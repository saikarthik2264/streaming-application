"use client";
import React from "react";
import Link from "next/link";
import { Play, Info, Star, Clock } from "lucide-react";
import { CatalogItem } from "@/store/useStore";

export default function HeroCarousel({ featuredItem }: { featuredItem: CatalogItem }) {
  const detailUrl = `/movie/${featuredItem.id}`;
  const streamUrl = `https://vidfast.pro/movie/${featuredItem.imdbId}?autoPlay=true&theme=E50914`;

  return (
    <section className="relative w-full h-[70vh] overflow-hidden">
      {/* Backdrop */}
      <img
        src={featuredItem.backdropUrl || featuredItem.posterUrl}
        alt={featuredItem.title}
        className="absolute inset-0 w-full h-full object-cover object-center"
        onError={(e) => { (e.target as HTMLImageElement).src = featuredItem.posterUrl || ""; }}
      />
      <div className="absolute inset-0 hero-gradient" />

      {/* Content */}
      <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 sm:px-12 flex items-end pb-16 sm:pb-20">
        <div className="max-w-xl flex flex-col gap-3">
          {/* Genres */}
          <div className="flex items-center gap-2 flex-wrap">
            {featuredItem.genres.map(g => (
              <span key={g} className="text-[11px] font-semibold text-white/70 bg-white/10 px-2.5 py-0.5 rounded-md backdrop-blur-sm">{g}</span>
            ))}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
            {featuredItem.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-white/70 font-medium">
            <span className="flex items-center gap-1 text-yellow-400 font-bold">
              <Star size={14} fill="currentColor" /> {featuredItem.vote_average}
            </span>
            <span className="flex items-center gap-1"><Clock size={13} /> {featuredItem.runtime}</span>
            <span>{featuredItem.release_date?.split("-")[0]}</span>
          </div>

          <p className="text-sm sm:text-[15px] text-white/75 leading-relaxed line-clamp-3">
            {featuredItem.overview}
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3 mt-1">
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#e50914] hover:bg-[#ff1a25] text-white font-bold text-sm py-2.5 px-7 rounded-md transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-900/30"
            >
              <Play size={16} fill="currentColor" /> Watch Now
            </a>
            <Link
              href={detailUrl}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-sm py-2.5 px-6 rounded-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
            >
              <Info size={16} /> More Info
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
