'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Theme } from '@/types/portfolio';
import {
  Terminal,
  Menu,
  X,
  ChevronDown,
  Check,
  Tv,
} from 'lucide-react';

interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'GitHub', href: '/github/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
];

const THEME_OPTIONS: { id: Theme; label: string; dotColor: string }[] = [
  { id: 'cozy-crt', label: 'Cozy CRT', dotColor: 'bg-[#A8D672]' },
  { id: 'warm-apartment', label: 'Warm Apartment', dotColor: 'bg-[#D9825B]' },
  { id: 'moonlit-terminal', label: 'Moonlit Terminal', dotColor: 'bg-[#73B7FF]' },
];

export default function Navbar() {
  const pathname = usePathname();
  const {
    theme,
    setTheme,
    toggleTerminal,
    isTerminalOpen,
    crtEffect,
    toggleCrtEffect,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setThemeDropdownOpen(false);
      }
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[data-mobile-toggle]')
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setThemeDropdownOpen(false);
  }, [pathname]);

  // Close menus on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setThemeDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    // Match either exact or with trailing slash
    const normalizedHref = href.replace(/\/$/, '');
    const normalizedPath = pathname.replace(/\/$/, '');
    return normalizedPath === normalizedHref || normalizedPath.startsWith(normalizedHref + '/');
  };

  const currentThemeMeta = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-bg/90 backdrop-blur-md transition-colors duration-200">
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 h-14 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md py-1 px-1.5 -ml-1.5 transition-colors"
          aria-label="Huzbi Digital Room Home"
        >
          <div className="relative flex items-center justify-center w-6 h-6 rounded bg-bg-surface border border-border group-hover:border-accent transition-colors">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-subtle shadow-crt" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold tracking-wider text-fg group-hover:text-accent transition-colors">
              <span>HUZBI</span>
              <span className="text-accent/80 font-light">//</span>
              <span className="text-xs text-fg-muted font-normal hidden xs:inline">ROOM</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center space-x-1 lg:space-x-2 font-mono text-xs"
          aria-label="Main Navigation"
        >
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3 py-1.5 rounded-md transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? 'text-accent bg-bg-surface border border-border font-semibold shadow-crt'
                    : 'text-fg-muted hover:text-fg hover:bg-bg-surface/50 border border-transparent'
                }`}
              >
                {active && (
                  <span className="inline-block mr-1.5 text-accent animate-pulse">
                    &gt;
                  </span>
                )}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Terminal Button, Theme Selector, Mobile Hamburger */}
        <div className="flex items-center gap-2">
          {/* Terminal Launcher Button */}
          <button
            type="button"
            onClick={toggleTerminal}
            className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isTerminalOpen
                ? 'bg-accent text-bg border-accent font-bold shadow-crt'
                : 'bg-bg-surface hover:bg-bg-hover text-accent border-border hover:border-accent/60'
            }`}
            title="Open Retro Terminal (Ctrl+`)"
            aria-label={`Toggle Retro Terminal (shortcut Ctrl+\`), currently ${
              isTerminalOpen ? 'open' : 'closed'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-semibold">&gt;_ CLI</span>
            <kbd className="hidden lg:inline-block text-[10px] px-1 py-0.2 rounded bg-bg-deep border border-border/80 text-fg-muted">
              Ctrl+`
            </kbd>
          </button>

          {/* Theme Dropdown / Cycler */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setThemeDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-bg-surface hover:bg-bg-hover border border-border hover:border-accent/50 text-xs font-mono text-fg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-haspopup="true"
              aria-expanded={themeDropdownOpen}
              aria-label={`Select theme, current theme: ${currentThemeMeta.label}`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${currentThemeMeta.dotColor} shadow-crt`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline font-medium">
                {currentThemeMeta.label}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-fg-muted transition-transform duration-200 ${
                  themeDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {themeDropdownOpen && (
              <div
                className="absolute right-0 mt-1.5 w-48 rounded-lg bg-bg-surface border border-border shadow-crt p-1.5 z-[60] animate-in fade-in slide-in-from-top-1 font-mono text-xs"
                role="menu"
                aria-orientation="vertical"
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-fg-muted font-semibold border-b border-border/50 mb-1">
                  Palette Selection
                </div>
                {THEME_OPTIONS.map((item) => {
                  const isSelected = item.id === theme;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setTheme(item.id);
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                        isSelected
                          ? 'bg-accent/15 text-accent font-semibold'
                          : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${item.dotColor}`}
                          aria-hidden="true"
                        />
                        <span>{item.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                    </button>
                  );
                })}

                {/* CRT Scanline Toggle in Dropdown */}
                <div className="border-t border-border/50 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleCrtEffect()}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <Tv className="w-3.5 h-3.5 text-accent-secondary" />
                      <span>CRT Scanlines</span>
                    </div>
                    <span className="font-mono text-[10px] text-accent">
                      {crtEffect ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            data-mobile-toggle
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden flex items-center justify-center p-2 rounded-md bg-bg-surface hover:bg-bg-hover border border-border text-fg-muted hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4 text-accent" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-border/80 bg-bg-deep/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200"
          role="region"
          aria-label="Mobile Navigation"
        >
          {/* Navigation Links */}
          <div className="grid grid-cols-1 gap-1 font-mono text-sm">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-accent/15 text-accent font-semibold border border-accent/30'
                      : 'text-fg-muted hover:text-fg hover:bg-bg-surface'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="flex items-center gap-2">
                    {active ? (
                      <span className="text-accent">&gt;</span>
                    ) : (
                      <span className="text-fg-subtle">#</span>
                    )}
                    {link.label}
                  </span>
                  {active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-mono uppercase">
                      Active
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile Terminal Action & Quick Controls */}
          <div className="pt-2 border-t border-border/60 flex flex-col gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                toggleTerminal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-bg-surface hover:bg-bg-hover text-accent border border-accent/40 font-semibold shadow-crt transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Retro Terminal</span>
            </button>

            {/* Quick CRT Scanline Toggle */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-surface border border-border text-fg-muted">
              <span className="flex items-center gap-2">
                <Tv className="w-3.5 h-3.5 text-accent-secondary" />
                <span>CRT Scanlines</span>
              </span>
              <button
                type="button"
                onClick={toggleCrtEffect}
                className="px-2 py-1 rounded bg-bg-deep border border-border text-accent font-semibold hover:border-accent transition-colors"
              >
                {crtEffect ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
