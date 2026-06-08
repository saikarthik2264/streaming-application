/**
 * TMDB Sync Service
 * 
 * Fetches movies from multiple TMDB endpoints across multiple pages,
 * stores them in the local database, and auto-discovers collections.
 */

import {
  addMovie,
  updateCollection,
  createSyncLog,
  finishSyncLog,
  forceSave,
  getDiscoveredCollectionIds,
  getCollection,
  type SyncLog,
} from "./movieDatabase";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Rate limiter: max 35 requests per 10 seconds
let requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_WINDOW = 35;
const WINDOW_MS = 10000;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(t => now - t < WINDOW_MS);
  
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestInWindow = requestTimestamps[0];
    const waitMs = WINDOW_MS - (now - oldestInWindow) + 100;
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
  
  requestTimestamps.push(Date.now());
  return fetch(url);
}

async function fetchTmdbPage(endpoint: string, apiKey: string, page: number, extraParams: Record<string, string> = {}): Promise<any> {
  const params = new URLSearchParams({ api_key: apiKey, page: String(page), ...extraParams });
  const url = `${TMDB_BASE_URL}/${endpoint}?${params.toString()}`;
  
  const res = await rateLimitedFetch(url);
  if (!res.ok) {
    throw new Error(`TMDB ${endpoint} page ${page}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchTmdbCollection(collectionId: number, apiKey: string): Promise<any> {
  const params = new URLSearchParams({ api_key: apiKey });
  const url = `${TMDB_BASE_URL}/collection/${collectionId}?${params.toString()}`;
  
  const res = await rateLimitedFetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function fetchMovieDetail(movieId: number, apiKey: string): Promise<any> {
  const params = new URLSearchParams({ api_key: apiKey, append_to_response: "credits" });
  const url = `${TMDB_BASE_URL}/movie/${movieId}?${params.toString()}`;
  
  const res = await rateLimitedFetch(url);
  if (!res.ok) return null;
  return res.json();
}

// ─── Endpoint Configs ────────────────────────────────────────────────
interface SyncEndpoint {
  name: string;
  endpoint: string;
  maxPages: number;
  extraParams?: Record<string, string>;
}

const FULL_SYNC_ENDPOINTS: SyncEndpoint[] = [
  { name: "popular", endpoint: "movie/popular", maxPages: 25 },
  { name: "top_rated", endpoint: "movie/top_rated", maxPages: 25 },
  { name: "now_playing", endpoint: "movie/now_playing", maxPages: 10 },
  { name: "upcoming", endpoint: "movie/upcoming", maxPages: 10 },
  { name: "trending_day", endpoint: "trending/movie/day", maxPages: 10 },
  { name: "trending_week", endpoint: "trending/movie/week", maxPages: 15 },
  { name: "discover_vote", endpoint: "discover/movie", maxPages: 20, extraParams: { sort_by: "vote_count.desc" } },
  { name: "discover_revenue", endpoint: "discover/movie", maxPages: 15, extraParams: { sort_by: "revenue.desc" } },
  { name: "discover_action", endpoint: "discover/movie", maxPages: 10, extraParams: { sort_by: "popularity.desc", with_genres: "28" } },
  { name: "discover_animation", endpoint: "discover/movie", maxPages: 10, extraParams: { sort_by: "popularity.desc", with_genres: "16" } },
  { name: "discover_scifi", endpoint: "discover/movie", maxPages: 10, extraParams: { sort_by: "popularity.desc", with_genres: "878" } },
  { name: "discover_horror", endpoint: "discover/movie", maxPages: 10, extraParams: { sort_by: "popularity.desc", with_genres: "27" } },
];

const TRENDING_ENDPOINTS: SyncEndpoint[] = [
  { name: "trending_day", endpoint: "trending/movie/day", maxPages: 10 },
  { name: "trending_week", endpoint: "trending/movie/week", maxPages: 10 },
];

const POPULAR_ENDPOINTS: SyncEndpoint[] = [
  { name: "popular", endpoint: "movie/popular", maxPages: 20 },
  { name: "now_playing", endpoint: "movie/now_playing", maxPages: 5 },
];

// ─── Main Sync Function ─────────────────────────────────────────────
export type SyncType = "full" | "trending" | "popular" | "discover";

let currentSync: SyncLog | null = null;

export function isSyncRunning(): boolean {
  return currentSync !== null && currentSync.status === "running";
}

export function getCurrentSync(): SyncLog | null {
  return currentSync;
}

export async function runSync(type: SyncType): Promise<SyncLog> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY not configured");
  }

  if (isSyncRunning()) {
    throw new Error("A sync is already running");
  }

  const log = createSyncLog(type);
  currentSync = log;

  console.log(`[Sync] Starting ${type} sync...`);

  try {
    let endpoints: SyncEndpoint[];
    switch (type) {
      case "trending":
        endpoints = TRENDING_ENDPOINTS;
        break;
      case "popular":
        endpoints = POPULAR_ENDPOINTS;
        break;
      case "discover":
        endpoints = FULL_SYNC_ENDPOINTS.filter(e => e.name.startsWith("discover_"));
        break;
      case "full":
      default:
        endpoints = FULL_SYNC_ENDPOINTS;
        break;
    }

    // Phase 1: Fetch movie lists from all endpoints
    const discoveredCollectionIds = new Set<number>();
    const newMovieIds: number[] = [];

    for (const ep of endpoints) {
      console.log(`[Sync] Fetching ${ep.name}...`);
      
      try {
        const firstPage = await fetchTmdbPage(ep.endpoint, apiKey, 1, ep.extraParams);
        const totalAvailablePages = Math.min(firstPage.total_pages || 1, ep.maxPages);
        
        const ids1 = processMovieResults(firstPage.results || [], ep.name, log, discoveredCollectionIds);
        newMovieIds.push(...ids1);
        log.pages_fetched++;

        for (let page = 2; page <= totalAvailablePages; page++) {
          try {
            const pageData = await fetchTmdbPage(ep.endpoint, apiKey, page, ep.extraParams);
            const ids = processMovieResults(pageData.results || [], ep.name, log, discoveredCollectionIds);
            newMovieIds.push(...ids);
            log.pages_fetched++;
          } catch (pageErr: any) {
            log.errors.push(`${ep.name} page ${page}: ${pageErr.message}`);
          }
        }
      } catch (epErr: any) {
        log.errors.push(`${ep.name}: ${epErr.message}`);
      }
    }

    // Phase 1.5: Fetch movie details for newly added movies to discover collections
    // (List endpoints don't include belongs_to_collection, only /movie/{id} does)
    const uniqueNewIds = [...new Set(newMovieIds)];
    console.log(`[Sync] Phase 1.5: Fetching details for ${uniqueNewIds.length} movies to discover collections...`);
    
    const detailBatches = chunk(uniqueNewIds, 8);
    let detailsFetched = 0;
    for (const batch of detailBatches) {
      const results = await Promise.all(
        batch.map(id => fetchMovieDetail(id, apiKey).catch(() => null))
      );
      for (const detail of results) {
        if (detail && detail.id) {
          // Re-add with collection info
          addMovie(detail, "detail");
          detailsFetched++;
          if (detail.belongs_to_collection?.id) {
            discoveredCollectionIds.add(detail.belongs_to_collection.id);
          }
        }
      }
      // Progress log every 50 details
      if (detailsFetched % 50 < 8) {
        console.log(`[Sync] Details: ${detailsFetched}/${uniqueNewIds.length}, collections found so far: ${discoveredCollectionIds.size}`);
      }
    }
    console.log(`[Sync] Phase 1.5 complete: Fetched ${detailsFetched} details, discovered ${discoveredCollectionIds.size} collections.`);

    // Phase 2: Fetch full collection details
    console.log(`[Sync] Phase 2: Fetching ${discoveredCollectionIds.size} collection details...`);
    
    // Also include unfetched collections from database
    const existingIds = getDiscoveredCollectionIds();
    for (const id of existingIds) {
      const col = getCollection(id);
      if (col && !col.fetched_from_tmdb) {
        discoveredCollectionIds.add(id);
      }
    }

    const collectionBatches = chunk(Array.from(discoveredCollectionIds), 5);
    for (const batch of collectionBatches) {
      const results = await Promise.all(
        batch.map(id => fetchTmdbCollection(id, apiKey).catch(() => null))
      );
      for (const colData of results) {
        if (colData && colData.id) {
          updateCollection(colData);
          log.collections_found++;
        }
      }
    }

    forceSave();
    finishSyncLog(log, "completed");
    console.log(`[Sync] Completed! Added ${log.movies_added}, updated ${log.movies_updated}, found ${log.collections_found} collections, fetched ${log.pages_fetched} pages.`);

  } catch (err: any) {
    log.errors.push(`Fatal: ${err.message}`);
    finishSyncLog(log, "failed");
    console.error(`[Sync] Failed:`, err);
  } finally {
    currentSync = null;
  }

  return log;
}

function processMovieResults(results: any[], source: string, log: SyncLog, discoveredCollections: Set<number>): number[] {
  const addedIds: number[] = [];
  for (const movie of results) {
    if (!movie || !movie.id) continue;

    const { added, updated } = addMovie(movie, source);
    if (added) {
      log.movies_added++;
      addedIds.push(movie.id);
    } else if (updated) {
      log.movies_updated++;
    } else {
      log.duplicates_skipped++;
    }

    // Track collection if present
    if (movie.belongs_to_collection?.id) {
      discoveredCollections.add(movie.belongs_to_collection.id);
    }
  }
  return addedIds;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
