'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Theme } from '@/types/portfolio';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  isTerminalOpen: boolean;
  openTerminal: () => void;
  closeTerminal: () => void;
  toggleTerminal: () => void;
  crtEffect: boolean;
  setCrtEffect: (enabled: boolean) => void;
  toggleCrtEffect: () => void;
}

const THEMES: Theme[] = ['cozy-crt', 'warm-apartment', 'moonlit-terminal'];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('cozy-crt');
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [crtEffect, setCrtEffect] = useState(true);

  // Sync theme with DOM and localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      try {
        localStorage.setItem('huzbi-theme', newTheme);
      } catch {
        // localStorage may be unavailable in private/incognito modes
      }
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const currentIndex = THEMES.indexOf(current);
      const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextTheme);
        try {
          localStorage.setItem('huzbi-theme', nextTheme);
        } catch {
          // Ignore storage errors
        }
      }
      return nextTheme;
    });
  }, []);

  const openTerminal = useCallback(() => setIsTerminalOpen(true), []);
  const closeTerminal = useCallback(() => setIsTerminalOpen(false), []);
  const toggleTerminal = useCallback(() => setIsTerminalOpen((prev) => !prev), []);
  const toggleCrtEffect = useCallback(() => setCrtEffect((prev) => !prev), []);

  // Initialize theme and CRT preference from localStorage on client mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('huzbi-theme') as Theme | null;
      if (savedTheme && THEMES.includes(savedTheme)) {
        setThemeState(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'cozy-crt');
      }

      const savedCrt = localStorage.getItem('huzbi-crt');
      if (savedCrt !== null) {
        setCrtEffect(savedCrt === 'true');
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Sync CRT state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('huzbi-crt', String(crtEffect));
    } catch {
      // Ignore storage errors
    }
  }, [crtEffect]);

  // Global keyboard shortcuts: Ctrl+` or Ctrl+~ to toggle terminal, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + ` (backtick) or Ctrl + ~ toggles terminal
      if (e.ctrlKey && (e.key === '`' || e.key === '~')) {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isTerminalOpen) {
        setIsTerminalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTerminalOpen]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        cycleTheme,
        isTerminalOpen,
        openTerminal,
        closeTerminal,
        toggleTerminal,
        crtEffect,
        setCrtEffect,
        toggleCrtEffect,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
