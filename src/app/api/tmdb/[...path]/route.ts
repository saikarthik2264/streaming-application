import { NextRequest, NextResponse } from "next/server";
import { generateCatalog, MOVIES, TV_SHOWS, getCategoryRows } from "@/data/mockCatalog";
import { CatalogItem } from "@/store/useStore";
import { getAllCollections as getDbCollections, getCollection as getDbCollection, getCollectionMovies, getMovieCount } from "@/lib/movieDatabase";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;
  const fullPath = pathParts.join("/");
  const { searchParams } = new URL(request.url);
  
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return handleMockFallback(fullPath, pathParts, searchParams);
  }

  try {
    // Custom endpoint to build all homepage content in a single parallel payload
    if (fullPath === "home") {
      const profileType = searchParams.get("profileType") || "cinephile";

      const fetchTmdb = async (endpoint: string, extraParams: Record<string, string> = {}) => {
        const urlParams = new URLSearchParams({ api_key: apiKey, ...extraParams });
        const res = await fetch(`${TMDB_BASE_URL}/${endpoint}?${urlParams.toString()}`);
        if (!res.ok) throw new Error(`TMDB error fetching ${endpoint}: ${res.statusText}`);
        return res.json();
      };

      if (profileType === "kids") {
        const [
          animation,
          family,
          kidsTv,
          fantasy,
          comedyFamily,
          disney
        ] = await Promise.all([
          fetchTmdb("discover/movie", { with_genres: "16", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "10751", sort_by: "popularity.desc" }),
          fetchTmdb("discover/tv", { with_genres: "10762", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "14", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "35,10751", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_companies: "2", sort_by: "popularity.desc" }) // Walt Disney Pictures
        ]);

        const featuredList = (disney.results && disney.results.length > 0)
          ? disney.results.slice(0, 6)
          : (animation.results ? animation.results.slice(0, 6) : []);

        return NextResponse.json({
          featured: featuredList,
          categories: [
            { title: "Disney Favorites", items: disney.results || [], type: "movie" },
            { title: "Animated Adventures", items: animation.results || [], type: "movie" },
            { title: "Family Movies", items: family.results || [], type: "movie" },
            { title: "Fantasy Lands", items: fantasy.results || [], type: "movie" },
            { title: "Family Comedies", items: comedyFamily.results || [], type: "movie" },
            { title: "Fun Kids TV Shows", items: kidsTv.results || [], type: "tv" }
          ]
        });
      } else if (profileType === "action") {
        const [
          actionBlockbusters,
          thrillingAdventures,
          actionTv,
          thrillers,
          sciFiAction,
          crimeSuspense
        ] = await Promise.all([
          fetchTmdb("discover/movie", { with_genres: "28", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "12", sort_by: "popularity.desc" }),
          fetchTmdb("discover/tv", { with_genres: "10759", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "53", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "28,878", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "80", sort_by: "popularity.desc" })
        ]);

        const featuredList = (actionBlockbusters.results && actionBlockbusters.results.length > 0)
          ? actionBlockbusters.results.slice(0, 6)
          : (thrillingAdventures.results ? thrillingAdventures.results.slice(0, 6) : []);

        return NextResponse.json({
          featured: featuredList,
          categories: [
            { title: "Action Blockbusters", items: actionBlockbusters.results || [], type: "movie" },
            { title: "Thrilling Adventures", items: thrillingAdventures.results || [], type: "movie" },
            { title: "Action & Adventure TV", items: actionTv.results || [], type: "tv" },
            { title: "Sci-Fi Action-Packed", items: sciFiAction.results || [], type: "movie" },
            { title: "Crime & Suspense", items: crimeSuspense.results || [], type: "movie" },
            { title: "Suspense Thrillers", items: thrillers.results || [], type: "movie" }
          ]
        });
      } else if (profileType === "guest") {
        const [
          trendingMovies,
          popularTv,
          comedyHits,
          documentaries,
          fantasyMovies,
          mysteryThrillers
        ] = await Promise.all([
          fetchTmdb("trending/movie/week"),
          fetchTmdb("tv/popular"),
          fetchTmdb("discover/movie", { with_genres: "35", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "99", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "14", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "9648,53", sort_by: "popularity.desc" })
        ]);

        const featuredList = (trendingMovies.results && trendingMovies.results.length > 0)
          ? trendingMovies.results.slice(0, 6)
          : [];

        return NextResponse.json({
          featured: featuredList,
          categories: [
            { title: "Trending Movies", items: trendingMovies.results || [], type: "movie" },
            { title: "Comedy Hits", items: comedyHits.results || [], type: "movie" },
            { title: "Popular TV Shows", items: popularTv.results || [], type: "tv" },
            { title: "Intriguing Documentaries", items: documentaries.results || [], type: "movie" },
            { title: "Mystery & Thrillers", items: mysteryThrillers.results || [], type: "movie" },
            { title: "Fantasy & Magic", items: fantasyMovies.results || [], type: "movie" }
          ]
        });
      } else {
        const [
          trendingMovies,
          topRatedMovies,
          sciFiMovies,
          actionMovies,
          animationMovies,
          dramaMovies,
          trendingTv,
          popularTv,
          nowPlayingMovies
        ] = await Promise.all([
          fetchTmdb("trending/movie/week"),
          fetchTmdb("movie/top_rated"),
          fetchTmdb("discover/movie", { with_genres: "878", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "28", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "16", sort_by: "popularity.desc" }),
          fetchTmdb("discover/movie", { with_genres: "18", sort_by: "popularity.desc" }),
          fetchTmdb("trending/tv/week"),
          fetchTmdb("tv/popular"),
          fetchTmdb("movie/now_playing")
        ]);

        const featuredList = (nowPlayingMovies.results && nowPlayingMovies.results.length > 0)
          ? nowPlayingMovies.results.slice(0, 6)
          : (trendingMovies.results ? trendingMovies.results.slice(0, 6) : []);

        return NextResponse.json({
          featured: featuredList,
          categories: [
            { title: "Trending Movies", items: trendingMovies.results || [], type: "movie" },
            { title: "Top Rated Movies", items: topRatedMovies.results || [], type: "movie" },
            { title: "Sci-Fi Movies", items: sciFiMovies.results || [], type: "movie" },
            { title: "Action Movies", items: actionMovies.results || [], type: "movie" },
            { title: "Animation Movies", items: animationMovies.results || [], type: "movie" },
            { title: "Drama Movies", items: dramaMovies.results || [], type: "movie" },
            { title: "Trending TV Shows", items: trendingTv.results || [], type: "tv" },
            { title: "Popular TV Shows", items: popularTv.results || [], type: "tv" }
          ]
        });
      }
    }

    if (fullPath === "collections" || fullPath === "collections/trending") {
      // Try database first (populated by sync service)
      const dbCollections = getDbCollections();
      
      if (dbCollections.length > 0) {
        const collections = dbCollections
          .map(c => ({
            id: c.id,
            name: c.name,
            overview: c.overview || `The complete collection of ${c.name}.`,
            poster_path: c.poster_path,
            backdrop_path: c.backdrop_path,
            movie_count: c.movie_count,
            year_range: c.year_range
          }))
          .sort((a, b) => b.movie_count - a.movie_count);

        if (fullPath === "collections/trending") {
          return NextResponse.json(collections.slice(0, 6));
        }
        return NextResponse.json(collections);
      }

      // Fallback: scan catalog + TMDB API
      const discoveredCollectionIds = new Set<number>();
      MOVIES.forEach(movie => {
        if (movie.collection && movie.collection.id) {
          discoveredCollectionIds.add(Number(movie.collection.id));
        }
      });

      const allCollectionIds = Array.from(discoveredCollectionIds);
      const fetchCollection = async (id: number) => {
        try {
          const urlParams = new URLSearchParams({ api_key: apiKey });
          const res = await fetch(`${TMDB_BASE_URL}/collection/${id}?${urlParams.toString()}`);
          if (!res.ok) return null;
          return res.json();
        } catch {
          return null;
        }
      };

      const results = await Promise.all(allCollectionIds.map(fetchCollection));
      const collections = results.filter(Boolean).map(c => {
        const releaseYears = c.parts
          .map((p: any) => p.release_date ? parseInt(p.release_date.split("-")[0]) : null)
          .filter(Boolean) as number[];
        const minYear = releaseYears.length > 0 ? Math.min(...releaseYears) : 2000;
        const maxYear = releaseYears.length > 0 ? Math.max(...releaseYears) : 2026;
        return {
          id: c.id,
          name: c.name,
          overview: c.overview || `The complete collection of ${c.name}.`,
          poster_path: c.poster_path,
          backdrop_path: c.backdrop_path,
          movie_count: c.parts.length,
          year_range: `${minYear}–${maxYear}`
        };
      }).sort((a, b) => b.movie_count - a.movie_count);

      if (fullPath === "collections/trending") {
        return NextResponse.json(collections.slice(0, 6));
      }
      return NextResponse.json(collections);
    }

    if (fullPath.startsWith("collections/") && pathParts.length === 2) {
      const collectionId = pathParts[1];
      const urlParams = new URLSearchParams({ api_key: apiKey });
      const res = await fetch(`${TMDB_BASE_URL}/collection/${collectionId}?${urlParams.toString()}`);
      if (!res.ok) {
        return NextResponse.json({ status_message: res.statusText }, { status: res.status });
      }
      const data = await res.json();
      if (data.parts) {
        data.parts.sort((a: any, b: any) => {
          const dateA = a.release_date || "";
          const dateB = b.release_date || "";
          return dateA.localeCompare(dateB);
        });
      }
      return NextResponse.json(data);
    }

    // Standard proxy request
    const forwardParams: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      forwardParams[key] = val;
    });
    forwardParams["api_key"] = apiKey;

    // Auto-append credits & external IDs when loading movie or TV detail endpoints
    if (
      (fullPath.startsWith("movie/") || fullPath.startsWith("tv/")) &&
      pathParts.length === 2
    ) {
      forwardParams["append_to_response"] = "credits,external_ids";
    }

    const queryStr = new URLSearchParams(forwardParams).toString();
    const targetUrl = `${TMDB_BASE_URL}/${fullPath}?${queryStr}`;
    
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return NextResponse.json({ status_message: res.statusText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Proxy fetching error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch from TMDB API" },
      { status: 500 }
    );
  }
}

function handleMockFallback(
  fullPath: string,
  pathParts: string[],
  searchParams: URLSearchParams
) {
  const catalog = generateCatalog();

  const buildMockCollections = () => {
    const collectionsMap: Record<string | number, any> = {};
    MOVIES.forEach(movie => {
      if (movie.collection) {
        const col = movie.collection;
        if (!collectionsMap[col.id]) {
          collectionsMap[col.id] = {
            id: col.id,
            name: col.name,
            overview: col.overview || `A compilation of the films in the ${col.name}.`,
            poster_path: col.poster_path || movie.poster_path,
            backdrop_path: col.backdrop_path || movie.backdrop_path,
            posterUrl: col.poster_path ? `https://image.tmdb.org/t/p/w500${col.poster_path}` : movie.posterUrl,
            backdropUrl: col.backdrop_path ? `https://image.tmdb.org/t/p/w1280${col.backdrop_path}` : movie.backdropUrl,
            parts: []
          };
        }
        collectionsMap[col.id].parts.push(movie);
      }
    });

    const activeCollections = Object.values(collectionsMap)
      .filter(c => c.parts.length >= 2)
      .map(c => {
        c.parts.sort((a: any, b: any) => {
          const dateA = a.release_date || "";
          const dateB = b.release_date || "";
          return dateA.localeCompare(dateB);
        });

        const releaseYears = c.parts
          .map((p: any) => p.release_date ? parseInt(p.release_date.split("-")[0]) : null)
          .filter(Boolean) as number[];
        const minYear = releaseYears.length > 0 ? Math.min(...releaseYears) : 2000;
        const maxYear = releaseYears.length > 0 ? Math.max(...releaseYears) : 2026;

        return {
          id: c.id,
          name: c.name,
          overview: c.overview,
          poster_path: c.poster_path,
          backdrop_path: c.backdrop_path,
          posterUrl: c.posterUrl,
          backdropUrl: c.backdropUrl,
          movie_count: c.parts.length,
          year_range: `${minYear}–${maxYear}`,
          parts: c.parts.map(toDetail)
        };
      });
      
    return activeCollections;
  };

  if (fullPath === "collections") {
    const cols = buildMockCollections();
    const list = cols.map(({ parts, ...rest }) => rest);
    return NextResponse.json(list);
  }

  if (fullPath === "collections/trending") {
    const cols = buildMockCollections();
    const list = cols.map(({ parts, ...rest }) => rest).slice(0, 5);
    return NextResponse.json(list);
  }

  if (fullPath.startsWith("collections/") && pathParts.length === 2) {
    const colId = pathParts[1];
    const cols = buildMockCollections();
    const match = cols.find(c => c.id.toString() === colId);
    if (!match) return NextResponse.json({ status_message: "Collection not found" }, { status: 404 });
    return NextResponse.json(match);
  }

  // Search
  if (fullPath === "search/multi") {
    const q = (searchParams.get("query") || "").toLowerCase();
    const results = catalog.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.overview.toLowerCase().includes(q) ||
      i.genres.some(g => g.toLowerCase().includes(q)) ||
      (i.cast && i.cast.some(c => c.toLowerCase().includes(q)))
    );
    return NextResponse.json({ page: 1, results: results.map(toResult), total_results: results.length });
  }

  // Movie detail
  if (fullPath.startsWith("movie/") && pathParts.length === 2) {
    const item = MOVIES.find(m => m.id === parseInt(pathParts[1]));
    if (!item) return NextResponse.json({ status_message: "Not found" }, { status: 404 });
    return NextResponse.json(toDetail(item));
  }

  // TV detail
  if (fullPath.startsWith("tv/") && pathParts.length === 2) {
    const item = TV_SHOWS.find(t => t.id === parseInt(pathParts[1]));
    if (!item) return NextResponse.json({ status_message: "Not found" }, { status: 404 });
    return NextResponse.json(toTVDetail(item));
  }

  // Similar
  if (fullPath.includes("/similar")) {
    const isTv = fullPath.startsWith("tv/");
    const items = isTv ? TV_SHOWS : MOVIES;
    return NextResponse.json({ page: 1, results: items.slice(0, 10).map(toResult) });
  }

  // Home Categories fallback
  if (fullPath === "home") {
    const profileType = searchParams.get("profileType") || "cinephile";
    const categories = getCategoryRows(profileType);
    
    let featuredSource = MOVIES;
    if (profileType === "kids") {
      featuredSource = MOVIES.filter(m => m.genres.some(g => ["Animation", "Family"].includes(g)));
    } else if (profileType === "action") {
      featuredSource = MOVIES.filter(m => m.genres.some(g => ["Action", "Adventure"].includes(g)));
    }
    if (featuredSource.length === 0) featuredSource = MOVIES;

    return NextResponse.json({
      featured: featuredSource.slice(0, 6).map(toDetail),
      categories: categories.map(c => ({
        title: c.title,
        type: c.type,
        items: c.items.map(toResult)
      }))
    });
  }

  if (fullPath.includes("trending")) {
    const all = [...MOVIES, ...TV_SHOWS];
    return NextResponse.json({ page: 1, results: all.slice(0, 12).map(toResult) });
  }

  return NextResponse.json({ page: 1, results: [] });
}

function toResult(item: CatalogItem) {
  let posterUrl = item.posterUrl;
  let backdropUrl = item.backdropUrl;
  if (item.imdbId === "tt9813792" || item.id === 9813792) {
    const returnedTitle = item.name || item.title || "";
    if (returnedTitle === "From") {
      posterUrl = "https://image.tmdb.org/t/p/original/jfw5WoRnPGJQrDdaSOB5QqpjytC.jpg";
      backdropUrl = "https://image.tmdb.org/t/p/original/jfw5WoRnPGJQrDdaSOB5QqpjytC.jpg";
    } else {
      posterUrl = "/posters/from.jpg";
      backdropUrl = "/posters/from.jpg";
    }
  }
  return {
    id: item.id,
    title: item.title,
    name: item.name || item.title,
    media_type: item.type,
    overview: item.overview,
    vote_average: item.vote_average,
    release_date: item.release_date || "",
    first_air_date: item.first_air_date || "",
    backdrop_path: item.backdrop_path,
    poster_path: item.poster_path,
    posterUrl,
    backdropUrl
  };
}

function toDetail(item: CatalogItem) {
  let posterUrl = item.posterUrl;
  let backdropUrl = item.backdropUrl;
  if (item.imdbId === "tt9813792" || item.id === 9813792) {
    const returnedTitle = item.name || item.title || "";
    if (returnedTitle === "From") {
      posterUrl = "https://image.tmdb.org/t/p/original/jfw5WoRnPGJQrDdaSOB5QqpjytC.jpg";
      backdropUrl = "https://image.tmdb.org/t/p/original/jfw5WoRnPGJQrDdaSOB5QqpjytC.jpg";
    } else {
      posterUrl = "/posters/from.jpg";
      backdropUrl = "/posters/from.jpg";
    }
  }
  return {
    id: item.id,
    imdb_id: item.imdbId,
    title: item.title,
    overview: item.overview,
    vote_average: item.vote_average,
    release_date: item.release_date,
    genres: item.genres.map((n, i) => ({ id: i, name: n })),
    runtime: parseInt(item.runtime?.replace(/\D/g, "") || "120"),
    credits: {
      cast: (item.cast || []).map((n, i) => ({ id: i, name: n, character: `Role ${i+1}`, profile_path: null }))
    },
    posterUrl,
    backdropUrl
  };
}

function toTVDetail(item: CatalogItem) {
  const number_of_seasons = item.seasons?.length || item.number_of_seasons || 5;
  const episodes_per_season = item.episodes_per_season || 10;
  const seasonsData = item.seasons || Array.from({ length: number_of_seasons }, (_, i) => i + 1).map(s => ({
    id: s,
    season_number: s,
    episode_count: episodes_per_season,
    name: `Season ${s}`
  }));
  let posterUrl = item.posterUrl;
  let backdropUrl = item.backdropUrl;
  if (item.imdbId === "tt9813792" || item.id === 9813792) {
    const returnedTitle = item.name || item.title || "";
    if (returnedTitle === "From") {
      posterUrl = "https://image.tmdb.org/t/p/original/jfw5WoRnPGJQrDdaSOB5QqpjytC.jpg";
      backdropUrl = "https://image.tmdb.org/t/p/original/jfw5WoRnPGJQrDdaSOB5QqpjytC.jpg";
    } else {
      posterUrl = "/posters/from.jpg";
      backdropUrl = "/posters/from.jpg";
    }
  }

  return {
    id: item.id,
    imdb_id: item.imdbId,
    name: item.name || item.title,
    overview: item.overview,
    vote_average: item.vote_average,
    first_air_date: item.first_air_date,
    genres: item.genres.map((n, i) => ({ id: i, name: n })),
    number_of_seasons,
    seasons: seasonsData,
    credits: {
      cast: (item.cast || []).map((n, i) => ({ id: i, name: n, character: `Role ${i+1}`, profile_path: null }))
    },
    posterUrl,
    backdropUrl
  };
}

