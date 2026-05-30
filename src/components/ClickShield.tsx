"use client";
import React, { useState } from "react";

export default function ClickShield() {
  const [clicks, setClicks] = useState(0);

  // Absorb the first 2 clicks (ad triggers), then disappear
  if (clicks >= 2) return null;

  return (
    <div
      className="absolute inset-0 z-20 cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setClicks(c => c + 1);
      }}
    >
      {clicks === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs font-medium px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10 pointer-events-none animate-pulse">
          Click to activate player
        </div>
      )}
    </div>
  );
}
