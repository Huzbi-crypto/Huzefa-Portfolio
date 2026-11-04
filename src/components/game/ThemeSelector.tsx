'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PALETTES } from '@/game/art/palette';
import type { Theme } from '@/types/portfolio';

export interface ThemeSelectorProps {
  currentTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  crtEffect?: boolean;
  onToggleCrt?: () => void;
  className?: string;
}

type ThemeMeta = {
  id: Theme;
  name: string;
  short: string;
};

const THEMES: ThemeMeta[] = [
  { id: 'cozy-crt', name: 'Cozy CRT', short: 'Phosphor midnight' },
  { id: 'warm-apartment', name: 'Warm Apartment', short: 'Terracotta afternoon' },
  { id: 'moonlit-terminal', name: 'Moonlit Terminal', short: 'Cool blue starlight' },
];

/** The five palette roles that best tell the three themes apart at a glance. */
const SWATCH_KEYS = ['a', 'c', 'g', 'n', 'r'] as const;

function paletteVars(theme: Theme): React.CSSProperties {
  const palette = PALETTES[theme];
  return {
    '--ts-ink': palette.a,
    '--ts-panel': palette.b,
    '--ts-line': palette.q,
    '--ts-text': palette.C,
    '--ts-amber': palette.r,
    '--ts-amber-hi': palette.s,
  } as React.CSSProperties;
}

/**
 * The room's light switch: three real palettes, a visible selected state, and
 * the CRT scanlines. Buttons only, so keyboard and touch both work, and no
 * colour is the only signal.
 */
export function ThemeSelector({
  currentTheme,
  onThemeChange,
  crtEffect,
  onToggleCrt,
  className = '',
}: ThemeSelectorProps) {
  const app = useApp();
  const active = currentTheme ?? app.theme ?? 'cozy-crt';
  const setTheme = onThemeChange ?? app.setTheme;
  const crtOn = crtEffect ?? app.crtEffect ?? true;
  const toggleCrt = onToggleCrt ?? app.toggleCrtEffect;

  return (
    <div
      className={`theme-selector ${className}`.trim()}
      role="group"
      aria-label="Room light and screen"
      style={paletteVars(active)}
    >
      <p className="theme-selector-label" aria-hidden="true">
        Room light
      </p>

      <div className="theme-options">
        {THEMES.map((theme) => {
          const selected = theme.id === active;
          const palette = PALETTES[theme.id];
          return (
            <button
              key={theme.id}
              type="button"
              data-theme-id={theme.id}
              aria-pressed={selected}
              className="theme-option"
              style={paletteVars(theme.id)}
              onClick={() => setTheme(theme.id)}
              title={`${theme.name}: ${theme.short}`}
            >
              <span className="theme-swatches" aria-hidden="true">
                {SWATCH_KEYS.map((key) => (
                  <span
                    key={key}
                    className="theme-swatch"
                    data-swatch={palette[key]}
                    style={{ backgroundColor: palette[key] }}
                  />
                ))}
              </span>
              <span className="theme-option-text">
                <span className="theme-option-name">{theme.name}</span>
                <span className="theme-option-short">{theme.short}</span>
              </span>
              <span className="theme-option-mark" aria-hidden="true">
                {selected ? 'X' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="theme-crt"
        data-crt-toggle
        aria-pressed={crtOn}
        onClick={toggleCrt}
      >
        CRT lines {crtOn ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

export default ThemeSelector;
