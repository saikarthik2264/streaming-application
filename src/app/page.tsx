"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import MovieRow from "@/components/MovieRow";
import { useStore, CatalogItem } from "@/store/useStore";
import { getHomeCategories, RowCategory, discoverCatalog, getTrendingCollections, CollectionItem } from "@/lib/tmdb";

export default function Home() {
  const [featured, setFeatured] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<RowCategory[]>([]);
  const [defaultCategories, setDefaultCategories] = useState<RowCategory[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering states
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [filteringLoading, setFilteringLoading] = useState(false);

  // Load trending collections
  useEffect(() => {
    (async () => {
      try {
        const cols = await getTrendingCollections();
        setCollections(cols);
      } catch (e) {
        console.error("Failed to load trending collections on homepage:", e);
      }
    })();
  }, []);

  const playbackProgressByProfile = useStore(s => s.playbackProgressByProfile);
  const activeProfile = useStore(s => s.activeProfile);

  // Load initial home catalog based on active profile type
  useEffect(() => {
    (async () => {
      setLoading(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      try {
        const data = await getHomeCategories(activeProfile.type);
        setFeatured(data.featured);
        setCategories(data.categories);
        setDefaultCategories(data.categories);
      } catch (e) {
        console.error("Failed to load TMDB categories:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeProfile.type]);

  // Language & Country dynamic discovery effect
  useEffect(() => {
    if (loading) return;

    if (selectedCountry === "all" && selectedLanguage === "all") {
      setCategories(defaultCategories);
      return;
    }

    (async () => {
      setFilteringLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCountry !== "all") params.with_origin_country = selectedCountry;
        if (selectedLanguage !== "all") params.with_original_language = selectedLanguage;

        // Labels for titles
        const langLabels: Record<string, string> = {
          te: "Telugu", hi: "Hindi", ta: "Tamil", ml: "Malayalam", kn: "Kannada",
          en: "English", ko: "Korean", ja: "Japanese", es: "Spanish"
        };
        const countryLabels: Record<string, string> = {
          IN: "Indian", US: "American", KR: "Korean", JP: "Japanese", GB: "British", ES: "Spanish"
        };

        const langText = selectedLanguage !== "all" ? (langLabels[selectedLanguage] || selectedLanguage) : "";
        const countryText = selectedCountry !== "all" ? (countryLabels[selectedCountry] || selectedCountry) : "";
        const labelConnector = langText && countryText ? " " : "";
        const bannerTitleSuffix = `${countryText}${labelConnector}${langText}`;

        const [popular, topRated, action, comedy, drama] = await Promise.all([
          discoverCatalog({ ...params, sort_by: "popularity.desc" }),
          discoverCatalog({ ...params, sort_by: "vote_average.desc", "vote_count.gte": "10" }),
          discoverCatalog({ ...params, with_genres: "28", sort_by: "popularity.desc" }),
          discoverCatalog({ ...params, with_genres: "35", sort_by: "popularity.desc" }),
          discoverCatalog({ ...params, with_genres: "18", sort_by: "popularity.desc" })
        ]);

        const filteredRows: RowCategory[] = [];
        if (popular.length > 0) {
          filteredRows.push({ title: `Popular ${bannerTitleSuffix} Movies`, items: popular, type: "movie" });
        }
        if (topRated.length > 0) {
          filteredRows.push({ title: `Top Rated ${bannerTitleSuffix} Movies`, items: topRated, type: "movie" });
        }
        if (action.length > 0) {
          filteredRows.push({ title: `${bannerTitleSuffix} Action & Adventure`, items: action, type: "movie" });
        }
        if (comedy.length > 0) {
          filteredRows.push({ title: `${bannerTitleSuffix} Comedy Hits`, items: comedy, type: "movie" });
        }
        if (drama.length > 0) {
          filteredRows.push({ title: `${bannerTitleSuffix} Drama & Romance`, items: drama, type: "movie" });
        }

        // If all rows are empty, show a fallback row
        if (filteredRows.length === 0) {
          filteredRows.push({ title: `No movies found matching the selection`, items: [], type: "movie" });
        }

        setCategories(filteredRows);
      } catch (e) {
        console.error("Discovery filtering failed:", e);
      } finally {
        setFilteringLoading(false);
      }
    })();
  }, [selectedCountry, selectedLanguage, defaultCategories, loading]);

  if (loading || featured.length === 0) return <HomeSkeleton />;

  const profileProgress = playbackProgressByProfile[activeProfile.id] || {};
  const continueWatchingItems = Object.values(profileProgress)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6 sm:gap-10 pb-16 animate-fade-in">
      <HeroCarousel featuredItems={featured} />

      {/* Country & Language Selector Bar */}
      <div className="bg-[#111111]/90 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-[1400px] mx-auto w-full px-6 sm:px-12 mt-2 shadow-xl">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            🍿 Regional Cinema Showcase
          </h2>
          <p className="text-xs text-white/50">Filter the entire catalog dynamically by origin country or spoken language.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1 w-full sm:w-[180px]">
            <label className="text-[10px] font-extrabold uppercase text-white/40 tracking-wider">Country / Region</label>
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#e50914] focus:bg-[#181818] cursor-pointer transition-all">
              <option value="all">Global (All Countries)</option>
              <option value="IN">India 🇮🇳</option>
              <option value="US">United States 🇺🇸</option>
              <option value="KR">South Korea 🇰🇷</option>
              <option value="JP">Japan 🇯🇵</option>
              <option value="GB">United Kingdom 🇬🇧</option>
              <option value="ES">Spain 🇪🇸</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-[180px]">
            <label className="text-[10px] font-extrabold uppercase text-white/40 tracking-wider">Audio / Language</label>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#e50914] focus:bg-[#181818] cursor-pointer transition-all">
              <option value="all">All Languages</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="hi">Hindi (हिन्दी)</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="ml">Malayalam (മലയാളം)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
              <option value="en">English</option>
              <option value="ko">Korean (한국어)</option>
              <option value="ja">Japanese (日本語)</option>
              <option value="es">Spanish (Español)</option>
            </select>
          </div>
        </div>
      </div>

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

      {filteringLoading ? (
        <div className="flex flex-col gap-8 pb-16">
          {[1, 2].map(r => (
            <div key={r} className="flex flex-col gap-3 px-12">
              <div className="h-5 w-48 bg-[#1f1f1f] rounded animate-pulse" />
              <div className="flex gap-3 overflow-hidden">
                {[1,2,3,4,5,6].map(c => <div key={c} className="flex-none w-[180px] aspect-[2/3] bg-[#1a1a1a] rounded-lg animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {collections.length > 0 && (
            <MovieRow title="Popular Franchise Collections" items={collections as any} />
          )}
          {categories.map((cat, i) => (
            <MovieRow key={i} title={cat.title} items={cat.items} />
          ))}
        </>
      )}
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
