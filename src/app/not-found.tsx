'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Terminal, Home, Layers } from 'lucide-react';

export default function NotFound() {
  const { openTerminal } = useApp();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full p-6 sm:p-8 rounded-2xl bg-bg-surface border-2 border-border shadow-crt text-center font-mono space-y-6">
        {/* Retro CRT Status Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3 text-xs text-fg-muted">
          <div className="flex items-center gap-2 text-accent">
            <Terminal className="w-3.5 h-3.5" />
            <span>ERR_404_NOT_FOUND</span>
          </div>
          <span>2:00 AM QUIET MODE</span>
        </div>

        {/* Pixel Art 404 Illustration */}
        <div className="py-2">
          <div className="text-6xl sm:text-7xl font-bold tracking-widest text-accent drop-shadow-md">
            404
          </div>
          <div className="text-xs text-accent-secondary mt-1">
            [ COORDINATE VOID // SECTOR UNMAPPED ]
          </div>
        </div>

        {/* Chill Copywriting */}
        <div className="space-y-2">
          <h1 className="text-lg sm:text-xl font-bold text-fg font-sans">
            Nothing here yet.
          </h1>
          <p className="text-xs sm:text-sm text-fg-muted font-sans leading-relaxed">
            I probably got distracted reading manga, configuring a packet routing simulator, or tweaking CRT phosphor shaders at 2 AM.
          </p>
        </div>

        {/* Helpful Action Buttons */}
        <div className="pt-4 border-t border-border/70 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-bg font-bold text-xs shadow-crt hover:opacity-90 transition-opacity"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Room</span>
          </Link>

          <Link
            href="/projects/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bg-deep hover:bg-bg-hover text-fg border border-border text-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-accent-secondary" />
            <span>Projects Lab</span>
          </Link>

          <button
            type="button"
            onClick={openTerminal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bg-deep hover:bg-bg-hover text-accent border border-accent/40 text-xs transition-colors"
            title="Launch Terminal"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>CLI Shell</span>
          </button>
        </div>
      </div>
    </div>
  );
}
