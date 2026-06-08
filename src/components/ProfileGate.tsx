"use client";
import React, { useState, useEffect } from "react";
import { useStore, AVAILABLE_PROFILES, UserProfile } from "@/store/useStore";

export default function ProfileGate() {
  const activeProfile = useStore((s) => s.activeProfile);
  const setActiveProfile = useStore((s) => s.setActiveProfile);
  
  const [visible, setVisible] = useState(false);
  const [fadeAway, setFadeAway] = useState(false);

  useEffect(() => {
    // Check if session has started
    const sessionStarted = sessionStorage.getItem("streamflix_session_started");
    if (!sessionStarted) {
      // Force Cinephile profile on fresh enter
      setActiveProfile(AVAILABLE_PROFILES[0]);
      sessionStorage.setItem("streamflix_session_started", "true");
      sessionStorage.removeItem("streamflix_profile_confirmed"); // force gate open
      setVisible(true);
    } else {
      const confirmed = sessionStorage.getItem("streamflix_profile_confirmed");
      if (!confirmed) {
        setVisible(true);
      }
    }
  }, [setActiveProfile]);

  const handleSelectProfile = (profile: UserProfile) => {
    setActiveProfile(profile);
    setFadeAway(true);
    sessionStorage.setItem("streamflix_profile_confirmed", "true");
    
    // Smooth transition
    setTimeout(() => {
      setVisible(false);
    }, 600);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
        fadeAway ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-radial from-[#1e1415]/30 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none" />

      <div className="flex flex-col items-center gap-8 md:gap-12 animate-fade-in text-center px-4 max-w-4xl relative z-10">
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] select-none">
          Who&apos;s Watching?
        </h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 justify-center">
          {AVAILABLE_PROFILES.map((profile, index) => {
            const delay = `${index * 100}ms`;
            return (
              <button
                key={profile.id}
                onClick={() => handleSelectProfile(profile)}
                className="group flex flex-col items-center gap-3 md:gap-4 focus:outline-none cursor-pointer transition-transform duration-300"
                style={{ animationDelay: delay }}
              >
                {/* Profile Avatar Card */}
                <div
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center text-4xl md:text-5xl shadow-2xl relative transition-all duration-300 transform group-hover:scale-105 group-hover:-translate-y-1 group-hover:ring-4 group-active:scale-95"
                  style={{
                    backgroundColor: profile.color,
                    boxShadow: `0 10px 30px -10px ${profile.color}80`,
                    "--tw-ring-color": profile.color,
                  } as React.CSSProperties}
                >
                  {profile.avatar}
                  
                  {/* Subtle inner overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Profile Name */}
                <span className="text-sm md:text-base font-bold text-gray-400 group-hover:text-white transition-colors duration-200 select-none">
                  {profile.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Enter Catalog Bypass */}
        <button
          onClick={() => handleSelectProfile(activeProfile)}
          className="mt-8 px-6 py-2.5 border border-white/20 text-gray-400 rounded-lg hover:border-white hover:text-white text-xs md:text-sm font-semibold tracking-wider uppercase transition-all hover:bg-white/5 cursor-pointer"
        >
          Enter Catalog
        </button>
      </div>
    </div>
  );
}
