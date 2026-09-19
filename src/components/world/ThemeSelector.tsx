'use client';

import React, { useState } from 'react';
import { Theme } from '@/types/portfolio';
import { useApp } from '@/context/AppContext';
import { Monitor, Check, Eye, Sliders } from 'lucide-react';

export interface ThemeSelectorProps {
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  crtEffect?: boolean;
  onToggleCrt?: () => void;
  className?: string;
}

interface ThemeMeta {
  id: Theme;
  title: string;
  tagline: string;
  vibe: string;
  colors: {
    bg: string;
    surface: string;
    accent: string;
    secondary: string;
  };
}

const THEMES_META: ThemeMeta[] = [
  {
    id: 'cozy-crt',
    title: 'Cozy CRT / Midnight',
    tagline: 'Phosphor green glow & late night hacker quiet',
    vibe: 'Nostalgic, warm phosphor, retro computing',
    colors: {
      bg: '#0B0E14',
      surface: '#19202B',
      accent: '#A8D672',
      secondary: '#E6A15C',
    },
  },
  {
    id: 'warm-apartment',
    title: 'Warm Pixel Apartment',
    tagline: 'Terracotta, warm timber & steaming tea',
    vibe: 'Indie illustrated game, cozy lived-in room',
    colors: {
      bg: '#171416',
      surface: '#2B2322',
      accent: '#D9825B',
      secondary: '#D6AE62',
    },
  },
  {
    id: 'moonlit-terminal',
    title: 'Moonlit Terminal',
    tagline: 'Celestial electric blue & quiet focus',
    vibe: 'Modern minimal, deep space, icy clarity',
    colors: {
      bg: '#080B10',
      surface: '#171E28',
      accent: '#73B7FF',
      secondary: '#A79BFF',
    },
  },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme: propTheme,
  onThemeChange: propOnThemeChange,
  crtEffect: propCrtEffect,
  onToggleCrt: propOnToggleCrt,
  className = '',
}) => {
  const appContext = useApp();
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  const activeTheme: Theme = propTheme ?? appContext.theme ?? 'cozy-crt';
  const handleThemeChange = propOnThemeChange ?? appContext.setTheme;
  const isCrtActive: boolean = propCrtEffect ?? appContext.crtEffect ?? true;
  const handleToggleCrt = propOnToggleCrt ?? appContext.toggleCrtEffect;

  return (
    <div className={`relative ${className}`}>
      {/* COMPACT TOP NAVIGATION BAR WIDGET */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-bg-surface p-1.5 rounded-lg border border-border shadow-sm">
        <span className="text-fg-muted px-1.5 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-accent" />
          <span className="hidden sm:inline">Theme:</span>
        </span>

        {/* Quick buttons */}
        <div className="flex items-center gap-1">
          {THEMES_META.map((t) => {
            const isActive = activeTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
                  isActive
                    ? 'bg-accent text-bg font-bold shadow-crt'
                    : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
                }`}
                title={`Switch to ${t.title}`}
              >
                {/* Micro Swatch Dot */}
                <span
                  className="w-2 h-2 rounded-full border border-black/20"
                  style={{ backgroundColor: t.colors.accent }}
                />
                <span className="truncate max-w-[90px] sm:max-w-none">
                  {t.id === 'cozy-crt'
                    ? 'Cozy CRT'
                    : t.id === 'warm-apartment'
                    ? 'Warm Apartment'
                    : 'Moonlit'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Side-by-side Compare Palette Trigger */}
        <button
          type="button"
          onClick={() => setShowCompareModal(!showCompareModal)}
          className={`px-2 py-1 rounded border text-[11px] flex items-center gap-1 transition-colors ${
            showCompareModal
              ? 'border-accent text-accent bg-accent/10'
              : 'border-border text-fg-muted hover:text-fg'
          }`}
          title="Compare all 3 palettes side-by-side"
        >
          <Sliders className="w-3 h-3" />
          <span className="hidden md:inline">Compare Palettes</span>
        </button>

        {/* Scanlines Toggle Switch */}
        <button
          type="button"
          onClick={handleToggleCrt}
          className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1.5 transition-colors ${
            isCrtActive
              ? 'border-accent text-accent bg-accent/10'
              : 'border-border text-fg-subtle hover:text-fg-muted'
          }`}
          title="Toggle CRT Scanline Effect"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCrtActive ? 'bg-accent shadow-crt' : 'bg-fg-subtle'
            }`}
          />
          <span>CRT Lines: {isCrtActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* SIDE-BY-SIDE PALETTE COMPARISON DRAWER / MODAL */}
      {showCompareModal && (
        <div className="mt-3 p-4 rounded-xl bg-bg-surface border-2 border-accent shadow-crt font-mono text-xs z-30 transition-all">
          <div className="flex items-center justify-between border-b border-border/70 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-accent" />
              <span className="font-bold text-fg">SIDE-BY-SIDE PALETTE EVALUATION</span>
              <span className="text-[10px] text-fg-muted">(As specified in design brief)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCompareModal(false)}
              className="px-2 py-0.5 rounded text-fg-muted hover:text-fg border border-border"
            >
              Close [✕]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {THEMES_META.map((t) => {
              const isSelected = activeTheme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  style={{ backgroundColor: t.colors.bg }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'border-accent shadow-crt scale-[1.02]'
                      : 'border-border hover:border-fg-muted/60 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs" style={{ color: t.colors.accent }}>
                        {t.title}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] text-accent bg-bg-surface px-1.5 py-0.5 rounded border border-border">
                          <Check className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-fg-muted mb-2">{t.tagline}</p>

                    {/* 4 Swatch Blocks */}
                    <div className="grid grid-cols-4 gap-1.5 my-2">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-full h-7 rounded border border-white/10"
                          style={{ backgroundColor: t.colors.bg }}
                        />
                        <span className="text-[8px] text-fg-subtle mt-0.5">BG</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div
                          className="w-full h-7 rounded border border-white/10"
                          style={{ backgroundColor: t.colors.surface }}
                        />
                        <span className="text-[8px] text-fg-subtle mt-0.5">SURF</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div
                          className="w-full h-7 rounded border border-white/10"
                          style={{ backgroundColor: t.colors.accent }}
                        />
                        <span className="text-[8px] text-fg-subtle mt-0.5">ACC</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div
                          className="w-full h-7 rounded border border-white/10"
                          style={{ backgroundColor: t.colors.secondary }}
                        />
                        <span className="text-[8px] text-fg-subtle mt-0.5">SEC</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full mt-2 py-1 rounded text-center text-[10px] font-bold border transition-colors"
                    style={{
                      backgroundColor: isSelected ? t.colors.accent : 'transparent',
                      color: isSelected ? t.colors.bg : t.colors.accent,
                      borderColor: t.colors.accent,
                    }}
                  >
                    {isSelected ? 'CURRENT SELECTION' : 'APPLY THEME'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
