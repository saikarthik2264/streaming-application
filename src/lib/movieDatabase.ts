/**
 * Server-Side Movie Database
 * 
 * In-memory store backed by JSON files for persistence.
 * Provides fast reads from memory, periodic writes to disk.
 */

import fs from "fs";
import path from "path";

// ─── Types ───────────────────────────────────────────────────────────
export interface DbMovie {
  id: number;
  imdb_id?: string;
  title: string;
  overview: string;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  genres: { id: number; name: string }[];
  original_language: string;
  original_title: string;
  adult: boolean;
  collection_id: number | null;
  collection_name: string | null;
  collection_poster: string | null;
  collection_backdrop: string | null;
  cast: string[];
  source: string; // which endpoint it came from
  imported_at: number; // timestamp
  updated_at: number;
}

export interface DbCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  movie_ids: number[];
  movie_count: number;
  year_range: string;
  fetched_from_tmdb: boolean;
  updated_at: number;
}

export interface SyncLog {
  id: string;
  type: string;
  started_at: number;
  finished_at: number | null;
  movies_added: number;
  movies_updated: number;
  duplicates_skipped: number;
  collections_found: number;
  errors: string[];
  pages_fetched: number;
  status: "running" | "completed" | "failed";
}

export interface DbStats {
  total_movies: number;
  total_collections: number;
  total_genres: number;
  total_tv_shows: number;
  movies_added_today: number;
  collections_added_today: number;
  last_sync_time: number | null;
  last_sync_type: string | null;
  genre_breakdown: Record<string, number>;
  language_breakdown: Record<string, number>;
  top_collections: { name: string; count: number }[];
}

// ─── Paths ───────────────────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), "src", "data");
const MOVIES_PATH = path.join(DATA_DIR, "db_movies.json");
const COLLECTIONS_PATH = path.join(DATA_DIR, "db_collections.json");
const SYNC_LOG_PATH = path.join(DATA_DIR, "db_sync_log.json");

// ─── In-Memory Store ─────────────────────────────────────────────────
let moviesMap: Map<number, DbMovie> = new Map();
let collectionsMap: Map<number, DbCollection> = new Map();
let syncLogs: SyncLog[] = [];
let loaded = false;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// ─── Genre Map ───────────────────────────────────────────────────────
const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western"
};

// ─── Load from Disk ──────────────────────────────────────────────────
function ensureLoaded() {
  if (loaded) return;
  loaded = true;

  try {
    if (fs.existsSync(MOVIES_PATH)) {
      const raw = JSON.parse(fs.readFileSync(MOVIES_PATH, "utf-8"));
      if (Array.isArray(raw)) {
        for (const m of raw) {
          moviesMap.set(m.id, m);
        }
      }
    }
  } catch (e) {
    console.error("[MovieDB] Failed to load movies from disk:", e);
  }

  try {
    if (fs.existsSync(COLLECTIONS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(COLLECTIONS_PATH, "utf-8"));
      if (Array.isArray(raw)) {
        for (const c of raw) {
          collectionsMap.set(c.id, c);
        }
      }
    }
  } catch (e) {
    console.error("[MovieDB] Failed to load collections from disk:", e);
  }

  try {
    if (fs.existsSync(SYNC_LOG_PATH)) {
      syncLogs = JSON.parse(fs.readFileSync(SYNC_LOG_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("[MovieDB] Failed to load sync logs:", e);
  }

  console.log(`[MovieDB] Loaded ${moviesMap.size} movies, ${collectionsMap.size} collections from disk.`);
}

// ─── Save to Disk (debounced) ────────────────────────────────────────
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveToDisk();
  }, 2000); // Debounce 2 seconds
}

function saveToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MOVIES_PATH, JSON.stringify(Array.from(moviesMap.values()), null, 0));
    fs.writeFileSync(COLLECTIONS_PATH, JSON.stringify(Array.from(collectionsMap.values()), null, 0));
    fs.writeFileSync(SYNC_LOG_PATH, JSON.stringify(syncLogs.slice(-50), null, 0)); // Keep last 50 logs
  } catch (e) {
    console.error("[MovieDB] Failed to save to disk:", e);
  }
}

// ─── Movie Operations ────────────────────────────────────────────────
export function addMovie(tmdbMovie: any, source: string): { added: boolean; updated: boolean } {
  ensureLoaded();

  const id = tmdbMovie.id;
  const existing = moviesMap.get(id);
  const now = Date.now();

  const genres = tmdbMovie.genres
    ? tmdbMovie.genres
    : (tmdbMovie.genre_ids || []).map((gid: number) => ({ id: gid, name: GENRE_MAP[gid] || "Unknown" }));

  const record: DbMovie = {
    id,
    imdb_id: tmdbMovie.imdb_id || tmdbMovie.external_ids?.imdb_id || undefined,
    title: tmdbMovie.title || "Untitled",
    overview: tmdbMovie.overview || "",
    release_date: tmdbMovie.release_date || "",
    runtime: tmdbMovie.runtime || null,
    vote_average: tmdbMovie.vote_average || 0,
    vote_count: tmdbMovie.vote_count || 0,
    popularity: tmdbMovie.popularity || 0,
    poster_path: tmdbMovie.poster_path || null,
    backdrop_path: tmdbMovie.backdrop_path || null,
    genre_ids: tmdbMovie.genre_ids || genres.map((g: any) => g.id),
    genres,
    original_language: tmdbMovie.original_language || "en",
    original_title: tmdbMovie.original_title || tmdbMovie.title || "",
    adult: tmdbMovie.adult || false,
    collection_id: tmdbMovie.belongs_to_collection?.id || null,
    collection_name: tmdbMovie.belongs_to_collection?.name || null,
    collection_poster: tmdbMovie.belongs_to_collection?.poster_path || null,
    collection_backdrop: tmdbMovie.belongs_to_collection?.backdrop_path || null,
    cast: tmdbMovie.credits?.cast?.map((c: any) => c.name).slice(0, 8) || existing?.cast || [],
    source,
    imported_at: existing?.imported_at || now,
    updated_at: now,
  };

  if (existing) {
    // Merge: keep richer data
    if (!record.imdb_id && existing.imdb_id) record.imdb_id = existing.imdb_id;
    if (record.cast.length === 0 && existing.cast.length > 0) record.cast = existing.cast;
    if (!record.runtime && existing.runtime) record.runtime = existing.runtime;
    moviesMap.set(id, record);
    scheduleSave();
    return { added: false, updated: true };
  }

  moviesMap.set(id, record);
  
  // Auto-create collection entry if movie has one
  if (record.collection_id && record.collection_name) {
    addCollectionFromMovie(record);
  }

  scheduleSave();
  return { added: true, updated: false };
}

function addCollectionFromMovie(movie: DbMovie) {
  if (!movie.collection_id) return;
  
  const existing = collectionsMap.get(movie.collection_id);
  if (existing) {
    // Add movie ID if not already there
    if (!existing.movie_ids.includes(movie.id)) {
      existing.movie_ids.push(movie.id);
      existing.movie_count = existing.movie_ids.length;
      existing.year_range = computeYearRange(existing.movie_ids);
      existing.updated_at = Date.now();
    }
    return;
  }

  // Create new collection entry
  const col: DbCollection = {
    id: movie.collection_id,
    name: movie.collection_name || `Collection ${movie.collection_id}`,
    overview: `A compilation of the films in the ${movie.collection_name}.`,
    poster_path: movie.collection_poster,
    backdrop_path: movie.collection_backdrop,
    movie_ids: [movie.id],
    movie_count: 1,
    year_range: movie.release_date ? movie.release_date.split("-")[0] : "Unknown",
    fetched_from_tmdb: false,
    updated_at: Date.now(),
  };
  collectionsMap.set(col.id, col);
}

function computeYearRange(movieIds: number[]): string {
  const years = movieIds
    .map(id => moviesMap.get(id)?.release_date)
    .filter(Boolean)
    .map(d => parseInt(d!.split("-")[0]))
    .filter(y => !isNaN(y));
  
  if (years.length === 0) return "Unknown";
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? `${min}` : `${min}–${max}`;
}

export function updateCollection(tmdbCollection: any) {
  ensureLoaded();

  const id = tmdbCollection.id;
  const parts = tmdbCollection.parts || [];
  const movieIds = parts.map((p: any) => p.id);

  // Also import the movies from collection parts
  for (const part of parts) {
    if (!moviesMap.has(part.id)) {
      addMovie({ ...part, belongs_to_collection: { id, name: tmdbCollection.name, poster_path: tmdbCollection.poster_path, backdrop_path: tmdbCollection.backdrop_path } }, "collection");
    }
  }

  const years = parts
    .map((p: any) => p.release_date ? parseInt(p.release_date.split("-")[0]) : null)
    .filter(Boolean) as number[];
  const minYear = years.length > 0 ? Math.min(...years) : 2000;
  const maxYear = years.length > 0 ? Math.max(...years) : 2026;

  const col: DbCollection = {
    id,
    name: tmdbCollection.name,
    overview: tmdbCollection.overview || `The complete collection of ${tmdbCollection.name}.`,
    poster_path: tmdbCollection.poster_path,
    backdrop_path: tmdbCollection.backdrop_path,
    movie_ids: movieIds,
    movie_count: movieIds.length,
    year_range: `${minYear}–${maxYear}`,
    fetched_from_tmdb: true,
    updated_at: Date.now(),
  };

  collectionsMap.set(id, col);
  scheduleSave();
}

// ─── Query Operations ────────────────────────────────────────────────
export function getMovie(id: number): DbMovie | undefined {
  ensureLoaded();
  return moviesMap.get(id);
}

export function getAllMovies(): DbMovie[] {
  ensureLoaded();
  return Array.from(moviesMap.values());
}

export function getMovieCount(): number {
  ensureLoaded();
  return moviesMap.size;
}

export function getAllCollections(): DbCollection[] {
  ensureLoaded();
  return Array.from(collectionsMap.values()).filter(c => c.movie_count >= 2);
}

export function getCollection(id: number): DbCollection | undefined {
  ensureLoaded();
  return collectionsMap.get(id);
}

export function getCollectionMovies(collectionId: number): DbMovie[] {
  ensureLoaded();
  const col = collectionsMap.get(collectionId);
  if (!col) return [];
  return col.movie_ids
    .map(mid => moviesMap.get(mid))
    .filter(Boolean) as DbMovie[];
}

// ─── Sync Log Operations ─────────────────────────────────────────────
export function createSyncLog(type: string): SyncLog {
  ensureLoaded();
  const log: SyncLog = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    started_at: Date.now(),
    finished_at: null,
    movies_added: 0,
    movies_updated: 0,
    duplicates_skipped: 0,
    collections_found: 0,
    errors: [],
    pages_fetched: 0,
    status: "running",
  };
  syncLogs.push(log);
  return log;
}

export function finishSyncLog(log: SyncLog, status: "completed" | "failed") {
  log.finished_at = Date.now();
  log.status = status;
  scheduleSave();
}

export function getRecentSyncLogs(count = 10): SyncLog[] {
  ensureLoaded();
  return syncLogs.slice(-count).reverse();
}

// ─── Statistics ──────────────────────────────────────────────────────
export function getStats(): DbStats {
  ensureLoaded();

  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const allMovies = Array.from(moviesMap.values());
  const allCollections = getAllCollections();

  // Genre breakdown
  const genreCount: Record<string, number> = {};
  for (const m of allMovies) {
    for (const g of m.genres) {
      const name = g.name || GENRE_MAP[g.id] || "Unknown";
      genreCount[name] = (genreCount[name] || 0) + 1;
    }
  }

  // Language breakdown
  const langCount: Record<string, number> = {};
  for (const m of allMovies) {
    langCount[m.original_language] = (langCount[m.original_language] || 0) + 1;
  }

  // Movies added today
  const moviesAddedToday = allMovies.filter(m => m.imported_at >= todayStart).length;
  const collectionsAddedToday = allCollections.filter(c => c.updated_at >= todayStart).length;

  // Top collections
  const topCollections = [...allCollections]
    .sort((a, b) => b.movie_count - a.movie_count)
    .slice(0, 10)
    .map(c => ({ name: c.name, count: c.movie_count }));

  const lastLog = syncLogs.length > 0 ? syncLogs[syncLogs.length - 1] : null;

  return {
    total_movies: moviesMap.size,
    total_collections: allCollections.length,
    total_genres: Object.keys(genreCount).length,
    total_tv_shows: 5, // From mock catalog
    movies_added_today: moviesAddedToday,
    collections_added_today: collectionsAddedToday,
    last_sync_time: lastLog?.started_at || null,
    last_sync_type: lastLog?.type || null,
    genre_breakdown: genreCount,
    language_breakdown: langCount,
    top_collections: topCollections,
  };
}

// ─── Force Save ──────────────────────────────────────────────────────
export function forceSave() {
  saveToDisk();
}

// ─── Get all unique collection IDs from database ─────────────────────
export function getDiscoveredCollectionIds(): number[] {
  ensureLoaded();
  const ids = new Set<number>();
  for (const m of moviesMap.values()) {
    if (m.collection_id) {
      ids.add(m.collection_id);
    }
  }
  return Array.from(ids);
}
