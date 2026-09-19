'use client';

import React, { useState, useEffect, useRef } from 'react';
import { personalInfo } from '@/data/personal';
import { ReadingItem } from '@/types/portfolio';
import { BookOpen, Sparkles, X } from 'lucide-react';

export interface BookshelfProps {
  onSelectBook?: (book: ReadingItem | null) => void;
  className?: string;
}

interface ShelfBookMeta {
  item: ReadingItem;
  height: number;
  width: number;
  spineColor: string;
  textColor: string;
  goldTrim?: boolean;
  code: string;
}

const BOOKS_DATA: ShelfBookMeta[] = [
  {
    item: personalInfo.readingList.find((b) => b.title.includes('One Piece')) || {
      title: 'One Piece',
      type: 'manga',
      author: 'Eiichiro Oda',
      status: 'favorite',
      note: 'The pinnacle of grand adventure, absurd worldbuilding, and pure freedom.',
    },
    height: 74,
    width: 23,
    spineColor: '#A82828',
    textColor: '#F5E8C7',
    goldTrim: true,
    code: 'ONE PIECE',
  },
  {
    item: personalInfo.readingList.find((b) => b.title.includes('Naruto')) || {
      title: 'Naruto',
      type: 'manga',
      author: 'Masashi Kishimoto',
      status: 'favorite',
      note: 'Tactical ninja combat and the stubborn resolve to never back down.',
    },
    height: 70,
    width: 21,
    spineColor: '#E67E22',
    textColor: '#FFFFFF',
    goldTrim: true,
    code: 'NARUTO',
  },
  {
    item: personalInfo.readingList.find((b) => b.title.includes('Bleach')) || {
      title: 'Bleach',
      type: 'manga',
      author: 'Tite Kubo',
      status: 'favorite',
      note: 'Peerless character drip, stylish paneling, and Bankai releases.',
    },
    height: 68,
    width: 20,
    spineColor: '#1A1D24',
    textColor: '#FFFFFF',
    goldTrim: false,
    code: 'BLEACH',
  },
  {
    item: personalInfo.readingList.find((b) => b.title.includes('Black Clover')) || {
      title: 'Black Clover',
      type: 'manga',
      author: 'Yūki Tabata',
      status: 'favorite',
      note: 'High-octane pacing, magic teamwork, and Asta\'s anti-magic hustle.',
    },
    height: 66,
    width: 20,
    spineColor: '#2B3D2E',
    textColor: '#E8E6DD',
    goldTrim: true,
    code: 'BLK CLOVER',
  },
  {
    item: personalInfo.readingList.find((b) => b.title.includes('One Punch Man')) || {
      title: 'One Punch Man',
      type: 'manga',
      author: 'ONE / Yusuke Murata',
      status: 'favorite',
      note: 'Yusuke Murata\'s god-tier visual spreads and hilarious subversion of superhero stakes.',
    },
    height: 67,
    width: 20,
    spineColor: '#E5A93C',
    textColor: '#1E1E1E',
    goldTrim: false,
    code: 'OPM',
  },
  {
    item: personalInfo.readingList.find((b) => b.title.includes('SICP')) || {
      title: 'Structure and Interpretation of Computer Programs (SICP)',
      type: 'tech',
      author: 'Harold Abelson & Gerald Jay Sussman',
      status: 'reading',
      note: 'Foundational mental models on computation and abstraction.',
    },
    height: 78,
    width: 26,
    spineColor: '#4A3B69',
    textColor: '#D6E7FF',
    goldTrim: true,
    code: 'SICP',
  },
  {
    item: personalInfo.readingList.find((b) => b.title.includes('Computer Networking')) || {
      title: 'Computer Networking: A Top-Down Approach',
      type: 'tech',
      author: 'Kurose & Ross',
      status: 'completed',
      note: 'Direct inspiration for the Routing Simulation project.',
    },
    height: 76,
    width: 24,
    spineColor: '#1E3A4C',
    textColor: '#7FB8D9',
    goldTrim: false,
    code: 'NETWORKS',
  },
];

export const Bookshelf: React.FC<BookshelfProps> = ({
  onSelectBook,
  className = '',
}) => {
  const [selectedBook, setSelectedBook] = useState<ShelfBookMeta | null>(null);
  const [hoveredBook, setHoveredBook] = useState<ShelfBookMeta | null>(null);
  const shelfRef = useRef<HTMLDivElement>(null);

  const activeInspect = hoveredBook || selectedBook;

  // Toggle or deselect a book on click
  const handleBookClick = (book: ShelfBookMeta) => {
    if (selectedBook?.code === book.code) {
      setSelectedBook(null);
      onSelectBook?.(null);
    } else {
      setSelectedBook(book);
      onSelectBook?.(book.item);
    }
  };

  const handleDeselect = () => {
    setSelectedBook(null);
    onSelectBook?.(null);
  };

  // Click outside to deselect book & Escape key listener
  useEffect(() => {
    if (!selectedBook) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (shelfRef.current && !shelfRef.current.contains(e.target as Node)) {
        handleDeselect();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDeselect();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBook]);

  return (
    <div ref={shelfRef} className={`relative flex flex-col items-center ${className}`}>
      {/* COZY INSPECTION TOOLTIP / POPUP */}
      {activeInspect && (
        <div
          className="absolute -top-28 sm:-top-24 z-40 w-72 max-w-[90vw] transition-all"
          style={{ pointerEvents: selectedBook ? 'auto' : 'none' }}
        >
          <div className="relative bg-bg-surface/95 backdrop-blur-md p-3 rounded-lg border-2 border-accent shadow-crt text-xs font-mono">
            {/* Close button when book is selected */}
            {selectedBook && (
              <button
                type="button"
                onClick={handleDeselect}
                className="absolute top-2 right-2 p-1 rounded hover:bg-bg-hover text-fg-muted hover:text-fg transition-colors"
                title="Deselect book (or click book again)"
                aria-label="Close book inspection"
              >
                <X className="w-3.5 h-3.5 text-accent" />
              </button>
            )}

            <div className="flex items-center justify-between text-[10px] text-accent font-bold mb-1 pr-6">
              <span className="uppercase">[{activeInspect.item.type}] // {activeInspect.item.status}</span>
              <span className="text-fg-muted">Huzbi&apos;s Shelf</span>
            </div>
            <div className="font-bold text-fg text-sm line-clamp-1">
              {activeInspect.item.title}
            </div>
            {activeInspect.item.author && (
              <div className="text-[11px] text-fg-muted">{activeInspect.item.author}</div>
            )}
            {activeInspect.item.note && (
              <div className="mt-1.5 pt-1.5 border-t border-border/60 text-[11px] text-accent-cream italic leading-snug">
                &ldquo;{activeInspect.item.note}&rdquo;
              </div>
            )}
            {selectedBook && (
              <div className="mt-1 text-[9px] text-fg-subtle text-right">
                (click again or press Esc to close)
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOOKSHELF MAIN PHYSICAL FRAME */}
      <div className="relative w-full max-w-[380px] bg-[#221B16] rounded-t-lg border-t-4 border-x-4 border-[#3D3025] shadow-xl p-3 pb-1">
        
        {/* Top Shelf Molding Header */}
        <div className="flex items-center justify-between px-1 mb-3 pb-1 border-b border-[#35291F] text-[10px] font-mono text-[#8C7B6B]">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-accent" />
            <span className="font-bold">SHELF // 2 AM READS</span>
          </div>
          <span className="text-[9px] text-[#A69482]">7 VOLS</span>
        </div>

        {/* SHELF INNER ROW (Holds books + decorative items) */}
        <div className="flex items-end justify-between gap-1 px-1 h-24 relative">
          
          {/* Decorative Item 1: Tiny Pixel Succulent Plant */}
          <div className="flex flex-col items-center select-none group cursor-pointer" title="Desk Succulent">
            {/* Plant leaves */}
            <div className="w-4 h-3 flex items-center justify-center font-mono text-[10px] text-accent">
              <Sparkles className="w-3 h-3 text-accent fill-accent" />
            </div>
            {/* Terracotta Pot */}
            <div className="w-5 h-4 bg-[#A65B32] border border-[#7A4020] rounded-b-sm" />
          </div>

          {/* Bookend Bracket (Left) */}
          <div className="w-1.5 h-16 bg-[#4A3D31] rounded-l border border-[#2B231B]" />

          {/* BOOKS ROW */}
          <div className="flex items-end gap-1 flex-1 justify-center">
            {BOOKS_DATA.map((book) => {
              const isHovered = hoveredBook?.item.title === book.item.title;
              const isSelected = selectedBook?.item.title === book.item.title;

              return (
                <button
                  key={book.item.title}
                  type="button"
                  onClick={() => handleBookClick(book)}
                  onMouseEnter={() => setHoveredBook(book)}
                  onMouseLeave={() => setHoveredBook(null)}
                  style={{
                    height: `${book.height}px`,
                    width: `${book.width}px`,
                    backgroundColor: book.spineColor,
                    borderColor: isHovered || isSelected ? 'var(--color-accent)' : '#191512',
                  }}
                  className={`relative rounded-t-sm border-2 transition-all duration-200 cursor-pointer select-none flex flex-col justify-between items-center py-1 group ${
                    isHovered || isSelected
                      ? '-translate-y-2 shadow-crt ring-1 ring-accent'
                      : 'hover:-translate-y-1'
                  }`}
                  title={`${book.item.title} (${book.item.author}) - Click to inspect/read, click again to close`}
                >
                  {/* Top Gold Trim / Emboss line */}
                  {book.goldTrim && (
                    <div className="w-full h-1 bg-[#D6AE62] opacity-80" />
                  )}

                  {/* Vertical Spine Title */}
                  <span
                    style={{ color: book.textColor }}
                    className="text-[8px] font-mono font-bold uppercase tracking-tighter [writing-mode:vertical-lr] rotate-180 line-clamp-1"
                  >
                    {book.code}
                  </span>

                  {/* Bottom Gold Trim / Volume mark */}
                  <div className="w-1.5 h-1.5 rounded-full bg-border/40" />
                </button>
              );
            })}
          </div>

          {/* Bookend Bracket (Right) */}
          <div className="w-1.5 h-16 bg-[#4A3D31] rounded-r border border-[#2B231B]" />

          {/* Decorative Item 2: Retro SNES Cartridge */}
          <div
            className="w-6 h-8 bg-[#3E4554] rounded-t-sm border border-[#252A33] flex flex-col items-center justify-center p-0.5 cursor-pointer"
            title="SNES Cartridge: Chrono Trigger"
          >
            <div className="w-4 h-3 bg-[#E6A15C] rounded-xs" />
            <span className="text-[6px] font-mono text-fg-muted mt-1">ROM</span>
          </div>
        </div>

        {/* HEAVY WOODEN SHELF BOARD (Bottom shelf slab) */}
        <div className="w-full h-4 bg-[#33251B] border-t-2 border-[#4A3627] rounded-b shadow-md flex items-center justify-between px-2 text-[8px] font-mono text-[#7A6452]">
          <span>OAK SHELF</span>
          <span>CLICK ANY BOOK TO READ &bull; ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};
