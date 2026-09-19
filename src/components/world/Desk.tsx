'use client';

import React, { useState } from 'react';
import { MangaSeries } from '@/data/dialogues';

export interface DeskProps {
  lampOn: boolean;
  onToggleLamp: () => void;
  onLaptopClick?: () => void;
  onMonitorClick?: () => void;
  onKeyboardClick?: () => void;
  onKeyboardActivity?: () => void;
  activeManga?: MangaSeries;
  isTyping?: boolean;
  className?: string;
}

export const Desk: React.FC<DeskProps> = ({
  lampOn,
  onToggleLamp,
  onLaptopClick,
  onMonitorClick,
  onKeyboardClick,
  onKeyboardActivity,
  activeManga = 'one-piece',
  isTyping = false,
  className = '',
}) => {
  const [mugHovered, setMugHovered] = useState<boolean>(false);
  const [stickyHovered, setStickyHovered] = useState<boolean>(false);
  const [activeKeyPulse, setActiveKeyPulse] = useState<number | null>(null);

  const handleKeyboardTap = (idx: number) => {
    setActiveKeyPulse(idx);
    if (onKeyboardClick) {
      onKeyboardClick();
    } else if (onKeyboardActivity) {
      onKeyboardActivity();
    }
    setTimeout(() => setActiveKeyPulse(null), 250);
  };

  const handleLaptopTap = () => {
    if (onLaptopClick) {
      onLaptopClick();
    } else if (onKeyboardActivity) {
      onKeyboardActivity();
    }
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
                title="Desk Lamp"
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

              {/* Switch Pill Indicator */}
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

          {/* 2. CENTER DESK MAT WITH RETRO BATTLESTATION SETUP */}
          <div className="flex-1 max-w-2xl mx-auto flex flex-col items-center">
            {/* Desk Mat (Stitched precision battlestation mat) */}
            <div className="w-full bg-[#12151D] rounded-xl p-2.5 sm:p-3.5 border border-[#232B3A] shadow-inner flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-4">
              
              {/* --- RETRO LAPTOP (Left Side of Mat) --- */}
              <div
                className="group flex flex-col items-center cursor-pointer select-none transition-transform hover:-translate-y-0.5"
                onClick={handleLaptopTap}
                title="Retro Clamshell Workstation"
              >
                {/* Laptop Screen Lid (Angled Perspective) */}
                <div className="relative w-28 sm:w-32 h-18 sm:h-20 bg-[#161C24] rounded-t-md border-2 border-[#2A3547] p-1 shadow-lg group-hover:border-accent/70 transition-colors">
                  {/* Top Bezel Webcam Dot & Model */}
                  <div className="flex items-center justify-between px-1 mb-0.5">
                    <span className="text-[6.5px] font-mono text-fg-subtle tracking-tighter">[ H-PAD ]</span>
                    <div className="w-1 h-1 rounded-full bg-[#3B475B]" />
                  </div>

                  {/* Laptop Display Screen */}
                  <div className="relative w-full h-[52px] sm:h-[58px] bg-[#0A0E14] rounded-sm p-1 border border-[#1E2635] overflow-hidden flex flex-col justify-between">
                    {/* Scanlines effect on laptop screen */}
                    <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(0deg,#000,#000_1px,transparent_1px,transparent_3px)] pointer-events-none" />

                    {/* Terminal Header */}
                    <div className="flex items-center justify-between text-[6.5px] font-mono text-[#73B7FF] border-b border-[#1A2332] pb-0.5">
                      <span>tty2: bash</span>
                      <span className={`w-1 h-1 rounded-full ${isTyping ? 'bg-accent animate-ping' : 'bg-accent'}`} />
                    </div>

                    {/* Simulated Code Lines */}
                    <div className="space-y-0.5 text-[6.5px] sm:text-[7px] font-mono leading-none">
                      <div className="text-accent truncate">
                        $ ./route_sim
                      </div>
                      <div className="text-[#E6A15C] truncate">
                        &gt; 128 pkts [OK]
                      </div>
                      <div className="text-fg-subtle truncate flex items-center gap-0.5">
                        <span>spf_cost: 0.12ms</span>
                        <span className="inline-block w-1 h-2 bg-accent animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laptop Hinge */}
                <div className="w-24 sm:w-28 h-1 bg-[#222B3A] border-x border-[#334158]" />

                {/* Laptop Keyboard Deck (Base) */}
                <div className="relative w-30 sm:w-34 h-10 sm:h-11 bg-[#1A202C] rounded-b-md border-2 border-t-0 border-[#2A3547] p-1 shadow-md flex flex-col justify-between group-hover:border-accent/70 transition-colors">
                  {/* Miniature Key Matrix */}
                  <div className="grid grid-cols-8 gap-0.5 px-0.5">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-[1px] transition-colors ${
                          isTyping && i % 3 === 0
                            ? 'bg-accent'
                            : 'bg-[#252E3E] border border-[#313E53]'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Red TrackPoint Nub in Center */}
                  <div className="absolute top-[8px] sm:top-[9px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#E53935] shadow-[0_0_2px_#E53935]" />

                  {/* Palmrest, Trackpad & Status LEDs */}
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    {/* Status LEDs */}
                    <div className="flex items-center gap-1">
                      <span className={`w-1 h-1 rounded-full ${isTyping ? 'bg-accent animate-pulse' : 'bg-accent/60'}`} />
                      <span className="w-1 h-1 rounded-full bg-[#E6A15C]" />
                    </div>

                    {/* Miniature Trackpad */}
                    <div className="w-6 h-2.5 bg-[#141923] rounded-[1px] border border-[#2B3547] flex flex-col justify-end">
                      <div className="w-full h-0.5 bg-[#252E3E] border-t border-[#1C2330]" />
                    </div>

                    {/* Think Badge */}
                    <span className="text-[5.5px] font-mono text-fg-subtle">PRO</span>
                  </div>
                </div>
              </div>

              {/* --- CENTER / RIGHT: EXTERNAL MONITOR + MINI KEYBOARD & MOUSE --- */}
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                
                {/* 1. EXTERNAL RETRO MONITOR ON STAND */}
                <div
                  className="group flex flex-col items-center cursor-pointer select-none transition-transform hover:-translate-y-0.5"
                  onClick={onMonitorClick}
                  title="External Manga & Anime Monitor"
                >
                  {/* Monitor Display Housing */}
                  <div className="relative w-40 sm:w-48 h-26 sm:h-30 bg-[#151A24] rounded-lg border-2 border-[#2C384C] p-1.5 shadow-xl group-hover:border-accent/70 transition-colors">
                    {/* Inner Screen Bezel */}
                    <div className="relative w-full h-[76px] sm:h-[90px] rounded bg-[#090C12] border border-[#202938] overflow-hidden flex flex-col justify-between p-1.5">
                      {/* Scanlines Effect */}
                      <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,#000,#000_1px,transparent_1px,transparent_3px)] pointer-events-none" />

                      {/* --- DYNAMIC MANGA ARTWORK DISPLAY --- */}
                      {activeManga === 'one-piece' && (
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                          {/* Straw Hat Pixel Icon */}
                          <div className="flex flex-col items-center">
                            {/* Crown of Hat */}
                            <div className="w-7 h-2.5 bg-[#E6B445] rounded-t-md border-t border-[#F5D07A]" />
                            {/* Red Ribbon */}
                            <div className="w-7 h-1 bg-[#DC2626]" />
                            {/* Hat Brim */}
                            <div className="w-11 h-1 bg-[#E6B445] rounded-full" />
                          </div>
                          <div className="text-[8px] font-mono font-bold text-[#FBBF24] mt-1 tracking-wider">
                            ONE PIECE
                          </div>
                          <div className="text-[6.5px] font-mono text-[#F4DDB8] opacity-80">
                            GEAR 5 // SUN GOD NIKA
                          </div>
                        </div>
                      )}

                      {activeManga === 'naruto' && (
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                          {/* Konoha Headband Plate */}
                          <div className="w-12 h-4 bg-[#6B7280] rounded-[2px] border border-[#9CA3AF] flex items-center justify-center shadow-inner">
                            {/* Engraved Leaf Spiral */}
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-[#1F2937] border-t-transparent -rotate-45" />
                          </div>
                          <div className="text-[8px] font-mono font-bold text-[#FB923C] mt-1 tracking-wider">
                            NARUTO
                          </div>
                          <div className="text-[6.5px] font-mono text-[#FED7AA] opacity-80">
                            WILL OF FIRE // SAGE
                          </div>
                        </div>
                      )}

                      {activeManga === 'bleach' && (
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                          {/* Tensa Zangetsu Blade Silhouette */}
                          <div className="flex items-center gap-1">
                            <div className="w-10 h-1.5 bg-[#0F172A] border border-[#38BDF8] rounded-l-sm" />
                            <span className="text-[9px] font-bold text-[#60A5FA]">卍解</span>
                          </div>
                          <div className="text-[8px] font-mono font-bold text-[#60A5FA] mt-1 tracking-wider">
                            BLEACH
                          </div>
                          <div className="text-[6.5px] font-mono text-[#BAE6FD] opacity-80">
                            TENSA ZANGETSU // MUKEN
                          </div>
                        </div>
                      )}

                      {activeManga === 'black-clover' && (
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                          {/* 5-Leaf Clover Grimoire Symbol */}
                          <div className="relative flex items-center justify-center">
                            <div className="w-4 h-4 bg-[#7F1D1D] rounded-full border border-[#EF4444] flex items-center justify-center">
                              <span className="text-[7px] text-[#FCA5A5] font-bold">♣5</span>
                            </div>
                          </div>
                          <div className="text-[8px] font-mono font-bold text-[#F87171] mt-1 tracking-wider">
                            BLACK CLOVER
                          </div>
                          <div className="text-[6.5px] font-mono text-[#FECACA] opacity-80">
                            ANTI-MAGIC // ASTA
                          </div>
                        </div>
                      )}

                      {activeManga === 'one-punch-man' && (
                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
                          {/* Saitama Iconic Minimalist Deadpan Face */}
                          <div className="w-6 h-6 rounded-full bg-[#FEF08A] border border-[#CA8A04] flex flex-col items-center justify-center pt-0.5">
                            {/* Eyes */}
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-[#1C1917]" />
                              <div className="w-1 h-1 rounded-full bg-[#1C1917]" />
                            </div>
                            {/* Neutral mouth */}
                            <div className="w-2 h-0.5 bg-[#1C1917] mt-0.5" />
                          </div>
                          <div className="text-[8px] font-mono font-bold text-[#FACC15] mt-1 tracking-wider">
                            ONE PUNCH MAN
                          </div>
                          <div className="text-[6.5px] font-mono text-[#FEF08A] opacity-80">
                            SERIOUS PUNCH // SAITAMA
                          </div>
                        </div>
                      )}

                      {/* Screen Footer Status */}
                      <div className="relative z-10 flex items-center justify-between text-[6px] font-mono text-fg-subtle pt-0.5 border-t border-[#1C2433]">
                        <span>HDMI-1</span>
                        <span className="text-accent">ONLINE</span>
                      </div>
                    </div>

                    {/* Bottom Bezel Badge & Power LED */}
                    <div className="flex items-center justify-between px-1 pt-1">
                      <span className="text-[6px] font-mono text-fg-subtle">[ H-SYNC PRO ]</span>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-accent shadow-crt" />
                        <span className="w-1.5 h-1 bg-[#252E3E] rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  {/* Monitor Stand Neck */}
                  <div className="w-3.5 h-3.5 bg-[#1B222E] border-x border-[#2D394C]" />
                  {/* Monitor Stand Base */}
                  <div className="w-16 h-1.5 bg-[#252E3E] rounded-full border border-[#374459] shadow-md" />
                </div>

                {/* 2. MINI MECHANICAL KEYBOARD & PRECISION MOUSE */}
                <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                  
                  {/* COMPACT 60% MECHANICAL KEYBOARD */}
                  <div
                    className="bg-[#181F2B] p-1.5 rounded-md border border-[#2B3648] shadow-md cursor-pointer select-none group hover:border-accent/70 transition-colors"
                    onClick={() => handleKeyboardTap(Math.floor(Math.random() * 8))}
                    title="Compact 60% Mechanical Keyboard"
                  >
                    {/* Key Matrix Rows */}
                    <div className="space-y-0.5">
                      {/* Row 1: Function / Numbers */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-3.5 sm:w-4 h-2.5 rounded-[1px] text-[5.5px] font-mono flex items-center justify-center transition-all ${
                              activeKeyPulse === i || (isTyping && i % 2 === 0)
                                ? 'bg-accent text-bg font-bold shadow-crt translate-y-0.2'
                                : 'bg-[#252E3E] text-fg-subtle border border-[#313E53]'
                            }`}
                          >
                            {['ESC', '1', '2', '3', '4', '5', '6', 'DEL'][i]}
                          </div>
                        ))}
                      </div>

                      {/* Row 2: Alphas */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-3.5 sm:w-4 h-2.5 rounded-[1px] text-[5.5px] font-mono flex items-center justify-center transition-all ${
                              activeKeyPulse === i + 10 || (isTyping && i % 2 === 1)
                                ? 'bg-accent text-bg font-bold shadow-crt translate-y-0.2'
                                : 'bg-[#222A38] text-fg-muted border border-[#2E3A4E]'
                            }`}
                          >
                            {['TAB', 'Q', 'W', 'E', 'R', 'T', 'Y', 'RET'][i]}
                          </div>
                        ))}
                      </div>

                      {/* Row 3: Spacebar & Modifiers */}
                      <div className="flex items-center gap-0.5">
                        <span className="w-4 h-2.5 rounded-[1px] bg-[#1C2330] text-[5px] text-fg-subtle flex items-center justify-center border border-[#2B3547]">
                          CTRL
                        </span>
                        <div
                          className={`flex-1 h-2.5 rounded-[1px] text-[5.5px] font-mono flex items-center justify-center transition-all ${
                            activeKeyPulse === 99 || isTyping
                              ? 'bg-accent text-bg font-bold'
                              : 'bg-[#283344] text-fg-muted border border-[#36445B]'
                          }`}
                        >
                          SPACEBAR
                        </div>
                        <span className="w-4 h-2.5 rounded-[1px] bg-[#1C2330] text-[5px] text-fg-subtle flex items-center justify-center border border-[#2B3547]">
                          FN
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PRECISION PIXEL MOUSE */}
                  <div
                    className="relative w-6 h-9 sm:w-7 sm:h-10 bg-[#1A212E] rounded-t-lg rounded-b-md border border-[#2D384B] shadow-md flex flex-col items-center pt-1 group cursor-pointer hover:border-accent transition-colors"
                    onClick={() => handleKeyboardTap(99)}
                    title="Precision Optical Mouse"
                  >
                    {/* Mouse Split Line */}
                    <div className="w-0.5 h-2.5 bg-[#0F141C] absolute top-0" />
                    {/* Glowing Scroll Wheel */}
                    <div className="w-1.5 h-2.5 bg-accent rounded-full animate-pulse shadow-crt" />
                    {/* RGB Logo Dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/50 mt-2" />
                  </div>
                </div>
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
          <span>BATTLESTATION: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
