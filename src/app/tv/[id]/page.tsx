"use client";
import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Plus, Check, Star, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import MovieRow from "@/components/MovieRow";
import ClickShield from "@/components/ClickShield";
import { getTVDetail, getSimilarTVShows } from "@/lib/tmdb";
import { useStore, CatalogItem } from "@/store/useStore";

export default function TVDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [show, setShow] = useState<CatalogItem | null>(null);
  const [similar, setSimilar] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [theater, setTheater] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [numSeasons, setNumSeasons] = useState(5);
  const [episodesPerSeason, setEpisodesPerSeason] = useState(10);

  const addToHistory = useStore(s => s.addToHistory);
  const toggleWatchlist = useStore(s => s.toggleWatchlist);
  const isInWatchlist = useStore(s => s.isInWatchlist);
  const savePlaybackProgress = useStore(s => s.savePlaybackProgress);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await getTVDetail(id);
        setShow(s);
        addToHistory(s);
        if (s.number_of_seasons) setNumSeasons(s.number_of_seasons);
        if (s.episodes_per_season) setEpisodesPerSeason(s.episodes_per_season);
        const sim = await getSimilarTVShows(id);
        setSimilar(sim);
        if (searchParams.get("resume") === "true") setPlaying(true);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  useEffect(() => {
    if (!playing || !show) return;
    savePlaybackProgress(show.id, 10, {
      title: show.title, type: "tv", posterPath: show.posterUrl || "", backdropPath: show.backdropUrl || "", imdbId: show.imdbId, season, episode
    });
  }, [playing, season, episode, show]);

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!show) return <div className="flex flex-col items-center justify-center gap-4 py-32"><h2 className="text-xl font-bold text-red-500">Show Not Found</h2><Link href="/" className="bg-red-600 px-6 py-2 rounded-md font-bold text-sm">Home</Link></div>;

  const isBookmarked = isInWatchlist(show.id);
  const streamUrl = `https://vidfast.pro/tv/${show.imdbId}/${season}/${episode}?autoPlay=true&nextButton=true&autoNext=true`;

  const playEpisode = (s: number, ep: number) => { setSeason(s); setEpisode(ep); setPlaying(true); };

  return (
    <div className="flex flex-col gap-8 pb-16 animate-fade-in">
      <div className="px-6 sm:px-12 pt-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium cursor-pointer"><ArrowLeft size={16} /> Back</button>
      </div>

      <div className={`${theater ? "w-full" : "max-w-[1400px] mx-auto w-full px-6 sm:px-12"}`}>
        {playing ? (
          <div className={`relative bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 ${theater ? "h-[85vh] rounded-none" : "aspect-video"}`}>
            <iframe src={streamUrl} className="w-full h-full border-none" allowFullScreen allow="autoplay; fullscreen" referrerPolicy="no-referrer" />
            <ClickShield />
            <button onClick={() => setTheater(!theater)} className="absolute top-3 right-3 z-30 bg-black/60 p-2 rounded-lg text-white/70 hover:text-white cursor-pointer border border-white/10">
              {theater ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        ) : (
          <div className="relative aspect-video sm:aspect-[21/9] rounded-xl overflow-hidden border border-white/5 group shadow-2xl">
            <img src={show.backdropUrl || show.posterUrl} alt={show.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              onError={(e) => { (e.target as HTMLImageElement).src = show.posterUrl || ""; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <button onClick={() => setPlaying(true)} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#e50914] hover:bg-[#ff1a25] text-white flex items-center justify-center shadow-2xl shadow-red-950/50 hover:scale-110 active:scale-95 transition-all cursor-pointer">
                <Play size={24} fill="currentColor" className="translate-x-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {show.genres.map(g => <span key={g} className="text-xs font-semibold text-white/60 bg-white/5 px-3 py-1 rounded-md border border-white/5">{g}</span>)}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">{show.title}</h1>
          <div className="flex items-center gap-3 text-sm text-white/60 font-medium">
            <span className="flex items-center gap-1 text-yellow-400 font-bold"><Star size={14} fill="currentColor" /> {show.vote_average}</span>
            <span>{numSeasons} Seasons</span>
            <span>{show.first_air_date?.split("-")[0]}</span>
          </div>
          <p className="text-[15px] text-white/70 leading-relaxed">{show.overview}</p>

          {/* Season selector */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto hide-scrollbar border-b border-white/5 pb-2">
            {Array.from({ length: numSeasons }, (_, i) => i + 1).map(s => (
              <button key={s} onClick={() => { setSeason(s); setEpisode(1); }}
                className={`text-sm font-semibold px-4 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${season === s ? "bg-white text-black" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                Season {s}
              </button>
            ))}
          </div>

          {/* Episode grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-2">
            {Array.from({ length: episodesPerSeason }, (_, i) => i + 1).map(ep => (
              <button key={ep} onClick={() => playEpisode(season, ep)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all cursor-pointer group/ep ${episode === ep && playing ? "bg-[#e50914]/10 border-[#e50914]/40 text-[#e50914]" : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white"}`}>
                <Play size={16} className="group-hover/ep:scale-110 transition-transform" />
                <span className="text-xs font-bold">E{ep}</span>
              </button>
            ))}
          </div>

          {show.cast && show.cast.length > 0 && (
            <div className="border-t border-white/5 pt-4 mt-4">
              <h3 className="text-xs font-bold uppercase text-white/40 mb-2 tracking-wider">Cast</h3>
              <div className="flex flex-wrap gap-2">
                {show.cast.map(a => <span key={a} className="text-xs font-medium text-white/60 bg-white/5 px-2.5 py-1 rounded-md">{a}</span>)}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {!playing && (
            <button onClick={() => setPlaying(true)} className="w-full flex items-center justify-center gap-2 bg-[#e50914] hover:bg-[#ff1a25] text-white font-bold py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-sm shadow-lg shadow-red-950/30">
              <Play size={16} fill="currentColor" /> Watch S{season} E{episode}
            </button>
          )}
          <button onClick={() => toggleWatchlist(show)} className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-lg transition-all text-sm cursor-pointer ${isBookmarked ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/15"}`}>
            {isBookmarked ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
            {isBookmarked ? "In Watchlist" : "Add to Watchlist"}
          </button>
        </div>
      </div>

      {similar.length > 0 && <MovieRow title="More Like This" items={similar} />}
    </div>
  );
}
