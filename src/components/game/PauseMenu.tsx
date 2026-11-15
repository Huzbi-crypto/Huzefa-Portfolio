'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { copy } from '@/game/content/copy';
import { useFocusTrap } from './useFocusTrap';
import './game.css';

/**
 * The pause menu: a still frame of the room behind a hard-edged panel. Esc or
 * the Menu button opens it, Esc and Resume both close it, and Exit leaves the
 * save where the game already wrote it. The focus trap hands the keyboard back
 * to the game stage on close.
 */
export function PauseMenu({
  open,
  found,
  total,
  onResume,
}: {
  open: boolean;
  found: number;
  total: number;
  onResume: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(open, backdropRef, resumeRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onResume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onResume]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="pause-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onResume();
      }}
    >
      <div className="pause-panel px-panel">
        <h2 id="pause-title" className="pause-title">
          {copy.ui.pause.title}
        </h2>
        <p className="pause-body">{copy.ui.pause.body}</p>
        <p className="pause-stars">{copy.ui.pause.stars(found, total)}</p>

        <div className="pause-actions">
          <button
            ref={resumeRef}
            type="button"
            className="pause-resume"
            aria-label={copy.ui.pause.resumeLabel}
            onClick={onResume}
          >
            {copy.ui.pause.resume}
          </button>
          <Link href="/" className="pause-exit" aria-label={copy.ui.pause.exitLabel}>
            {copy.ui.pause.exit}
          </Link>
        </div>

        <p className="pause-saved">{copy.ui.pause.saved}</p>
      </div>
    </div>
  );
}
