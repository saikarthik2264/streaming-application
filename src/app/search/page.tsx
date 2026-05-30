"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Search, Film, Tv } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { generateCatalog } from "@/data/mockCatalog";
import { CatalogItem } from "@/store/useStore";

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q: queryParam = "", type: typeParam = "all" } = use(searchParams);
  const router = useRouter();
  const [query, setQuery] = useState(queryParam);
  const [filter, setFilter] = useState(typeParam);

  useEffect(() => { setQuery(queryParam); }, [queryParam]);

  const catalog = generateCatalog();
  const q = query.toLowerCase();
  let results = q ? catalog.filter(i =>
    i.title.toLowerCase().includes(q) ||
    i.overview.toLowerCase().includes(q) ||
    i.genres.some(g => g.toLowerCase().includes(q)) ||
    (i.cast && i.cast.some(c => c.toLowerCase().includes(q)))
  ) : catalog;

  if (filter === "movie") results = results.filter(i => i.type === "movie");
  if (filter === "tv") results = results.filter(i => i.type === "tv");

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-8 flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center bg-[#1a1a1a] border border-white/5 rounded-xl py-3 px-5 max-w-xl">
        <Search className="text-white/30 mr-3" size={20} />
        <input type="text" placeholder="Search titles, actors, genres..." className="bg-transparent text-white text-sm outline-none w-full font-medium placeholder:text-white/30"
          value={query} onChange={e => { setQuery(e.target.value); router.push(`/search?q=${encodeURIComponent(e.target.value)}&type=${filter}`); }} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{q ? `Results for "${query}"` : "Browse All"} <span className="text-white/30 text-sm font-medium ml-1">({results.length})</span></h2>
        <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-white/5">
          {[{ key: "all", label: "All" }, { key: "movie", label: "Movies", icon: Film }, { key: "tv", label: "TV", icon: Tv }].map(t => (
            <button key={t.key} onClick={() => { setFilter(t.key); router.push(`/search?q=${encodeURIComponent(query)}&type=${t.key}`); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${filter === t.key ? "bg-[#e50914] text-white" : "text-white/40 hover:text-white"}`}>
              {t.icon && <t.icon size={12} />} {t.label}
            </button>
          ))}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {results.map(item => <MovieCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Search className="text-white/10" size={48} />
          <p className="text-white/40 text-sm">No results found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
