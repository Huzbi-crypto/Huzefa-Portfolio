'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Character, CharacterAction } from './Character';
import { CRTMonitor } from './CRTMonitor';
import { Desk } from './Desk';
import { Bookshelf } from './Bookshelf';
import { StarWindow } from './StarWindow';
import { useApp } from '@/context/AppContext';
import { ReadingItem } from '@/types/portfolio';
import { MANGA_SERIES_LIST, MANGA_DIALOGUES, CODING_DIALOGUES, MangaSeries } from '@/data/dialogues';
import { Clock, Moon, Sun, BookOpen } from 'lucide-react';

export interface RoomProps {
  onSelectProject?: (projectId: string) => void;
  className?: string;
}

export const Room: React.FC<RoomProps> = ({
  onSelectProject,
  className = '',
}) => {
  const { theme } = useApp();
  const [characterState, setCharacterState] = useState<CharacterAction>('idle');
  const [lampOn, setLampOn] = useState<boolean>(true);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [gazeOverride, setGazeOverride] = useState<{ x: number; y: number } | null>(null);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [activeMangaIndex, setActiveMangaIndex] = useState<number>(0);
  const [mangaQuoteIndices, setMangaQuoteIndices] = useState<Record<MangaSeries, number>>({
    'one-piece': 0,
    'naruto': 0,
    'bleach': 0,
    'black-clover': 0,
    'one-punch-man': 0,
  });
  const [codingThoughtIndex, setCodingThoughtIndex] = useState<number>(0);
  const [isDeskTyping, setIsDeskTyping] = useState<boolean>(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gazeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeBook, setActiveBook] = useState<ReadingItem | null>(null);
  const [mobileTab, setMobileTab] = useState<'crt' | 'bookshelf' | 'window'>('crt');
  const roomRef = useRef<HTMLDivElement | null>(null);

  // Track mouse coordinates across the room container and normalize to [-1, 1]
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setCursorPos({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCursorPos({ x: 0, y: 0 });
  }, []);

  // When a book is selected on the bookshelf, Huzbi starts reading; deselecting returns to idle
  const handleSelectBook = (book: ReadingItem | null) => {
    setActiveBook(book);
    setCharacterState(book ? 'reading' : 'idle');
  };

  // When typing on keyboard or in CRT, Huzbi starts typing!
  const handleActivity = (action: 'typing' | 'idle') => {
    setCharacterState(action);
  };

  // When user clicks Laptop or Keyboard: typing animation starts, eyes look at laptop, coding thought appears
  const handleLaptopOrKeyboardClick = useCallback(() => {
    setCharacterState('typing');
    setIsDeskTyping(true);
    setGazeOverride({ x: -0.7, y: 0.85 });

    const quote = CODING_DIALOGUES[codingThoughtIndex % CODING_DIALOGUES.length];
    setBubbleText(quote);
    setCodingThoughtIndex((prev) => (prev + 1) % CODING_DIALOGUES.length);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setCharacterState('idle');
      setIsDeskTyping(false);
    }, 2800);

    if (gazeTimerRef.current) clearTimeout(gazeTimerRef.current);
    gazeTimerRef.current = setTimeout(() => {
      setGazeOverride(null);
    }, 3200);
  }, [codingThoughtIndex]);

  // When user clicks Monitor: eyes look at monitor, screen cycles manga, manga quote appears (cycling versions)
  const handleMonitorClick = useCallback(() => {
    const currentMangaMeta = MANGA_SERIES_LIST[activeMangaIndex % MANGA_SERIES_LIST.length];
    const seriesId = currentMangaMeta.id;
    const quotes = MANGA_DIALOGUES[seriesId];
    const quoteIdx = mangaQuoteIndices[seriesId] % quotes.length;
    const selectedQuote = quotes[quoteIdx];

    setMangaQuoteIndices((prev) => ({
      ...prev,
      [seriesId]: (prev[seriesId] + 1) % quotes.length,
    }));

    setActiveMangaIndex((prev) => (prev + 1) % MANGA_SERIES_LIST.length);
    setCharacterState('looking');
    setGazeOverride({ x: 0.45, y: 0.35 });
    setBubbleText(selectedQuote);

    if (gazeTimerRef.current) clearTimeout(gazeTimerRef.current);
    gazeTimerRef.current = setTimeout(() => {
      setGazeOverride(null);
      setCharacterState('idle');
    }, 3200);
  }, [activeMangaIndex, mangaQuoteIndices]);

  const activeMangaId = MANGA_SERIES_LIST[activeMangaIndex % MANGA_SERIES_LIST.length].id;

  return (
    <div
      ref={roomRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-6xl mx-auto rounded-2xl border-2 border-border/80 bg-bg-deep shadow-2xl overflow-hidden select-none transition-colors duration-500 ${className}`}
    >
      {/* 2 AM ROOM AMBIENT LIGHTING SHADOW / LAMP GLOW LAYER */}
      <div
        className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-700"
        style={{
          background: lampOn
            ? 'radial-gradient(ellipse at 40% 65%, rgba(230, 161, 92, 0.18) 0%, rgba(11, 14, 20, 0.4) 70%, rgba(5, 7, 10, 0.75) 100%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(168, 214, 114, 0.08) 0%, rgba(6, 8, 12, 0.82) 65%, rgba(2, 3, 5, 0.95) 100%)',
        }}
      />

      {/* TOP ROOM STATUS STRIP */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-bg/90 backdrop-blur-md border-b border-border/70 text-xs font-mono">
        <div className="flex items-center gap-2 text-accent">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-crt" />
          <span className="font-bold tracking-wider">HUZBI&apos;S WORKSPACE</span>
          <span className="text-fg-muted text-[11px] hidden sm:inline">// 2 AM Quiet Session</span>
        </div>

        {/* Quick Character Action Controls */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-fg-muted hidden md:inline mr-1">Huzbi state:</span>
          {(['idle', 'typing', 'reading', 'looking'] as CharacterAction[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setCharacterState(st)}
              className={`px-2 py-0.5 rounded transition-all ${
                characterState === st
                  ? 'bg-accent text-bg font-bold shadow-crt'
                  : 'text-fg-muted hover:text-fg bg-bg-surface border border-border/50'
              }`}
            >
              {st === 'idle'
                ? '🛋️ Chill'
                : st === 'typing'
                ? '⌨️ Code'
                : st === 'reading'
                ? '📖 Manga'
                : '👀 Look'}
            </button>
          ))}

          {/* Lamp Toggle in Top Strip */}
          <button
            type="button"
            onClick={() => setLampOn(!lampOn)}
            className={`ml-2 px-2 py-0.5 rounded border text-[11px] flex items-center gap-1 transition-colors ${
              lampOn
                ? 'border-[#E6A15C] text-[#E6A15C] bg-[#E6A15C]/10'
                : 'border-border text-fg-subtle bg-bg-surface'
            }`}
            title="Toggle room ambient lamp"
          >
            {lampOn ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            <span className="hidden sm:inline">Lamp: {lampOn ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* MOBILE TAB CONTROLS (< md) */}
      <div className="flex md:hidden items-center justify-around bg-bg-surface/80 border-b border-border/60 p-1.5 text-xs font-mono relative z-20">
        <button
          type="button"
          onClick={() => setMobileTab('crt')}
          className={`flex-1 py-1 text-center rounded transition-colors ${
            mobileTab === 'crt' ? 'bg-accent text-bg font-bold' : 'text-fg-muted'
          }`}
        >
          CRT &amp; Desk
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('bookshelf')}
          className={`flex-1 py-1 text-center rounded transition-colors ${
            mobileTab === 'bookshelf' ? 'bg-accent text-bg font-bold' : 'text-fg-muted'
          }`}
        >
          Bookshelf
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('window')}
          className={`flex-1 py-1 text-center rounded transition-colors ${
            mobileTab === 'window' ? 'bg-accent text-bg font-bold' : 'text-fg-muted'
          }`}
        >
          Night Window
        </button>
      </div>

      {/* ROOM MAIN INTERIOR */}
      <div className="relative z-20 p-4 sm:p-6 lg:p-8">
        
        {/* DESKTOP SPATIAL ROOM COMPOSITION (hidden on mobile when not selected) */}
        <div className="hidden md:grid grid-cols-12 gap-6 items-end">
          
          {/* LEFT ZONE: NIGHT STAR WINDOW & RETRO POSTER */}
          <div className="col-span-4 flex flex-col items-center justify-between h-full space-y-6">
            {/* Retro Wall Clock */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bg-surface border border-border text-[11px] font-mono text-fg-muted">
              <Clock className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>02:14 AM // KARACHI, PK</span>
            </div>

            {/* Star Window Component */}
            <StarWindow theme={theme} className="w-full max-w-[260px]" />

            {/* Wall Poster (Anime / Systems Aesthetic) */}
            <div className="w-48 bg-[#181D26] p-2 rounded border border-[#263040] shadow-md rotate-[-2deg] select-none text-center">
              <div className="border border-dashed border-accent/40 p-2 rounded">
                <span className="text-[10px] font-mono text-accent font-bold tracking-widest block">
                  FAST-NUCES CS
                </span>
                <span className="text-[8px] font-mono text-fg-muted block mt-0.5">
                  SYSTEMS &bull; PACKETS &bull; AI
                </span>
              </div>
            </div>
          </div>

          {/* CENTER ZONE: CRT MONITOR, DESK, AND HUZBI CHARACTER */}
          <div className="col-span-5 flex flex-col items-center relative">
            {/* CRT Monitor positioned atop desk */}
            <div className="w-full relative z-10 -mb-6">
              <CRTMonitor
                onActivity={handleActivity}
                onSelectProject={onSelectProject}
              />
            </div>

            {/* Character Huzbi sitting right in front of the setup */}
            <div className="relative z-20 -mb-10 pointer-events-auto">
              <Character
                state={characterState}
                cursorPos={cursorPos}
                gazeOverride={gazeOverride}
                bubbleText={bubbleText}
                onStateChange={setCharacterState}
                isLampOn={lampOn}
              />
            </div>

            {/* Desk Surface with Battlestation (Laptop, Monitor, Keyboard, Mouse), Steaming Mug, and Lamp */}
            <div className="w-full relative z-0">
              <Desk
                lampOn={lampOn}
                onToggleLamp={() => setLampOn(!lampOn)}
                onLaptopClick={handleLaptopOrKeyboardClick}
                onKeyboardClick={handleLaptopOrKeyboardClick}
                onMonitorClick={handleMonitorClick}
                activeManga={activeMangaId}
                isTyping={isDeskTyping}
              />
            </div>
          </div>

          {/* RIGHT ZONE: WALL BOOKSHELF & MANGA STACK */}
          <div className="col-span-3 flex flex-col items-center justify-between h-full space-y-6">
            {/* Currently Reading Badge if active */}
            {activeBook ? (
              <div className="w-full p-2.5 rounded-lg bg-bg-surface border border-accent/70 text-xs font-mono">
                <div className="text-[10px] text-accent font-bold flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  <span>HUZBI IS READING:</span>
                </div>
                <div className="text-fg font-bold truncate mt-0.5">{activeBook.title}</div>
              </div>
            ) : (
              <div className="text-[11px] font-mono text-fg-muted text-center italic">
                &ldquo;quiet hours, favorite stories&rdquo;
              </div>
            )}

            {/* Bookshelf Component */}
            <Bookshelf onSelectBook={handleSelectBook} className="w-full" />

            {/* Small floor decoration: Cable spool or headphone stand */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-fg-subtle">
              <span className="w-2 h-2 rounded-full bg-accent/30" />
              <span>TERMINAL READY (TTY1)</span>
            </div>
          </div>
        </div>

        {/* MOBILE STACKED LINEAR COMPOSITION (< md) */}
        <div className="md:hidden flex flex-col items-center space-y-6">
          {mobileTab === 'crt' && (
            <div className="w-full flex flex-col items-center space-y-4">
              <CRTMonitor
                onActivity={handleActivity}
                onSelectProject={onSelectProject}
                className="w-full max-w-sm"
              />
              <Character
                state={characterState}
                cursorPos={cursorPos}
                gazeOverride={gazeOverride}
                bubbleText={bubbleText}
                onStateChange={setCharacterState}
                isLampOn={lampOn}
              />
              <Desk
                lampOn={lampOn}
                onToggleLamp={() => setLampOn(!lampOn)}
                onLaptopClick={handleLaptopOrKeyboardClick}
                onKeyboardClick={handleLaptopOrKeyboardClick}
                onMonitorClick={handleMonitorClick}
                activeManga={activeMangaId}
                isTyping={isDeskTyping}
              />
            </div>
          )}

          {mobileTab === 'bookshelf' && (
            <div className="w-full flex flex-col items-center space-y-4">
              <Bookshelf onSelectBook={handleSelectBook} className="w-full" />
              <div className="p-2.5 rounded-lg bg-bg-surface border border-border text-xs font-mono text-fg-muted text-center">
                Huzbi&apos;s Reading Stack &bull; 2:00 AM Shelf
              </div>
            </div>
          )}

          {mobileTab === 'window' && (
            <div className="w-full flex flex-col items-center space-y-4">
              <StarWindow theme={theme} />
              <div className="text-xs font-mono text-fg-muted text-center">
                2:00 AM Night Window &bull; Karachi, Pakistan
              </div>
            </div>
          )}
        </div>

        {/* ROOM BOTTOM WOODEN FLOOR BASEBOARD */}
        <div className="mt-8 pt-3 border-t-2 border-[#251D18] flex flex-wrap items-center justify-between text-[11px] font-mono text-fg-subtle gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3D3025]" />
            <span>ROOM AUDIO: LO-FI RAIN &bull; 2 AM AMBIENCE</span>
          </div>
          <div className="flex items-center gap-3">
            <span>MOUSE INTERACTION ACTIVE</span>
            <span className="text-accent font-bold">[ONLINE]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
