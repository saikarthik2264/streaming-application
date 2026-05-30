import { NextRequest, NextResponse } from "next/server";
import { generateCatalog, MOVIES, TV_SHOWS } from "@/data/mockCatalog";
import { CatalogItem } from "@/store/useStore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params;
  const fullPath = pathParts.join("/");
  const { searchParams } = new URL(request.url);
  const catalog = generateCatalog();

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
  return { id: item.id, title: item.title, name: item.name || item.title, media_type: item.type, overview: item.overview, vote_average: item.vote_average, release_date: item.release_date || "", first_air_date: item.first_air_date || "", backdrop_path: item.backdrop_path, poster_path: item.poster_path, posterUrl, backdropUrl };
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
  return { id: item.id, imdb_id: item.imdbId, title: item.title, overview: item.overview, vote_average: item.vote_average, release_date: item.release_date, genres: item.genres.map((n, i) => ({ id: i, name: n })), runtime: parseInt(item.runtime?.replace(/\D/g, "") || "120"), credits: { cast: (item.cast || []).map((n, i) => ({ id: i, name: n, character: `Role ${i+1}`, profile_path: null })) }, posterUrl, backdropUrl };
}

function toTVDetail(item: CatalogItem) {
  const number_of_seasons = item.number_of_seasons || 5;
  const episodes_per_season = item.episodes_per_season || 10;
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
    seasons: Array.from({ length: number_of_seasons }, (_, i) => i + 1).map(s => ({
      id: s,
      season_number: s,
      episode_count: episodes_per_season,
      name: `Season ${s}`
    })),
    credits: { cast: (item.cast || []).map((n, i) => ({ id: i, name: n, character: `Role ${i+1}`, profile_path: null })) },
    posterUrl,
    backdropUrl
  };
}
