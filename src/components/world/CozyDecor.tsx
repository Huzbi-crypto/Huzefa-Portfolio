'use client';

import React, { useState } from 'react';

/**
 * 1. FAIRY STRING LIGHTS
 * Swagged gracefully across the upper wall/ceiling with soft warm glowing bulbs.
 */
export const FairyLights: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full select-none pointer-events-none ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 1000 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-10 sm:h-12 md:h-14 overflow-visible drop-shadow-[0_0_8px_rgba(255,200,100,0.6)]"
      >
        <defs>
          <filter id="bulbGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FFB703" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Catenary Wire Strand Curves across the room */}
        <path
          d="M0,15 Q160,45 330,18 Q500,48 670,18 Q835,46 1000,15"
          stroke="#382E25"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Hanging Bulbs along the wire */}
        {[
          { cx: 50, cy: 26, color: '#FFE494', delay: '0s' },
          { cx: 110, cy: 35, color: '#FFB703', delay: '0.6s' },
          { cx: 170, cy: 38, color: '#FFE494', delay: '1.2s' },
          { cx: 230, cy: 34, color: '#FF9E00', delay: '1.8s' },
          { cx: 290, cy: 24, color: '#FFE494', delay: '0.4s' },
          { cx: 380, cy: 26, color: '#FFB703', delay: '1.0s' },
          { cx: 440, cy: 36, color: '#FFE494', delay: '1.6s' },
          { cx: 500, cy: 40, color: '#FF9E00', delay: '0.2s' },
          { cx: 560, cy: 36, color: '#FFE494', delay: '0.8s' },
          { cx: 620, cy: 26, color: '#FFB703', delay: '1.4s' },
          { cx: 720, cy: 26, color: '#FFE494', delay: '0.3s' },
          { cx: 780, cy: 36, color: '#FF9E00', delay: '0.9s' },
          { cx: 840, cy: 38, color: '#FFE494', delay: '1.5s' },
          { cx: 900, cy: 34, color: '#FFB703', delay: '0.5s' },
          { cx: 960, cy: 22, color: '#FFE494', delay: '1.1s' },
        ].map((bulb, i) => (
          <g key={i} className="animate-pulse" style={{ animationDelay: bulb.delay, animationDuration: '2.8s' }}>
            {/* Tiny socket cap */}
            <rect x={bulb.cx - 1.5} y={bulb.cy - 3} width="3" height="3" fill="#263324" />
            {/* Glowing round bulb */}
            <circle cx={bulb.cx} cy={bulb.cy + 2.5} r="3" fill={bulb.color} filter="url(#bulbGlow)" />
            <circle cx={bulb.cx} cy={bulb.cy + 2.5} r="1.5" fill="#FFFDF0" />
          </g>
        ))}
      </svg>
    </div>
  );
};

/**
 * 2. SLEEPING PIXEL CAT
 * An adorable ginger/calico cat curled on a cozy round cushion by the bookshelf.
 * Features gentle breathing animation and an interactive purr tooltip when clicked.
 */
export const SleepingCat: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isPurring, setIsPurring] = useState<boolean>(false);
  const [clickCount, setClickCount] = useState<number>(0);

  const catThoughts = [
    "*purrrrrr...* sleeping soundly next to the warm PC vent.",
    "*soft meow* ...stretches tiny paws and curls back into a ball.",
    "dreaming of chasing laser pointers in the terminal.",
    "*purr-purr...* the 2 AM compiler hum is the best lullaby.",
  ];

  const handleCatClick = () => {
    setIsPurring(true);
    setClickCount((prev) => prev + 1);
    setTimeout(() => {
      setIsPurring(false);
    }, 4000);
  };

  const activeThought = catThoughts[clickCount % catThoughts.length];

  return (
    <div
      className={`relative inline-block cursor-pointer select-none group ${className}`}
      onClick={handleCatClick}
      title="Sleeping Room Mascot (Click to pet!)"
    >
      {/* Purr / Sleep Bubble */}
      {isPurring && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap">
          <div className="relative border border-accent/80 bg-bg-deep text-fg font-mono text-[10px] px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1">
            <span className="text-accent text-[9px]">&#9829;</span>
            <span>{activeThought}</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-bg-deep border-r border-b border-accent/80 rotate-45" />
          </div>
        </div>
      )}

      {/* Floating "z z Z" sleep bubbles when resting */}
      {!isPurring && (
        <div className="absolute -top-4 right-2 pointer-events-none flex flex-col items-center opacity-70 group-hover:opacity-100 transition-opacity">
          <span className="font-mono text-[9px] text-accent/80 animate-bounce leading-none" style={{ animationDuration: '2.4s' }}>
            z
          </span>
          <span className="font-mono text-[7px] text-fg-muted animate-pulse leading-none" style={{ animationDuration: '1.8s' }}>
            z
          </span>
        </div>
      )}

      {/* SVG PIXEL CAT & CUSHION */}
      <svg
        viewBox="0 0 64 42"
        className="w-20 h-14 sm:w-24 sm:h-16 pixelated drop-shadow-md overflow-visible"
        shapeRendering="crispEdges"
      >
        {/* Cozy Tufted Round Cushion (Warm Cream & Terracotta) */}
        <g id="cushion">
          {/* Shadow underneath */}
          <ellipse cx="32" cy="36" rx="30" ry="6" fill="#0E121A" opacity="0.6" />
          {/* Cushion Base & Rim */}
          <ellipse cx="32" cy="33" rx="28" ry="7" fill="#8B4513" />
          <ellipse cx="32" cy="31" rx="27" ry="6.5" fill="#D9825B" />
          <ellipse cx="32" cy="29" rx="25" ry="5.5" fill="#F4DDB8" />
          {/* Tuft stitches */}
          <rect x="22" y="28" width="2" height="2" fill="#B35E35" />
          <rect x="32" y="27" width="2" height="2" fill="#B35E35" />
          <rect x="42" y="28" width="2" height="2" fill="#B35E35" />
        </g>

        {/* Curled Ginger/Calico Sleeping Cat with Breathing Motion */}
        <g
          id="cat-body"
          className="transition-transform duration-1000 ease-in-out origin-center animate-pulse"
          style={{ animationDuration: '3.5s' }}
        >
          {/* Curled Body (warm orange ginger) */}
          <ellipse cx="32" cy="24" rx="16" ry="10" fill="#E67E22" />
          {/* Body Undercoat highlight */}
          <ellipse cx="33" cy="23" rx="13" ry="8" fill="#F39C12" />
          {/* Calico White patch */}
          <ellipse cx="36" cy="25" rx="7" ry="5" fill="#FDFEFE" />
          {/* Darker ginger tabby stripes */}
          <rect x="26" y="17" width="2" height="5" fill="#BA4A00" />
          <rect x="30" y="16" width="2" height="6" fill="#BA4A00" />
          <rect x="35" y="17" width="2" height="5" fill="#BA4A00" />

          {/* Sleeping Cat Head tucked in */}
          <g id="cat-head">
            <circle cx="21" cy="22" r="7.5" fill="#E67E22" />
            <circle cx="21" cy="22" r="6.5" fill="#F39C12" />

            {/* Left Ear */}
            <polygon points="16,16 19,10 22,16" fill="#E67E22" />
            <polygon points="17,15 19,12 21,15" fill="#FADBD8" />

            {/* Right Ear */}
            <polygon points="22,16 25,11 27,17" fill="#E67E22" />
            <polygon points="23,15 25,13 26,16" fill="#FADBD8" />

            {/* Sleepy curved closed eyes */}
            <path d="M17,21 Q19,23 21,21" stroke="#5D4037" strokeWidth="1" fill="none" />
            <path d="M22,21 Q24,23 26,21" stroke="#5D4037" strokeWidth="1" fill="none" />

            {/* Tiny Pink Nose */}
            <polygon points="21,23 20,22 22,22" fill="#F1948A" />

            {/* Whiskers */}
            <line x1="14" y1="22" x2="18" y2="23" stroke="#FFF" strokeWidth="0.5" opacity="0.8" />
            <line x1="14" y1="24" x2="18" y2="24" stroke="#FFF" strokeWidth="0.5" opacity="0.8" />
          </g>

          {/* Curled Paw tucked under chin */}
          <ellipse cx="25" cy="27" rx="3" ry="2" fill="#FDFEFE" />

          {/* Tail Wrapped around the side */}
          <path
            d="M45,26 Q50,22 47,17 Q45,15 42,16"
            stroke="#E67E22"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* White tip of tail */}
          <circle cx="42" cy="16" r="2" fill="#FDFEFE" />
        </g>
      </svg>
    </div>
  );
};

/**
 * 3. WOVEN AREA RUG
 * Anchors the desk and swivel chair onto the wooden floorboards.
 * Features an artisanal geometric pattern with fringes on the edges.
 */
export const RoomRug: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full select-none pointer-events-none ${className}`} aria-hidden="true">
      <div className="relative w-full max-w-2xl mx-auto h-16 sm:h-20 bg-[#221A22] rounded-lg border-2 border-[#382633] shadow-2xl overflow-hidden flex flex-col justify-between p-1.5 opacity-90">
        {/* Outer Warm Terracotta / Gold Border */}
        <div className="w-full h-full rounded border border-[#4A3242] p-1 flex flex-col justify-between bg-[#191318]">
          {/* Top Fringe Pattern */}
          <div className="flex justify-around items-center h-1 opacity-60">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-[#D9825B]" />
            ))}
          </div>

          {/* Center Bohemian Diamond Pattern */}
          <div className="flex items-center justify-around px-2 py-0.5 opacity-80">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 border border-[#D6AE62] rotate-45 bg-[#3B2933] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#91A878] rotate-45" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Fringe Pattern */}
          <div className="flex justify-around items-center h-1 opacity-60">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-[#D9825B]" />
            ))}
          </div>
        </div>

        {/* Left & Right Rug Tassels */}
        <div className="absolute -left-1 top-2 bottom-2 w-1 flex flex-col justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1 bg-[#E8DCC4] rounded-l" />
          ))}
        </div>
        <div className="absolute -right-1 top-2 bottom-2 w-1 flex flex-col justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1 bg-[#E8DCC4] rounded-r" />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 4. FLOOR MONSTERA PLANT
 * Potted floor plant in terracotta pot with broad fenestrated leaves.
 */
export const FloorMonstera: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative inline-block select-none ${className}`} title="Monstera Deliciosa">
      <svg
        viewBox="0 0 50 65"
        className="w-14 h-18 sm:w-16 sm:h-22 pixelated drop-shadow-md overflow-visible"
        shapeRendering="crispEdges"
      >
        {/* Plant Shadow */}
        <ellipse cx="25" cy="62" rx="14" ry="3" fill="#0A0D14" opacity="0.6" />

        {/* Terracotta Pot */}
        <polygon points="17,45 33,45 30,62 20,62" fill="#B35E35" />
        <rect x="15" y="42" width="20" height="3" fill="#C86D43" rx="1" />
        {/* Dark Soil */}
        <ellipse cx="25" cy="43" rx="8" ry="1.5" fill="#2E1C12" />

        {/* Stems */}
        <path d="M25,43 Q24,30 20,20" stroke="#3D5A34" strokeWidth="2" fill="none" />
        <path d="M25,43 Q26,28 32,16" stroke="#3D5A34" strokeWidth="2" fill="none" />
        <path d="M25,43 Q20,35 12,28" stroke="#3D5A34" strokeWidth="1.5" fill="none" />
        <path d="M25,43 Q30,34 38,26" stroke="#3D5A34" strokeWidth="1.5" fill="none" />

        {/* Leaf 1 (Top Left) */}
        <ellipse cx="19" cy="16" rx="9" ry="7" fill="#4B6E40" />
        <ellipse cx="19" cy="16" rx="7" ry="5.5" fill="#5C864E" />
        {/* Leaf slits */}
        <rect x="14" y="15" width="3" height="1" fill="#121620" />
        <rect x="16" y="19" width="3" height="1" fill="#121620" />

        {/* Leaf 2 (Top Right) */}
        <ellipse cx="32" cy="13" rx="10" ry="8" fill="#4B6E40" />
        <ellipse cx="32" cy="13" rx="8" ry="6.5" fill="#699958" />
        {/* Leaf slits */}
        <rect x="33" y="10" width="3" height="1" fill="#121620" />
        <rect x="35" y="14" width="3" height="1" fill="#121620" />

        {/* Leaf 3 (Side Left) */}
        <ellipse cx="11" cy="27" rx="7" ry="5.5" fill="#3D5A34" />
        <rect x="8" y="27" width="2" height="1" fill="#121620" />

        {/* Leaf 4 (Side Right) */}
        <ellipse cx="39" cy="25" rx="7" ry="5.5" fill="#3D5A34" />
        <rect x="40" y="25" width="2" height="1" fill="#121620" />
      </svg>
    </div>
  );
};

/**
 * 5. FLOOR MINI-ITX PC TOWER
 * Compact desktop workstation case resting on the floor beside the desk.
 */
export const FloorPCTower: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative inline-block select-none ${className}`} title="Huzbi's Linux Rig // Custom ITX Build">
      <div className="w-16 sm:w-18 h-24 sm:h-28 bg-[#11141C] rounded border-2 border-[#222A38] shadow-xl p-1.5 flex flex-col justify-between relative overflow-hidden">
        {/* Tempered Glass Side Window */}
        <div className="relative w-full flex-1 bg-[#090C12] rounded-sm border border-[#1A2230] p-1 flex flex-col justify-between overflow-hidden">
          {/* Subtle warm glow inside PC from components */}
          <div className="absolute inset-0 bg-gradient-to-tr from-accent/15 via-transparent to-[#73B7FF]/20 pointer-events-none" />

          {/* Internal Glowing Fan */}
          <div className="flex items-center justify-center my-auto">
            <div className="w-8 h-8 rounded-full border border-accent/40 flex items-center justify-center bg-accent/5">
              <div className="w-3 h-3 rounded-full bg-accent/60 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          </div>

          {/* GPU Backplate & RGB stripe */}
          <div className="w-full h-1.5 bg-[#1F2736] rounded-[1px] flex items-center px-1">
            <div className="w-full h-0.5 bg-accent animate-pulse" />
          </div>
        </div>

        {/* Front Panel Header */}
        <div className="mt-1 flex items-center justify-between px-1">
          {/* Power Button with Status LED */}
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_4px_var(--color-accent)]" />
            <span className="text-[6.5px] font-mono text-fg-subtle">PWR</span>
          </div>
          {/* USB Ports */}
          <div className="flex items-center gap-0.5">
            <div className="w-1 h-1.5 bg-[#253042] rounded-[0.5px]" />
            <div className="w-1 h-1.5 bg-[#253042] rounded-[0.5px]" />
          </div>
        </div>

        {/* Case Feet */}
        <div className="absolute -bottom-1 left-2 w-2.5 h-1 bg-[#090C12]" />
        <div className="absolute -bottom-1 right-2 w-2.5 h-1 bg-[#090C12]" />
      </div>
    </div>
  );
};

/**
 * 6. WALL CORKBOARD / PEGBOARD
 * Pinned sticky notes, anime sketches, and polaroid photo.
 */
export const WallCorkboard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative select-none ${className}`} title="Inspiration & Architecture Notes">
      <div className="w-44 sm:w-48 bg-[#9E6E45] p-1.5 rounded border-2 border-[#5C3F27] shadow-lg">
        {/* Cork Texture Board */}
        <div className="relative w-full bg-[#B88758] p-2 rounded-xs border border-[#855B36] flex flex-col gap-2">
          {/* Top Row: Mini Polaroid & Pinned Note */}
          <div className="flex items-start justify-between gap-1.5">
            {/* Pinned Mini Polaroid Photo */}
            <div className="relative w-16 bg-[#FDFBF7] p-1 rounded-xs shadow-md rotate-[-3deg]">
              {/* Pushpin */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E53935] shadow" />
              {/* Photo Image */}
              <div className="w-full h-10 bg-[#25384D] rounded-[1px] flex flex-col justify-end p-0.5 relative overflow-hidden">
                <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F5B041]" />
                <polygon points="0,10 6,4 12,10" fill="#1B2836" />
                <polygon points="5,10 10,6 14,10" fill="#141D27" />
              </div>
              <span className="text-[5.5px] font-mono text-[#555] block text-center mt-0.5">KARACHI &apos;24</span>
            </div>

            {/* Pinned Yellow Sticky Note */}
            <div className="relative w-20 bg-[#FFF59D] p-1.5 rounded-xs shadow-md rotate-[2deg] text-[#333]">
              {/* Pushpin */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#1E88E5] shadow" />
              <div className="text-[6.5px] font-mono font-bold leading-tight border-b border-[#E0D068] pb-0.5">
                // SYSTEM ARCH
              </div>
              <div className="text-[6px] font-mono leading-tight mt-0.5">
                &bull; SPF O(E log V)
                <br />
                &bull; Zero dropped frames
                <br />
                &bull; Buy more chai
              </div>
            </div>
          </div>

          {/* Bottom Row: Manga Sketch Scrap */}
          <div className="relative bg-[#F4ECD8] px-2 py-1 rounded-xs shadow border border-[#D9CEB4] rotate-[-1deg]">
            <div className="text-[7px] font-mono text-[#4A3828] font-bold flex items-center justify-between">
              <span>&ldquo;SURPASS LIMITS&rdquo;</span>
              <span className="text-accent-secondary text-[8px]">&#9733;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 7. FLOOR MANGA STACK WITH WARM CHAI MUG
 * 3 manga volumes stacked horizontally on the wooden floor beside the bookshelf.
 */
export const FloorMangaStack: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative inline-block select-none ${className}`} title="Late Night Reading Stack">
      <div className="flex flex-col items-center">
        {/* Hot Chai Mug resting on top book */}
        <div className="relative mb-0.5 flex flex-col items-center">
          {/* Steam puffs */}
          <div className="text-[7px] font-mono text-fg-muted/60 animate-pulse -mb-0.5">~ ~</div>
          {/* Ceramic Mug */}
          <div className="w-4 h-4 bg-[#E0D6C3] rounded-xs border border-[#8C7B6B] flex items-center justify-center relative shadow-sm">
            <div className="w-2.5 h-1 bg-[#8D5B4C] rounded-full" />
            {/* Handle */}
            <div className="absolute -right-1 top-1 w-1.5 h-2 rounded-r border border-l-0 border-[#8C7B6B]" />
          </div>
        </div>

        {/* Volume 3 (Top) */}
        <div className="w-18 h-3.5 bg-[#8E2828] rounded-[1px] border border-[#521818] shadow-sm flex items-center justify-between px-1">
          <span className="text-[6px] font-mono text-[#FFF] uppercase font-bold">ONE PIECE 108</span>
          <div className="w-1 h-1 bg-[#F5B041] rounded-full" />
        </div>

        {/* Volume 2 (Middle, slightly angled) */}
        <div className="w-20 h-3.5 bg-[#2B4736] rounded-[1px] border border-[#1A2E22] shadow-sm flex items-center justify-between px-1 -mt-0.5 rotate-[-1deg]">
          <span className="text-[6px] font-mono text-[#A8D672] uppercase font-bold">VAGABOND 37</span>
          <div className="w-1 h-1 bg-[#FFF] rounded-full" />
        </div>

        {/* Volume 1 (Base) */}
        <div className="w-22 h-4 bg-[#1E2530] rounded-[1px] border border-[#11161D] shadow-md flex items-center justify-between px-1.5 -mt-0.5">
          <span className="text-[6px] font-mono text-[#7FB8D9] uppercase font-bold">BERSERK DELUXE</span>
          <div className="w-1.5 h-1.5 bg-[#D6AE62] rounded-full" />
        </div>
      </div>
    </div>
  );
};
