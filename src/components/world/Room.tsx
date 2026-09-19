'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character, CharacterAction } from './Character';
import { CRTMonitor } from './CRTMonitor';
import { Desk } from './Desk';
import { Bookshelf } from './Bookshelf';
import { StarWindow } from './StarWindow';
import {
  FairyLights,
  SleepingCat,
  RoomRug,
  FloorMonstera,
  FloorPCTower,
  WallCorkboard,
  FloorMangaStack,
} from './CozyDecor';
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
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeBook, setActiveBook] = useState<ReadingItem | null>(null);
  const [mobileTab, setMobileTab] = useState<'crt' | 'bookshelf' | 'window'>('crt');
  const roomRef = useRef<HTMLDivElement | null>(null);

  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (gazeTimerRef.current) clearTimeout(gazeTimerRef.current);
    };
  }, []);

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

  // When user clicks the avatar directly, clear any external device bubble override
  const handleAvatarClick = useCallback(() => {
    setBubbleText(null);
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current);
    }
  }, []);

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

    // Auto-clear bubbleText after 4500ms so avatar returns to quiet state and general thoughts
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      setBubbleText(null);
    }, 4500);
  }, [codingThoughtIndex]);

  // When user clicks Monitor: advance manga first so screen art and quote are 100% in lockstep
  const handleMonitorClick = useCallback(() => {
    const nextIndex = (activeMangaIndex + 1) % MANGA_SERIES_LIST.length;
    setActiveMangaIndex(nextIndex);

    const nextMangaMeta = MANGA_SERIES_LIST[nextIndex];
    const seriesId = nextMangaMeta.id;
    const quotes = MANGA_DIALOGUES[seriesId];
    const quoteIdx = (mangaQuoteIndices[seriesId] ?? 0) % quotes.length;
    const selectedQuote = quotes[quoteIdx];

    setMangaQuoteIndices((prev) => ({
      ...prev,
      [seriesId]: ((prev[seriesId] ?? 0) + 1) % quotes.length,
    }));

    setCharacterState('looking');
    setGazeOverride({ x: 0.45, y: 0.35 });
    setBubbleText(selectedQuote);

    // Auto-clear bubbleText after 4500ms
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => {
      setBubbleText(null);
    }, 4500);

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
      className={`relative w-full max-w-[1700px] mx-auto rounded-2xl border-2 border-border/80 bg-bg-deep shadow-2xl overflow-hidden select-none transition-colors duration-500 ${className}`}
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

      {/* ROOM WALL TEXTURE: Subtle vertical acoustic wood slats behind battlestation */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(90deg,transparent,transparent_28px,rgba(255,255,255,0.015)_28px,rgba(255,255,255,0.015)_30px)]" />

      {/* ROOM WOODEN FLOORING PLANE (Bottom section of room) */}
      <div className="absolute bottom-0 inset-x-0 h-44 sm:h-48 bg-gradient-to-b from-[#181310] via-[#140F0D] to-[#0D0A08] border-t-2 border-[#332419] pointer-events-none opacity-95">
        {/* Wood Plank Grooves */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_22px,rgba(0,0,0,0.4)_22px,rgba(0,0,0,0.4)_24px)] opacity-60" />
        {/* Subtle vertical plank joint offsets */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_160px,rgba(255,255,255,0.012)_160px,rgba(255,255,255,0.012)_162px)] opacity-30" />
      </div>

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

      {/* FAIRY STRING LIGHTS GARLAND ACROSS CEILING */}
      <div className="relative z-20 px-2 sm:px-6 -mb-4 sm:-mb-6 pointer-events-none">
        <FairyLights />
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
          Bookshelf &amp; Cat
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
        
        {/* DESKTOP SPATIAL ROOM COMPOSITION */}
        <div className="hidden md:grid grid-cols-12 gap-4 lg:gap-6 items-end">
          
          {/* LEFT ZONE: NIGHT WINDOW, WALL CORKBOARD, CLOCK & FLOOR MONSTERA */}
          <div className="col-span-3 flex flex-col items-center justify-between h-full space-y-4">
            {/* Retro Wall Clock */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bg-surface border border-border text-[11px] font-mono text-fg-muted shadow-sm">
              <Clock className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>02:14 AM // KARACHI, PK</span>
            </div>

            {/* Star Window Component (Curtains & Brass Rod) */}
            <StarWindow theme={theme} className="w-full max-w-[280px]" />

            {/* Wall Corkboard (Pinned Notes, Polaroid, Arch Notes) */}
            <WallCorkboard className="w-full max-w-[240px]" />

            {/* Floor Monstera Plant sitting on wooden floorboards */}
            <div className="w-full flex items-end justify-center pt-2">
              <FloorMonstera />
            </div>
          </div>

          {/* CENTER ZONE: CRT MONITOR, DESK, HUZBI, WOVEN RUG & FLOOR PC TOWER */}
          <div className="col-span-6 flex flex-col items-center relative">
            {/* CRT Monitor positioned atop desk riser */}
            <div className="w-full max-w-lg relative z-10 -mb-8">
              <CRTMonitor
                onActivity={handleActivity}
                onSelectProject={onSelectProject}
              />
            </div>

            {/* Character Huzbi sitting directly behind the desk */}
            <div className="relative z-20 -mb-12 pointer-events-auto">
              <Character
                state={characterState}
                cursorPos={cursorPos}
                gazeOverride={gazeOverride}
                bubbleText={bubbleText}
                onAvatarClick={handleAvatarClick}
                onStateChange={setCharacterState}
                isLampOn={lampOn}
              />
            </div>

            {/* Desk Surface with Battlestation (Laptop, Monitor, Keyboard, Mouse, Lamp, Chai) */}
            <div className="w-full relative z-30">
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

            {/* Floor Under Desk: Artisanal Woven Rug & Floor PC Workstation */}
            <div className="w-full relative z-20 mt-1 flex items-center justify-between px-2 sm:px-4">
              {/* Floor PC Workstation Tower to the left of chair */}
              <div className="relative z-30 -mt-2">
                <FloorPCTower />
              </div>

              {/* Bohemian Woven Area Rug Centered Under Desk & Chair */}
              <div className="flex-1 -mx-6 relative z-10">
                <RoomRug />
              </div>

              {/* Right floor spacer for balance */}
              <div className="w-14 sm:w-16" />
            </div>
          </div>

          {/* RIGHT ZONE: WALL BOOKSHELF WITH TRAILING IVY, SLEEPING CAT & MANGA STACK */}
          <div className="col-span-3 flex flex-col items-center justify-between h-full space-y-4">
            {/* Currently Reading Badge if active */}
            {activeBook ? (
              <div className="w-full p-2.5 rounded-lg bg-bg-surface border border-accent/70 text-xs font-mono shadow-md">
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

            {/* Bookshelf Component (13 Volumes, Trailing Pothos Ivy, Wall Brackets) */}
            <Bookshelf onSelectBook={handleSelectBook} className="w-full" />

            {/* Floor Zone: Sleeping Pixel Cat & Manga Volume Stack with Steaming Chai */}
            <div className="w-full flex items-end justify-around pt-3">
              {/* Floor Manga Stack with steaming cup of chai */}
              <FloorMangaStack />

              {/* Sleeping Ginger/Calico Cat on tufted cushion */}
              <SleepingCat />
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
              <div className="relative z-20 -mb-10">
                <Character
                  state={characterState}
                  cursorPos={cursorPos}
                  gazeOverride={gazeOverride}
                  bubbleText={bubbleText}
                  onAvatarClick={handleAvatarClick}
                  onStateChange={setCharacterState}
                  isLampOn={lampOn}
                />
              </div>
              <div className="w-full relative z-30">
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
              <div className="w-full flex items-center justify-around pt-2">
                <FloorPCTower />
                <SleepingCat />
              </div>
            </div>
          )}

          {mobileTab === 'bookshelf' && (
            <div className="w-full flex flex-col items-center space-y-4">
              <Bookshelf onSelectBook={handleSelectBook} className="w-full" />
              <div className="flex items-center justify-around w-full pt-2">
                <FloorMangaStack />
                <SleepingCat />
              </div>
            </div>
          )}

          {mobileTab === 'window' && (
            <div className="w-full flex flex-col items-center space-y-4">
              <StarWindow theme={theme} />
              <WallCorkboard />
              <FloorMonstera />
            </div>
          )}
        </div>

        {/* ROOM BOTTOM WOODEN FLOOR BASEBOARD */}
        <div className="mt-6 pt-3 border-t-2 border-[#2D1F16] flex flex-wrap items-center justify-between text-[11px] font-mono text-fg-subtle gap-2 relative z-30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4A382A]" />
            <span>ROOM AUDIO: LO-FI RAIN &bull; 2 AM AMBIENCE</span>
          </div>
          <div className="flex items-center gap-3">
            <span>COMPANION: SLEEPING CAT [PURRING]</span>
            <span className="text-accent font-bold">[ONLINE]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
