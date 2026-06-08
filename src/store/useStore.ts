import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CatalogItem {
  id: string | number; // TMDB ID or custom mock ID
  imdbId?: string;
  title: string;
  name?: string; // TV Show Name
  type: "movie" | "tv";
  backdrop_path: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genres: string[];
  runtime?: string;
  cast?: string[];
  backdropUrl?: string; // absolute or Unsplash fallback
  posterUrl?: string;
  seasons?: { season_number: number; episode_count: number; name: string }[];
  number_of_seasons?: number;
  collection?: {
    id: number | string;
    name: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
  };
}

export interface PlaybackProgress {
  tmdbId: string | number;
  imdbId?: string;
  title: string;
  type: "movie" | "tv";
  posterPath: string;
  backdropPath: string;
  progress: number; // 0 to 100 percentage
  timestamp: number; // last updated
  season?: number; // for TV
  episode?: number; // for TV
  lastWatchedEpisodeName?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  type: "cinephile" | "kids" | "action" | "guest";
}

export const AVAILABLE_PROFILES: UserProfile[] = [
  { id: "profile-1", name: "Cinephile", avatar: "🍿", color: "#E50914", type: "cinephile" },
  { id: "profile-2", name: "Kids Zone", avatar: "🤖", color: "#3B82F6", type: "kids" },
  { id: "profile-3", name: "Action Fan", avatar: "💥", color: "#10B981", type: "action" },
  { id: "profile-4", name: "Guest User", avatar: "🎭", color: "#8B5CF6", type: "guest" }
];

interface StreamFlixState {
  // Profiles State
  activeProfile: UserProfile;
  setActiveProfile: (profile: UserProfile) => void;
  
  // Watchlist & Favorites States (Keyed by profile ID to have separate lists per profile!)
  watchlistByProfile: Record<string, CatalogItem[]>;
  favoritesByProfile: Record<string, CatalogItem[]>;
  historyByProfile: Record<string, CatalogItem[]>;
  
  // Action triggers
  addToWatchlist: (item: CatalogItem) => void;
  removeFromWatchlist: (itemId: string | number) => void;
  toggleWatchlist: (item: CatalogItem) => void;
  isInWatchlist: (itemId: string | number) => boolean;
  
  addToFavorites: (item: CatalogItem) => void;
  removeFromFavorites: (itemId: string | number) => void;
  toggleFavorite: (item: CatalogItem) => void;
  isInFavorites: (itemId: string | number) => boolean;
  
  addToHistory: (item: CatalogItem) => void;
  clearHistory: () => void;
  
  // Playback Progress (keyed by profile ID)
  playbackProgressByProfile: Record<string, Record<string, PlaybackProgress>>; // profileId -> {itemId -> progress}
  savePlaybackProgress: (
    tmdbId: string | number,
    progress: number,
    itemMeta: { title: string; type: "movie" | "tv"; posterPath: string; backdropPath: string; imdbId?: string; season?: number; episode?: number; lastWatchedEpisodeName?: string }
  ) => void;
  removePlaybackProgress: (tmdbId: string | number) => void;
  getPlaybackProgress: (tmdbId: string | number) => PlaybackProgress | null;
}

export const useStore = create<StreamFlixState>()(
  persist(
    (set, get) => ({
      activeProfile: AVAILABLE_PROFILES[0],
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      
      watchlistByProfile: {},
      favoritesByProfile: {},
      historyByProfile: {},
      playbackProgressByProfile: {},
      
      // Watchlist methods
      addToWatchlist: (item) => {
        const profileId = get().activeProfile.id;
        const currentList = get().watchlistByProfile[profileId] || [];
        if (currentList.some((i) => i.id === item.id)) return;
        
        set((state) => ({
          watchlistByProfile: {
            ...state.watchlistByProfile,
            [profileId]: [item, ...currentList],
          },
        }));
      },
      
      removeFromWatchlist: (itemId) => {
        const profileId = get().activeProfile.id;
        const currentList = get().watchlistByProfile[profileId] || [];
        
        set((state) => ({
          watchlistByProfile: {
            ...state.watchlistByProfile,
            [profileId]: currentList.filter((i) => i.id !== itemId),
          },
        }));
      },
      
      toggleWatchlist: (item) => {
        if (get().isInWatchlist(item.id)) {
          get().removeFromWatchlist(item.id);
        } else {
          get().addToWatchlist(item);
        }
      },
      
      isInWatchlist: (itemId) => {
        const profileId = get().activeProfile.id;
        const currentList = get().watchlistByProfile[profileId] || [];
        return currentList.some((i) => i.id === itemId);
      },
      
      // Favorites methods
      addToFavorites: (item) => {
        const profileId = get().activeProfile.id;
        const currentList = get().favoritesByProfile[profileId] || [];
        if (currentList.some((i) => i.id === item.id)) return;
        
        set((state) => ({
          favoritesByProfile: {
            ...state.favoritesByProfile,
            [profileId]: [item, ...currentList],
          },
        }));
      },
      
      removeFromFavorites: (itemId) => {
        const profileId = get().activeProfile.id;
        const currentList = get().favoritesByProfile[profileId] || [];
        
        set((state) => ({
          favoritesByProfile: {
            ...state.favoritesByProfile,
            [profileId]: currentList.filter((i) => i.id !== itemId),
          },
        }));
      },
      
      toggleFavorite: (item) => {
        if (get().isInFavorites(item.id)) {
          get().removeFromFavorites(item.id);
        } else {
          get().addToFavorites(item);
        }
      },
      
      isInFavorites: (itemId) => {
        const profileId = get().activeProfile.id;
        const currentList = get().favoritesByProfile[profileId] || [];
        return currentList.some((i) => i.id === itemId);
      },
      
      // History methods
      addToHistory: (item) => {
        const profileId = get().activeProfile.id;
        const currentList = get().historyByProfile[profileId] || [];
        // Remove duplicate and prepand
        const filtered = currentList.filter((i) => i.id !== item.id);
        set((state) => ({
          historyByProfile: {
            ...state.historyByProfile,
            [profileId]: [item, ...filtered].slice(0, 20), // Max 20 history items
          },
        }));
      },
      
      clearHistory: () => {
        const profileId = get().activeProfile.id;
        set((state) => ({
          historyByProfile: {
            ...state.historyByProfile,
            [profileId]: [],
          },
        }));
      },
      
      // Playback progress methods
      savePlaybackProgress: (tmdbId, progress, itemMeta) => {
        const profileId = get().activeProfile.id;
        const profileProgress = get().playbackProgressByProfile[profileId] || {};
        
        const newRecord: PlaybackProgress = {
          tmdbId,
          imdbId: itemMeta.imdbId,
          title: itemMeta.title,
          type: itemMeta.type,
          posterPath: itemMeta.posterPath,
          backdropPath: itemMeta.backdropPath,
          progress,
          timestamp: Date.now(),
          season: itemMeta.season,
          episode: itemMeta.episode,
          lastWatchedEpisodeName: itemMeta.lastWatchedEpisodeName
        };
        
        set((state) => ({
          playbackProgressByProfile: {
            ...state.playbackProgressByProfile,
            [profileId]: {
              ...profileProgress,
              [tmdbId]: newRecord
            }
          }
        }));
      },
      
      removePlaybackProgress: (tmdbId) => {
        const profileId = get().activeProfile.id;
        const profileProgress = get().playbackProgressByProfile[profileId] || {};
        const { [tmdbId]: _, ...rest } = profileProgress; // Destructure to delete key
        
        set((state) => ({
          playbackProgressByProfile: {
            ...state.playbackProgressByProfile,
            [profileId]: rest
          }
        }));
      },
      
      getPlaybackProgress: (tmdbId) => {
        const profileId = get().activeProfile.id;
        const profileProgress = get().playbackProgressByProfile[profileId] || {};
        return profileProgress[tmdbId] || null;
      }
    }),
    {
      name: "streamflix-persistent-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
