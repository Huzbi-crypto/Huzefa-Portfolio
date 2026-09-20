'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { ReadingItem } from '@/types/portfolio';
import { personalInfo } from '@/data/personal';
import { MANGA_SERIES_LIST, MANGA_DIALOGUES, CODING_DIALOGUES, MangaSeries } from '@/data/dialogues';
import { AvatarHotspotId } from '@/types/avatar';
import { useAvatarMotion } from '@/hooks/useAvatarMotion';
import { PanoramicRoomStage } from './PanoramicRoomStage';
import { Clock, Moon, Sun, BookOpen, Monitor, Laptop, Heart, Eye, Armchair, Tv } from 'lucide-react';

export interface RoomProps {
  onSelectProject?: (projectId: string) => void;
  className?: string;
}

export const Room: React.FC<RoomProps> = ({
  onSelectProject,
  className = '',
}) => {
  const { theme } = useApp();
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
  const [activeBook, setActiveBook] = useState<ReadingItem | null>(null);
  const roomRef = useRef<HTMLDivElement | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Avatar Spatial Movement Hook
  const {
    currentHotspotId,
    actionState,
    coords,
    facingRight,
    transitDuration,
    currentHotspot,
    moveToHotspot,
  } = useAvatarMotion({ initialHotspot: 'desk-monitor' });

  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
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

  // When user clicks the avatar directly: clear device override and let character cycle personal thoughts
  const handleAvatarClick = useCallback(() => {
    setBubbleText(null);
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
  }, []);

  // 1. CRT MONITOR CLICK: Huzbi walks to center desk, watches CRT terminal
  const handleMonitorClick = useCallback(() => {
    moveToHotspot('desk-monitor', () => {
      setGazeOverride({ x: 0, y: -0.3 });
      const crtThoughts = [
        "huzbi@room ~ $ running full system diagnostics... all green.",
        "38 repos and counting. late night commits hit different.",
        "retro trinitron crt scanlines give code an undefeated aesthetic.",
        "building compilers and simulating network routes at 2 AM.",
        "vintage crt glow... my favorite way to debug in the dark.",
      ];
      const thought = crtThoughts[Math.floor(Math.random() * crtThoughts.length)];
      setBubbleText(thought);

      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleText(null);
        setGazeOverride(null);
      }, 5000);
    });
  }, [moveToHotspot]);

  // 1.5 SECONDARY MANGA DISPLAY CLICK: Huzbi walks over to right monitor (x: 65.5%), cycles manga series & dialogues
  const handleMangaDisplayClick = useCallback(() => {
    moveToHotspot('manga-display', () => {
      setGazeOverride({ x: 0.1, y: -0.3 });
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

      setBubbleText(selectedQuote);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleText(null);
        setGazeOverride(null);
      }, 5000);
    });
  }, [activeMangaIndex, mangaQuoteIndices, moveToHotspot]);

  // 2. LAPTOP CLICK: Huzbi walks to left workstation, types rapidly, and generates coding reflections
  const handleLaptopClick = useCallback(() => {
    moveToHotspot('desk-laptop', () => {
      setGazeOverride({ x: -0.6, y: 0.2 });
      const quote = CODING_DIALOGUES[codingThoughtIndex % CODING_DIALOGUES.length];
      setBubbleText(quote);
      setCodingThoughtIndex((prev) => (prev + 1) % CODING_DIALOGUES.length);

      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleText(null);
        setGazeOverride(null);
      }, 5000);
    });
  }, [codingThoughtIndex, moveToHotspot]);

  // 3. BOOKSHELF CLICK: Huzbi walks to right bookcase, takes out volume, and reads with open pages
  const handleBookshelfClick = useCallback(
    (book: ReadingItem) => {
      moveToHotspot('bookshelf-stand', () => {
        setActiveBook(book);
        setGazeOverride({ x: 0.5, y: 0.3 });
        setBubbleText(`Reading ${book.title}: "${book.note || 'Masterpiece.'}"`);

        if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = setTimeout(() => {
          setBubbleText(null);
          setGazeOverride(null);
        }, 5200);
      });
    },
    [moveToHotspot]
  );

  // 4. CAT MASCOT CLICK: Huzbi walks to the armchair/rug, crouches down, and pets the sleeping cat
  const handleCatClick = useCallback(() => {
    moveToHotspot('mascot-pet', () => {
      setGazeOverride({ x: 0.5, y: 0.5 });
      const catReactions = [
        "*purrrrrr...* Huzbi sits down and scratches behind tiny ears ♥",
        "*soft purr...* the cat stretches tiny paws and curls into Huzbi's hand.",
        "*purr-purr...* the 2 AM compiler hum is the best lullaby.",
        "*meow...* purrs softly as Huzbi pets the warm calico coat.",
      ];
      const reaction = catReactions[Math.floor(Math.random() * catReactions.length)];
      setBubbleText(reaction);

      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleText(null);
        setGazeOverride(null);
      }, 5000);
    });
  }, [moveToHotspot]);

  // 5. WINDOW CLICK: Huzbi steps up to the panoramic window and gazes out into the 2 AM Karachi sky
  const handleWindowClick = useCallback(() => {
    moveToHotspot('window-gaze', () => {
      setGazeOverride({ x: -0.6, y: -0.6 });
      const windowThoughts = [
        "Karachi skyline at 2 AM... the city is quiet, stars are sharp.",
        "Late night breeze through the window. Perfect coding weather.",
        "Looking out at the distant radio spire... packets traversing the night.",
        "Clear night sky. Taking a quiet breather before the next build.",
      ];
      const thought = windowThoughts[Math.floor(Math.random() * windowThoughts.length)];
      setBubbleText(thought);

      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleText(null);
        setGazeOverride(null);
      }, 5000);
    });
  }, [moveToHotspot]);

  // 6. SOFA CLICK: Huzbi walks to the comfy sofa, sits down, closes eyes, and hums to lo-fi beats
  const handleSofaClick = useCallback(() => {
    moveToHotspot('sofa-chill', () => {
      setGazeOverride({ x: 0, y: 0.1 });
      const hummingThoughts = [
        "~ *hmmmm~ hmmm~* nodding along to late-night lo-fi beats ♪ ♫",
        "♪ ♫ *dum da dum~* eyes closed, soul at peace on this comfy couch.",
        "~ ♬ humming favorite anime theme... sound is crisp on these headphones.",
        "♪ ♫ ~ cozy 2 AM playlist on loop. good music, warm room.",
        "~ ♩ hmmmm... sinking into the cushions, just pure comfort.",
      ];
      const thought = hummingThoughts[Math.floor(Math.random() * hummingThoughts.length)];
      setBubbleText(thought);

      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleText(null);
        setGazeOverride(null);
      }, 5500);
    });
  }, [moveToHotspot]);

  // Quick navigation dispatcher from top strip
  const handleQuickNav = (hotspotId: AvatarHotspotId) => {
    switch (hotspotId) {
      case 'sofa-chill':
        handleSofaClick();
        break;
      case 'desk-monitor':
        handleMonitorClick();
        break;
      case 'manga-display':
        handleMangaDisplayClick();
        break;
      case 'desk-laptop':
        handleLaptopClick();
        break;
      case 'bookshelf-stand':
        if (personalInfo.readingList.length > 0) {
          handleBookshelfClick(personalInfo.readingList[0]);
        }
        break;
      case 'mascot-pet':
        handleCatClick();
        break;
      case 'window-gaze':
        handleWindowClick();
        break;
      case 'idle-chill':
      default:
        moveToHotspot('sofa-chill');
        break;
    }
  };

  const activeMangaId = MANGA_SERIES_LIST[activeMangaIndex % MANGA_SERIES_LIST.length].id;

  return (
    <div
      ref={roomRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-[1700px] mx-auto rounded-2xl border-2 border-border/80 bg-[#161220] shadow-2xl overflow-hidden select-none transition-colors duration-500 ${className}`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP ROOM CONTROL STRIP                                                 */}
      {/* ========================================================================= */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-bg/90 backdrop-blur-md border-b border-border/70 text-xs font-mono">
        {/* Left: Location & Mode Status */}
        <div className="flex items-center gap-2 text-accent">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-crt" />
          <span className="font-bold tracking-wider">HUZBI&apos;S WORKSPACE</span>
          <span className="text-fg-muted text-[11px] hidden sm:inline">// 2 AM Retro Sanctuary</span>
        </div>

        {/* Center / Right: Interactive Avatar Action Hotspot Buttons */}
        <div className="flex items-center gap-1 text-[11px] flex-wrap">
          <span className="text-fg-muted hidden md:inline mr-1">Navigate Huzbi:</span>
          {[
            { id: 'sofa-chill', icon: Armchair, label: 'Comfy Sofa' },
            { id: 'desk-monitor', icon: Monitor, label: 'CRT Screen' },
            { id: 'manga-display', icon: Tv, label: 'Manga Screen' },
            { id: 'desk-laptop', icon: Laptop, label: 'Laptop' },
            { id: 'bookshelf-stand', icon: BookOpen, label: 'Bookshelf' },
            { id: 'mascot-pet', icon: Heart, label: 'Pet Cat' },
            { id: 'window-gaze', icon: Eye, label: 'Night Window' },
          ].map((item) => {
            const isActive = currentHotspotId === item.id;
            const IconComponent = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleQuickNav(item.id as AvatarHotspotId)}
                className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-accent text-bg font-bold shadow-crt'
                    : 'text-fg-muted hover:text-fg bg-bg-surface border border-border/50'
                }`}
                title={`Move Huzbi to ${item.label}`}
              >
                <IconComponent className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}

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

      {/* ========================================================================= */}
      {/* 2. MASTER PANORAMIC ROOM STAGE CANVAS (Inspired by Reference Image)       */}
      {/* ========================================================================= */}
      <PanoramicRoomStage
        theme={theme}
        lampOn={lampOn}
        activeManga={activeMangaId}
        actionState={actionState}
        currentHotspot={currentHotspot}
        coords={coords}
        facingRight={facingRight}
        transitDuration={transitDuration}
        cursorPos={cursorPos}
        gazeOverride={gazeOverride}
        bubbleText={bubbleText}
        onAvatarClick={handleAvatarClick}
        onMonitorClick={handleMonitorClick}
        onMangaDisplayClick={handleMangaDisplayClick}
        onLaptopClick={handleLaptopClick}
        onBookshelfClick={handleBookshelfClick}
        onCatClick={handleCatClick}
        onWindowClick={handleWindowClick}
        onSofaClick={handleSofaClick}
        onSelectProject={onSelectProject}
      />

      {/* ========================================================================= */}
      {/* 3. BOTTOM ROOM STATUS BASEBOARD                                           */}
      {/* ========================================================================= */}
      <div className="px-4 py-2 bg-[#120D1A] border-t-2 border-[#2D1F35] flex flex-wrap items-center justify-between text-[11px] font-mono text-fg-subtle gap-2 relative z-30">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-accent" />
          <span>KARACHI // 02:14 AM &bull; LO-FI RAIN</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-fg-muted">
            Huzbi is currently:{' '}
            <strong className="text-accent uppercase font-bold">{actionState}</strong> at{' '}
            <span className="text-fg">{currentHotspot.label}</span>
            {activeBook && actionState === 'reading' && (
              <span className="text-accent-secondary ml-1.5">// &ldquo;{activeBook.title}&rdquo;</span>
            )}
            {actionState === 'humming' && (
              <span className="text-accent-secondary ml-1.5">// &ldquo;listening to lo-fi beats&rdquo; ♪ ♫</span>
            )}
          </span>
          <span className="text-accent font-bold">[ONLINE]</span>
        </div>
      </div>
    </div>
  );
};
