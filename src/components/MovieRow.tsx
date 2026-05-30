"use client";
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import { CatalogItem } from "@/store/useStore";

export default function MovieRow({ title, items }: { title: string; items: CatalogItem[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => { checkScroll(); }, [items]);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.8;
    rowRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!items?.length) return null;

  return (
    <div className="flex flex-col gap-1.5 relative group/row">
      <h2 className="text-base sm:text-lg font-bold text-white/90 px-6 sm:px-12">{title}</h2>
      <div className="relative">
        {canScrollLeft && (
          <button onClick={() => scroll("left")} className="absolute left-0 top-0 bottom-0 w-10 bg-black/50 hover:bg-black/70 text-white z-30 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer">
            <ChevronLeft size={22} />
          </button>
        )}
        <div ref={rowRef} onScroll={checkScroll} className="flex gap-2 sm:gap-3 overflow-x-auto hide-scrollbar px-6 sm:px-12 py-2">
          {items.map(item => <MovieCard key={item.id} item={item} />)}
        </div>
        {canScrollRight && (
          <button onClick={() => scroll("right")} className="absolute right-0 top-0 bottom-0 w-10 bg-black/50 hover:bg-black/70 text-white z-30 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer">
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
