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
  const [hoveredBookInfo, setHoveredBookInfo] = useState<{ book: ReadingItem; shelfIdx: number } | null>(null);

  // Group books logically for shelves
  const shelf1Books = books.slice(0, 5); // Shonen Manga: One Piece, Naruto, Bleach, Black Clover, OPM
  const shelf2Books = [books[7], books[8], books[9], books[10]].filter(Boolean); // Seinen Masterpieces: Berserk, Vagabond, Monster, Vinland
  const shelf3Books = [books[5], books[6], books[11], books[12]].filter(Boolean); // Systems & Tech: SICP, Networks, DDIA, OSTEP
  const shelf4Manuals: ReadingItem[] = [
    {
      title: 'UNIX Systems Architecture & Internals',
      author: 'Bell Labs / Huzbi',
      type: 'tech',
      status: 'completed',
      note: 'Kernel primitives, virtual memory, process trees, and IPC mechanisms.',
    },
    {
      title: 'TCP/IP Illustrated: The Protocols',
      author: 'W. Richard Stevens',
      type: 'tech',
      status: 'completed',
      note: 'The packet bible: TCP handshakes, sliding windows, congestion control, and routing topologies.',
    },
    {
      title: 'Huzbi Labs System Binder',
      author: 'Huzbi',
      type: 'tech',
      status: 'reading',
      note: 'Personal lab notes on distributed systems, routing simulations, and compilers.',
    },
  ];

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
        className={`absolute top-[6%] right-[1.5%] w-[15.5%] h-[67%] bg-[#241A14] rounded-t border-t-4 border-l-4 border-r-2 border-[#3D2C22] shadow-2xl p-1.5 flex flex-col justify-between transition-all ${
          hoveredBookInfo ? 'z-50' : 'z-30'
        }`}
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

        {/* 4 Densely Packed Shelves with Authentic Book Spines */}
        <div className="flex-1 flex flex-col justify-between py-1 space-y-1">
          {/* SHELF 1: Shonen Manga Collection (One Piece, Naruto, Bleach, Black Clover, OPM) */}
          <div className="border-b-2 border-[#3D2C22] pb-0.5 flex items-end justify-start gap-1 h-[23%] px-0.5 overflow-hidden">
            {shelf1Books.map((b, idx) => {
              const mangaSpines = [
                { base: '#991B1B', gold: '#FBBF24', width: '19%', height: '88%', label: 'OP', code: '105', tilt: 'hover:-translate-y-1' },
                { base: '#C2410C', gold: '#FEF08A', width: '18%', height: '84%', label: 'NAR', code: '72', tilt: 'hover:-translate-y-1 rotate-1 origin-bottom' },
                { base: '#111827', gold: '#E5E7EB', width: '19%', height: '87%', label: 'BLC', code: '74', tilt: 'hover:-translate-y-1' },
                { base: '#166534', gold: '#BBF7D0', width: '18%', height: '83%', label: 'BC', code: '35', tilt: 'hover:-translate-y-1 -rotate-1 origin-bottom' },
                { base: '#A16207', gold: '#FEF9C3', width: '18%', height: '85%', label: 'OPM', code: '28', tilt: 'hover:-translate-y-1' },
              ];
              const spine = mangaSpines[idx % mangaSpines.length];
              return (
                <button
                  key={b.title}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onBookshelfClick) onBookshelfClick(b);
                  }}
                  onMouseEnter={() => setHoveredBookInfo({ book: b, shelfIdx: 0 })}
                  onMouseLeave={() => setHoveredBookInfo(null)}
                  className={`rounded-t-[2px] transition-transform flex flex-col justify-between items-center py-0.5 px-0.5 cursor-pointer border border-black/50 select-none shrink-0 relative ${spine.tilt}`}
                  style={{
                    width: spine.width,
                    height: `${spine.height}`,
                    backgroundColor: spine.base,
                    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 25%, rgba(0,0,0,0.12) 75%, rgba(0,0,0,0.45) 100%)',
                    boxShadow: 'inset 1px 0 1px rgba(255,255,255,0.3), inset -1.5px 0 1.5px rgba(0,0,0,0.6), 1px 1px 2px rgba(0,0,0,0.4)',
                  }}
                  title={`${b.title} (${b.author})`}
                >
                  {/* Spine Crease / Gutter Groove Line */}
                  <div className="absolute left-[1.5px] top-0 bottom-0 w-[0.5px] bg-black/40 pointer-events-none" />

                  {/* Top Cream Paper Block Rims */}
                  <div className="w-[85%] h-[1px] bg-[#FAF0DC] rounded-t-[0.5px] opacity-90 mx-auto" />

                  {/* Top Cloth Headband */}
                  <div className="w-full h-[1.5px] bg-[#D4AF37] opacity-90 rounded-t-[1px]" />
                  
                  {/* Upper Title Simulation Marks */}
                  <div className="w-full flex flex-col items-center gap-[1px] my-0.5">
                    <div className="w-2.5 h-[1px] bg-white/80" />
                    <div className="w-3.5 h-[1px] bg-white/80" />
                    <div className="w-2 h-[1px] bg-white/70" />
                  </div>

                  {/* Horizontal Raised Spine Rib */}
                  <div className="w-full h-[1px] bg-white/25 border-b border-black/40 my-0.5" />

                  {/* Volume Number Circular Emblem */}
                  <div className="w-3 h-3 rounded-full bg-black/50 border border-white/40 flex items-center justify-center text-[5.5px] font-mono text-white font-bold leading-none">
                    {spine.code}
                  </div>

                  {/* Bottom Cloth Tailband */}
                  <div className="w-full h-[1.5px] bg-[#D4AF37] opacity-90 rounded-b-[1px]" />

                  {/* Silky Red Ribbon Bookmark dangling onto shelf (Volume 1) */}
                  {idx === 0 && (
                    <div className="w-[1.5px] h-2 bg-[#DC2626] -bottom-1 absolute left-1.5 z-20 shadow-sm rounded-b-xs pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* SHELF 2: Seinen / Dark Fantasy Hardcovers + Horizontal Stack */}
          <div className="border-b-2 border-[#3D2C22] pb-0.5 flex items-end justify-start gap-1 h-[23%] px-0.5 overflow-hidden">
            {shelf2Books.map((b, idx) => {
              const seinenSpines = [
                { base: '#4C0519', gold: '#FBBF24', width: '22%', height: '92%', badge: '✦' }, // Berserk Deluxe
                { base: '#143823', gold: '#86EFAC', width: '18%', height: '86%', badge: '剣' }, // Vagabond
                { base: '#3B0764', gold: '#E9D5FF', width: '18%', height: '88%', badge: '●' }, // Monster
                { base: '#1E293B', gold: '#93C5FD', width: '18%', height: '85%', badge: 'ᚱ' }, // Vinland
              ];
              const spine = seinenSpines[idx % seinenSpines.length];
              return (
                <button
                  key={b.title}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onBookshelfClick) onBookshelfClick(b);
                  }}
                  onMouseEnter={() => setHoveredBookInfo({ book: b, shelfIdx: 1 })}
                  onMouseLeave={() => setHoveredBookInfo(null)}
                  className="rounded-t-[2px] transition-transform hover:-translate-y-1 flex flex-col justify-between items-center py-0.5 px-0.5 cursor-pointer border border-black/60 select-none shrink-0 relative"
                  style={{
                    width: spine.width,
                    height: `${spine.height}`,
                    backgroundColor: spine.base,
                    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 30%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.5) 100%)',
                    boxShadow: 'inset 1px 0 1px rgba(255,255,255,0.25), inset -1.5px 0 2px rgba(0,0,0,0.65), 1px 1px 3px rgba(0,0,0,0.4)',
                  }}
                  title={`${b.title} (${b.author})`}
                >
                  {/* Spine Crease / Gutter Groove Line */}
                  <div className="absolute left-[1.5px] top-0 bottom-0 w-[0.5px] bg-black/40 pointer-events-none" />

                  {/* Top Cream Paper Block Rims */}
                  <div className="w-[85%] h-[1px] bg-[#FAF0DC] rounded-t-[0.5px] opacity-90 mx-auto" />

                  {/* Top Headband */}
                  <div className="w-full h-[1.5px] bg-[#E5E7EB]/80 rounded-t-[1px]" />

                  {/* Gold Title Stamping */}
                  <div className="w-full flex flex-col items-center gap-[1px] my-0.5">
                    <div className="w-3 h-[1px] bg-[#FBBF24]/90" />
                    <div className="w-2 h-[1px] bg-[#FBBF24]/80" />
                  </div>

                  {/* Raised Ribs */}
                  <div className="w-full space-y-[2px] my-0.5">
                    <div className="w-full h-[1px] bg-white/20 border-b border-black/50" />
                    <div className="w-full h-[1px] bg-white/20 border-b border-black/50" />
                  </div>

                  {/* Emblem */}
                  <span className="text-[6px] font-mono text-[#FBBF24] leading-none font-bold">
                    {spine.badge}
                  </span>

                  {/* Tailband */}
                  <div className="w-full h-[1.5px] bg-[#E5E7EB]/80 rounded-b-[1px]" />

                  {/* Gold Bookmark Ribbon (Berserk) */}
                  {idx === 0 && (
                    <div className="w-[1.5px] h-2.5 bg-[#FBBF24] -bottom-1.5 absolute left-1.5 z-20 shadow-sm rounded-b-xs pointer-events-none" />
                  )}
                </button>
              );
            })}

            {/* Horizontal Book Stack with Cream Page Edges */}
            <div className="w-[18%] h-[50%] flex flex-col justify-end gap-[1.5px] mb-0.5 shrink-0">
              <div className="w-full h-[30%] bg-[#78350F] rounded-t-[1px] border border-black/50 flex justify-between px-0.5 items-center">
                <div className="w-1.5 h-[1px] bg-white/60" />
                <div className="w-2 h-full bg-[#FAF0DC] rounded-r-xs" />
              </div>
              <div className="w-full h-[30%] bg-[#1E3A5F] border border-black/50 flex justify-between px-0.5 items-center">
                <div className="w-1.5 h-[1px] bg-white/60" />
                <div className="w-2 h-full bg-[#FAF0DC] rounded-r-xs" />
              </div>
              <div className="w-full h-[30%] bg-[#581C87] rounded-b-[1px] border border-black/50 flex justify-between px-0.5 items-center">
                <div className="w-1.5 h-[1px] bg-white/60" />
                <div className="w-2 h-full bg-[#FAF0DC] rounded-r-xs" />
              </div>
            </div>
          </div>

          {/* SHELF 3: Heavy Computer Science & Systems Volumes (SICP, DDIA, Networks, OSTEP) */}
          <div className="border-b-2 border-[#3D2C22] pb-0.5 flex items-end justify-start gap-1 h-[23%] px-0.5 overflow-hidden">
            {shelf3Books.map((b, idx) => {
              const techSpines = [
                { base: '#312E81', gold: '#FDE047', width: '24%', height: '93%', tag: 'SICP' }, // Wizard Tome
                { base: '#1E3A8A', gold: '#93C5FD', width: '22%', height: '89%', tag: 'NET' },
                { base: '#7F1D1D', gold: '#FCA5A5', width: '23%', height: '91%', tag: 'DDIA' },
                { base: '#115E59', gold: '#99F6E4', width: '20%', height: '87%', tag: 'OS' },
              ];
              const spine = techSpines[idx % techSpines.length];
              return (
                <button
                  key={b.title}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onBookshelfClick) onBookshelfClick(b);
                  }}
                  onMouseEnter={() => setHoveredBookInfo({ book: b, shelfIdx: 2 })}
                  onMouseLeave={() => setHoveredBookInfo(null)}
                  className="rounded-t-[2px] transition-transform hover:-translate-y-1 flex flex-col justify-between items-center py-0.5 px-0.5 cursor-pointer border border-black/60 select-none shrink-0 relative"
                  style={{
                    width: spine.width,
                    height: `${spine.height}`,
                    backgroundColor: spine.base,
                    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.06) 25%, rgba(0,0,0,0.12) 75%, rgba(0,0,0,0.5) 100%)',
                    boxShadow: 'inset 1px 0 1px rgba(255,255,255,0.25), inset -1.5px 0 2px rgba(0,0,0,0.6), 1px 1px 3px rgba(0,0,0,0.4)',
                  }}
                  title={`${b.title} (${b.author})`}
                >
                  {/* Spine Crease / Gutter Groove Line */}
                  <div className="absolute left-[1.5px] top-0 bottom-0 w-[0.5px] bg-black/40 pointer-events-none" />

                  {/* Top Cream Paper Block Rims */}
                  <div className="w-[85%] h-[1px] bg-[#FAF0DC] rounded-t-[0.5px] opacity-90 mx-auto" />

                  {/* Top Gold Headband */}
                  <div className="w-full h-[1.5px] bg-[#D4AF37] rounded-t-[1px]" />

                  {/* Gold Embossed Spine Box */}
                  <div className="w-full bg-black/40 border border-white/20 py-0.5 flex flex-col items-center justify-center my-0.5">
                    <span className="text-[5px] font-mono font-bold text-white tracking-widest leading-none">
                      {spine.tag}
                    </span>
                  </div>

                  {/* 3 Raised Horizontal Bands */}
                  <div className="w-full space-y-[2px]">
                    <div className="w-full h-[1px] bg-white/20 border-b border-black/50" />
                    <div className="w-full h-[1px] bg-white/20 border-b border-black/50" />
                  </div>

                  {/* Publisher Foil Dot */}
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/90 my-0.5 shadow-sm" />

                  {/* Bottom Gold Tailband */}
                  <div className="w-full h-[1.5px] bg-[#D4AF37] rounded-b-[1px]" />
                </button>
              );
            })}

            {/* Brass Bookend */}
            <div className="w-2 h-[55%] border-r-2 border-b-2 border-[#D4AF37] bg-[#78350F]/40 rounded-br-xs self-end mb-0.5 ml-auto" />
          </div>

          {/* SHELF 4: Storage Binders, Boxes & Retro Cartridges */}
          <div className="pb-0.5 flex items-end justify-between h-[23%] px-1">
            {/* Storage Box */}
            <div className="w-[30%] h-[75%] bg-[#384C32] rounded-[1px] border border-[#243320] flex items-center justify-center">
              <div className="w-3 h-1 bg-[#1C2618] rounded-xs" />
            </div>

            {/* Leaning Manual 1: UNIX Systems Architecture */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onBookshelfClick) onBookshelfClick(shelf4Manuals[0]);
              }}
              onMouseEnter={() => setHoveredBookInfo({ book: shelf4Manuals[0], shelfIdx: 3 })}
              onMouseLeave={() => setHoveredBookInfo(null)}
              className="w-[18%] h-[82%] bg-[#4A3B69] rounded-t-[1px] border border-black/40 -rotate-12 origin-bottom-left flex justify-end cursor-pointer hover:scale-105 transition-transform select-none"
              title={`${shelf4Manuals[0].title} (${shelf4Manuals[0].author})`}
            >
              <div className="w-[3px] h-full bg-[#FAF0DC] rounded-r-xs" />
            </button>

            {/* Leaning Manual 2: TCP/IP Illustrated */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onBookshelfClick) onBookshelfClick(shelf4Manuals[1]);
              }}
              onMouseEnter={() => setHoveredBookInfo({ book: shelf4Manuals[1], shelfIdx: 3 })}
              onMouseLeave={() => setHoveredBookInfo(null)}
              className="w-[18%] h-[82%] bg-[#2E3748] rounded-t-[1px] border border-black/40 -rotate-6 origin-bottom-left flex justify-end cursor-pointer hover:scale-105 transition-transform select-none"
              title={`${shelf4Manuals[1].title} (${shelf4Manuals[1].author})`}
            >
              <div className="w-[3px] h-full bg-[#FAF0DC] rounded-r-xs" />
            </button>

            {/* Thick Blue Binder: Huzbi Labs System Binder */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onBookshelfClick) onBookshelfClick(shelf4Manuals[2]);
              }}
              onMouseEnter={() => setHoveredBookInfo({ book: shelf4Manuals[2], shelfIdx: 3 })}
              onMouseLeave={() => setHoveredBookInfo(null)}
              className="w-[24%] h-[90%] bg-[#1A365D] rounded-t-[1px] border border-black/40 flex flex-col justify-between py-0.5 cursor-pointer hover:scale-105 transition-transform select-none"
              title={`${shelf4Manuals[2].title} (${shelf4Manuals[2].author})`}
            >
              <div className="w-full h-1 bg-white/50" />
              <div className="w-2.5 h-1.5 bg-white/30 mx-auto" />
            </button>
          </div>
        </div>

        {/* Hovered Book Tooltip with Dynamic Shelf-Relative Alignment */}
        {hoveredBookInfo && (
          <div
            className="absolute right-full mr-2.5 bg-[#0B0E14] border-2 border-accent p-2.5 rounded-lg shadow-[0_12px_36px_rgba(0,0,0,0.95)] z-50 pointer-events-none w-52 text-[10px] font-mono transition-all duration-150"
            style={{
              top:
                hoveredBookInfo.shelfIdx === 0
                  ? '7%'
                  : hoveredBookInfo.shelfIdx === 1
                  ? '29%'
                  : hoveredBookInfo.shelfIdx === 2
                  ? '52%'
                  : '74%',
            }}
          >
            {/* Pointer arrow pointing directly towards the hovered shelf */}
            <div className="absolute -right-1.5 top-3 w-3 h-3 border-t-2 border-r-2 border-accent bg-[#0B0E14] rotate-45" />
            <p className="text-accent font-bold truncate">{hoveredBookInfo.book.title}</p>
            <p className="text-fg-muted text-[9px]">{hoveredBookInfo.book.author}</p>
            <p className="text-fg-subtle text-[8.5px] mt-1 line-clamp-2">&ldquo;{hoveredBookInfo.book.note}&rdquo;</p>
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
      {/* 7. LAYER 6: ON-DESK EQUIPMENT (ALL ANCHORED ON TOP OF DESK SLAB: bottom: 52%, z-40) */}
      {/* ========================================================================= */}
      {/* 1. Left Desk: Authentic Retro Clamshell Laptop Station (IBM ThinkPad / Retro 90s Style) */}
      <div
        className="absolute cursor-pointer group z-40 select-none"
        style={{
          bottom: '52%',
          left: '22%',
          width: '15.5%',
          height: '18%',
        }}
        onClick={onLaptopClick}
        title="Retro Laptop Workstation (Click to type!)"
      >
        {/* Tilted Open Screen Lid (3/4 Clamshell Perspective) */}
        <div className="w-full h-[58%] bg-[#1A1F29] rounded-t-sm border-2 border-b-0 border-[#2D3645] shadow-xl p-1 flex flex-col justify-between group-hover:border-accent transition-colors relative overflow-hidden">
          {/* Bevel Highlight & ThinkPad RGB Badge */}
          <div className="flex justify-between items-center px-0.5">
            <div className="flex items-center gap-1">
              {/* IBM-style 3-stripe color logo */}
              <div className="flex gap-[1px]">
                <div className="w-1 h-1 bg-[#EF4444] rounded-[0.5px]" />
                <div className="w-1 h-1 bg-[#22C55E] rounded-[0.5px]" />
                <div className="w-1 h-1 bg-[#3B82F6] rounded-[0.5px]" />
              </div>
              <span className="text-[5.5px] font-mono font-bold text-accent tracking-tighter">[H-PAD 90]</span>
            </div>
            {/* Top ThinkLight / Webcam Dot & Latch */}
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
              <div className="w-2 h-0.5 bg-[#4A5568] rounded-xs" />
            </div>
          </div>

          {/* High-Contrast Phosphor Screen with Glowing Terminal Output */}
          <div className="relative bg-[#070D18] rounded-[1px] p-1 h-[68%] font-mono text-[5.5px] leading-tight overflow-hidden border border-black/60 shadow-[inset_0_0_8px_rgba(0,0,0,0.9)]">
            {/* Glare Reflection Strip */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 45%)',
              }}
            />
            <div className="text-[#38BDF8] flex items-center gap-1">
              <span>$ ./route_sim</span>
              <span className="text-[4.5px] bg-[#1E293B] px-0.5 text-accent rounded-xs">v2.1</span>
            </div>
            <div className="text-accent">&gt; 128 pkts [OK]</div>
            <div className="text-[#94A3B8] text-[4.5px] truncate">&gt; sys: fast-nuces/karachi</div>
          </div>
        </div>

        {/* Dual Heavy-Duty Cylindrical Metal Hinges */}
        <div className="w-full h-1 bg-[#10141C] flex justify-between px-3 relative z-10">
          <div className="w-3.5 h-1.5 -top-0.5 relative bg-[#475569] rounded-xs border border-[#1E293B]" />
          <div className="w-3.5 h-1.5 -top-0.5 relative bg-[#475569] rounded-xs border border-[#1E293B]" />
        </div>

        {/* Projected Keyboard Deck Lying Flat in Perspective on Desk Surface */}
        <div className="w-full h-[40%] bg-gradient-to-b from-[#242C3B] to-[#181E29] rounded-b-sm border-2 border-[#2D3645] border-t-0 p-1 flex flex-col justify-between shadow-2xl relative">
          {/* Recessed Keyboard Well with Staggered Key Rows */}
          <div className="bg-[#10141C] rounded-[1px] p-0.5 border border-[#2B3545] shadow-inner space-y-[1px]">
            {/* Row 1: Function / Number keys */}
            <div className="flex justify-between gap-[1px]">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-[#1E2533] border-b border-black rounded-[0.5px]" />
              ))}
            </div>
            {/* Row 2: QWERTY Keys with Red TrackPoint Nub in Center */}
            <div className="flex justify-between items-center gap-[1px] relative">
              <div className="w-[42%] h-1 bg-[#1E2533] border-b border-black rounded-[0.5px]" />
              {/* Iconic Red TrackPoint Nub */}
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shadow-[0_0_2px_#EF4444] shrink-0 mx-[1px]" title="TrackPoint" />
              <div className="w-[42%] h-1 bg-[#1E2533] border-b border-black rounded-[0.5px]" />
            </div>
            {/* Row 3: Spacebar & Dual Click Buttons with Blue/Red Trim */}
            <div className="flex justify-center items-center gap-1 pt-[0.5px]">
              <div className="w-7 h-1 bg-[#283244] border-b border-black rounded-[0.5px]" />
              <div className="flex gap-[1px]">
                <div className="w-2 h-1 bg-[#1E2533] border-t border-[#3B82F6] rounded-[0.5px]" />
                <div className="w-2 h-1 bg-[#1E2533] border-t border-[#EF4444] rounded-[0.5px]" />
              </div>
            </div>
          </div>

          {/* Palm Rest, Status LEDs & Touchpad */}
          <div className="flex items-center justify-between px-1 text-[4.5px] font-mono">
            {/* Intel/OS Badge */}
            <div className="w-2.5 h-1.5 bg-[#2563EB] rounded-[0.5px] text-[3.5px] text-white flex items-center justify-center font-bold">
              SYS
            </div>
            {/* Centered Miniature Touchpad */}
            <div className="w-5 h-1.5 bg-[#171C26] rounded-[0.5px] border border-[#2F3B4E]" />
            {/* Status LEDs (Power, Amber Battery, Blinking Green Disk I/O) */}
            <div className="flex gap-1 items-center">
              <span className="w-1 h-1 rounded-full bg-accent" />
              <span className="w-1 h-1 rounded-full bg-[#F59E0B]" />
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
            </div>
          </div>
        </div>

        {/* Retro Optical Mouse & Coiled Wire Beside Laptop */}
        <div className="absolute -right-3.5 bottom-0 flex flex-col items-center">
          {/* Mousepad Base */}
          <div className="w-3.5 h-4.5 bg-[#0F172A] rounded-sm border border-[#334155] flex flex-col items-center justify-center p-0.5 shadow-sm">
            {/* Retro 2-Button Mouse with Scroll Wheel */}
            <div className="w-2.5 h-3.5 bg-[#475569] rounded-t-sm rounded-b-[1px] border border-[#1E293B] relative shadow-sm flex flex-col justify-between items-center py-[1px]">
              {/* Split Buttons & Scroll Wheel */}
              <div className="w-full flex justify-between px-[1px] gap-[0.5px]">
                <div className="w-1 h-1 bg-[#334155] rounded-tl-xs" />
                <div className="w-0.5 h-1 bg-[#0F172A]" />
                <div className="w-1 h-1 bg-[#334155] rounded-tr-xs" />
              </div>
              {/* Red Optical Glow Underneath */}
              <div className="w-1 h-0.5 bg-[#EF4444] rounded-full shadow-[0_0_2px_#EF4444]" />
            </div>
          </div>
          {/* Fine Coiled Wire Curling to Laptop Side Port */}
          <svg viewBox="0 0 20 15" className="w-3 h-2 -mt-1 overflow-visible" fill="none">
            <path d="M5,15 Q2,8 0,3" stroke="#1E293B" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Steaming Mug of Chai on Desk */}
      <div
        className="absolute z-40 pointer-events-none"
        style={{
          bottom: '52%',
          left: '38.5%',
          width: '14px',
          height: '18px',
        }}
      >
        <div className="w-full h-3.5 bg-[#D97706] rounded-b-sm border border-[#B45309] shadow-sm relative flex items-center justify-center">
          <div className="w-1.5 h-2 border-r border-t border-b border-[#B45309] absolute -right-1.5 top-0.5 rounded-r-xs" />
          <div className="w-2 h-0.5 bg-[#78350F] rounded-full" />
        </div>
        {/* Steam Animation */}
        <div className="w-1.5 h-2.5 -mt-1 mx-auto bg-white/40 rounded-full animate-bounce" style={{ animationDuration: '2.2s' }} />
      </div>

      {/* 2. Center-Left Desk: Interactive Retro CRT Monitor */}
      <div
        className="absolute z-40 cursor-pointer"
        style={{
          bottom: '52%',
          left: '41%',
          width: '17.5%',
          height: '25%',
        }}
        title="Interactive CRT Monitor (Click to watch & cycle modes)"
      >
        <CRTMonitor
          onActivity={() => {}}
          onSelectProject={onSelectProject}
          onMonitorClick={onMonitorClick}
          className="w-full h-full"
        />
      </div>

      {/* 3. Right Desk: Dedicated Retro Manga Display Terminal */}
      <div
        className="absolute z-40 select-none cursor-pointer group"
        style={{
          bottom: '52%',
          left: '59.5%',
          width: '13.5%',
          height: '18%',
        }}
        onClick={onMonitorClick}
        title="Secondary Manga Display (Click to cycle manga!)"
      >
        {/* Monitor Upper Chassis */}
        <div className="w-full h-[85%] bg-gradient-to-b from-[#252B36] to-[#181C24] rounded-t border-2 border-[#384252] group-hover:border-[#FBBF24] transition-colors shadow-2xl p-1 flex flex-col justify-between overflow-hidden">
          {/* Monitor Header Badge & Status LED */}
          <div className="flex items-center justify-between border-b border-[#2C3442] pb-0.5 px-0.5">
            <span className="text-[5.5px] font-mono text-[#FBBF24] font-bold tracking-wider">MANGA-OS // V-SYNC</span>
            <span className="w-1 h-1 rounded-full bg-[#FBBF24] animate-pulse" />
          </div>

          {/* CRT Screen Tube Displaying Unique Pixel Art Manga Badges */}
          <div className="relative bg-[#070A0F] rounded-[1px] h-[74%] p-1 flex flex-col items-center justify-between text-center overflow-hidden border border-black/70 shadow-[inset_0_0_8px_rgba(0,0,0,0.9)]">
            {/* Scanline Overlay */}
            <div className="absolute inset-0 crt-scanlines pointer-events-none opacity-30" />
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 40%)',
              }}
            />

            {/* MANGA 1: ONE PIECE */}
            {activeManga === 'one-piece' && (
              <div className="flex-1 flex flex-col items-center justify-between w-full py-0.5 relative z-10">
                {/* Straw Hat Pixel Art Icon */}
                <div className="w-7 h-4 relative flex items-center justify-center">
                  <div className="w-6 h-1 bg-[#D97706] rounded-full absolute bottom-0.5" />
                  <div className="w-4 h-2.5 bg-[#FBBF24] rounded-t-full relative">
                    <div className="w-full h-0.5 bg-[#DC2626] absolute bottom-0.5" />
                  </div>
                </div>
                <div>
                  <div className="text-[7.5px] font-mono font-bold text-[#FBBF24] tracking-wider leading-none">ONE PIECE</div>
                  <div className="text-[5px] font-mono text-[#FDE68A] mt-0.5">GEAR 5 // SUN GOD NIKA</div>
                </div>
                <div className="w-full bg-[#1E293B] rounded-xs px-1 py-[0.5px] flex justify-between text-[4.5px] font-mono text-[#94A3B8]">
                  <span className="text-[#FBBF24]">BOUNTY</span>
                  <span>3,000,000,000 ฿</span>
                </div>
              </div>
            )}

            {/* MANGA 2: NARUTO */}
            {activeManga === 'naruto' && (
              <div className="flex-1 flex flex-col items-center justify-between w-full py-0.5 relative z-10">
                {/* Konoha Spiral Headband Icon */}
                <div className="w-6 h-3 bg-[#475569] rounded-[1px] border border-[#94A3B8] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full border border-white flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-white rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="text-[7.5px] font-mono font-bold text-[#FB923C] tracking-wider leading-none">NARUTO</div>
                  <div className="text-[5px] font-mono text-[#FED7AA] mt-0.5">SAGE OF SIX PATHS</div>
                </div>
                <div className="w-full bg-[#1E293B] rounded-xs px-1 py-[0.5px] flex justify-between text-[4.5px] font-mono text-[#94A3B8]">
                  <span className="text-[#FB923C]">CHAKRA</span>
                  <span className="text-accent">100% [MAX]</span>
                </div>
              </div>
            )}

            {/* MANGA 3: BLEACH */}
            {activeManga === 'bleach' && (
              <div className="flex-1 flex flex-col items-center justify-between w-full py-0.5 relative z-10">
                {/* Hollow Mask / Crossed Blades Icon */}
                <div className="w-5 h-3 flex items-center justify-center relative">
                  <div className="w-3.5 h-3 bg-[#F1F5F9] rounded-t-md rounded-b-xs relative flex items-center justify-around px-0.5">
                    <div className="w-0.5 h-1 bg-[#DC2626]" />
                    <div className="w-0.5 h-1 bg-[#1E293B]" />
                    <div className="w-0.5 h-1 bg-[#1E293B]" />
                  </div>
                </div>
                <div>
                  <div className="text-[7.5px] font-mono font-bold text-[#F87171] tracking-wider leading-none">BLEACH</div>
                  <div className="text-[5px] font-mono text-[#C084FC] mt-0.5">BANKAI // TENSA ZANGETSU</div>
                </div>
                <div className="w-full bg-[#1E293B] rounded-xs px-1 py-[0.5px] flex justify-between text-[4.5px] font-mono text-[#94A3B8]">
                  <span className="text-[#C084FC]">REIRYOKU</span>
                  <span className="text-red-400">OVERFLOW</span>
                </div>
              </div>
            )}

            {/* MANGA 4: BLACK CLOVER */}
            {activeManga === 'black-clover' && (
              <div className="flex-1 flex flex-col items-center justify-between w-full py-0.5 relative z-10">
                {/* 5-Leaf Clover Icon */}
                <div className="w-4 h-3 flex items-center justify-center">
                  <span className="text-[9px] text-[#EF4444] leading-none">🍀</span>
                </div>
                <div>
                  <div className="text-[7.5px] font-mono font-bold text-[#EF4444] tracking-wider leading-none">BLACK CLOVER</div>
                  <div className="text-[5px] font-mono text-[#FCA5A5] mt-0.5">ANTI-MAGIC // DEVIL UNION</div>
                </div>
                <div className="w-full bg-[#1E293B] rounded-xs px-1 py-[0.5px] flex justify-between text-[4.5px] font-mono text-[#94A3B8]">
                  <span className="text-[#EF4444]">MANA</span>
                  <span>ZERO // WILL: ∞</span>
                </div>
              </div>
            )}

            {/* MANGA 5: ONE PUNCH MAN */}
            {activeManga === 'one-punch-man' && (
              <div className="flex-1 flex flex-col items-center justify-between w-full py-0.5 relative z-10">
                {/* Saitama Hero Profile / Fist Icon */}
                <div className="w-4 h-3 flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#FDE68A] rounded-full border border-[#D97706] shadow-sm" />
                </div>
                <div>
                  <div className="text-[7.5px] font-mono font-bold text-[#EAB308] tracking-wider leading-none">ONE PUNCH MAN</div>
                  <div className="text-[5px] font-mono text-[#FEF08A] mt-0.5">SERIOUS PUNCH // 100%</div>
                </div>
                <div className="w-full bg-[#1E293B] rounded-xs px-1 py-[0.5px] flex justify-between text-[4.5px] font-mono text-[#94A3B8]">
                  <span className="text-[#EF4444]">THREAT</span>
                  <span className="text-accent font-bold">GOD LEVEL</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dual Tubular Metallic Stand Legs & Flat Desk Footplate */}
        <div className="w-full h-[15%] flex flex-col items-center justify-end">
          <div className="w-8 h-2 flex justify-between px-1">
            <div className="w-1.5 h-full bg-[#64748B] border-x border-[#334155]" />
            <div className="w-1.5 h-full bg-[#64748B] border-x border-[#334155]" />
          </div>
          <div className="w-14 h-1 bg-[#475569] rounded-b-xs border border-t-0 border-[#1E293B] shadow-md" />
        </div>
      </div>

      {/* 4. Far Right Desk: Retro Hi-Fi Audio Cassette Deck D-88 */}
      <div
        className="absolute z-40 bg-[#1C2029] rounded border-2 border-[#333C4D] shadow-xl p-1.5 flex flex-col justify-between pointer-events-none select-none"
        style={{
          bottom: '52%',
          left: '73.5%',
          width: '9%',
          height: '16%',
        }}
      >
        {/* Brushed Metal Top Trim with Silk-screened Branding */}
        <div className="flex items-center justify-between border-b border-[#2C3442] pb-0.5">
          <span className="text-[5px] font-mono text-[#D4AF37] font-bold tracking-wider">HUZBI D-88</span>
          {/* Digital 7-Segment Tape Counter */}
          <div className="bg-[#0A0D13] px-1 rounded-[0.5px] border border-[#232936] text-[5px] font-mono text-[#EF4444] font-bold leading-tight">
            02:14
          </div>
        </div>

        {/* Clear Acrylic Cassette Bay Door with Rotating Spools & Magnetic Tape */}
        <div className="relative bg-[#0A0D13] rounded-[1px] p-1 border border-black/70 shadow-inner flex flex-col justify-between h-[52%]">
          {/* Cassette Tape Housing Inside Bay */}
          <div className="w-full h-full bg-[#181D26] rounded-[1px] border border-[#333C4D] p-0.5 flex flex-col justify-between">
            {/* Label Strip */}
            <div className="w-full h-1 bg-[#DC2626] rounded-[0.5px] flex items-center justify-center">
              <span className="text-[3.5px] font-mono text-white font-bold">LO-FI BEATS // 90M</span>
            </div>

            {/* Twin Geared Spools with Spinning Crossbars */}
            <div className="flex justify-around items-center py-0.5">
              <div className="w-3 h-3 rounded-full bg-[#2A3342] border border-[#4A5568] flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-spin" style={{ animationDuration: '3.5s' }} />
                <div className="w-0.5 h-0.5 rounded-full bg-[#0A0D13] absolute" />
              </div>
              {/* Visible Magnetic Tape Ribbon Bridge */}
              <div className="w-4 h-0.5 bg-[#451A03] rounded-full opacity-90" />
              <div className="w-3 h-3 rounded-full bg-[#2A3342] border border-[#4A5568] flex items-center justify-center relative">
                <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-spin" style={{ animationDuration: '3.5s' }} />
                <div className="w-0.5 h-0.5 rounded-full bg-[#0A0D13] absolute" />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Dual VU Meters & Physical Tape Transport Buttons */}
        <div className="space-y-0.5 pt-0.5">
          {/* Dual Stereo Jumping LED Ladders */}
          <div className="flex items-center justify-between bg-[#0A0D13] px-1 py-0.5 rounded-[0.5px] border border-black/50">
            <span className="text-[4px] font-mono text-[#94A3B8]">L/R</span>
            <div className="flex gap-1 items-center">
              <div className="flex gap-[0.5px] items-end h-1.5">
                <div className="w-0.5 h-1 bg-accent" />
                <div className="w-0.5 h-1 bg-accent" />
                <div className="w-0.5 h-1.5 bg-[#F59E0B] animate-pulse" />
                <div className="w-0.5 h-1.5 bg-[#EF4444]" />
              </div>
              <div className="flex gap-[0.5px] items-end h-1.5">
                <div className="w-0.5 h-1 bg-accent" />
                <div className="w-0.5 h-1 bg-accent" />
                <div className="w-0.5 h-1.5 bg-[#F59E0B]" />
                <div className="w-0.5 h-1.5 bg-[#EF4444] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Tape Controls: REC, PLAY, STOP & Headphone Jack */}
          <div className="flex justify-between items-center px-0.5">
            <div className="flex gap-[1px]">
              <div className="w-1.5 h-1 bg-[#DC2626] rounded-[0.5px]" title="REC" />
              <div className="w-1.5 h-1 bg-accent rounded-[0.5px]" title="PLAY" />
              <div className="w-1.5 h-1 bg-[#475569] rounded-[0.5px]" title="STOP" />
            </div>
            {/* Knurled Volume Potentiometer Dial */}
            <div className="w-2 h-2 rounded-full bg-[#475569] border border-[#1E293B] flex items-center justify-center relative shadow-sm">
              <div className="w-0.5 h-1 bg-white absolute top-0" />
            </div>
          </div>
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
      {/* 9. LAYER 8: RIGHT FOREGROUND COZY FLOOR CAT COUCH & SLEEPING CALICO CAT   */}
      {/* ========================================================================= */}
      <div
        className="absolute bottom-[2%] left-[76.5%] w-[20%] h-[18%] z-40 cursor-pointer group select-none"
        onClick={onCatClick}
        title="Sleeping Cat Mascot in Cat Bed (Click to pet!)"
      >
        {/* Miniature Velvet Cat Couch / Bed SVG */}
        <svg viewBox="0 0 100 65" className="w-full h-full drop-shadow-xl overflow-visible" shapeRendering="crispEdges">
          {/* Back Bolster Cushion */}
          <rect x="12" y="8" width="76" height="30" rx="6" fill="#3D2A4A" stroke="#251830" strokeWidth="2" />
          {/* Tufted Button Accents on Back Cushion */}
          <circle cx="28" cy="20" r="1.5" fill="#251830" />
          <circle cx="50" cy="18" r="1.5" fill="#251830" />
          <circle cx="72" cy="20" r="1.5" fill="#251830" />

          {/* Left Bolster Armrest */}
          <rect x="6" y="20" width="16" height="30" rx="5" fill="#4B355A" stroke="#251830" strokeWidth="1.5" />
          <rect x="8.5" y="22" width="11" height="25" rx="3.5" fill="#5F4573" />

          {/* Right Bolster Armrest */}
          <rect x="78" y="20" width="16" height="30" rx="5" fill="#4B355A" stroke="#251830" strokeWidth="1.5" />
          <rect x="80.5" y="22" width="11" height="25" rx="3.5" fill="#5F4573" />

          {/* Deep Velvet Mattress Cushion */}
          <rect x="18" y="26" width="64" height="26" rx="5" fill="#5E4373" stroke="#251830" strokeWidth="1.5" />
          <rect x="21" y="28" width="58" height="20" rx="3.5" fill="#75568F" />
          {/* Front Bolster Lip */}
          <rect x="18" y="44" width="64" height="8" rx="2" fill="#3D2A4A" stroke="#251830" strokeWidth="1" />

          {/* Miniature Wooden Bun Feet on Floor */}
          <rect x="14" y="52" width="6" height="5" rx="1.5" fill="#241710" />
          <rect x="80" y="52" width="6" height="5" rx="1.5" fill="#241710" />
        </svg>

        {/* Sleeping Calico Cat nestled snugly in the pet bed */}
        <div className="absolute top-[8%] left-[16%] w-[68%] h-[68%] pointer-events-none">
          <svg viewBox="0 0 70 45" className="w-full h-full overflow-visible" shapeRendering="geometricPrecision">
            {/* Soft Shadow on Velvet Cushion */}
            <ellipse cx="36" cy="31" rx="22" ry="7" fill="#20132B" opacity="0.45" />

            {/* Cat Main Curled Body (Loaf / Donut Pose) */}
            <ellipse cx="37" cy="24" rx="18" ry="11" fill="#E67E22" stroke="#873600" strokeWidth="1" />
            <ellipse cx="38" cy="22" rx="15" ry="8" fill="#F39C12" />

            {/* Calico Dark Amber / Chocolate Tabby Stripes on Back */}
            <path d="M44,14 Q49,16 47,21 Q42,19 44,14" fill="#6E2C00" />
            <path d="M37,13 Q41,15 40,20 Q35,18 37,13" fill="#6E2C00" />
            <path d="M30,14 Q33,15 32,19 Q28,18 30,14" fill="#BA4A00" />

            {/* Fluffy Cream / White Chest & Tummy Patch */}
            <ellipse cx="36" cy="27" rx="10" ry="5.5" fill="#FFFDF8" />

            {/* Tucked Front Paws */}
            <ellipse cx="25" cy="28" rx="3.5" ry="2.5" fill="#FFFDF8" stroke="#D5D8DC" strokeWidth="0.5" />
            <ellipse cx="29" cy="29" rx="3.5" ry="2.5" fill="#FFFDF8" stroke="#D5D8DC" strokeWidth="0.5" />
            {/* Paw Toe Pad Lines */}
            <circle cx="24" cy="28" r="0.4" fill="#F472B6" />
            <circle cx="26" cy="28" r="0.4" fill="#F472B6" />
            <circle cx="28" cy="29" r="0.4" fill="#F472B6" />
            <circle cx="30" cy="29" r="0.4" fill="#F472B6" />

            {/* Curled Fluffy Tail Wrapped Around Flank */}
            <path d="M52,25 Q60,21 57,14 Q54,11 48,13" stroke="#D35400" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M52,25 Q60,21 57,14 Q54,11 48,13" stroke="#E67E22" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            {/* White Tail Tip */}
            <circle cx="48" cy="13" r="2.2" fill="#FFFDF8" stroke="#D5D8DC" strokeWidth="0.5" />

            {/* Cat Head Nestled Peacefully on Cushion */}
            <circle cx="20" cy="22" r="8.5" fill="#E67E22" stroke="#873600" strokeWidth="1" />
            <ellipse cx="20" cy="22" rx="7" ry="6.5" fill="#F39C12" />

            {/* White Cheek / Muzzle Patches */}
            <ellipse cx="17" cy="24.5" rx="3.5" ry="3" fill="#FFFDF8" />
            <ellipse cx="22" cy="24.5" rx="3.5" ry="3" fill="#FFFDF8" />

            {/* Triangular Ears with Soft Pink Inner Pads */}
            {/* Left Ear */}
            <polygon points="12,16 15,7 19,14" fill="#D35400" stroke="#873600" strokeWidth="0.8" />
            <polygon points="13.5,15 15.5,9 18,13.5" fill="#FBCFE8" />
            {/* Right Ear */}
            <polygon points="19,14 24,7 26,16" fill="#D35400" stroke="#873600" strokeWidth="0.8" />
            <polygon points="20.5,13.5 23.5,9 25,15" fill="#FBCFE8" />

            {/* Sleeping Face Details */}
            {/* Happy Closed Curved Eyes */}
            <path d="M14.5,21 Q16.5,23.5 18.5,21" stroke="#3E2723" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            <path d="M21,21 Q23,23.5 25,21" stroke="#3E2723" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            {/* Cute Pink Triangular Nose */}
            <polygon points="20,23.8 19,22.8 21,22.8" fill="#EC407A" />
            {/* Sweet Resting Mouth */}
            <path d="M19,24.3 Q20,25.2 21,24.3" stroke="#4E342E" strokeWidth="0.8" fill="none" />

            {/* Fine Delicate White Whiskers */}
            <line x1="13.5" y1="23.5" x2="8" y2="22.5" stroke="#FFFDF8" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="13.5" y1="25" x2="8" y2="26" stroke="#FFFDF8" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="25" y1="23.5" x2="30.5" y2="22.5" stroke="#FFFDF8" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="25" y1="25" x2="30.5" y2="26" stroke="#FFFDF8" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
        </div>

        {/* Dynamic Thought / Status Bubble Over Cat: "z Z Z" when sleeping, "purr... ♥" when petted */}
        <div className="absolute -top-5 left-[32%] pointer-events-none select-none transition-all duration-200 z-50">
          {actionState === 'petting' ? (
            /* When Huzbi pets: zzz transforms into purr bubble with bounce & hearts */
            <div className="flex items-center gap-1.5 bg-[#25132A]/95 border-2 border-[#F472B6] px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(244,114,182,0.6)] animate-bounce">
              <span className="text-[8px] font-mono font-bold text-[#F472B6] leading-none tracking-wide">
                purr...
              </span>
              <span className="text-[#EC4899] text-[9px] animate-ping leading-none">♥</span>
              <span className="text-[#F472B6] text-[7.5px] leading-none">♪</span>
            </div>
          ) : (
            /* When sleeping: cute floating z Z Z bubble with thought trail dots */
            <div className="relative flex items-center gap-1 bg-[#161224]/90 border border-[#8B5CF6]/60 px-2 py-0.5 rounded-full shadow-lg">
              <div className="flex items-end gap-0.5 font-mono font-bold leading-none">
                <span className="text-[7px] text-[#A78BFA] animate-pulse" style={{ animationDuration: '2.4s' }}>z</span>
                <span className="text-[8.5px] text-[#C4B5FD] animate-pulse" style={{ animationDuration: '2.4s', animationDelay: '0.4s' }}>Z</span>
                <span className="text-[10px] text-[#E9D5FF] animate-pulse" style={{ animationDuration: '2.4s', animationDelay: '0.8s' }}>Z</span>
              </div>
              {/* Little thought bubble trail dots pointing to cat's head */}
              <div className="absolute -bottom-1.5 left-2 w-1.5 h-1.5 bg-[#161224] border border-[#8B5CF6]/60 rounded-full" />
              <div className="absolute -bottom-2.5 left-1 w-1 h-1 bg-[#161224] border border-[#8B5CF6]/60 rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Cat Water Dish & Toy on Floor next to Cat Bed */}
      <div className="absolute bottom-[2%] left-[72.5%] w-5 h-3 bg-[#E2E8F0] rounded-b-md border border-[#A0AEC0] flex items-center justify-center pointer-events-none shadow-sm z-30">
        <div className="w-3 h-0.5 bg-[#60A5FA] rounded-full" />
      </div>
      <div className="absolute bottom-[1.5%] left-[97%] w-2.5 h-2.5 bg-[#E53935] rounded-full shadow-sm pointer-events-none z-30 flex items-center justify-center">
        <div className="w-1 h-0.5 bg-white/60 -rotate-45" />
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
