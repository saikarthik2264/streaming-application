"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, Menu, X, ChevronDown, Award } from "lucide-react";
import { useStore, AVAILABLE_PROFILES, UserProfile } from "@/store/useStore";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Local states
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Zustand Store
  const activeProfile = useStore((state) => state.activeProfile);
  const setActiveProfile = useStore((state) => state.setActiveProfile);

  // Monitor scrolling to add frosted glass backing
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync route path to active searches
  useEffect(() => {
    if (!pathname.startsWith("/search")) {
      setSearchQuery("");
      setSearchOpen(false);
    }
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const selectProfile = (profile: UserProfile) => {
    setActiveProfile(profile);
    setProfileDropdownOpen(false);
    // Reload active catalog recommendations dynamically
    router.refresh();
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Movies", href: "/search?type=movie" },
    { name: "TV Shows", href: "/search?type=tv" },
    { name: "My List", href: "/my-list" }
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 h-16 sm:h-20 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav shadow-lg shadow-black/40" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between">
        
        {/* Left Section: Brand & Nav Links */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-black tracking-tighter text-red-600 group-hover:text-red-500 transition-colors drop-shadow-[0_0_12px_rgba(229,9,20,0.5)]">
              STREAMFLIX
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href.split("?")[0]));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-all duration-200 hover:text-white ${
                    isActive ? "text-red-500 font-bold tracking-wide" : "text-gray-300"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Section: Action Controls */}
        <div className="flex items-center gap-4">
          
          {/* Search Trigger */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            {searchOpen ? (
              <div className="flex items-center bg-black/50 border border-white/10 rounded-full py-1 px-3 glass-panel animate-fade-in w-[150px] sm:w-[220px]">
                <input
                  type="text"
                  placeholder="Titles, actors, genres..."
                  className="bg-transparent text-white text-xs sm:text-sm outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    router.push(`/search?q=${encodeURIComponent(e.target.value)}`);
                  }}
                  autoFocus
                />
                <button type="submit" className="text-gray-400 hover:text-white cursor-pointer">
                  <Search size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Search"
              >
                <Search size={20} />
              </button>
            )}
          </form>

          {/* Notifications Placeholder */}
          <div className="relative text-gray-300 hover:text-white transition-colors cursor-pointer hidden sm:block" title="Notifications">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
          </div>

          {/* Profile Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:py-1.5 rounded-full glass-panel hover:bg-white/5 transition-all text-xs sm:text-sm font-semibold select-none cursor-pointer"
            >
              <span
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs text-white"
                style={{ backgroundColor: activeProfile.color }}
              >
                {activeProfile.avatar}
              </span>
              <span className="hidden sm:inline text-gray-200">{activeProfile.name}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel p-2 shadow-2xl animate-scale-in">
                <p className="text-[10px] uppercase font-bold text-gray-400 px-3 py-1.5 border-b border-white/5 tracking-wider">
                  Switch Profile
                </p>
                <div className="flex flex-col gap-1 mt-1.5">
                  {AVAILABLE_PROFILES.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => selectProfile(profile)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs sm:text-sm transition-all hover:bg-white/5 cursor-pointer ${
                        activeProfile.id === profile.id ? "text-red-500 font-bold bg-white/5" : "text-gray-300"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: profile.color }}
                      >
                        {profile.avatar}
                      </span>
                      <span>{profile.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer (Responsive Overlay) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 sm:top-20 glass-panel border-t-0 p-4 flex flex-col gap-3 shadow-2xl animate-slide-down">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href.split("?")[0]));
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-medium py-2 px-3 rounded-lg hover:bg-white/5 transition-all ${
                  isActive ? "text-red-500 bg-white/5 font-bold" : "text-gray-300"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
