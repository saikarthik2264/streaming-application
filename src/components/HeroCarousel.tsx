"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Info, Star, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { CatalogItem } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroCarousel({ featuredItems }: { featuredItems: CatalogItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredItems.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [featuredItems]);

  if (!featuredItems || featuredItems.length === 0) return null;

  const featuredItem = featuredItems[currentIndex];
  const detailUrl = `/${featuredItem.type}/${featuredItem.id}`;
  const watchUrl = `/${featuredItem.type}/${featuredItem.id}?resume=true`;

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % featuredItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  return (
    <section className="relative w-full h-[75vh] overflow-hidden bg-black group/carousel">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Backdrop */}
          <img
            src={featuredItem.backdropUrl || featuredItem.posterUrl}
            alt={featuredItem.title}
            className="absolute inset-0 w-full h-full object-cover object-center scale-100 group-hover/carousel:scale-[1.01] transition-transform duration-10000 ease-out"
            onError={(e) => { (e.target as HTMLImageElement).src = featuredItem.posterUrl || ""; }}
          />
          <div className="absolute inset-0 hero-gradient" />

          {/* Content */}
          <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 sm:px-12 flex items-end pb-16 sm:pb-24">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-xl flex flex-col gap-3"
            >
              {/* Release Tag & Genres */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold tracking-wider text-[#e50914] bg-[#e50914]/10 border border-[#e50914]/30 px-2 py-0.5 rounded-md uppercase">Recent Release</span>
                {featuredItem.genres.slice(0, 3).map(g => (
                  <span key={g} className="text-[11px] font-semibold text-white/70 bg-white/10 px-2.5 py-0.5 rounded-md backdrop-blur-sm">{g}</span>
                ))}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight drop-shadow-md">
                {featuredItem.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center gap-3 text-sm text-white/75 font-medium">
                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Star size={14} fill="currentColor" /> {featuredItem.vote_average.toFixed(1)}
                </span>
                {featuredItem.runtime && <span className="flex items-center gap-1"><Clock size={13} /> {featuredItem.runtime}</span>}
                <span>{featuredItem.release_date?.split("-")[0]}</span>
              </div>

              <p className="text-sm sm:text-[15px] text-white/85 leading-relaxed line-clamp-3 max-w-lg drop-shadow-sm">
                {featuredItem.overview}
              </p>

              {/* Buttons */}
              <div className="flex items-center gap-3 mt-2">
                <Link
                  href={watchUrl}
                  className="flex items-center gap-2 bg-[#e50914] hover:bg-[#ff1a25] text-white font-bold text-sm py-2.5 px-7 rounded-md transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-900/30"
                >
                  <Play size={16} fill="currentColor" /> Watch Now
                </Link>
                <Link
                  href={detailUrl}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-sm py-2.5 px-6 rounded-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                >
                  <Info size={16} /> More Info
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {featuredItems.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/5 text-white/70 hover:text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 cursor-pointer">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/5 text-white/70 hover:text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 cursor-pointer">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots indicators */}
      {featuredItems.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {featuredItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${currentIndex === idx ? "w-6 bg-[#e50914]" : "w-2 bg-white/40 hover:bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
