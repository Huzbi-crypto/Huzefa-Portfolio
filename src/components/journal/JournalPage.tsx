import type { ReactNode } from 'react';
import './journal.css';
import { MysteryBanner } from './MysteryBanner';

type Props = {
  /** The page's one h1. */
  title: ReactNode;
  /** One sentence under the title. */
  lede?: ReactNode;
  /** Pixel art beside the title; decorative unless it carries its own label. */
  art?: ReactNode;
  /** Small links above the title, such as a way back. */
  crumbs?: ReactNode;
  children: ReactNode;
};

/**
 * The frame every plain page shares: the banner, the title and the room's
 * palette. It is plain server markup, so it reads the same with scripts off.
 */
export function JournalPage({ title, lede, art, crumbs, children }: Props) {
  return (
    <div className="journal-root">
      <MysteryBanner />
      <div className="j-wrap journal-body">
        {crumbs ? <div className="journal-crumbs">{crumbs}</div> : null}
        <header className="journal-head">
          <div className="journal-head-text">
            <h1 className="journal-title">{title}</h1>
            {lede ? <p className="journal-lede">{lede}</p> : null}
          </div>
          {art ? <div className="journal-head-art">{art}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}
