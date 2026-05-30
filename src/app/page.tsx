"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import MovieRow from "@/components/MovieRow";
import { MOVIES, getCategoryRows } from "@/data/mockCatalog";
import { useStore } from "@/store/useStore";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const playbackProgressByProfile = useStore(s => s.playbackProgressByProfile);
  const activeProfile = useStore(s => s.activeProfile);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <HomeSkeleton />;

  const featured = MOVIES.find(m => m.imdbId === "tt0816692")!; // Interstellar
  const categories = getCategoryRows();

  const profileProgress = playbackProgressByProfile[activeProfile.id] || {};
  const continueWatchingItems = Object.values(profileProgress)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6 sm:gap-10 pb-16 animate-fade-in">
      <HeroCarousel featuredItem={featured} />

      {/* Continue Watching — only shows if user has actually watched something */}
      {continueWatchingItems.length > 0 && (
        <div className="flex flex-col gap-1.5 px-6 sm:px-12">
          <h2 className="text-base sm:text-lg font-bold text-white/90">Continue Watching</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2">
            {continueWatchingItems.map(item => (
              <Link key={item.tmdbId} href={`/${item.type}/${item.tmdbId}?resume=true`}
                className="flex-none w-[220px] sm:w-[280px] rounded-lg overflow-hidden bg-[#181818] group hover:scale-105 transition-transform border border-white/[0.04]">
                <div className="aspect-video relative">
                  <img src={item.backdropPath || item.posterPath} alt={item.title} className="w-full h-full object-cover" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-[#e50914] text-white flex items-center justify-center"><Play size={16} fill="currentColor" /></div>
                  </div>
                </div>
                <div className="w-full h-[3px] bg-white/10"><div className="h-full bg-[#e50914]" style={{ width: `${item.progress}%` }} /></div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                  <p className="text-[10px] text-white/40">{item.type === "tv" ? `S${item.season} E${item.episode}` : "Resume"}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {categories.map((cat, i) => (
        <MovieRow key={i} title={cat.title} items={cat.items} />
      ))}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="w-full h-[70vh] bg-[#141414] animate-shimmer" />
      {[1, 2, 3].map(r => (
        <div key={r} className="flex flex-col gap-3 px-12">
          <div className="h-5 w-40 bg-[#1f1f1f] rounded" />
          <div className="flex gap-3">
            {[1,2,3,4,5,6].map(c => <div key={c} className="flex-none w-[180px] aspect-[2/3] bg-[#1a1a1a] rounded-lg animate-shimmer" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
