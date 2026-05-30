"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Bookmark, Heart, Sparkles, Compass } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { useStore } from "@/store/useStore";

export default function MyList() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"watchlist" | "favorites">("watchlist");

  // Zustand Store
  const activeProfile = useStore((state) => state.activeProfile);
  const watchlistByProfile = useStore((state) => state.watchlistByProfile);
  const favoritesByProfile = useStore((state) => state.favoritesByProfile);

  // Client hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <MyListSkeleton />;
  }

  // Load lists for active profile
  const watchlist = watchlistByProfile[activeProfile.id] || [];
  const favorites = favoritesByProfile[activeProfile.id] || [];

  const displayedList = activeTab === "watchlist" ? watchlist : favorites;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-6 sm:gap-8 relative z-10 animate-fade-in">
      
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2 select-none">
            <Sparkles className="text-red-500 animate-pulse" size={24} />
            My Theatrical Lists
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-1">
            Personal collection curated for profile: <span className="text-red-500 font-bold">{activeProfile.name}</span>
          </p>
        </div>

        {/* Tab switch control */}
        <div className="flex items-center gap-2 bg-[#0c0c12]/90 border border-white/5 p-1 rounded-lg backdrop-blur-md">
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "watchlist" ? "bg-red-600 text-white shadow-md shadow-red-950/40" : "text-gray-400 hover:text-white"
            }`}
          >
            <Bookmark size={14} />
            Watchlist ({watchlist.length})
          </button>
          
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "favorites" ? "bg-red-600 text-white shadow-md shadow-red-950/40" : "text-gray-400 hover:text-white"
            }`}
          >
            <Heart size={14} />
            Favorites ({favorites.length})
          </button>
        </div>
      </div>

      {/* Grid listing */}
      {displayedList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
          {displayedList.map((item) => (
            <MovieCard key={`${item.id}-${activeTab}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
            {activeTab === "watchlist" ? <Bookmark size={28} /> : <Heart size={28} />}
          </div>
          <div className="flex flex-col gap-1 max-w-sm">
            <h3 className="text-lg sm:text-xl font-bold text-gray-300">
              {activeTab === "watchlist" ? "Your Watchlist is Empty" : "No Favorites Liked Yet"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {activeTab === "watchlist"
                ? "Bookmark titles that catch your eye, and they will populate here across your profiles."
                : "Heart titles that you love, and we will automatically fine-tune your recommendations."}
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm py-2.5 px-6 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Compass size={16} />
            Browse Spotlight Catalog
          </Link>
        </div>
      )}

    </div>
  );
}

// Sleek loading skeleton
function MyListSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col gap-8 animate-pulse">
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-gray-800 rounded-md" />
          <div className="h-4 w-32 bg-gray-800 rounded" />
        </div>
        <div className="h-10 w-64 bg-gray-800 rounded-lg" />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-[2/3] bg-gradient-to-br from-[#0c0c12] to-[#161622] rounded-xl border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
