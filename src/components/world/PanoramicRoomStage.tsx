'use client';

import React, { useState } from 'react';
import { Theme } from '@/types/portfolio';
import { AvatarActionState, HotspotCoordinates } from '@/types/avatar';
import { Character } from './Character';
import { CRTMonitor } from './CRTMonitor';
import { MangaSeries } from '@/data/dialogues';
import { ReadingItem } from '@/types/portfolio';
import { personalInfo } from '@/data/personal';
import { BookOpen } from 'lucide-react';

export interface PanoramicRoomStageProps {
  theme?: Theme;
  lampOn?: boolean;
  activeManga?: MangaSeries;
  actionState: AvatarActionState;
  currentHotspot: HotspotCoordinates;
  coords: { x: number; bottom: number };
  facingRight: boolean;
  transitDuration: number;
  cursorPos?: { x: number; y: number };
  gazeOverride?: { x: number; y: number } | null;
  bubbleText?: string | null;
  onAvatarClick?: () => void;
  onMonitorClick?: () => void;
  onLaptopClick?: () => void;
  onBookshelfClick?: (book: ReadingItem) => void;
  onCatClick?: () => void;
  onWindowClick?: () => void;
  onSelectProject?: (projectId: string) => void;
  className?: string;
}

export const PanoramicRoomStage: React.FC<PanoramicRoomStageProps> = ({
  theme = 'cozy-crt',
  lampOn = true,
  activeManga = 'one-piece',
  actionState,
  currentHotspot,
  coords,
  facingRight,
  transitDuration,
  cursorPos = { x: 0, y: 0 },
  gazeOverride = null,
  bubbleText = null,
  onAvatarClick,
  onMonitorClick,
  onLaptopClick,
  onBookshelfClick,
  onCatClick,
  onWindowClick,
  onSelectProject,
  className = '',
}) => {
  const books = personalInfo.readingList;
  const [hoveredBook, setHoveredBook] = useState<ReadingItem | null>(null);

  // Group books for shelves
  const shelf2Books = books.slice(0, 5); // Manga icons
  const shelf3Books = books.slice(5, 9); // Fiction / deep manga
  const shelf4Books = books.slice(9, 13); // Tech & systems books

  return (
    <div
      className={`relative w-full aspect-[25/14] min-h-[480px] sm:min-h-[540px] md:min-h-[600px] select-none overflow-hidden bg-[#181222] ${className}`}
      style={{
        backgroundColor:
          theme === 'warm-apartment'
            ? '#21171A'
            : theme === 'moonlit-terminal'
            ? '#0F1522'
            : '#181222',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. LAYER 0: ROOM PERSPECTIVE WALLS, CORNICE, AND BASEBOARD               */}
      {/* ========================================================================= */}
      <svg
        viewBox="0 0 1000 560"
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Ambient Wall Gradient */}
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#251D33" />
            <stop offset="60%" stopColor="#1E172A" />
            <stop offset="100%" stopColor="#15101E" />
          </linearGradient>

          {/* Left Angled Perspective Wall */}
          <linearGradient id="leftWallGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#15101F" />
            <stop offset="100%" stopColor="#20182E" />
          </linearGradient>

          {/* Right Angled Perspective Wall */}
          <linearGradient id="rightWallGrad" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#15101F" />
            <stop offset="100%" stopColor="#20182E" />
          </linearGradient>

          {/* Floorboard Gradient */}
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2D1C13" />
            <stop offset="50%" stopColor="#22140D" />
            <stop offset="100%" stopColor="#140B07" />
          </linearGradient>
        </defs>

        {/* Back Center Main Wall */}
        <rect x="0" y="0" width="1000" height="425" fill="url(#wallGrad)" />

        {/* Left Angled Corner Wall Trapezoid */}
        <polygon points="0,0 190,45 190,425 0,460" fill="url(#leftWallGrad)" />
        <line x1="190" y1="45" x2="190" y2="425" stroke="#100C18" strokeWidth="2" opacity="0.7" />

        {/* Right Angled Corner Wall Trapezoid */}
        <polygon points="1000,0 835,45 835,425 1000,460" fill="url(#rightWallGrad)" />
        <line x1="835" y1="45" x2="835" y2="425" stroke="#100C18" strokeWidth="2" opacity="0.7" />

        {/* Top Ceiling Molding / Cornice */}
        <rect x="0" y="0" width="1000" height="24" fill="#130E1B" />
        <line x1="0" y1="24" x2="1000" y2="24" stroke="#372A4B" strokeWidth="2" />
        <rect x="0" y="26" width="1000" height="6" fill="#1B1426" opacity="0.8" />

        {/* Wooden Floorboards Plane (Bottom Y: 425 - 560) */}
        <polygon points="0,425 1000,425 1000,560 0,560" fill="url(#floorGrad)" />
        <line x1="0" y1="425" x2="1000" y2="425" stroke="#3D261C" strokeWidth="3" />

        {/* Floorboard Seams & Perspective Plank Divides */}
        <line x1="0" y1="460" x2="1000" y2="460" stroke="#180F0B" strokeWidth="1.5" />
        <line x1="0" y1="500" x2="1000" y2="500" stroke="#180F0B" strokeWidth="1.5" />
        <line x1="0" y1="540" x2="1000" y2="540" stroke="#180F0B" strokeWidth="1.5" />

        {/* Vertical Floorboard stagger marks */}
        {[
          { x1: 90, y1: 425, x2: 80, y2: 460 },
          { x1: 290, y1: 425, x2: 280, y2: 460 },
          { x1: 520, y1: 425, x2: 515, y2: 460 },
          { x1: 740, y1: 425, x2: 745, y2: 460 },
          { x1: 930, y1: 425, x2: 940, y2: 460 },
          { x1: 180, y1: 460, x2: 170, y2: 500 },
          { x1: 410, y1: 460, x2: 405, y2: 500 },
          { x1: 640, y1: 460, x2: 645, y2: 500 },
          { x1: 850, y1: 460, x2: 860, y2: 500 },
          { x1: 80, y1: 500, x2: 70, y2: 540 },
          { x1: 310, y1: 500, x2: 300, y2: 540 },
          { x1: 550, y1: 500, x2: 555, y2: 540 },
          { x1: 790, y1: 500, x2: 800, y2: 540 },
        ].map((line, idx) => (
          <line
            key={idx}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#160E0B"
            strokeWidth="1.5"
            opacity="0.7"
          />
        ))}

        {/* Floor Baseboard Trim */}
        <rect x="0" y="552" width="1000" height="8" fill="#100A07" />
      </svg>

      {/* ========================================================================= */}
      {/* 2. LAYER 1: WIDE PANORAMIC CITY WINDOW WITH VENETIAN BLINDS               */}
      {/* ========================================================================= */}
      <div
        className="absolute top-[7.5%] left-[21%] w-[62%] h-[40%] cursor-pointer group rounded border-4 border-[#3D2C22] shadow-2xl overflow-hidden z-10"
        onClick={onWindowClick}
        title="2 AM Karachi Night Sky (Click to gaze outside)"
      >
        {/* Night Sky Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A13] via-[#0F1626] to-[#1C273C] overflow-hidden">
          {/* Distant City Skyline Silhouettes */}
          <div className="absolute bottom-0 inset-x-0 h-[52%] flex items-end justify-between px-1 opacity-85 pointer-events-none">
            {/* Cluster of illuminated skyscrapers */}
            <div className="w-8 h-20 bg-[#0B101D] relative">
              <div className="w-1 h-1 bg-[#FBBF24] opacity-80 absolute top-3 left-1.5" />
              <div className="w-1 h-1 bg-[#FFF] opacity-60 absolute top-8 left-4" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-80 absolute top-14 left-2" />
            </div>
            <div className="w-14 h-32 bg-[#090D18] relative">
              {/* Radio Tower Spire with blinking red beacon */}
              <div className="w-0.5 h-8 bg-[#0D1424] absolute -top-8 left-7">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-1 -left-[3px]" />
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 absolute -top-0.5 -left-[2px]" />
              </div>
              <div className="w-1 h-1 bg-accent opacity-90 absolute top-4 left-3" />
              <div className="w-1 h-1 bg-[#FFF] opacity-70 absolute top-4 left-9" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-80 absolute top-10 left-6" />
              <div className="w-1 h-1 bg-accent opacity-90 absolute top-18 left-4" />
              <div className="w-1 h-1 bg-[#FFF] opacity-70 absolute top-24 left-8" />
            </div>
            <div className="w-16 h-24 bg-[#0B101D] relative">
              <div className="w-1 h-1 bg-[#FFF] opacity-70 absolute top-4 left-3" />
              <div className="w-1 h-1 bg-[#73B7FF] opacity-80 absolute top-10 left-10" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-75 absolute top-16 left-5" />
            </div>
            <div className="w-12 h-34 bg-[#080B14] relative">
              <div className="w-1 h-1 bg-[#FFF] opacity-75 absolute top-5 left-4" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-90 absolute top-13 left-7" />
              <div className="w-1 h-1 bg-[#FFF] opacity-75 absolute top-22 left-3" />
            </div>
            <div className="w-18 h-22 bg-[#0B101D] relative">
              <div className="w-1 h-1 bg-[#73B7FF] opacity-80 absolute top-4 left-5" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-80 absolute top-10 left-12" />
            </div>
            <div className="w-10 h-28 bg-[#090D18] relative">
              <div className="w-1 h-1 bg-[#FFF] opacity-70 absolute top-8 left-3" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-90 absolute top-16 left-6" />
            </div>
          </div>

          {/* Crescent Moon */}
          <div className="absolute top-3 right-8 pointer-events-none">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#F5E8C7] drop-shadow-[0_0_12px_rgba(245,232,199,0.8)]" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>

          {/* Twinkling Pixel Stars */}
          {[
            { left: '12%', top: '26%', size: 2, delay: '0.2s' },
            { left: '25%', top: '16%', size: 2.5, delay: '0.9s' },
            { left: '38%', top: '28%', size: 1.5, delay: '1.4s' },
            { left: '52%', top: '18%', size: 2, delay: '0.5s' },
            { left: '65%', top: '30%', size: 2.5, delay: '1.2s' },
            { left: '76%', top: '20%', size: 2, delay: '0.7s' },
            { left: '88%', top: '34%', size: 1.5, delay: '1.6s' },
          ].map((star, idx) => (
            <div
              key={idx}
              className="absolute rounded-full bg-white pointer-events-none animate-pulse"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: star.delay,
                animationDuration: '3s',
              }}
            />
          ))}

          {/* Venetian Blinds across Top of Window (From Reference Image) */}
          <div className="absolute top-0 inset-x-0 bg-[#E2D8C6] border-b-2 border-[#B8AA94] shadow-md z-15 flex flex-col justify-between py-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full h-1 border-b border-[#C4B79E] bg-[#EFE9DC]/60" />
            ))}
            {/* Blinds Pull String on Left */}
            <div className="absolute top-0 left-6 w-0.5 h-16 bg-[#A39580]">
              <div className="w-1.5 h-2 rounded-full bg-[#8A7B66] -ml-0.5 mt-14" />
            </div>
          </div>

          {/* 6-Pane Window Mullions (Crossbars) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Vertical Mullion 1 */}
            <div className="w-2 h-full bg-[#2B1F18] border-x border-[#1A120D] absolute left-[33%]" />
            {/* Vertical Mullion 2 */}
            <div className="w-2 h-full bg-[#2B1F18] border-x border-[#1A120D] absolute left-[66%]" />
            {/* Horizontal Center Mullion */}
            <div className="h-2 w-full bg-[#2B1F18] border-y border-[#1A120D] absolute top-[58%]" />
          </div>
        </div>

        {/* Window Ledge / Sill */}
        <div className="absolute bottom-0 inset-x-0 h-2 bg-[#2D1F17] border-t border-[#473326]" />
      </div>

      {/* ========================================================================= */}
      {/* 3. LAYER 2: LEFT WALL TECH PANEL, RACK & OSCILLOSCOPE                     */}
      {/* ========================================================================= */}
      {/* Left Wall Illuminated Red Circuit Panel (From Reference Image) */}
      <div className="absolute top-[8%] left-[2.5%] w-[15%] h-[34%] bg-[#1A121A] rounded border-2 border-[#4A1D24] shadow-xl p-1.5 flex flex-col justify-between overflow-hidden z-15 pointer-events-none">
        <div className="text-[7.5px] font-mono font-bold text-[#E53935] tracking-widest border-b border-[#4A1D24] pb-0.5 flex justify-between">
          <span>NET-BUS v2</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] animate-ping" />
        </div>
        {/* Schematic Circuit Tracks */}
        <svg viewBox="0 0 100 80" className="w-full h-full opacity-85" stroke="#E53935" strokeWidth="1.5" fill="none">
          <polyline points="10,10 45,10 45,35 85,35" />
          <circle cx="85" cy="35" r="3" fill="#E53935" />
          <polyline points="20,45 55,45 65,65 92,65" />
          <circle cx="92" cy="65" r="3" fill="#F5B041" />
          <polyline points="10,70 30,70 45,50 80,50" />
          <circle cx="10" cy="70" r="2.5" fill="#E53935" />
        </svg>
        <div className="flex items-center justify-between text-[6.5px] font-mono text-[#8C7A7A]">
          <span>TTL: 64</span>
          <span className="text-[#F5B041]">ETH0: UP</span>
        </div>
      </div>

      {/* Left Industrial Rack Unit with Oscilloscope & Metal Drawers */}
      <div className="absolute top-[46%] left-[1.5%] w-[16.5%] h-[32%] bg-[#151A22] rounded-t border-2 border-[#263142] shadow-2xl p-1.5 flex flex-col justify-between z-20 pointer-events-none">
        {/* Oscilloscope Screen (Green Sine Wave) */}
        <div className="w-full h-12 bg-[#090D14] rounded border border-[#1F2A3B] p-1 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-[7px] font-mono text-accent">
            <span>OSC-88 // 1kHz</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </div>
          {/* Animated Sine Wave */}
          <svg viewBox="0 0 80 20" className="w-full h-4 overflow-visible" fill="none">
            <path d="M0,10 Q10,2 20,10 T40,10 T60,10 T80,10" stroke="#A8D672" strokeWidth="1.5" />
          </svg>
          <div className="flex justify-between text-[5.5px] font-mono text-fg-subtle">
            <span>CH1: 5V</span>
            <span>TIME: 2ms</span>
          </div>
        </div>
        {/* Metal Equipment Drawers */}
        <div className="space-y-1 mt-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="w-full h-4 bg-[#1E2532] rounded-[1px] border border-[#2B3547] flex items-center justify-between px-1.5">
              <div className="w-5 h-1 bg-[#3A485E] rounded-xs" />
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-accent" />
                <span className="w-1 h-1 rounded-full bg-[#E6A15C]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blue Plastic Equipment Bin on Floor */}
      <div className="absolute bottom-[6%] left-[9%] w-[8%] h-[8%] bg-[#1E3A5F] rounded-t border-2 border-[#13263E] p-1 z-25 pointer-events-none shadow-md">
        <div className="w-full h-1 bg-[#2C5282] rounded-xs mb-1" />
        <div className="flex gap-0.5 justify-center">
          <div className="w-1.5 h-3 bg-[#4A5568] rotate-12" />
          <div className="w-1.5 h-4 bg-[#A0AEC0] -rotate-6" />
          <div className="w-1.5 h-3.5 bg-[#ED8936]" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LAYER 3: RIGHT WALL DENSELY PACKED BOOKSHELF (13+ Books)               */}
      {/* ========================================================================= */}
      <div
        className="absolute top-[6%] right-[1.5%] w-[15.5%] h-[67%] bg-[#241A14] rounded-t border-t-4 border-l-4 border-r-2 border-[#3D2C22] shadow-2xl p-1.5 flex flex-col justify-between z-20"
        title="Huzbi's Manga & Tech Library (Click any book to read)"
      >
        {/* Top Header & Trailing Plant */}
        <div className="relative border-b-2 border-[#3B2B20] pb-1 flex items-center justify-between text-[8px] font-mono text-[#A89886]">
          <div className="flex items-center gap-1 font-bold text-accent truncate">
            <BookOpen className="w-2.5 h-2.5" />
            <span>LIBRARY</span>
          </div>
          <span className="text-[7.5px] text-fg-subtle">{books.length} VOLS</span>
          {/* Cascading Green Ivy Foliage */}
          <div className="absolute -top-3.5 -left-1 flex items-center gap-0.5 pointer-events-none">
            <div className="w-3 h-2 bg-[#2D4D24] rounded-full" />
            <div className="w-2.5 h-3.5 bg-[#3B6630] rounded-full" />
            <div className="w-2 h-2.5 bg-[#4D8040] rounded-full" />
          </div>
        </div>

        {/* 4 Densely Packed Shelves */}
        <div className="flex-1 flex flex-col justify-between py-1 space-y-1">
          {/* SHELF 1: Top Manga Shelf (One Piece, Naruto, Bleach, etc.) */}
          <div className="border-b-2 border-[#3D2C22] pb-0.5 flex items-end justify-start gap-1 h-[23%] px-0.5 overflow-hidden">
            {shelf2Books.map((b, idx) => {
              const colors = ['#A82828', '#E67E22', '#1B1E24', '#2B3D2E', '#E5A93C'];
              const heights = [86, 82, 85, 80, 84];
              return (
                <button
                  key={b.title}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onBookshelfClick) onBookshelfClick(b);
                  }}
                  onMouseEnter={() => setHoveredBook(b)}
                  onMouseLeave={() => setHoveredBook(null)}
                  className="flex-1 rounded-t-[1px] border border-[#16110D] transition-transform hover:-translate-y-1 flex flex-col justify-between items-center py-0.5 cursor-pointer shadow-sm"
                  style={{
                    height: `${heights[idx % heights.length]}%`,
                    backgroundColor: colors[idx % colors.length],
                  }}
                  title={`${b.title} (${b.author})`}
                >
                  <div className="w-full h-0.5 bg-[#D6AE62] opacity-80" />
                  <div className="text-[6px] font-mono text-white/80 font-bold truncate leading-none">
                    {idx + 1}
                  </div>
                </button>
              );
            })}
          </div>

          {/* SHELF 2: Fiction & Dark Fantasy (Berserk, Vagabond, Monster, Vinland) */}
          <div className="border-b-2 border-[#3D2C22] pb-0.5 flex items-end justify-start gap-1 h-[23%] px-0.5 overflow-hidden">
            {shelf3Books.map((b, idx) => {
              const colors = ['#5C1620', '#1C3827', '#381829', '#244552'];
              const heights = [88, 84, 82, 87];
              return (
                <button
                  key={b.title}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onBookshelfClick) onBookshelfClick(b);
                  }}
                  onMouseEnter={() => setHoveredBook(b)}
                  onMouseLeave={() => setHoveredBook(null)}
                  className="flex-1 rounded-t-[1px] border border-[#16110D] transition-transform hover:-translate-y-1 flex flex-col justify-between items-center py-0.5 cursor-pointer shadow-sm"
                  style={{
                    height: `${heights[idx % heights.length]}%`,
                    backgroundColor: colors[idx % colors.length],
                  }}
                  title={`${b.title} (${b.author})`}
                >
                  <div className="w-full h-0.5 bg-[#F5E8C7] opacity-60" />
                  <div className="w-1.5 h-1 bg-white/40 rounded-xs" />
                </button>
              );
            })}
            {/* Horizontal Book Stack on the side */}
            <div className="w-5 h-[45%] flex flex-col justify-end gap-0.5 mb-0.5">
              <div className="w-full h-1/3 bg-[#6B4423] rounded-[1px] border border-black/40" />
              <div className="w-full h-1/3 bg-[#8C5D38] rounded-[1px] border border-black/40" />
              <div className="w-full h-1/3 bg-[#4A2E16] rounded-[1px] border border-black/40" />
            </div>
          </div>

          {/* SHELF 3: Tech & Computer Science Classics (SICP, Networking, DDIA, OSTEP) */}
          <div className="border-b-2 border-[#3D2C22] pb-0.5 flex items-end justify-start gap-1 h-[23%] px-0.5 overflow-hidden">
            {shelf4Books.map((b, idx) => {
              const colors = ['#7A5C28', '#1F3A5C', '#8A2D19', '#2E4C3D'];
              const heights = [90, 92, 87, 89];
              return (
                <button
                  key={b.title}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onBookshelfClick) onBookshelfClick(b);
                  }}
                  onMouseEnter={() => setHoveredBook(b)}
                  onMouseLeave={() => setHoveredBook(null)}
                  className="flex-1 rounded-t-[1px] border border-[#16110D] transition-transform hover:-translate-y-1 flex flex-col justify-between items-center py-0.5 cursor-pointer shadow-sm"
                  style={{
                    height: `${heights[idx % heights.length]}%`,
                    backgroundColor: colors[idx % colors.length],
                  }}
                  title={`${b.title} (${b.author})`}
                >
                  <div className="w-full h-0.5 bg-[#D6AE62]" />
                  <div className="w-2 h-1 bg-white/60 mx-auto" />
                </button>
              );
            })}
          </div>

          {/* SHELF 4: Storage Binders, Boxes & Retro Cartridges */}
          <div className="pb-0.5 flex items-end justify-between h-[23%] px-1">
            {/* Storage Box */}
            <div className="w-[30%] h-[75%] bg-[#384C32] rounded-[1px] border border-[#243320] flex items-center justify-center">
              <div className="w-3 h-1 bg-[#1C2618] rounded-xs" />
            </div>
            {/* 2 Leaning Manuals */}
            <div className="w-[18%] h-[82%] bg-[#4A3B69] rounded-t-[1px] border border-black/40 -rotate-12 origin-bottom-left" />
            <div className="w-[18%] h-[82%] bg-[#2E3748] rounded-t-[1px] border border-black/40 -rotate-6 origin-bottom-left" />
            {/* Thick Blue Binder */}
            <div className="w-[24%] h-[90%] bg-[#1A365D] rounded-t-[1px] border border-black/40 flex flex-col justify-between py-0.5">
              <div className="w-full h-1 bg-white/50" />
              <div className="w-2.5 h-1.5 bg-white/30 mx-auto" />
            </div>
          </div>
        </div>

        {/* Hovered Book Tooltip */}
        {hoveredBook && (
          <div className="absolute right-full mr-2 top-10 bg-bg-deep border border-accent p-2 rounded-lg shadow-2xl z-50 pointer-events-none w-48 text-[10px] font-mono">
            <p className="text-accent font-bold truncate">{hoveredBook.title}</p>
            <p className="text-fg-muted text-[9px]">{hoveredBook.author}</p>
            <p className="text-fg-subtle text-[8.5px] mt-1 line-clamp-2">&ldquo;{hoveredBook.note}&rdquo;</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. LAYER 4: UNDER-DESK EQUIPMENT & RETRO HARDWARE                         */}
      {/* ========================================================================= */}
      {/* Left Under-Desk Beige Vintage PC Tower with Dual 5.25" Floppy Bays */}
      <div className="absolute bottom-[23.5%] left-[23%] w-[10.5%] h-[20%] bg-[#C9BEAA] rounded-[2px] border-2 border-[#948773] shadow-xl p-1 flex flex-col justify-between z-15 pointer-events-none">
        {/* Dual Floppy Drives */}
        <div className="space-y-1">
          <div className="w-full h-2.5 bg-[#383127] rounded-[1px] border border-[#6B6051] flex items-center justify-between px-1">
            <div className="w-6 h-0.5 bg-[#14120F]" />
            <div className="w-1 h-1 rounded-full bg-[#E53935]" />
          </div>
          <div className="w-full h-2.5 bg-[#383127] rounded-[1px] border border-[#6B6051] flex items-center justify-between px-1">
            <div className="w-6 h-0.5 bg-[#14120F]" />
            <div className="w-1 h-1 rounded-full bg-accent" />
          </div>
        </div>
        {/* Turbo Button & Keylock */}
        <div className="flex items-center justify-between px-0.5 text-[5px] font-mono text-[#5C5243]">
          <span className="font-bold">TURBO 66</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        </div>
      </div>

      {/* Center Under-Desk: PERMANENT RED SWIVEL STOOL (From Reference Image) */}
      <div className="absolute bottom-[23.5%] left-[45.5%] w-[8.5%] h-[20%] z-20 pointer-events-none flex flex-col items-center justify-end">
        {/* Red Circular Padded Cushion with 3D Bevel */}
        <div className="w-full h-4 bg-[#992222] rounded-full border-2 border-[#5E1414] shadow-md flex items-center justify-center relative">
          <div className="w-[85%] h-2.5 bg-[#D93838] rounded-full" />
        </div>
        {/* Chrome Pneumatic Stem */}
        <div className="w-1.5 h-7 bg-gradient-to-r from-[#94A3B8] to-[#64748B]" />
        {/* Chrome Circular Footrest Ring */}
        <div className="w-9 h-1.5 border border-[#94A3B8] rounded-full -mt-4 mb-2 opacity-80" />
        {/* 5-Star Caster Base on Floor */}
        <div className="w-12 h-2 bg-[#1E2530] rounded-sm flex justify-between items-center px-0.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0F131A]" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#0F131A]" />
        </div>
      </div>

      {/* Right Under-Desk Red Mini-UPS & Teal Server Cabinet */}
      <div className="absolute bottom-[23.5%] left-[65.5%] w-[14%] h-[19%] flex items-end justify-between z-15 pointer-events-none">
        {/* Red Mini-UPS */}
        <div className="w-9 h-14 bg-[#A82828] rounded-[2px] border border-[#751B1B] shadow-lg p-1 flex flex-col justify-between">
          <div className="w-full h-1 bg-[#4A1010]" />
          <div className="text-[5px] font-mono text-white text-center font-bold">UPS 1200</div>
          <div className="flex justify-around">
            <span className="w-1 h-1 rounded-full bg-accent" />
            <span className="w-1 h-1 rounded-full bg-[#F5B041]" />
          </div>
        </div>
        {/* Teal Industrial Server Cabinet */}
        <div className="w-14 h-20 bg-[#1B3E42] rounded-[2px] border-2 border-[#122A2D] shadow-xl p-1 flex flex-col justify-between">
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full h-0.5 bg-[#102427] rounded-xs" />
            ))}
          </div>
          <div className="flex items-center justify-between px-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[5px] font-mono text-[#82D9B5]">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Draped Black Equipment Cables */}
      <svg viewBox="0 0 500 80" className="absolute bottom-[28%] left-[26%] w-[48%] h-[12%] pointer-events-none z-16" fill="none">
        <path d="M15,5 Q60,65 130,30 Q200,75 280,25 Q360,80 470,15" stroke="#0E0C11" strokeWidth="2.5" />
        <path d="M45,10 Q95,55 170,40 Q250,70 340,30 Q420,70 490,25" stroke="#16131A" strokeWidth="2" />
      </svg>

      {/* ========================================================================= */}
      {/* 6. LAYER 5: MASTER CONTINUOUS WORKBENCH & APRON FASCIA                    */}
      {/* ========================================================================= */}
      {/* Solid Wooden Tabletop Slab (Runs from 20% to 83%) */}
      <div className="absolute top-[47.5%] left-[20%] w-[62.5%] h-[4.5%] bg-[#422E20] rounded-t border-t-2 border-[#5E422E] shadow-2xl z-30 pointer-events-none">
        {/* Top Surface Light Reflection Highlight */}
        <div className="w-full h-1 bg-[#6A4B35] opacity-80" />
      </div>

      {/* Equipment Apron Fascia with Switches, Jacks, and Status LEDs */}
      <div className="absolute top-[52%] left-[20.5%] w-[61.5%] h-[5.5%] bg-[#1A181C] rounded-b border-b-2 border-x-2 border-[#2E2833] shadow-md z-30 flex items-center justify-between px-3 text-[7px] font-mono text-fg-subtle pointer-events-none">
        {/* Left Apron Console */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#E6A15C]" />
          </div>
          <span className="hidden sm:inline">TTY-BUS // ACTIVE</span>
        </div>
        {/* Center Legroom Open Indicator */}
        <div className="w-28 h-1 bg-[#0F0E11] rounded-full mx-auto" />
        {/* Right Apron Console */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full border border-[#443850] flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#73B7FF]" />
          </div>
          <span className="hidden sm:inline">240V STABLE</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. LAYER 6: ON-DESK EQUIPMENT (ALL ANCHORED ON DESK SURFACE: bottom: 48%)  */}
      {/* ========================================================================= */}
      {/* 1. Left Desk: Retro Clamshell Laptop Station */}
      <div
        className="absolute bottom-[48%] left-[23.5%] w-[13.5%] h-[16%] cursor-pointer group z-35"
        onClick={onLaptopClick}
        title="Retro Laptop Workstation (Click to type)"
      >
        {/* Laptop Screen Lid */}
        <div className="w-full h-[64%] bg-[#1E2530] rounded-t border-2 border-[#333E50] p-1 shadow-lg group-hover:border-accent transition-colors flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[5.5px] font-mono text-accent">[H-PAD 90]</span>
            <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
          </div>
          <div className="bg-[#090D14] rounded-[1px] p-0.5 h-[68%] font-mono text-[5.5px] text-[#73B7FF] leading-none overflow-hidden">
            <div>$ ./route_sim</div>
            <div className="text-accent">&gt; 128 pkts [OK]</div>
          </div>
        </div>
        {/* Laptop Base Keyboard Deck Resting on Desk Surface */}
        <div className="w-full h-[36%] bg-[#252E3D] rounded-b border-2 border-t-0 border-[#333E50] flex items-center justify-center relative shadow-sm">
          <div className="w-10 h-2 bg-[#171D27] rounded-[1px]" />
          {/* Red TrackPoint Nub */}
          <div className="w-1 h-1 rounded-full bg-[#E53935] absolute top-1 left-1/2 -translate-x-1/2" />
        </div>
        {/* Mouse with Coiled Cable beside laptop */}
        <div className="absolute -right-3 bottom-0 w-2.5 h-3.5 bg-[#4A5568] rounded-t-sm border border-[#2D3748]" />
      </div>

      {/* Steaming Mug of Chai on Desk */}
      <div className="absolute bottom-[48%] left-[37.5%] w-3 h-4 z-35 pointer-events-none">
        <div className="w-full h-3 bg-[#E2E8F0] rounded-b-sm border border-[#A0AEC0] relative">
          <div className="w-1 h-1.5 border-r border-[#A0AEC0] absolute -right-1 top-0.5 rounded-r-xs" />
        </div>
        {/* Steam Animation */}
        <div className="w-1 h-2 -mt-1 mx-auto bg-white/40 rounded-full animate-bounce" style={{ animationDuration: '2s' }} />
      </div>

      {/* 2. Center-Left Desk: Interactive Retro CRT Monitor */}
      <div
        className="absolute bottom-[48%] left-[40%] w-[18.5%] h-[26%] z-40 cursor-pointer"
        title="Interactive CRT Monitor (Click to watch & cycle modes)"
      >
        <CRTMonitor
          onActivity={() => {}}
          onSelectProject={onSelectProject}
          onMonitorClick={onMonitorClick}
          className="w-full h-full"
        />
      </div>

      {/* 3. Right Desk: Secondary Screen (Manga Display) */}
      <div
        className="absolute bottom-[48%] left-[60%] w-[12%] h-[16%] bg-[#1A1D24] rounded-t border-2 border-[#333C4D] shadow-lg p-1 z-35 flex flex-col justify-between cursor-pointer group hover:border-[#FBBF24] transition-colors"
        onClick={onMonitorClick}
        title="Secondary Manga Display (Click to cycle manga)"
      >
        <div className="bg-[#080B10] rounded-[1px] h-[75%] p-1 flex flex-col items-center justify-center text-center overflow-hidden border border-black/50">
          <div className="text-[7.5px] font-mono font-bold text-[#FBBF24] tracking-wider uppercase">
            {activeManga.replace('-', ' ')}
          </div>
          <div className="text-[5.5px] font-mono text-accent-cream opacity-80 mt-0.5">
            {activeManga === 'one-piece'
              ? 'GEAR 5 // NIKA'
              : activeManga === 'naruto'
              ? 'SAGE OF SIX PATHS'
              : activeManga === 'bleach'
              ? 'BANKAI // HOLLOW'
              : activeManga === 'black-clover'
              ? 'ANTI-MAGIC GRIND'
              : 'SERIOUS PUNCH'}
          </div>
        </div>
        {/* Mini Stand */}
        <div className="w-8 h-1 bg-[#2C3440] mx-auto rounded-b-xs" />
      </div>

      {/* 4. Far Right Desk: Audio Cassette Deck & Amp with Bouncing VU Meters */}
      <div className="absolute bottom-[48%] left-[73%] w-[8.5%] h-[14%] bg-[#242A36] rounded border border-[#3A4456] shadow-md p-1 z-35 flex flex-col justify-between pointer-events-none">
        {/* Cassette Windows */}
        <div className="flex justify-around items-center h-4 bg-[#12161F] rounded-[1px] border border-black/40">
          <div className="w-2.5 h-2.5 rounded-full border border-[#4A5568] flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-white/60 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="w-2.5 h-2.5 rounded-full border border-[#4A5568] flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-white/60 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>
        {/* Bouncing Audio VU Meter */}
        <div className="flex items-center justify-between px-0.5">
          <div className="flex gap-0.5 items-end h-2">
            <div className="w-1 h-1 bg-accent" />
            <div className="w-1 h-1.5 bg-accent" />
            <div className="w-1 h-2 bg-[#E6A15C] animate-pulse" />
            <div className="w-1 h-1.5 bg-[#E53935]" />
          </div>
          <span className="text-[5px] font-mono text-fg-subtle">LO-FI</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. LAYER 7: FOREGROUND LARGE CRIMSON WOVEN RUG                            */}
      {/* ========================================================================= */}
      <div className="absolute bottom-[4%] left-[21%] w-[54%] h-[18%] pointer-events-none z-20">
        <div className="relative w-full h-full bg-[#8E2838] rounded-lg border-2 border-[#541822] shadow-2xl p-1 flex flex-col justify-between overflow-hidden">
          {/* Top Golden Fringe */}
          <div className="flex justify-around items-center h-1 opacity-70">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-[#D6AE62]" />
            ))}
          </div>
          {/* Bohemian Diamond Pattern */}
          <div className="flex items-center justify-around px-2 py-0.5 opacity-90">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-4 h-4 border border-[#D6AE62] rotate-45 bg-[#661D28] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#F4DDB8] rotate-45" />
              </div>
            ))}
          </div>
          {/* Bottom Golden Fringe */}
          <div className="flex justify-around items-center h-1 opacity-70">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-[#D6AE62]" />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. LAYER 8: RIGHT FOREGROUND PLUSH ARMCHAIR & SLEEPING CAT               */}
      {/* ========================================================================= */}
      <div
        className="absolute bottom-[3%] left-[77%] w-[21.5%] h-[34%] z-40 cursor-pointer group select-none"
        onClick={onCatClick}
        title="Sleeping Cat Mascot on Armchair (Click to pet!)"
      >
        {/* Retro Corduroy Armchair SVG */}
        <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-2xl overflow-visible" shapeRendering="crispEdges">
          {/* Armchair Backrest with Vertical Ribbed Sections */}
          <rect x="15" y="10" width="70" height="35" fill="#3D324F" rx="3" />
          <rect x="18" y="13" width="64" height="29" fill="#4E4065" rx="2" />
          <line x1="34" y1="13" x2="34" y2="42" stroke="#342A43" strokeWidth="1.5" />
          <line x1="50" y1="13" x2="50" y2="42" stroke="#342A43" strokeWidth="1.5" />
          <line x1="66" y1="13" x2="66" y2="42" stroke="#342A43" strokeWidth="1.5" />

          {/* Left Armrest */}
          <rect x="5" y="30" width="16" height="40" fill="#342A43" rx="2" />
          <rect x="7" y="32" width="12" height="36" fill="#4E4065" rx="1.5" />

          {/* Right Armrest */}
          <rect x="79" y="30" width="16" height="40" fill="#342A43" rx="2" />
          <rect x="81" y="32" width="12" height="36" fill="#4E4065" rx="1.5" />

          {/* Seat Cushion Base */}
          <rect x="19" y="44" width="62" height="22" fill="#342A43" rx="2" />
          <rect x="21" y="45" width="58" height="19" fill="#584972" rx="1.5" />

          {/* Wooden Legs */}
          <rect x="14" y="68" width="5" height="10" fill="#241710" />
          <rect x="81" y="68" width="5" height="10" fill="#241710" />
        </svg>

        {/* Sleeping Calico Cat nestled on the armchair seat */}
        <div className="absolute top-[28%] left-[26%] w-[48%] h-[40%] pointer-events-none">
          <svg viewBox="0 0 60 40" className="w-full h-full overflow-visible" shapeRendering="crispEdges">
            <g className="animate-pulse" style={{ animationDuration: '3.6s' }}>
              {/* Cat Body */}
              <ellipse cx="30" cy="22" rx="16" ry="10" fill="#E67E22" />
              <ellipse cx="31" cy="21" rx="13" ry="8" fill="#F39C12" />
              <ellipse cx="34" cy="23" rx="7" ry="5" fill="#FFFFFF" />
              <rect x="25" y="15" width="2" height="5" fill="#BA4A00" />
              <rect x="29" y="14" width="2" height="6" fill="#BA4A00" />

              {/* Head */}
              <circle cx="19" cy="20" r="7.5" fill="#E67E22" />
              <polygon points="14,14 17,8 20,14" fill="#E67E22" />
              <polygon points="20,14 23,9 25,14" fill="#E67E22" />
              {/* Closed Sleepy Eyes */}
              <path d="M15,19 Q17,21 19,19" stroke="#5D4037" strokeWidth="1.2" fill="none" />
              <polygon points="19,21 18,20 20,20" fill="#F1948A" />

              {/* Tail */}
              <path d="M43,24 Q48,20 45,15" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" fill="none" />
              <circle cx="45" cy="15" r="1.8" fill="#FFFFFF" />
            </g>
          </svg>
        </div>

        {/* Floating Hearts Animation when being petted */}
        {actionState === 'petting' && (
          <div className="absolute -top-6 left-[35%] flex gap-1 pointer-events-none animate-bounce">
            <span className="text-red-400 text-sm">♥</span>
            <span className="text-red-400 text-xs animate-ping">♥</span>
          </div>
        )}
      </div>

      {/* Retro Game Controller on Floor in front of Armchair */}
      <div className="absolute bottom-[2%] left-[84%] w-[6%] h-[4%] z-30 pointer-events-none">
        <svg viewBox="0 0 40 25" className="w-full h-full" fill="none">
          {/* Gamepad Body */}
          <rect x="4" y="5" width="32" height="15" rx="4" fill="#4A5568" stroke="#1A202C" strokeWidth="1" />
          {/* D-Pad */}
          <rect x="8" y="10" width="7" height="2.5" fill="#CBD5E1" />
          <rect x="10.25" y="7.75" width="2.5" height="7" fill="#CBD5E1" />
          {/* Action Buttons */}
          <circle cx="26" cy="11" r="1.5" fill="#E53935" />
          <circle cx="30" cy="9" r="1.5" fill="#FBBF24" />
          <circle cx="28" cy="14" r="1.5" fill="#38A169" />
          {/* Winding Wire */}
          <path d="M20,5 Q18,-3 12,-1 Q8,2 2,-2" stroke="#1A202C" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 10. LAYER 9: DYNAMIC SPATIAL MOVING AVATAR (Huzbi)                       */}
      {/* ========================================================================= */}
      <div
        className="absolute pointer-events-none transition-all ease-in-out"
        style={{
          left: `${coords.x}%`,
          bottom: `${coords.bottom}%`,
          height: '36%',
          aspectRatio: '80 / 95',
          zIndex: currentHotspot.zIndex,
          transform: 'translate(-50%, 0)',
          transitionDuration: `${transitDuration}ms`,
          transitionProperty: 'left, bottom',
        }}
      >
        <div className="w-full h-full pointer-events-auto">
          <Character
            actionState={actionState}
            hotspot={currentHotspot}
            facingRight={facingRight}
            cursorPos={cursorPos}
            gazeOverride={gazeOverride}
            bubbleText={bubbleText}
            onAvatarClick={onAvatarClick}
            isLampOn={lampOn}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 11. LAYER 10: 2 AM AMBIENT LIGHTING SHADOW & LAMP CONE                    */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none z-50 transition-opacity duration-700"
        style={{
          background: lampOn
            ? 'radial-gradient(ellipse at 48% 60%, rgba(230, 161, 92, 0.14) 0%, rgba(11, 14, 20, 0.35) 68%, rgba(5, 7, 10, 0.72) 100%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(168, 214, 114, 0.05) 0%, rgba(6, 8, 12, 0.78) 65%, rgba(2, 3, 5, 0.92) 100%)',
        }}
      />
    </div>
  );
};
