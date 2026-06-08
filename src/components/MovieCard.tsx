"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Plus, Check, Star, Heart } from "lucide-react";
import { CatalogItem, useStore } from "@/store/useStore";

export default function MovieCard({ item }: { item: CatalogItem }) {
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const toggleWatchlist = useStore(s => s.toggleWatchlist);
  const isInWatchlist = useStore(s => s.isInWatchlist);
  const toggleFavorite = useStore(s => s.toggleFavorite);
  const isInFavorites = useStore(s => s.isInFavorites);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isBookmarked = mounted ? isInWatchlist(item.id) : false;
  const isFavorited = mounted ? isInFavorites(item.id) : false;
  const isCollection = (item.type as string) === "collection";
  const detailUrl = isCollection ? `/collections/${item.id}` : `/${item.type}/${item.id}`;
 
  return (
    <Link
      href={detailUrl}
      className="relative flex-none w-[140px] sm:w-[160px] md:w-[180px] rounded-lg overflow-hidden group transition-transform duration-300 hover:scale-105 hover:z-20"
    >
      {/* Poster */}
      <div className="aspect-[2/3] bg-[#181818] relative overflow-hidden rounded-lg shadow-lg shadow-black/60 group-hover:shadow-xl group-hover:shadow-red-950/20 transition-shadow duration-300 border border-white/[0.04] group-hover:border-white/10">
        {!imgError && item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-gray-500 text-xs font-semibold p-3 text-center">
            {item.title}
          </div>
        )}
 
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
 
        {/* Hover actions */}
        <div className="absolute bottom-0 inset-x-0 p-2.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex flex-col gap-1.5">
          {isCollection ? (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-extrabold uppercase bg-[#e50914] text-white px-2 py-0.5 rounded self-start tracking-wider">Franchise</span>
              <p className="text-[11px] font-black text-white truncate mt-1">{item.title}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/60">
                <span>{(item as any).movie_count || "2+"} Movies</span>
                <span>•</span>
                <span>{(item as any).year_range || "Collection"}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-[#e50914] text-white flex items-center justify-center cursor-pointer hover:bg-[#ff1a25] transition-colors">
                  <Play size={12} fill="currentColor" className="translate-x-[1px]" />
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(item); }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${isBookmarked ? "bg-white text-black border-white" : "bg-black/50 text-white border-white/30 hover:border-white"}`}
                  title={isBookmarked ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                  {isBookmarked ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(item); }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${isFavorited ? "bg-red-600 text-white border-red-600" : "bg-black/50 text-white border-white/30 hover:border-white"}`}
                  title={isFavorited ? "Remove from Favorites" : "Mark as Favorite"}
                >
                  <Heart size={12} fill={isFavorited ? "currentColor" : "none"} />
                </button>
              </div>
              <p className="text-[11px] font-bold text-white truncate">{item.title}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                <span className="text-green-400">{Math.round(item.vote_average * 10)}%</span>
                <span className="text-white/50">{(item.release_date || item.first_air_date || "").split("-")[0]}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
