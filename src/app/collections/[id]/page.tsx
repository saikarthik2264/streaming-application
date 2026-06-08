"use client";
import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Star, Calendar, Clock, Film } from "lucide-react";
import { getCollectionDetail, CollectionDetail } from "@/lib/tmdb";

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getCollectionDetail(id);
        setCollection(data);
      } catch (e) {
        console.error("Failed to load collection details:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <CollectionDetailsSkeleton />;
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <h2 className="text-xl font-bold text-[#e50914]">Collection Not Found</h2>
        <Link href="/collections" className="bg-[#e50914] px-6 py-2 rounded-md font-bold text-sm text-white">
          Back to Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 animate-fade-in relative z-10">
      
      {/* Back navigation */}
      <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Collection Hero Banner */}
      <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12">
        <div className="relative aspect-video sm:aspect-[24/9] rounded-2xl overflow-hidden border border-white/5 group shadow-2xl bg-[#141414]">
          <img
            src={collection.backdropUrl || collection.posterUrl}
            alt={collection.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-700 opacity-60"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = collection.posterUrl || "";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Logo/Info overlay on banner */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 right-6 sm:right-12 flex flex-col gap-2.5 max-w-2xl">
            <span className="text-[10px] font-black uppercase text-[#e50914] tracking-widest bg-[#e50914]/10 border border-[#e50914]/20 rounded-md px-2.5 py-1 self-start">
              Saga / Franchise
            </span>
            <h1 className="text-2xl sm:text-5xl font-black text-white drop-shadow-md select-none tracking-tight">
              {collection.name}
            </h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed drop-shadow line-clamp-3 font-medium">
              {collection.overview}
            </p>
          </div>
        </div>
      </div>

      {/* Collection Parts listing */}
      <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 flex flex-col gap-6 mt-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Film size={20} className="text-[#e50914]" />
            Chronological Order ({collection.parts.length} Films)
          </h2>
          <span className="text-xs text-white/40 font-semibold tracking-wider uppercase bg-[#18181f] px-3 py-1 rounded-md border border-white/5">
            Release Date Ascending
          </span>
        </div>

        {/* Film Row Cards */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {collection.parts.map((movie, index) => {
            const partIndex = (index + 1).toString().padStart(2, "0");
            return (
              <div
                key={movie.id}
                className="flex flex-col sm:flex-row gap-5 p-4 sm:p-5 rounded-2xl bg-[#121218]/80 hover:bg-[#161622]/80 border border-white/[0.04] hover:border-white/10 transition-all duration-300"
              >
                {/* Index badge */}
                <div className="hidden md:flex items-center justify-center font-black text-3xl text-white/10 select-none px-2">
                  {partIndex}
                </div>

                {/* Movie Poster */}
                <Link
                  href={`/movie/${movie.id}`}
                  className="flex-none w-[110px] sm:w-[130px] aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/5 hover:scale-105 transition-transform"
                >
                  <img
                    src={movie.posterUrl || ""}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop";
                    }}
                  />
                </Link>

                {/* Movie description details */}
                <div className="flex flex-col flex-1 gap-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Link href={`/movie/${movie.id}`} className="hover:text-[#e50914] transition-colors">
                      <h3 className="text-base sm:text-xl font-extrabold text-white">
                        {movie.title}
                      </h3>
                    </Link>
                  </div>
                  
                  {/* Metadata tags */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 font-bold mt-0.5">
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star size={13} fill="currentColor" />
                      {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {movie.release_date ? movie.release_date.split("-")[0] : "N/A"}
                    </span>
                    {movie.runtime && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {movie.runtime}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-medium line-clamp-3 mt-1.5 max-w-4xl">
                    {movie.overview}
                  </p>

                  <div className="mt-auto pt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/movie/${movie.id}?resume=true`}
                      className="flex items-center gap-2 bg-[#e50914] hover:bg-[#ff1a25] text-white font-extrabold text-xs py-2 px-5 rounded-lg shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    >
                      <Play size={12} fill="currentColor" /> Play Movie
                    </Link>
                    <Link
                      href={`/movie/${movie.id}`}
                      className="flex items-center gap-1.5 border border-white/10 hover:border-white hover:bg-white/5 text-gray-300 hover:text-white font-bold text-xs py-2 px-4 rounded-lg transition-all"
                    >
                      Franchise details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CollectionDetailsSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-12 py-8 flex flex-col gap-8 animate-pulse">
      <div className="h-5 w-20 bg-gray-800 rounded" />
      <div className="w-full aspect-[24/9] bg-gray-900 rounded-2xl" />
      <div className="flex justify-between pb-3 border-b border-white/5">
        <div className="h-6 w-64 bg-gray-800 rounded" />
        <div className="h-6 w-32 bg-gray-800 rounded" />
      </div>
      <div className="flex flex-col gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-5 p-5 bg-gray-900 rounded-2xl h-[180px]">
            <div className="w-[120px] aspect-[2/3] bg-gray-800 rounded-xl" />
            <div className="flex-1 flex flex-col gap-3">
              <div className="h-6 w-1/3 bg-gray-800 rounded" />
              <div className="h-4 w-1/4 bg-gray-800 rounded" />
              <div className="h-12 w-full bg-gray-800 rounded" />
              <div className="h-8 w-32 bg-gray-800 rounded mt-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
