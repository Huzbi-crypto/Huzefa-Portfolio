'use client';

import React from 'react';
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

  return (
    <div
      className={`relative w-full aspect-[25/14] min-h-[460px] sm:min-h-[520px] md:min-h-[580px] select-none overflow-hidden bg-[#181222] ${className}`}
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
            <stop offset="0%" stopColor="#2A1B14" />
            <stop offset="50%" stopColor="#21150F" />
            <stop offset="100%" stopColor="#150D0A" />
          </linearGradient>
        </defs>

        {/* Back Center Main Wall */}
        <rect x="0" y="0" width="1000" height="430" fill="url(#wallGrad)" />

        {/* Left Angled Corner Wall Trapezoid */}
        <polygon points="0,0 180,50 180,430 0,460" fill="url(#leftWallGrad)" />
        <line x1="180" y1="50" x2="180" y2="430" stroke="#100C18" strokeWidth="2.5" opacity="0.6" />

        {/* Right Angled Corner Wall Trapezoid */}
        <polygon points="1000,0 825,50 825,430 1000,460" fill="url(#rightWallGrad)" />
        <line x1="825" y1="50" x2="825" y2="430" stroke="#100C18" strokeWidth="2.5" opacity="0.6" />

        {/* Top Ceiling Molding / Cornice */}
        <rect x="0" y="0" width="1000" height="24" fill="#130E1B" />
        <line x1="0" y1="24" x2="1000" y2="24" stroke="#372A4B" strokeWidth="2" />
        <rect x="0" y="26" width="1000" height="6" fill="#1B1426" opacity="0.8" />

        {/* Wooden Floorboards Plane (Bottom Y: 430 - 560) */}
        <polygon points="0,430 1000,430 1000,560 0,560" fill="url(#floorGrad)" />
        <line x1="0" y1="430" x2="1000" y2="430" stroke="#3D261C" strokeWidth="3" />

        {/* Floorboard Seams & Perspective Plank Divides */}
        <line x1="0" y1="465" x2="1000" y2="465" stroke="#180F0B" strokeWidth="1.5" />
        <line x1="0" y1="505" x2="1000" y2="505" stroke="#180F0B" strokeWidth="1.5" />
        <line x1="0" y1="545" x2="1000" y2="545" stroke="#180F0B" strokeWidth="1.5" />

        {/* Vertical Floorboard stagger marks */}
        {[
          { x1: 90, y1: 430, x2: 80, y2: 465 },
          { x1: 290, y1: 430, x2: 280, y2: 465 },
          { x1: 520, y1: 430, x2: 515, y2: 465 },
          { x1: 740, y1: 430, x2: 745, y2: 465 },
          { x1: 930, y1: 430, x2: 940, y2: 465 },
          { x1: 180, y1: 465, x2: 170, y2: 505 },
          { x1: 410, y1: 465, x2: 405, y2: 505 },
          { x1: 640, y1: 465, x2: 645, y2: 505 },
          { x1: 850, y1: 465, x2: 860, y2: 505 },
          { x1: 80, y1: 505, x2: 70, y2: 545 },
          { x1: 310, y1: 505, x2: 300, y2: 545 },
          { x1: 550, y1: 505, x2: 555, y2: 545 },
          { x1: 790, y1: 505, x2: 800, y2: 545 },
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
      {/* 2. LAYER 1: WIDE PANORAMIC CITY WINDOW (Center Wall: 20% to 81%)          */}
      {/* ========================================================================= */}
      <div
        className="absolute top-[6.5%] left-[20.5%] w-[61%] h-[34%] cursor-pointer group rounded border-4 border-[#3D2C22] shadow-2xl overflow-hidden z-10"
        onClick={onWindowClick}
        title="2 AM Karachi Night Sky (Click to gaze outside)"
      >
        {/* Night Sky Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A13] via-[#0F1626] to-[#1C273C] overflow-hidden">
          {/* Distant City Skyline Silhouettes */}
          <div className="absolute bottom-0 inset-x-0 h-[48%] flex items-end justify-between px-1 opacity-80 pointer-events-none">
            {/* Cluster of illuminated skyscrapers */}
            <div className="w-8 h-16 bg-[#0B101D] relative">
              <div className="w-1 h-1 bg-[#FBBF24] opacity-80 absolute top-2 left-1.5" />
              <div className="w-1 h-1 bg-[#FFF] opacity-60 absolute top-6 left-4" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-80 absolute top-10 left-2" />
            </div>
            <div className="w-14 h-24 bg-[#090D18] relative">
              {/* Radio Tower Spire with blinking red beacon */}
              <div className="w-0.5 h-6 bg-[#0D1424] absolute -top-6 left-6">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping absolute -top-0.5 -left-[2px]" />
              </div>
              <div className="w-1 h-1 bg-accent opacity-90 absolute top-3 left-3" />
              <div className="w-1 h-1 bg-[#FFF] opacity-70 absolute top-3 left-9" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-80 absolute top-8 left-6" />
              <div className="w-1 h-1 bg-accent opacity-90 absolute top-14 left-4" />
            </div>
            <div className="w-16 h-20 bg-[#0B101D] relative">
              <div className="w-1 h-1 bg-[#FFF] opacity-70 absolute top-4 left-3" />
              <div className="w-1 h-1 bg-[#73B7FF] opacity-80 absolute top-9 left-10" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-75 absolute top-13 left-5" />
            </div>
            <div className="w-12 h-26 bg-[#080B14] relative">
              <div className="w-1 h-1 bg-[#FFF] opacity-75 absolute top-4 left-4" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-90 absolute top-11 left-7" />
              <div className="w-1 h-1 bg-[#FFF] opacity-75 absolute top-18 left-3" />
            </div>
            <div className="w-18 h-18 bg-[#0B101D] relative">
              <div className="w-1 h-1 bg-[#73B7FF] opacity-80 absolute top-3 left-5" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-80 absolute top-8 left-12" />
            </div>
            <div className="w-10 h-22 bg-[#090D18] relative">
              <div className="w-1 h-1 bg-[#FFF] opacity-70 absolute top-6 left-3" />
              <div className="w-1 h-1 bg-[#FBBF24] opacity-90 absolute top-12 left-6" />
            </div>
          </div>

          {/* Crescent Moon */}
          <div className="absolute top-2.5 right-6 pointer-events-none">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#F5E8C7] drop-shadow-[0_0_10px_rgba(245,232,199,0.7)]" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>

          {/* Twinkling Pixel Stars */}
          {[
            { left: '10%', top: '22%', size: 2, delay: '0.2s' },
            { left: '22%', top: '14%', size: 2.5, delay: '0.9s' },
            { left: '38%', top: '26%', size: 1.5, delay: '1.4s' },
            { left: '48%', top: '15%', size: 2, delay: '0.5s' },
            { left: '60%', top: '28%', size: 2.5, delay: '1.2s' },
            { left: '72%', top: '18%', size: 2, delay: '0.7s' },
            { left: '84%', top: '32%', size: 1.5, delay: '1.6s' },
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

          {/* 4-Pane Window Mullions (Crossbars) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Vertical Mullion 1 */}
            <div className="w-2 h-full bg-[#2B1F18] border-x border-[#1A120D] absolute left-[33%]" />
            {/* Vertical Mullion 2 */}
            <div className="w-2 h-full bg-[#2B1F18] border-x border-[#1A120D] absolute left-[66%]" />
            {/* Horizontal Center Mullion */}
            <div className="h-2 w-full bg-[#2B1F18] border-y border-[#1A120D] absolute top-[52%]" />
          </div>
        </div>

        {/* Window Ledge / Sill Trim */}
        <div className="absolute bottom-0 inset-x-0 h-2 bg-[#2D1F17] border-t border-[#473326]" />
      </div>

      {/* ========================================================================= */}
      {/* 3. LAYER 2: LEFT WALL CIRCUIT BOARD & TECH RACK                          */}
      {/* ========================================================================= */}
      {/* Left Wall Illuminated Red Circuit Panel */}
      <div className="absolute top-[12.5%] left-[2.5%] w-[14%] h-[32%] bg-[#1A121A] rounded border-2 border-[#4A1D24] shadow-xl p-1.5 flex flex-col justify-between overflow-hidden z-15 pointer-events-none">
        <div className="text-[7.5px] font-mono font-bold text-[#E53935] tracking-widest border-b border-[#4A1D24] pb-0.5">
          [ NET-BUS v2 ]
        </div>
        {/* Circuit Tracks (SVG) */}
        <svg viewBox="0 0 100 80" className="w-full h-full opacity-80" stroke="#E53935" strokeWidth="1.2" fill="none">
          <polyline points="10,10 40,10 40,30 80,30" />
          <circle cx="80" cy="30" r="2.5" fill="#E53935" />
          <polyline points="20,40 50,40 60,60 90,60" />
          <circle cx="90" cy="60" r="2.5" fill="#F5B041" />
          <polyline points="10,70 30,70 45,50 80,50" />
          <circle cx="10" cy="70" r="2" fill="#E53935" />
        </svg>
        <div className="flex items-center justify-between text-[6px] font-mono text-[#8C7A7A]">
          <span>TTL: 64</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] animate-pulse" />
        </div>
      </div>

      {/* Left Standing Tech Rack with Modular Drawers & Oscilloscope */}
      <div className="absolute top-[46.5%] left-[1.5%] w-[16%] h-[31%] bg-[#161B24] rounded-t border-2 border-[#263142] shadow-2xl p-1.5 flex flex-col justify-between z-20 pointer-events-none">
        {/* Oscilloscope Screen (Top Rack Unit) */}
        <div className="w-full h-10 bg-[#090D14] rounded border border-[#1F2A3B] p-1 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-[6.5px] font-mono text-accent">
            <span>OSC-88</span>
            <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
          </div>
          {/* Animated Sine Wave */}
          <svg viewBox="0 0 80 18" className="w-full h-3 overflow-visible" fill="none">
            <path d="M0,9 Q10,1 20,9 T40,9 T60,9 T80,9" stroke="#A8D672" strokeWidth="1.2" />
          </svg>
        </div>
        {/* Modular Hardware Drawers */}
        <div className="space-y-1 mt-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="w-full h-4 bg-[#1F2633] rounded-[1px] border border-[#2B3547] flex items-center justify-between px-1.5">
              <div className="w-4 h-1 bg-[#3A485E] rounded-xs" />
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-accent/70" />
                <span className="w-1 h-1 rounded-full bg-[#E6A15C]/70" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LAYER 3: RIGHT WALL TALL BOOKCASE (13 Books & Manga)                   */}
      {/* ========================================================================= */}
      <div
        className="absolute top-[7.5%] right-[1.5%] w-[15.5%] h-[69%] bg-[#241A14] rounded-t border-t-4 border-l-4 border-r-2 border-[#3D2C22] shadow-2xl p-1.5 flex flex-col justify-between z-20 cursor-pointer group"
        title="Huzbi's 13-Volume Manga & Tech Library (Click to browse)"
      >
        {/* Top Header & Trailing Ivy */}
        <div className="relative border-b border-[#3B2B20] pb-1 flex items-center justify-between text-[8px] font-mono text-[#A89886]">
          <div className="flex items-center gap-1 font-bold text-accent truncate">
            <BookOpen className="w-2.5 h-2.5" />
            <span>LIBRARY</span>
          </div>
          <span className="text-[7.5px]">{books.length} VOLS</span>
          {/* Trailing Ivy */}
          <div className="absolute -top-3.5 right-1 w-5 h-3 bg-[#385430] rounded-full flex items-center justify-center pointer-events-none">
            <div className="w-3 h-1.5 bg-[#4F7544] rounded-full" />
          </div>
        </div>

        {/* 5 Physical Shelves */}
        <div className="flex-1 flex flex-col justify-between py-1 space-y-1">
          {Array.from({ length: 4 }).map((_, shelfIdx) => {
            const shelfBooks = books.slice(shelfIdx * 3, shelfIdx * 3 + 3);
            const spineColors = ['#A82828', '#E67E22', '#1A1D24', '#2B3D2E', '#6B1724', '#1F3324', '#4A3B69', '#1E3A4C'];

            return (
              <div key={shelfIdx} className="border-b-2 border-[#3D2C22] pb-0.5 flex items-end justify-around h-[22%]">
                {shelfBooks.map((b, bIdx) => (
                  <button
                    key={b.title}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onBookshelfClick) onBookshelfClick(b);
                    }}
                    className="w-3 sm:w-3.5 rounded-t-[1px] border border-[#16110D] transition-transform hover:-translate-y-1 flex flex-col justify-between items-center py-0.5 cursor-pointer"
                    style={{
                      height: `${28 + ((bIdx * 5) % 10)}px`,
                      backgroundColor: spineColors[(shelfIdx * 3 + bIdx) % spineColors.length],
                    }}
                    title={`${b.title} — ${b.author}`}
                  >
                    <div className="w-full h-0.5 bg-[#D6AE62] opacity-80" />
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. LAYER 4: UNDER-DESK EQUIPMENT & RETRO HARDWARE                         */}
      {/* ========================================================================= */}
      {/* Left Under-Desk Beige Vintage PC Tower with Dual 5.25" Floppy Bays */}
      <div className="absolute top-[60%] left-[21.5%] w-[11.5%] h-[18%] bg-[#C9BEAA] rounded-[2px] border-2 border-[#948773] shadow-xl p-1 flex flex-col justify-between z-15 pointer-events-none">
        {/* Dual Floppy Drives */}
        <div className="space-y-1">
          <div className="w-full h-3 bg-[#383127] rounded-[1px] border border-[#6B6051] flex items-center justify-between px-1">
            <div className="w-7 h-0.5 bg-[#14120F]" />
            <div className="w-1 h-1 rounded-full bg-[#E53935]" />
          </div>
          <div className="w-full h-3 bg-[#383127] rounded-[1px] border border-[#6B6051] flex items-center justify-between px-1">
            <div className="w-7 h-0.5 bg-[#14120F]" />
            <div className="w-1 h-1 rounded-full bg-accent" />
          </div>
        </div>
        {/* Turbo Button & Keylock */}
        <div className="flex items-center justify-between px-1 text-[5.5px] font-mono text-[#5C5243]">
          <span className="font-bold">TURBO 66MHz</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        </div>
      </div>

      {/* Right Under-Desk Red Mini-UPS & Teal Server Cabinet */}
      <div className="absolute top-[60%] left-[62.5%] w-[15%] h-[18%] flex items-end justify-between z-15 pointer-events-none">
        {/* Red Mini-UPS */}
        <div className="w-10 h-16 bg-[#A82828] rounded-[2px] border border-[#751B1B] shadow-lg p-1 flex flex-col justify-between">
          <div className="w-full h-1 bg-[#4A1010]" />
          <div className="text-[5.5px] font-mono text-white text-center font-bold">UPS 1200</div>
          <div className="flex justify-around">
            <span className="w-1 h-1 rounded-full bg-accent" />
            <span className="w-1 h-1 rounded-full bg-[#F5B041]" />
          </div>
        </div>
        {/* Teal Industrial Server Cabinet */}
        <div className="w-16 h-22 bg-[#1B3E42] rounded-[2px] border-2 border-[#122A2D] shadow-xl p-1 flex flex-col justify-between">
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full h-1 bg-[#102427] rounded-xs" />
            ))}
          </div>
          <div className="flex items-center justify-between px-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[5.5px] font-mono text-[#82D9B5]">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Draped Black Equipment Cables */}
      <svg viewBox="0 0 500 100" className="absolute top-[58%] left-[25%] w-[50%] h-[16%] pointer-events-none z-16" fill="none">
        <path d="M20,10 Q60,80 120,40 Q180,90 260,30 Q340,95 440,20" stroke="#0E0C11" strokeWidth="2.5" />
        <path d="M50,15 Q90,70 160,50 Q230,85 320,35 Q400,85 480,30" stroke="#16131A" strokeWidth="2" />
      </svg>

      {/* ========================================================================= */}
      {/* 6. LAYER 5: MASTER CONTINUOUS WORKBENCH & APRON FASCIA                    */}
      {/* ========================================================================= */}
      {/* Solid Wooden Tabletop Slab (Runs from 19% to 81%) */}
      <div className="absolute top-[47.5%] left-[19%] w-[62.5%] h-[5.5%] bg-[#3D2B1F] rounded-t border-t-2 border-[#543D2D] shadow-2xl z-30 pointer-events-none">
        <div className="w-full h-1 bg-[#5C4230] opacity-80" />
      </div>

      {/* Equipment Apron Fascia with Switches, Jacks, and Status LEDs */}
      <div className="absolute top-[52.8%] left-[19.5%] w-[61.5%] h-[6.8%] bg-[#1A181C] rounded-b border-b-2 border-x-2 border-[#2E2833] shadow-md z-30 flex items-center justify-between px-3 text-[7px] font-mono text-fg-subtle pointer-events-none">
        {/* Left Apron Console */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#E6A15C]" />
          </div>
          <span className="hidden sm:inline">TTY-BUS // OK</span>
        </div>
        {/* Center Legroom Open Indicator */}
        <div className="w-32 h-1 bg-[#0F0E11] rounded-full mx-auto" />
        {/* Right Apron Console */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full border border-[#443850] flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#73B7FF]" />
          </div>
          <span className="hidden sm:inline">240V STABLE</span>
        </div>
      </div>

      {/* Left Desk: Retro Clamshell Laptop Station */}
      <div
        className="absolute top-[39%] left-[23.5%] w-[11.5%] h-[12%] cursor-pointer group z-35"
        onClick={onLaptopClick}
        title="Retro Laptop Workstation (Click to type)"
      >
        {/* Laptop Screen Lid */}
        <div className="w-full h-[62%] bg-[#181D26] rounded-t border-2 border-[#2F394A] p-0.5 shadow-lg group-hover:border-accent transition-colors flex flex-col justify-between">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[5px] font-mono text-accent">[H-PAD]</span>
            <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
          </div>
          <div className="bg-[#090C12] rounded-[1px] p-0.5 h-[70%] font-mono text-[5px] text-[#73B7FF] leading-none overflow-hidden">
            <div>$ ./route_sim</div>
            <div className="text-accent">&gt; 128 pkts [OK]</div>
          </div>
        </div>
        {/* Laptop Base Keyboard Deck */}
        <div className="w-full h-[38%] bg-[#1E2530] rounded-b border-2 border-t-0 border-[#2F394A] flex items-center justify-center relative">
          <div className="w-8 h-2 bg-[#2E3748] rounded-[1px]" />
          {/* Red TrackPoint Nub */}
          <div className="w-1 h-1 rounded-full bg-[#E53935] absolute top-1 left-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Center Desk: Interactive CRT Monitor */}
      <div
        className="absolute top-[31%] left-[43%] w-[14%] h-[20%] cursor-pointer z-40 group"
        onClick={onMonitorClick}
        title="Interactive CRT Monitor (Click to watch & cycle modes)"
      >
        <CRTMonitor
          onActivity={() => {}}
          onSelectProject={onSelectProject}
          className="w-full h-full scale-[0.82] sm:scale-100 origin-bottom"
        />
      </div>

      {/* Right Desk: Secondary Audio / Manga Screen */}
      <div
        className="absolute top-[38%] left-[59.5%] w-[12.5%] h-[13.5%] bg-[#151922] rounded border-2 border-[#2D384C] shadow-xl p-1 z-35 flex flex-col justify-between cursor-pointer group"
        onClick={onMonitorClick}
        title="Secondary Manga & Audio Console (Click to cycle manga)"
      >
        <div className="bg-[#080B10] rounded-[1px] h-[75%] p-1 flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="text-[7px] font-mono font-bold text-[#FBBF24] tracking-wider uppercase">
            {activeManga.replace('-', ' ')}
          </div>
          <div className="text-[5.5px] font-mono text-accent-cream opacity-80 mt-0.5">
            {activeManga === 'one-piece'
              ? 'GEAR 5 // SUN GOD NIKA'
              : activeManga === 'naruto'
              ? 'WILL OF FIRE // SAGE'
              : activeManga === 'bleach'
              ? 'BANKAI // SOUL SOCIETY'
              : activeManga === 'black-clover'
              ? 'ANTI-MAGIC // 5-LEAF'
              : 'SERIOUS PUNCH // SAITAMA'}
          </div>
        </div>
        {/* VU Audio Levels */}
        <div className="flex items-center justify-between px-1">
          <div className="flex gap-0.5">
            <div className="w-1 h-1.5 bg-accent" />
            <div className="w-1 h-2 bg-accent" />
            <div className="w-1 h-2.5 bg-[#E6A15C]" />
            <div className="w-1 h-1.5 bg-[#E53935]" />
          </div>
          <span className="text-[5.5px] font-mono text-fg-subtle">VOL 72%</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. LAYER 6: FOREGROUND LARGE CRIMSON WOVEN RUG                            */}
      {/* ========================================================================= */}
      <div className="absolute top-[78%] left-[23%] w-[56%] h-[16%] pointer-events-none z-20">
        <div className="relative w-full h-full bg-[#8E2838] rounded-lg border-2 border-[#541822] shadow-2xl p-1 flex flex-col justify-between overflow-hidden">
          {/* Top Fringe Pattern */}
          <div className="flex justify-around items-center h-1 opacity-70">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-[#D6AE62]" />
            ))}
          </div>
          {/* Bohemian Diamond Pattern */}
          <div className="flex items-center justify-around px-2 py-0.5 opacity-90">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-4 h-4 border border-[#D6AE62] rotate-45 bg-[#661D28] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#F4DDB8] rotate-45" />
              </div>
            ))}
          </div>
          {/* Bottom Fringe Pattern */}
          <div className="flex justify-around items-center h-1 opacity-70">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-[#D6AE62]" />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. LAYER 7: RIGHT FOREGROUND PLUSH ARMCHAIR & SLEEPING CAT               */}
      {/* ========================================================================= */}
      <div
        className="absolute top-[65%] right-[0.5%] w-[18.5%] h-[32%] z-50 cursor-pointer group select-none"
        onClick={onCatClick}
        title="Sleeping Cat Mascot (Click to pet!)"
      >
        {/* Retro Corduroy Armchair SVG */}
        <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-2xl overflow-visible" shapeRendering="crispEdges">
          {/* Armchair Backrest */}
          <rect x="15" y="10" width="70" height="35" fill="#3D324F" rx="3" />
          <rect x="18" y="13" width="64" height="29" fill="#4E4065" rx="2" />
          {/* Corduroy Stitching Lines */}
          <line x1="34" y1="13" x2="34" y2="42" stroke="#342A43" strokeWidth="1.5" />
          <line x1="50" y1="13" x2="50" y2="42" stroke="#342A43" strokeWidth="1.5" />
          <line x1="66" y1="13" x2="66" y2="42" stroke="#342A43" strokeWidth="1.5" />

          {/* Left Armrest */}
          <rect x="5" y="32" width="16" height="38" fill="#342A43" rx="2" />
          <rect x="7" y="34" width="12" height="34" fill="#4E4065" rx="1.5" />

          {/* Right Armrest */}
          <rect x="79" y="32" width="16" height="38" fill="#342A43" rx="2" />
          <rect x="81" y="34" width="12" height="34" fill="#4E4065" rx="1.5" />

          {/* Seat Cushion Base */}
          <rect x="19" y="44" width="62" height="22" fill="#342A43" rx="2" />
          <rect x="21" y="45" width="58" height="19" fill="#584972" rx="1.5" />

          {/* Wooden Legs */}
          <rect x="14" y="68" width="5" height="10" fill="#241710" />
          <rect x="81" y="68" width="5" height="10" fill="#241710" />
        </svg>

        {/* Sleeping Calico Cat nestled on the armchair seat */}
        <div className="absolute top-[28%] left-[28%] w-[50%] h-[40%] pointer-events-none">
          <svg viewBox="0 0 60 40" className="w-full h-full overflow-visible" shapeRendering="crispEdges">
            {/* Curled Body with subtle breathing animation */}
            <g className="animate-pulse" style={{ animationDuration: '3.6s' }}>
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
              <path d="M15,19 Q17,21 19,19" stroke="#5D4037" strokeWidth="1" fill="none" />
              <polygon points="19,21 18,20 20,20" fill="#F1948A" />

              {/* Tail */}
              <path d="M43,24 Q48,20 45,15" stroke="#E67E22" strokeWidth="3" strokeLinecap="round" fill="none" />
              <circle cx="45" cy="15" r="1.8" fill="#FFFFFF" />
            </g>
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. LAYER 8: DYNAMIC SPATIAL MOVING AVATAR STAGE                           */}
      {/* ========================================================================= */}
      <div
        className="absolute pointer-events-none transition-all ease-in-out"
        style={{
          left: `${coords.x}%`,
          bottom: `${coords.bottom}%`,
          zIndex: currentHotspot.zIndex,
          transform: 'translate(-50%, 0)',
          transitionDuration: `${transitDuration}ms`,
          transitionProperty: 'left, bottom',
        }}
      >
        <div className="pointer-events-auto">
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
      {/* 10. LAYER 9: 2 AM AMBIENT LIGHTING SHADOW & LAMP CONE                     */}
      {/* ========================================================================= */}
      <div
        className="absolute inset-0 pointer-events-none z-45 transition-opacity duration-700"
        style={{
          background: lampOn
            ? 'radial-gradient(ellipse at 48% 60%, rgba(230, 161, 92, 0.16) 0%, rgba(11, 14, 20, 0.35) 68%, rgba(5, 7, 10, 0.72) 100%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(168, 214, 114, 0.06) 0%, rgba(6, 8, 12, 0.78) 65%, rgba(2, 3, 5, 0.92) 100%)',
        }}
      />
    </div>
  );
};
