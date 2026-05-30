import { CatalogItem } from "@/store/useStore";

// Helper to convert TMDB payload format back into Zustand/Store CatalogItem format
function fromTmdbFormat(item: any, type: "movie" | "tv"): CatalogItem {
  let backdropUrl = item.backdropUrl;
  let posterUrl = item.posterUrl;
  const imdbId = item.imdb_id || item.imdbId || `tt${item.id}`;
  if (imdbId === "tt9813792" || item.id === 9813792) {
    const returnedTitle = item.name || item.title || "";
    if (returnedTitle === "From") {
      posterUrl = "https://image.tmdb.org/t/p/original/jfw5WoRnPGJQrDdaSOB5QqpjytC.jpg";
      backdropUrl = "https://image.tmdb.org/t/p/original/jfw5WoRnPGJQrDdaSOB5QqpjytC.jpg";
    } else {
      posterUrl = "/posters/from.jpg";
      backdropUrl = "/posters/from.jpg";
    }
  } else {
    backdropUrl = backdropUrl || (item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop");
    posterUrl = posterUrl || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop");
  }

  const releaseDate = item.release_date || item.first_air_date || "";
  const title = item.title || item.name || "Untitled Production";

  return {
    id: item.id,
    imdbId,
    title,
    name: item.name || title,
    type,
    backdrop_path: item.backdrop_path || "",
    poster_path: item.poster_path || "",
    overview: item.overview || "No overview available.",
    vote_average: item.vote_average || 0.0,
    release_date: releaseDate,
    first_air_date: releaseDate,
    genres: item.genres ? item.genres.map((g: any) => g.name) : ["Cinema"],
    runtime: item.runtime ? `${item.runtime}m` : undefined,
    cast: item.credits?.cast ? item.credits.cast.map((c: any) => c.name).slice(0, 5) : [],
    backdropUrl,
    posterUrl,
    number_of_seasons: item.number_of_seasons,
    episodes_per_season: item.episodes_per_season || (item.seasons?.[0]?.episode_count)
  };
}

export async function fetchFromProxy(path: string, searchParams: Record<string, string> = {}) {
  const qs = new URLSearchParams(searchParams).toString();
  const delimiter = qs ? "?" : "";
  const url = `/api/tmdb/${path}${delimiter}${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch from TMDB Proxy: ${res.statusText}`);
  }
  return res.json();
}

// 1. Get Movie Details
export async function getMovieDetail(id: string | number): Promise<CatalogItem> {
  const data = await fetchFromProxy(`movie/${id}`);
  return fromTmdbFormat(data, "movie");
}

// 2. Get TV Show Details
export async function getTVDetail(id: string | number): Promise<CatalogItem> {
  const data = await fetchFromProxy(`tv/${id}`);
  return fromTmdbFormat(data, "tv");
}

// 3. Get TV Season Details (episodes browse)
export interface EpisodeItem {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string;
  stillUrl: string;
  air_date: string;
}

export async function getTVSeasonDetails(id: string | number, seasonNum: number): Promise<EpisodeItem[]> {
  try {
    // If live API key is set, this might query live TMDB season details
    const data = await fetchFromProxy(`tv/${id}/season/${seasonNum}`);
    return data.episodes.map((ep: any) => ({
      id: ep.id,
      episode_number: ep.episode_number,
      name: ep.name || `Episode ${ep.episode_number}`,
      overview: ep.overview || "No episode summary available.",
      still_path: ep.still_path || "",
      stillUrl: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400&auto=format&fit=crop",
      air_date: ep.air_date || ""
    }));
  } catch (e) {
    // Elegant offline fallback episodic list
    const episodes: EpisodeItem[] = [];
    for (let i = 1; i <= 8; i++) {
      episodes.push({
        id: 900000 + i + seasonNum * 10,
        episode_number: i,
        name: `Episode ${i}: The Dark Rising`,
        overview: "A sudden security breach within the central grid triggers an high-stakes race against time to prevent code quarantine.",
        still_path: "",
        stillUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400&auto=format&fit=crop",
        air_date: `2024-05-1${i}`
      });
    }
    return episodes;
  }
}

// 4. Get Similar Movies
export async function getSimilarMovies(id: string | number): Promise<CatalogItem[]> {
  const data = await fetchFromProxy(`movie/${id}/similar`);
  return data.results.map((i: any) => fromTmdbFormat(i, "movie"));
}

// 5. Get Similar TV Shows
export async function getSimilarTVShows(id: string | number): Promise<CatalogItem[]> {
  const data = await fetchFromProxy(`tv/${id}/similar`);
  return data.results.map((i: any) => fromTmdbFormat(i, "tv"));
}

// 6. Global Search
export async function searchCatalog(query: string): Promise<CatalogItem[]> {
  if (!query.trim()) return [];
  const data = await fetchFromProxy("search/multi", { query });
  return data.results
    .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
    .map((item: any) => fromTmdbFormat(item, item.media_type as "movie" | "tv"));
}
