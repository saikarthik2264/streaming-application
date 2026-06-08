"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Film,
  FolderHeart,
  BarChart3,
  RefreshCw,
  Clock,
  Zap,
  TrendingUp,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Bug,
  ChevronDown,
  ChevronUp,
  Globe,
  Activity,
  Calendar,
  Play,
  Hash,
  Server,
  Lock,
} from "lucide-react";

interface DbStats {
  total_movies: number;
  total_collections: number;
  total_genres: number;
  total_tv_shows: number;
  movies_added_today: number;
  collections_added_today: number;
  last_sync_time: number | null;
  last_sync_type: string | null;
  genre_breakdown: Record<string, number>;
  language_breakdown: Record<string, number>;
  top_collections: { name: string; count: number }[];
}

interface SyncLog {
  id: string;
  type: string;
  started_at: number;
  finished_at: number | null;
  movies_added: number;
  movies_updated: number;
  duplicates_skipped: number;
  collections_found: number;
  errors: string[];
  pages_fetched: number;
  status: "running" | "completed" | "failed";
}

interface SyncStatus {
  is_running: boolean;
  current_sync: SyncLog | null;
  recent_logs: SyncLog[];
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("");
  const [passcodeError, setPasscodeError] = useState<boolean>(false);

  const [stats, setStats] = useState<DbStats | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState<string>("full");
  const [debugOpen, setDebugOpen] = useState(false);
  const [genresOpen, setGenresOpen] = useState(false);
  const [langsOpen, setLangsOpen] = useState(false);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("admin_authenticated");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, syncRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/sync"),
      ]);
      const statsData = await statsRes.json();
      const syncData = await syncRes.json();
      setStats(statsData);
      setSyncStatus(syncData);
      if (syncData.is_running) {
        setSyncing(true);
      } else {
        setSyncing(false);
      }
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchStats]);

  const handlePasscodeChange = useCallback((digit: string) => {
    if (passcode.length >= 4) return;
    const newCode = passcode + digit;
    setPasscode(newCode);
    
    if (newCode === "2002") {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin_authenticated", "true");
      }
    } else if (newCode.length === 4) {
      setPasscodeError(true);
      setTimeout(() => {
        setPasscode("");
        setPasscodeError(false);
      }, 800);
    }
  }, [passcode]);

  const handleBackspace = useCallback(() => {
    setPasscode((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPasscode("");
  }, []);

  const handleLock = () => {
    setIsAuthenticated(false);
    setPasscode("");
    setPasscodeError(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_authenticated");
    }
  };

  // Keyboard support for passcode screen
  useEffect(() => {
    if (isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handlePasscodeChange(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [passcode, isAuthenticated, handleBackspace, handleClear, handlePasscodeChange]);

  // Poll while syncing
  useEffect(() => {
    if (syncing && !pollInterval) {
      const id = setInterval(fetchStats, 3000);
      setPollInterval(id);
    }
    if (!syncing && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [syncing, pollInterval, fetchStats]);

  async function triggerSync(type: string) {
    setSyncing(true);
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      // Start polling
      setTimeout(fetchStats, 1000);
    } catch (e) {
      console.error("Sync trigger failed:", e);
      setSyncing(false);
    }
  }

  function formatTime(ts: number | null): string {
    if (!ts) return "Never";
    const d = new Date(ts);
    return d.toLocaleString();
  }

  function formatDuration(start: number, end: number | null): string {
    const elapsed = (end || Date.now()) - start;
    const secs = Math.floor(elapsed / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    return `${mins}m ${remainSecs}s`;
  }

  if (loading) return <AdminSkeleton />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            75% { transform: translateX(6px); }
          }
          .animate-shake {
            animation: shake 0.2s ease-in-out 0s 2;
          }
        `}} />
        <div className="max-w-md w-full bg-[#121218]/90 border border-white/[0.08] shadow-2xl shadow-black/80 rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-8 glass-panel animate-scale-in">
          
          {/* Padlock Icon Header */}
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              passcodeError 
                ? "bg-red-500/20 text-red-500 border border-red-500/40 animate-shake" 
                : passcode.length === 4 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse"
                : "bg-white/5 text-gray-300 border border-white/10"
            }`}>
              <Lock size={28} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-4">
              Admin Access Locked
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-[280px] mt-2">
              Please enter the 4-digit admin passkey to access the dashboard.
            </p>
          </div>

          {/* DOTS indicator */}
          <div className="flex items-center gap-5 my-2">
            {[0, 1, 2, 3].map((index) => {
              const isActive = passcode.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                    passcodeError
                      ? "bg-red-500 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                      : isActive
                      ? "bg-[#e50914] border-[#e50914] shadow-[0_0_12px_rgba(229,9,20,0.8)] scale-110"
                      : "bg-white/5 border-white/20"
                  }`}
                />
              );
            })}
          </div>

          {/* Error Message */}
          <div className="h-4">
            {passcodeError && (
              <p className="text-xs font-bold text-red-500 animate-fade-in">
                Incorrect Passcode. Try again.
              </p>
            )}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePasscodeChange(num.toString())}
                className="w-full aspect-square rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xl font-black text-white hover:bg-white/[0.08] hover:border-white/10 active:scale-95 transition-all select-none cursor-pointer flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="w-full aspect-square rounded-2xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/[0.02] active:scale-95 transition-all select-none cursor-pointer flex items-center justify-center"
            >
              Clear
            </button>
            <button
              onClick={() => handlePasscodeChange("0")}
              className="w-full aspect-square rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xl font-black text-white hover:bg-white/[0.08] hover:border-white/10 active:scale-95 transition-all select-none cursor-pointer flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="w-full aspect-square rounded-2xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/[0.02] active:scale-95 transition-all select-none cursor-pointer flex items-center justify-center"
            >
              Delete
            </button>
          </div>

          {/* Back Home */}
          <div className="flex items-center justify-center border-t border-white/5 pt-4 w-full">
            <button
              onClick={() => window.location.href = "/"}
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to Main Page
            </button>
          </div>

        </div>
      </div>
    );
  }

  const langLabels: Record<string, string> = {
    en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", ko: "Korean",
    ja: "Japanese", es: "Spanish", fr: "French", de: "German", zh: "Chinese",
    pt: "Portuguese", ru: "Russian", it: "Italian", ar: "Arabic", ml: "Malayalam",
    kn: "Kannada", bn: "Bengali", th: "Thai", pl: "Polish", tr: "Turkish", 
    nl: "Dutch", sv: "Swedish", da: "Danish", no: "Norwegian", fi: "Finnish",
    id: "Indonesian", ms: "Malay", vi: "Vietnamese", tl: "Filipino",
    uk: "Ukrainian", cs: "Czech", ro: "Romanian", hu: "Hungarian"
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-3">
            <Server className="text-[#e50914]" size={28} />
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-white/40 mt-1">
            TMDB Database Management & Sync Engine
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLock}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer mr-2"
            title="Lock Dashboard"
          >
            <Lock size={14} className="text-red-500" />
            <span className="hidden sm:inline">Lock Session</span>
          </button>
          <select
            value={syncType}
            onChange={(e) => setSyncType(e.target.value)}
            className="bg-[#121218] border border-white/[0.08] text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e50914]/40 cursor-pointer"
          >
            <option value="full">Full Sync</option>
            <option value="trending">Trending Only</option>
            <option value="popular">Popular Only</option>
            <option value="discover">Discover Only</option>
          </select>
          <button
            onClick={() => triggerSync(syncType)}
            disabled={syncing}
            className="flex items-center gap-2 bg-gradient-to-r from-[#e50914] to-[#b20710] text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#e50914]/20 active:scale-95 transition-all cursor-pointer"
          >
            {syncing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Zap size={16} />
            )}
            {syncing ? "Syncing..." : "Start Sync"}
          </button>
        </div>
      </div>

      {/* Live Sync Banner */}
      {syncing && syncStatus?.current_sync && (
        <div className="bg-gradient-to-r from-[#e50914]/10 to-purple-600/10 border border-[#e50914]/30 rounded-2xl p-5 flex items-center gap-4 animate-pulse-slow">
          <Loader2 className="text-[#e50914] animate-spin flex-none" size={24} />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">
              Sync in progress — {syncStatus.current_sync.type.toUpperCase()}
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              {syncStatus.current_sync.movies_added} movies added • {syncStatus.current_sync.pages_fetched} pages fetched • {syncStatus.current_sync.collections_found} collections found
            </p>
          </div>
          <span className="text-xs font-mono text-white/30">
            {formatDuration(syncStatus.current_sync.started_at, null)}
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard icon={<Film size={18} />} label="Total Movies" value={stats?.total_movies || 0} color="text-blue-400" bgColor="from-blue-500/10 to-blue-600/5" />
        <StatCard icon={<FolderHeart size={18} />} label="Collections" value={stats?.total_collections || 0} color="text-purple-400" bgColor="from-purple-500/10 to-purple-600/5" />
        <StatCard icon={<Layers size={18} />} label="Genres" value={stats?.total_genres || 0} color="text-emerald-400" bgColor="from-emerald-500/10 to-emerald-600/5" />
        <StatCard icon={<Play size={18} />} label="TV Shows" value={stats?.total_tv_shows || 0} color="text-amber-400" bgColor="from-amber-500/10 to-amber-600/5" />
        <StatCard icon={<Calendar size={18} />} label="Added Today" value={stats?.movies_added_today || 0} color="text-rose-400" bgColor="from-rose-500/10 to-rose-600/5" />
        <StatCard icon={<Hash size={18} />} label="Coll. Today" value={stats?.collections_added_today || 0} color="text-cyan-400" bgColor="from-cyan-500/10 to-cyan-600/5" />
        <StatCard icon={<Clock size={18} />} label="Last Sync" value={stats?.last_sync_time ? new Date(stats.last_sync_time).toLocaleTimeString() : "Never"} color="text-orange-400" bgColor="from-orange-500/10 to-orange-600/5" isText />
      </div>

      {/* Top Collections */}
      {stats && stats.top_collections.length > 0 && (
        <div className="bg-[#121218]/80 border border-white/[0.04] rounded-2xl p-5">
          <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#e50914]" />
            Largest Collections
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stats.top_collections.map((col, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/[0.02] rounded-lg px-3 py-2.5 border border-white/[0.04]">
                <span className="text-[10px] font-black text-[#e50914] w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{col.name}</p>
                  <p className="text-[10px] text-white/40">{col.count} movies</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genre Breakdown */}
      {stats && Object.keys(stats.genre_breakdown).length > 0 && (
        <div className="bg-[#121218]/80 border border-white/[0.04] rounded-2xl overflow-hidden">
          <button
            onClick={() => setGenresOpen(!genresOpen)}
            className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-400" />
              Genre Breakdown ({Object.keys(stats.genre_breakdown).length} genres)
            </h2>
            {genresOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
          </button>
          {genresOpen && (
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {Object.entries(stats.genre_breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([genre, count]) => (
                    <div key={genre} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
                      <span className="text-xs font-semibold text-white/70">{genre}</span>
                      <span className="text-xs font-black text-[#e50914]">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Language Breakdown */}
      {stats && Object.keys(stats.language_breakdown).length > 0 && (
        <div className="bg-[#121218]/80 border border-white/[0.04] rounded-2xl overflow-hidden">
          <button
            onClick={() => setLangsOpen(!langsOpen)}
            className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
          >
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Globe size={16} className="text-emerald-400" />
              Language Breakdown ({Object.keys(stats.language_breakdown).length} languages)
            </h2>
            {langsOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
          </button>
          {langsOpen && (
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {Object.entries(stats.language_breakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, count]) => (
                    <div key={lang} className="flex items-center justify-between bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
                      <span className="text-xs font-semibold text-white/70">{langLabels[lang] || lang.toUpperCase()}</span>
                      <span className="text-xs font-black text-emerald-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sync History */}
      {syncStatus && syncStatus.recent_logs.length > 0 && (
        <div className="bg-[#121218]/80 border border-white/[0.04] rounded-2xl p-5">
          <h2 className="text-sm font-black text-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-orange-400" />
            Sync History
          </h2>
          <div className="flex flex-col gap-2">
            {syncStatus.recent_logs.map((log) => (
              <div
                key={log.id}
                className={`flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-3 border transition-all ${
                  log.status === "running"
                    ? "border-[#e50914]/30 animate-pulse-slow"
                    : log.status === "completed"
                    ? "border-emerald-500/10"
                    : "border-red-500/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  {log.status === "running" ? (
                    <Loader2 size={16} className="text-[#e50914] animate-spin" />
                  ) : log.status === "completed" ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <XCircle size={16} className="text-red-400" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">
                      {log.type.toUpperCase()} Sync
                    </p>
                    <p className="text-[10px] text-white/40">
                      {formatTime(log.started_at)} • {formatDuration(log.started_at, log.finished_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-white/50">
                  <span>+{log.movies_added} movies</span>
                  <span>{log.pages_fetched} pages</span>
                  <span>{log.collections_found} collections</span>
                  {log.errors.length > 0 && (
                    <span className="text-red-400">{log.errors.length} errors</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <div className="bg-[#121218]/80 border border-white/[0.04] rounded-2xl overflow-hidden">
        <button
          onClick={() => setDebugOpen(!debugOpen)}
          className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        >
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <Bug size={16} className="text-yellow-400" />
            Debug Panel
          </h2>
          {debugOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
        </button>
        {debugOpen && (
          <div className="px-5 pb-5 flex flex-col gap-4">
            <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-white/70 max-h-[400px] overflow-y-auto border border-white/[0.04]">
              <p className="text-emerald-400 mb-2">// Database Debug Info</p>
              <p>Total TMDB Movies Imported: <span className="text-white font-bold">{stats?.total_movies || 0}</span></p>
              <p>Total Collections Generated: <span className="text-white font-bold">{stats?.total_collections || 0}</span></p>
              <p>Total Genres: <span className="text-white font-bold">{stats?.total_genres || 0}</span></p>
              <p>Movies Added Today: <span className="text-white font-bold">{stats?.movies_added_today || 0}</span></p>
              <p>Collections Added Today: <span className="text-white font-bold">{stats?.collections_added_today || 0}</span></p>
              <p>Last Sync Time: <span className="text-white font-bold">{formatTime(stats?.last_sync_time || null)}</span></p>
              <p>Last Sync Type: <span className="text-white font-bold">{stats?.last_sync_type || "N/A"}</span></p>
              <br />
              <p className="text-purple-400 mb-2">// Collection Names ({stats?.top_collections.length || 0})</p>
              {stats?.top_collections.map((col, i) => (
                <p key={i}>  [{col.count} movies] <span className="text-yellow-300">{col.name}</span></p>
              ))}
              <br />
              <p className="text-cyan-400 mb-2">// Sync Logs ({syncStatus?.recent_logs.length || 0})</p>
              {syncStatus?.recent_logs.map((log, i) => (
                <div key={i} className="mb-2">
                  <p className={log.status === "completed" ? "text-emerald-400" : log.status === "failed" ? "text-red-400" : "text-yellow-400"}>
                    [{log.status.toUpperCase()}] {log.type} sync at {formatTime(log.started_at)}
                  </p>
                  <p>  Added: {log.movies_added} | Updated: {log.movies_updated} | Skipped: {log.duplicates_skipped} | Pages: {log.pages_fetched} | Collections: {log.collections_found}</p>
                  {log.errors.length > 0 && (
                    <p className="text-red-400">  Errors: {log.errors.slice(0, 5).join(", ")}{log.errors.length > 5 ? ` (+${log.errors.length - 5} more)` : ""}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StatCard Component ──────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
  isText = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  isText?: boolean;
}) {
  return (
    <div className={`bg-gradient-to-br ${bgColor} border border-white/[0.04] rounded-2xl p-4 flex flex-col gap-2`}>
      <div className={`${color} flex items-center gap-2`}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
          {label}
        </span>
      </div>
      <span className={`${isText ? "text-sm" : "text-2xl"} font-black ${color}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────
function AdminSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col gap-6 animate-pulse">
      <div className="h-10 w-64 bg-gray-800 rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-24 bg-gray-800 rounded-2xl" />
        ))}
      </div>
      <div className="h-40 bg-gray-800 rounded-2xl" />
      <div className="h-60 bg-gray-800 rounded-2xl" />
    </div>
  );
}
