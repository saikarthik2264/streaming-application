"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Search, Film, Tv, Loader2 } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { searchCatalog } from "@/lib/tmdb";
import { CatalogItem } from "@/store/useStore";

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q: queryParam = "", type: typeParam = "all" } = use(searchParams);
  const router = useRouter();
  const [query, setQuery] = useState(queryParam);
  const [filter, setFilter] = useState(typeParam);
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setQuery(queryParam); }, [queryParam]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        if (query.trim()) {
          const searchResults = await searchCatalog(query);
          setResults(searchResults);
        } else {
          // If query is empty, load trending content as a default browse view
          const res = await fetch("/api/tmdb/trending/all/week");
          if (res.ok) {
            const data = await res.json();
            const items = (data.results || [])
              .filter((i: any) => i.media_type === "movie" || i.media_type === "tv")
              .map((i: any) => ({
                id: i.id,
                imdbId: i.imdb_id || `tt${i.id}`,
                title: i.title || i.name || "Untitled",
                name: i.name || i.title || "Untitled",
                type: i.media_type,
                backdrop_path: i.backdrop_path || "",
                poster_path: i.poster_path || "",
                overview: i.overview || "",
                vote_average: i.vote_average || 0.0,
                release_date: i.release_date || i.first_air_date || "",
                genres: [],
                posterUrl: i.poster_path ? `https://image.tmdb.org/t/p/w500${i.poster_path}` : "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop",
                backdropUrl: i.backdrop_path ? `https://image.tmdb.org/t/p/w1280${i.backdrop_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop"
              }));
            setResults(items);
          } else {
            setResults([]);
          }
        }
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  let filteredResults = results;
  if (filter === "movie") filteredResults = results.filter(i => i.type === "movie");
  if (filter === "tv") filteredResults = results.filter(i => i.type === "tv");

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-8 flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center bg-[#1a1a1a] border border-white/5 rounded-xl py-3 px-5 max-w-xl">
        <Search className="text-white/30 mr-3" size={20} />
        <input type="text" placeholder="Search titles, actors, genres..." className="bg-transparent text-white text-sm outline-none w-full font-medium placeholder:text-white/30"
          value={query} onChange={e => { setQuery(e.target.value); router.push(`/search?q=${encodeURIComponent(e.target.value)}&type=${filter}`); }} />
        {loading && <Loader2 className="text-[#e50914] animate-spin ml-2" size={18} />}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          {query ? `Results for "${query}"` : "Trending This Week"} 
          <span className="text-white/30 text-sm font-medium ml-1">({filteredResults.length})</span>
        </h2>
        <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-white/5">
          {[{ key: "all", label: "All" }, { key: "movie", label: "Movies", icon: Film }, { key: "tv", label: "TV", icon: Tv }].map(t => (
            <button key={t.key} onClick={() => { setFilter(t.key); router.push(`/search?q=${encodeURIComponent(query)}&type=${t.key}`); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${filter === t.key ? "bg-[#e50914] text-white" : "text-white/40 hover:text-white"}`}>
              {t.icon && <t.icon size={12} />} {t.label}
            </button>
          ))}
        </div>
      </div>

      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {filteredResults.map(item => <MovieCard key={item.id} item={item} />)}
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Search className="text-white/10" size={48} />
            <p className="text-white/40 text-sm">No results found for &ldquo;{query}&rdquo;</p>
          </div>
        )
      )}
    </div>
  );
}
