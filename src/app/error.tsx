'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { JournalPage } from '@/components/journal/JournalPage';
import { SCENE } from '@/components/journal/journalArt';
import { journalText } from '@/components/journal/journalText';
import { PixelArt } from '@/components/journal/PixelArt';
import { PixelPanel } from '@/components/journal/PixelPanel';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled room exception:', error);
  }, [error]);

  const { title, lede, retry, toRoom, digest, art } = journalText.error;
  return (
    <JournalPage
      title={title}
      lede={lede}
      art={<PixelArt grid={SCENE.lamp} scale={8} label={art} />}
    >
      <PixelPanel as="section" aria-label="What to do next">
        <div className="j-stack">
          <div className="j-row">
            <button type="button" className="j-btn" onClick={() => reset()}>
              {retry}
            </button>
            <Link href="/" className="j-btn" data-kind="ghost">
              {toRoom}
            </Link>
          </div>
          {error.digest ? (
            <p className="j-muted">
              {digest}: {error.digest}
            </p>
          ) : null}
        </div>
      </PixelPanel>
    </JournalPage>
  );
}
