'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { journalText } from '@/components/journal/journalText';
import { loadProgress } from '@/game/state/progress';
import { starTotal } from '@/game/content/stars';

type Saved = { found: number; total: number };

/**
 * The door's label: a fresh visit says "play", a returning visitor sees what
 * they already found. Storage is read after mount, never during render, so
 * the server markup matches the first client paint.
 */
export function PlayDoor() {
  const [saved, setSaved] = useState<Saved | null>(null);

  useEffect(() => {
    // Storage access itself throws in privacy-restricted or sandboxed
    // contexts, before loadProgress can see the failure. Fall back to a
    // fresh visit so the door still works.
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    const progress = loadProgress(storage);
    if (progress.found.length > 0 || progress.doorOpened) {
      setSaved({ found: progress.found.length, total: starTotal() });
    }
  }, []);

  return (
    <div className="play-door">
      <Link href="/play/" className="j-btn play-door-link">
        {saved ? journalText.home.continue : journalText.home.play}
      </Link>
      <p className="play-door-save" aria-live="polite">
        {saved ? journalText.home.stars(saved.found, saved.total) : null}
      </p>
    </div>
  );
}
