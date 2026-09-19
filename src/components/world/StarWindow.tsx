'use client';

import React, { useState } from 'react';
import { Theme } from '@/types/portfolio';

export interface StarWindowProps {
  theme?: Theme;
  className?: string;
}

interface Star {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // pixels
  twinkleDuration: number; // seconds
  delay: number; // seconds
  color: string;
}

const STARS: Star[] = [
  { id: 1, x: 15, y: 20, size: 2, twinkleDuration: 3.2, delay: 0.2, color: '#FFF' },
  { id: 2, x: 28, y: 12, size: 3, twinkleDuration: 4.1, delay: 0.8, color: 'var(--color-accent)' },
  { id: 3, x: 42, y: 25, size: 2, twinkleDuration: 2.8, delay: 1.4, color: '#FFF' },
  { id: 4, x: 55, y: 15, size: 2.5, twinkleDuration: 3.6, delay: 0.5, color: 'var(--color-accent-tertiary)' },
  { id: 5, x: 70, y: 22, size: 2, twinkleDuration: 4.5, delay: 1.1, color: '#FFF' },
  { id: 6, x: 82, y: 14, size: 3, twinkleDuration: 3.0, delay: 0.7, color: 'var(--color-accent-secondary)' },
  { id: 7, x: 20, y: 40, size: 2, twinkleDuration: 3.8, delay: 1.9, color: '#FFF' },
  { id: 8, x: 35, y: 48, size: 2.5, twinkleDuration: 2.9, delay: 0.4, color: 'var(--color-accent)' },
  { id: 9, x: 62, y: 38, size: 2, twinkleDuration: 4.2, delay: 1.3, color: '#FFF' },
  { id: 10, x: 78, y: 45, size: 2, twinkleDuration: 3.4, delay: 0.6, color: 'var(--color-accent-cream)' },
  { id: 11, x: 88, y: 30, size: 2.5, twinkleDuration: 3.9, delay: 1.7, color: '#FFF' },
  { id: 12, x: 48, y: 10, size: 3, twinkleDuration: 4.8, delay: 2.1, color: '#FFF' },
];

export const StarWindow: React.FC<StarWindowProps> = ({
  theme = 'cozy-crt',
  className = '',
}) => {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [shootingStarActive, setShootingStarActive] = useState<boolean>(false);

  const triggerShootingStar = () => {
    if (shootingStarActive) return;
    setShootingStarActive(true);
    setTimeout(() => setShootingStarActive(false), 1400);
  };

  return (
    <div
      className={`relative select-none flex flex-col items-center ${className}`}
      onMouseEnter={triggerShootingStar}
      title="Night Window: Look outside at the 2 AM sky"
    >
      {/* WINDOW WOODEN OUTER FRAME */}
      <div className="relative w-56 h-64 sm:w-64 sm:h-72 bg-[#1C1613] p-2.5 rounded-t-xl border-4 border-[#3A2D24] shadow-2xl overflow-hidden flex flex-col">
        
        {/* SKY CANVAS / NIGHT SKY BACKDROP */}
        <div className="relative flex-1 rounded-lg overflow-hidden bg-gradient-to-b from-[#060911] via-[#0D131F] to-[#141C2B]">
          
          {/* THEME AMBIENT COLOR OVERLAY */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none transition-colors duration-500"
            style={{
              background:
                theme === 'warm-apartment'
                  ? 'radial-gradient(circle at 80% 20%, #D9825B 0%, transparent 60%)'
                  : theme === 'moonlit-terminal'
                  ? 'radial-gradient(circle at 80% 20%, #73B7FF 0%, transparent 60%)'
                  : 'radial-gradient(circle at 80% 20%, #A8D672 0%, transparent 60%)',
            }}
          />

          {/* CRESCENT MOON */}
          <div className="absolute top-4 right-6 w-9 h-9 rounded-full shadow-[inset_-3px_3px_0_0_#F5E8C7] drop-shadow-[0_0_10px_rgba(245,232,199,0.5)] transition-transform hover:scale-110 cursor-pointer">
            {/* Subtle Moon craters */}
            <div className="absolute top-1.5 right-3 w-1 h-1 rounded-full bg-[#E0D0A6]/40" />
            <div className="absolute top-4 right-2 w-1.5 h-1.5 rounded-full bg-[#E0D0A6]/30" />
          </div>

          {/* SHOOTING STAR EFFECT */}
          {shootingStarActive && (
            <div className="absolute -top-4 -left-8 w-24 h-0.5 bg-gradient-to-r from-transparent via-accent to-white rotate-45 animate-[ping_1.2s_ease-out]" />
          )}

          {/* TWINKLING PIXEL STARS */}
          {STARS.map((star) => {
            const isHovered = hoveredStar === star.id;
            return (
              <div
                key={star.id}
                onMouseEnter={() => setHoveredStar(star.id)}
                onMouseLeave={() => setHoveredStar(null)}
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: `${isHovered ? star.size * 2 : star.size}px`,
                  height: `${isHovered ? star.size * 2 : star.size}px`,
                  backgroundColor: star.color,
                  animation: `pulseSubtle ${star.twinkleDuration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                }}
                className={`absolute rounded-full transition-all duration-200 cursor-pointer ${
                  isHovered ? 'scale-150 shadow-crt' : ''
                }`}
              />
            );
          })}

          {/* DISTANT CITY SKYLINE SILHOUETTE */}
          <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none flex items-end justify-between px-1">
            {/* Silhouette Buildings with Tiny Lit Pixel Windows */}
            <div className="w-8 h-10 bg-[#0A0E17] relative">
              <div className="w-1 h-1 bg-[#E6A15C] opacity-75 absolute top-2 left-1.5" />
              <div className="w-1 h-1 bg-[#FFF] opacity-60 absolute top-5 left-4" />
            </div>

            <div className="w-11 h-14 bg-[#080B12] relative">
              {/* Radio Tower Spire */}
              <div className="w-0.5 h-4 bg-[#0A0D15] absolute -top-4 left-5">
                <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse absolute -top-0.5 -left-[1px]" />
              </div>
              <div className="w-1 h-1 bg-accent opacity-80 absolute top-3 left-2" />
              <div className="w-1 h-1 bg-[#FFF] opacity-60 absolute top-3 left-6" />
              <div className="w-1 h-1 bg-[#E6A15C] opacity-80 absolute top-7 left-4" />
            </div>

            <div className="w-12 h-12 bg-[#0A0E17] relative">
              <div className="w-1 h-1 bg-[#FFF] opacity-60 absolute top-2 left-2" />
              <div className="w-1 h-1 bg-[#FFF] opacity-60 absolute top-5 left-7" />
              <div className="w-1 h-1 bg-accent-tertiary opacity-70 absolute top-7 left-2" />
            </div>

            <div className="w-9 h-15 bg-[#080B12] relative">
              <div className="w-1 h-1 bg-[#FFF] opacity-50 absolute top-4 left-2" />
              <div className="w-1 h-1 bg-[#E6A15C] opacity-75 absolute top-8 left-5" />
            </div>

            <div className="w-10 h-9 bg-[#0A0E17] relative">
              <div className="w-1 h-1 bg-[#FFF] opacity-60 absolute top-2 left-4" />
            </div>
          </div>

          {/* 4-PANE WINDOW MULLIONS (CROSSBARS) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Vertical Mullion */}
            <div className="w-2.5 h-full bg-[#2C221C] border-x border-[#1A1410] shadow-md" />
            {/* Horizontal Mullion */}
            <div className="h-2.5 w-full bg-[#2C221C] border-y border-[#1A1410] absolute shadow-md" />
          </div>
        </div>

        {/* WINDOW SILL / LEDGE (Bottom wooden shelf) */}
        <div className="w-full h-4 bg-[#33251B] border-t-2 border-[#473527] -mx-1 mt-1 rounded-b shadow-lg flex items-center justify-between px-3 text-[8px] font-mono text-[#7A624E]">
          <span>KARACHI // 02:00</span>
          <span>CLEAR SKY</span>
        </div>
      </div>
    </div>
  );
};
