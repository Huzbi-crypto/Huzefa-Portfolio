'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Radio, RefreshCw, Home } from 'lucide-react';
import { GithubIcon } from '@/components/icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for diagnostics
    console.error('Unhandled room exception:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 font-mono">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-bg-surface border-2 border-accent-secondary/50 shadow-crt text-center space-y-6">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3 text-xs text-fg-muted">
          <div className="flex items-center gap-2 text-accent-secondary">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>ROOM EXCEPTION TRACE</span>
          </div>
          <span>2:00 AM RECOVERY</span>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-accent-secondary/15 flex items-center justify-center text-accent-secondary border border-accent-secondary/40 text-xl font-bold">
            !
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-fg font-sans">
            Client state is taking a nap.
          </h1>
          <p className="text-xs sm:text-sm text-fg-muted font-sans leading-relaxed">
            Something tripped over a cable in Huzbi&apos;s digital apartment. You can retry the operation or jump back to the room.
          </p>
        </div>

        {/* Error Digest (if available) */}
        {error.digest && (
          <div className="p-2.5 rounded bg-bg-deep border border-border/60 text-[10px] text-fg-subtle truncate">
            Digest: {error.digest}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row gap-3 justify-center text-xs">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-bg font-bold shadow-crt hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bg-deep hover:bg-bg-hover text-fg border border-border transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-accent" />
            <span>Back to Room</span>
          </Link>

          <a
            href="https://github.com/Huzbi-crypto"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bg-deep hover:bg-bg-hover text-accent-secondary border border-border transition-colors"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>Direct GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
