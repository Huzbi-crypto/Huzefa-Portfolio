'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ICONS } from '@/components/journal/journalArt';
import { journalText } from '@/components/journal/journalText';
import { PixelArt } from '@/components/journal/PixelArt';
import '@/components/journal/journal.css';
import type { Theme } from '@/types/portfolio';

const NAV_LINKS = [
  { label: journalText.nav.room, href: '/' },
  { label: journalText.nav.projects, href: '/projects/' },
  { label: journalText.nav.github, href: '/github/' },
  { label: journalText.nav.about, href: '/about/' },
  { label: journalText.nav.contact, href: '/contact/' },
] as const;

const THEME_NAMES: Record<Theme, string> = {
  'cozy-crt': 'Cozy CRT',
  'warm-apartment': 'Warm Apartment',
  'moonlit-terminal': 'Moonlit Terminal',
};

/**
 * The navigation for every plain page. The home page is the game and carries
 * none. The links are real links, so they work with scripts off; the three
 * tools only appear once scripts are running, since they need them.
 */
export default function Navbar() {
  const pathname = usePathname();
  const { theme, cycleTheme, toggleTerminal, isTerminalOpen, crtEffect, toggleCrtEffect } = useApp();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  const isActive = (href: string): boolean => {
    if (href === '/') return pathname === '/';
    const base = href.replace(/\/$/, '');
    const path = pathname.replace(/\/$/, '');
    return path === base || path.startsWith(`${base}/`);
  };

  if (pathname === '/') return null;

  return (
    <header className="j-nav">
      <div className="j-nav-inner">
        <Link href="/" className="j-brand" aria-label={`${journalText.siteName}, home`}>
          <PixelArt grid={ICONS.lantern} scale={4} />
          <span>{journalText.siteName}</span>
        </Link>

        <nav className="j-tabs" aria-label={journalText.nav.label}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="j-tab"
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {ready ? (
          <div className="j-tools">
            <button
              type="button"
              className="j-tool"
              aria-pressed={isTerminalOpen}
              aria-label={journalText.tools.terminalLabel}
              onClick={toggleTerminal}
            >
              {journalText.tools.terminal}
            </button>
            <button
              type="button"
              className="j-tool"
              aria-label={`${journalText.tools.theme}: ${THEME_NAMES[theme]}. Press for the next one.`}
              onClick={cycleTheme}
            >
              {journalText.tools.theme}
            </button>
            <button
              type="button"
              className="j-tool"
              aria-pressed={crtEffect}
              aria-label={`${journalText.tools.crt} scanlines ${crtEffect ? journalText.tools.crtOn : journalText.tools.crtOff}`}
              onClick={toggleCrtEffect}
            >
              {journalText.tools.crt}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
