'use client';

import React, { useState } from 'react';

export interface DeskProps {
  lampOn: boolean;
  onToggleLamp: () => void;
  onKeyboardActivity?: () => void;
  className?: string;
}

export const Desk: React.FC<DeskProps> = ({
  lampOn,
  onToggleLamp,
  onKeyboardActivity,
  className = '',
}) => {
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [mugHovered, setMugHovered] = useState<boolean>(false);
  const [stickyHovered, setStickyHovered] = useState<boolean>(false);

  // Key tap simulator on keyboard
  const handleKeyTap = (idx: number) => {
    setActiveKey(idx);
    onKeyboardActivity?.();
    setTimeout(() => setActiveKey(null), 200);
  };

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* DESK LAMP WARM CONE OF LIGHT OVERLAY (when lamp is ON) */}
      {lampOn && (
        <div
          className="absolute -top-24 -left-4 sm:left-4 w-72 h-64 pointer-events-none z-10 opacity-70 transition-opacity duration-500"
          style={{
            background:
              'radial-gradient(ellipse at top left, var(--color-glow-secondary, rgba(230,161,92,0.45)) 0%, rgba(230,161,92,0.15) 45%, transparent 75%)',
          }}
        />
      )}

      {/* DESK SURFACE MAIN BODY */}
      <div className="relative w-full bg-[#1A1817] rounded-xl border-t-4 border-[#3D3028] shadow-2xl p-3 sm:p-4 overflow-hidden">
        {/* Wood grain / Texture horizontal stripes */}
        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(0deg,#000,#000_2px,transparent_2px,transparent_8px)] pointer-events-none" />

        {/* DESK SURFACE TOP ACCESSORIES ROW */}
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          
          {/* 1. INTERACTIVE DESK LAMP (Left Side) */}
          <div className="flex flex-col items-center group cursor-pointer" onClick={onToggleLamp}>
            {/* Lamp Hood / Shade */}
            <div className="relative transition-transform duration-200 group-hover:scale-105">
              {/* Lamp Shade Polygon */}
              <div
                className={`w-14 h-9 rounded-t-xl transition-all duration-300 flex items-center justify-center border-2 ${
                  lampOn
                    ? 'bg-[#E6A15C] border-[#F4DDB8] shadow-[0_0_24px_rgba(230,161,92,0.9)]'
                    : 'bg-[#29221F] border-[#3E332F]'
                }`}
                title="Click lamp to toggle room lighting"
              >
                <div
                  className={`w-4 h-4 rounded-full transition-all ${
                    lampOn
                      ? 'bg-[#FFF9E6] shadow-[0_0_12px_#FFF9E6]'
                      : 'bg-[#1C1613]'
                  }`}
                />
              </div>

              {/* Lamp Stem / Joint */}
              <div className="w-1.5 h-10 bg-[#3E332F] mx-auto relative">
                {/* Brass Knuckle Joint */}
                <div className="w-3 h-3 rounded-full bg-[#5A483E] -left-[3px] top-3 absolute border border-[#2B211A]" />
              </div>

              {/* Lamp Circular Base */}
              <div className="w-10 h-3 bg-[#2D2521] border border-[#44362E] rounded-full mx-auto shadow-md" />

              {/* Little Switch Pill Indicator */}
              <div className="mt-1 flex items-center justify-center">
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border transition-colors ${
                    lampOn
                      ? 'text-[#E6A15C] border-[#E6A15C]/60 bg-[#E6A15C]/10'
                      : 'text-fg-subtle border-border bg-bg-deep'
                  }`}
                >
                  {lampOn ? 'LAMP ON' : 'LAMP OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. CENTER DESK MAT WITH KEYBOARD & MOUSE */}
          <div className="flex-1 max-w-xl mx-auto flex flex-col items-center">
            {/* Desk Mat (Stitched gaming/mechanical keyboard mat) */}
            <div className="w-full bg-[#13161C] rounded-lg p-2.5 sm:p-3 border border-[#222A38] shadow-inner flex flex-col sm:flex-row items-center justify-between gap-3">
              
              {/* MECHANICAL KEYBOARD */}
              <div
                className="bg-[#1A202C] p-2 rounded border border-[#2B3547] shadow-md cursor-pointer select-none"
                onClick={() => handleKeyTap(Math.floor(Math.random() * 12))}
                title="Mechanical 65% Keyboard (Click to tap)"
              >
                {/* Keyboard Switch Plate */}
                <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-5 sm:w-7 sm:h-6 rounded text-[8px] font-mono flex items-center justify-center border transition-all ${
                        activeKey === i
                          ? 'bg-accent text-bg font-bold border-accent translate-y-0.5 shadow-crt'
                          : 'bg-[#252E3E] text-fg-muted border-[#344158] hover:bg-[#2F3B50]'
                      }`}
                    >
                      {['ESC', 'Q', 'W', 'E', 'R', 'T', 'TAB', 'A', 'S', 'D', 'F', 'SPC'][i]}
                    </div>
                  ))}
                </div>

                {/* Spacebar Row */}
                <div className="mt-1 flex items-center gap-1">
                  <span className="w-6 h-4 rounded bg-[#202735] text-[7px] text-fg-subtle flex items-center justify-center border border-[#2B3547]">
                    CTRL
                  </span>
                  <div
                    className={`flex-1 h-4 rounded text-[7px] font-mono flex items-center justify-center border transition-all ${
                      activeKey === 99
                        ? 'bg-accent text-bg border-accent translate-y-0.5'
                        : 'bg-[#2B3547] text-fg-muted border-[#3B4961] hover:bg-[#344158]'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKeyTap(99);
                    }}
                  >
                    SPACEBAR
                  </div>
                  <span className="w-6 h-4 rounded bg-[#202735] text-[7px] text-fg-subtle flex items-center justify-center border border-[#2B3547]">
                    RET
                  </span>
                </div>
              </div>

              {/* MOUSE WITH GLOWING SCROLL WHEEL */}
              <div className="flex flex-col items-center">
                <div
                  className="relative w-8 h-12 bg-[#1A202C] rounded-t-xl rounded-b-lg border border-[#2F3B50] shadow-md flex flex-col items-center pt-1.5 group cursor-pointer hover:border-accent transition-colors"
                  onClick={() => onKeyboardActivity?.()}
                  title="Optical Mouse"
                >
                  {/* Mouse Clicker Split */}
                  <div className="w-0.5 h-3 bg-[#0E131A] absolute top-0" />
                  {/* Scroll Wheel */}
                  <div className="w-1.5 h-3 bg-accent rounded-full animate-pulse shadow-crt" />
                  {/* Mouse RGB Logo */}
                  <div className="w-2 h-2 rounded-full bg-accent/40 mt-3" />
                </div>
                <span className="text-[8px] font-mono text-fg-subtle mt-1">1000 DPI</span>
              </div>
            </div>
          </div>

          {/* 3. COFFEE/TEA MUG & STICKY NOTE (Right Side) */}
          <div className="flex items-end gap-3">
            {/* Sticky Note */}
            <div
              className="relative w-20 min-h-[86px] sm:w-24 sm:min-h-[92px] bg-[#F5E8C7] text-[#332A15] p-2 sm:p-2.5 rounded shadow-md rotate-2 border border-[#E0D0A6] cursor-pointer hover:rotate-0 transition-transform select-none flex flex-col justify-between"
              onMouseEnter={() => setStickyHovered(true)}
              onMouseLeave={() => setStickyHovered(false)}
              title="Desk sticky note"
            >
              <div>
                <div className="text-[10px] font-mono font-bold border-b border-[#D4C394] pb-0.5 text-[#2E2410]">
                  TODO // 2 AM
                </div>
                <div className="text-[8.5px] font-mono mt-1 space-y-0.5 leading-snug text-[#4D4023]">
                  <div>&bull; Dijkstra SPF</div>
                  <div>&bull; One Piece ch. 1100</div>
                  <div>&bull; Sleep (opt.)</div>
                </div>
              </div>
              {stickyHovered && (
                <div className="absolute -top-7 left-0 sm:left-1/2 sm:-translate-x-1/2 bg-bg-surface text-accent text-[9px] font-mono px-2 py-0.5 rounded border border-border whitespace-nowrap z-30 shadow-md">
                  Huzbi&apos;s 2 AM notes
                </div>
              )}
            </div>

            {/* Steaming Mug */}
            <div
              className="relative flex flex-col items-center cursor-pointer group"
              onMouseEnter={() => setMugHovered(true)}
              onMouseLeave={() => setMugHovered(false)}
              title="Warm Tea / Coffee"
            >
              {/* Animated Pixel Steam Wisps */}
              <div className="h-4 flex items-center justify-center gap-1 font-mono text-xs text-accent-secondary opacity-75">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>~</span>
                <span className="animate-bounce" style={{ animationDelay: '200ms' }}>~</span>
              </div>

              {/* Ceramic Mug Body */}
              <div className="relative w-8 h-8 bg-[#2A3342] rounded-b-md border-2 border-[#3F4D63] flex items-center justify-center shadow-md">
                {/* Liquid inside rim */}
                <div className="absolute top-0.5 w-6 h-1.5 bg-[#4A2D1B] rounded-full" />
                {/* Mug Handle */}
                <div className="absolute -right-2 top-1.5 w-3 h-4 border-2 border-[#3F4D63] rounded-r-md" />
              </div>

              {/* Coaster */}
              <div className="w-10 h-1.5 bg-[#423326] rounded-full mt-0.5 border border-[#2B2118]" />

              {mugHovered && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-surface text-accent-cream text-[9px] font-mono px-2 py-0.5 rounded border border-border whitespace-nowrap z-20">
                  Cardamom Chai (Hot)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DESK BOTTOM EDGE & BEVEL */}
        <div className="mt-3 pt-2 border-t border-[#29221C] flex items-center justify-between text-[10px] font-mono text-fg-subtle">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-[#332A22]" />
            <span>SOLID WALNUT SURFACE</span>
          </div>
          <span>CABLE MANAGEMENT: &ldquo;IT WORKS&rdquo;</span>
        </div>
      </div>
    </div>
  );
};
