"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FolderHeart,
  Clapperboard,
  Compass,
  Calendar,
  Film,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sparkles,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { getCollections, CollectionItem } from "@/lib/tmdb";

type SortMode = "a-z" | "z-a" | "most-movies" | "newest" | "oldest";

const ITEMS_PER_PAGE = 12;

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("most-movies");
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCollections();
        setCollections(data);
      } catch (e) {
        console.error("Failed to load collections:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Reset page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortMode]);

  // Filtered + sorted collections
  const processedCollections = useMemo(() => {
    let filtered = collections;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.overview && c.overview.toLowerCase().includes(q))
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortMode) {
      case "a-z":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "z-a":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "most-movies":
        sorted.sort((a, b) => b.movie_count - a.movie_count);
        break;
      case "newest": {
        sorted.sort((a, b) => {
          const yearA = parseInt(b.year_range?.split("–")[1] || "0");
          const yearB = parseInt(a.year_range?.split("–")[1] || "0");
          return yearA - yearB;
        });
        break;
      }
      case "oldest": {
        sorted.sort((a, b) => {
          const yearA = parseInt(a.year_range?.split("–")[0] || "9999");
          const yearB = parseInt(b.year_range?.split("–")[0] || "9999");
          return yearA - yearB;
        });
        break;
      }
    }

    return sorted;
  }, [collections, searchQuery, sortMode]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedCollections.length / ITEMS_PER_PAGE));
  const paginatedCollections = processedCollections.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const totalMoviesAcrossCollections = collections.reduce(
    (sum, c) => sum + c.movie_count,
    0
  );

  if (loading) {
    return <CollectionsSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-6 sm:gap-8 relative z-10 animate-fade-in">
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-3 select-none">
              <FolderHeart className="text-[#e50914] animate-pulse" size={28} />
              Franchise Collections
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
              Explore complete cinematic sagas and multi-part chronicles grouped
              in one place.
            </p>
          </div>

          {/* Stats Badge */}
          <button
            onClick={() => setShowStats((s) => !s)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#e50914]/20 to-purple-600/20 border border-[#e50914]/30 text-white/80 text-xs font-bold px-4 py-2 rounded-full hover:border-[#e50914]/60 transition-all cursor-pointer select-none"
          >
            <BarChart3 size={14} className="text-[#e50914]" />
            {collections.length} Collections • {totalMoviesAcrossCollections}{" "}
            Films
          </button>
        </div>
      </div>

      {/* Stats Panel (collapsible) */}
      {showStats && (
        <div className="bg-gradient-to-br from-[#121218]/90 to-[#1a1a2e]/90 border border-white/[0.06] rounded-2xl p-5 flex flex-wrap gap-6 animate-fade-in backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/30">
              Total Collections
            </span>
            <span className="text-3xl font-black text-[#e50914]">
              {collections.length}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/30">
              Total Films
            </span>
            <span className="text-3xl font-black text-purple-400">
              {totalMoviesAcrossCollections}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/30">
              Avg Films / Collection
            </span>
            <span className="text-3xl font-black text-emerald-400">
              {collections.length > 0
                ? (totalMoviesAcrossCollections / collections.length).toFixed(1)
                : "0"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/30">
              Largest Franchise
            </span>
            <span className="text-lg font-black text-yellow-400 line-clamp-1">
              {collections.length > 0
                ? [...collections].sort((a, b) => b.movie_count - a.movie_count)[0]?.name
                : "—"}
            </span>
          </div>
        </div>
      )}

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full bg-[#121218] border border-white/[0.06] text-white text-sm font-medium rounded-xl pl-10 pr-10 py-2.5 placeholder:text-white/20 focus:outline-none focus:border-[#e50914]/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-white/30 hidden sm:block" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="bg-[#121218] border border-white/[0.06] text-white text-xs font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#e50914]/40 appearance-none cursor-pointer pr-8 transition-colors"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            <option value="most-movies">Most Movies</option>
            <option value="a-z">A → Z</option>
            <option value="z-a">Z → A</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-xs text-white/30 font-bold">
        <Sparkles size={12} className="text-[#e50914]" />
        Showing {paginatedCollections.length} of {processedCollections.length}{" "}
        collections
        {searchQuery && (
          <span className="text-white/50">
            {" "}matching &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>

      {paginatedCollections.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {paginatedCollections.map((col, i) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#121218]/80 border border-white/[0.04] hover:border-[#e50914]/40 transition-all duration-300 shadow-xl hover:shadow-[#e50914]/5 hover:scale-[1.03] flex-grow"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Image Banner Container */}
                <div className="aspect-video relative overflow-hidden bg-[#18181f]">
                  <img
                    src={col.backdropUrl || col.posterUrl}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop";
                    }}
                  />

                  {/* Visual gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121218] via-[#121218]/40 to-transparent" />

                  {/* Float count tag */}
                  <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-20">
                    <Film size={12} className="text-[#e50914]" />
                    <span className="text-[10px] font-black text-white tracking-wider uppercase">
                      {col.movie_count} Movies
                    </span>
                  </div>
                </div>

                {/* Info section */}
                <div className="p-5 flex flex-col flex-1 gap-2.5 bg-gradient-to-b from-transparent to-[#0a0a0f]/40">
                  <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-[#e50914] transition-colors line-clamp-1">
                    {col.name}
                  </h3>

                  {/* Year Range */}
                  <div className="flex items-center gap-1 text-[11px] font-bold text-white/50">
                    <Calendar size={12} />
                    <span>Timeline: {col.year_range}</span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {col.overview}
                  </p>

                  {/* View Details Prompt */}
                  <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#e50914] tracking-widest group-hover:translate-x-1 transition-transform">
                      Explore Chronicle &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 bg-[#121218] border border-white/[0.06] text-white/60 text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#e50914]/40 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/30"
                          : "bg-[#121218] border border-white/[0.06] text-white/40 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 bg-[#121218] border border-white/[0.06] text-white/60 text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#e50914]/40 hover:text-white transition-all cursor-pointer"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="w-full flex flex-col items-center justify-center gap-4 py-20 text-center">
          <Clapperboard className="text-white/10" size={48} />
          <p className="text-white/40 text-sm">
            {searchQuery
              ? `No collections match "${searchQuery}".`
              : "No franchise collections discovered yet."}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="flex items-center gap-2 bg-[#e50914] text-white font-extrabold text-xs sm:text-sm py-2.5 px-6 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer mt-2"
            >
              <X size={16} />
              Clear Search
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 bg-[#e50914] text-white font-extrabold text-xs sm:text-sm py-2.5 px-6 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer mt-2"
            >
              <Compass size={16} />
              Browse Catalog
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col gap-8 animate-pulse">
      <div className="flex flex-col gap-2 pb-4 border-b border-white/5">
        <div className="h-8 w-64 bg-gray-800 rounded-md" />
        <div className="h-4 w-48 bg-gray-800 rounded" />
      </div>

      {/* Search/sort skeleton */}
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-gray-800 rounded-xl" />
        <div className="w-40 h-10 bg-gray-800 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl bg-gray-900 border border-white/5 h-[340px] relative overflow-hidden"
          >
            <div className="aspect-video bg-gray-800" />
            <div className="p-5 flex flex-col gap-3 flex-1">
              <div className="h-5 w-3/4 bg-gray-800 rounded" />
              <div className="h-3 w-1/2 bg-gray-800 rounded" />
              <div className="h-10 w-full bg-gray-800 rounded mt-2" />
              <div className="h-4 w-1/3 bg-gray-800 rounded mt-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
