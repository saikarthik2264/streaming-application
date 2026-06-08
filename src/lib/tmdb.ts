import { CatalogItem } from "@/store/useStore";

const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics"
};

// Helper to convert TMDB payload format back into Zustand/Store CatalogItem format
function fromTmdbFormat(item: any, type: "movie" | "tv"): CatalogItem {
  let backdropUrl = item.backdropUrl;
  let posterUrl = item.posterUrl;
  const imdbId = item.external_ids?.imdb_id || item.imdb_id || item.imdbId || `tt${item.id}`;
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

  const resolvedGenres = item.genres 
    ? item.genres.map((g: any) => g.name) 
    : (item.genre_ids ? item.genre_ids.map((id: number) => GENRE_MAP[id]).filter(Boolean) : ["Cinema"]);

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
    genres: resolvedGenres,
    runtime: item.runtime ? `${item.runtime}m` : undefined,
    cast: item.credits?.cast ? item.credits.cast.map((c: any) => c.name).slice(0, 5) : [],
    backdropUrl,
    posterUrl,
    seasons: item.seasons ? item.seasons.map((s: any) => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name })) : undefined,
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
export async function searchCatalog(query: string): Promise<any[]> {
  if (!query.trim()) return [];
  
  try {
    const [movieData, collections] = await Promise.all([
      fetchFromProxy("search/multi", { query }),
      getCollections().catch(() => [])
    ]);
    
    const matchedCollections = collections.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) || 
      (c.overview && c.overview.toLowerCase().includes(query.toLowerCase()))
    ).map(c => ({
      id: c.id,
      title: c.name,
      type: "collection" as any,
      posterUrl: c.posterUrl,
      backdropUrl: c.backdropUrl,
      overview: c.overview,
      movie_count: c.movie_count,
      year_range: c.year_range,
      genres: ["Franchise Collection"],
      vote_average: 8.5
    }));

    const movies = (movieData.results || [])
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .map((item: any) => fromTmdbFormat(item, item.media_type as "movie" | "tv"));

    return [...matchedCollections, ...movies];
  } catch (e) {
    console.error("Search catalog failed:", e);
    return [];
  }
}

export interface RowCategory {
  title: string;
  items: CatalogItem[];
  type: "movie" | "tv" | "mixed";
}

export async function getHomeCategories(profileType?: string): Promise<{ featured: CatalogItem[]; categories: RowCategory[] }> {
  const data = await fetchFromProxy("home", profileType ? { profileType } : {});
  const featuredList = Array.isArray(data.featured)
    ? data.featured.map((i: any) => fromTmdbFormat(i, "movie"))
    : [fromTmdbFormat(data.featured, "movie")];

  return {
    featured: featuredList,
    categories: data.categories.map((cat: any) => ({
      title: cat.title,
      type: cat.type,
      items: cat.items.map((item: any) => fromTmdbFormat(item, cat.type === "mixed" ? (item.media_type || "movie") : cat.type))
    }))
  };
}

export async function discoverCatalog(params: Record<string, string> = {}): Promise<CatalogItem[]> {
  try {
    const data = await fetchFromProxy("discover/movie", params);
    return (data.results || []).map((item: any) => fromTmdbFormat(item, "movie"));
  } catch (e) {
    console.error("Discovery fetch failed:", e);
    return [];
  }
}

export interface CollectionItem {
  id: string | number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  posterUrl?: string;
  backdropUrl?: string;
  movie_count: number;
  year_range: string;
}

export interface CollectionDetail {
  id: string | number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  posterUrl?: string;
  backdropUrl?: string;
  parts: CatalogItem[];
}

export async function getCollections(): Promise<CollectionItem[]> {
  const data = await fetchFromProxy("collections");
  return data.map((c: any) => ({
    ...c,
    title: c.name,
    type: "collection",
    posterUrl: c.posterUrl || (c.poster_path ? `https://image.tmdb.org/t/p/w500${c.poster_path}` : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop"),
    backdropUrl: c.backdropUrl || (c.backdrop_path ? `https://image.tmdb.org/t/p/w1280${c.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop")
  }));
}

export async function getTrendingCollections(): Promise<CollectionItem[]> {
  const data = await fetchFromProxy("collections/trending");
  return data.map((c: any) => ({
    ...c,
    title: c.name,
    type: "collection",
    posterUrl: c.posterUrl || (c.poster_path ? `https://image.tmdb.org/t/p/w500${c.poster_path}` : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop"),
    backdropUrl: c.backdropUrl || (c.backdrop_path ? `https://image.tmdb.org/t/p/w1280${c.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop")
  }));
}

export async function getCollectionDetail(id: string | number): Promise<CollectionDetail> {
  const data = await fetchFromProxy(`collections/${id}`);
  return {
    id: data.id,
    name: data.name,
    overview: data.overview || `The complete collection of ${data.name}.`,
    poster_path: data.poster_path || "",
    backdrop_path: data.backdrop_path || "",
    posterUrl: data.posterUrl || (data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop"),
    backdropUrl: data.backdropUrl || (data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop"),
    parts: (data.parts || []).map((item: any) => fromTmdbFormat(item, "movie"))
  };
}
