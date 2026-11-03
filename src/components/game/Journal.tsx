'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { personalInfo } from '@/data/personal';
import { projects } from '@/data/projects';
import { copy } from '@/game/content/copy';
import { allStarIds, projectStarId, readStarId } from '@/game/content/stars';
import type { GameStore } from '@/game/state/store';
import './game.css';

export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  url?: string;
  found: boolean;
};

type Section = keyof typeof copy.journal.sections;

/** Which journal section a star belongs under, from its id alone. */
function sectionOf(id: string): Section {
  if (id.startsWith('project:')) return 'projects';
  if (id.startsWith('read:')) return 'books';
  return 'silly';
}

/** The words for one star, used only once it has been found. */
function openEntry(id: string): Omit<JournalEntry, 'found'> {
  const project = projects.find((item) => projectStarId(item.id) === id);
  if (project) {
    return { id, title: project.title, body: project.description, url: project.githubUrl };
  }

  const book = personalInfo.readingList.find((item) => readStarId(item.title) === id);
  if (book) {
    const by = book.author ? `${book.author}. ` : '';
    return { id, title: book.title, body: `${by}${book.note ?? ''}`.trim() };
  }

  const silly = copy.journal.silly[id];
  if (silly) return { id, title: silly.title, body: silly.body };

  // A star added later without journal words is still listed, never missed.
  const readable = id.replace(/^[a-z]+:/, '').replace(/-/g, ' ');
  return { id, title: readable, body: copy.journal.fallbackBody };
}

/**
 * One entry for every star in the game, built from `allStarIds()` so a new
 * project, book or silly star can never be left out. Unfound entries keep
 * their place but give nothing away.
 */
export function journalEntries(found: readonly string[]): JournalEntry[] {
  const have = new Set(found);
  return allStarIds().map((id) => {
    if (have.has(id)) return { ...openEntry(id), found: true };
    return {
      id,
      title: copy.journal.hiddenTitle,
      body: copy.journal.hiddenBody,
      found: false,
    };
  });
}

const SECTION_ORDER: Section[] = ['projects', 'books', 'silly'];

const STAR_ON = ['..#..', '..#..', '#####', '.###.', '.#.#.'];

function MiniStar({ on }: { on: boolean }) {
  const cells: React.ReactNode[] = [];
  STAR_ON.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#') cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />);
    });
  });
  return (
    <svg
      className="journal-star"
      data-on={on}
      width={15}
      height={15}
      viewBox="0 0 5 5"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {cells}
    </svg>
  );
}

/** The button owns its input: a click here must never walk the visitor. */
function stopAtTheButton(event: Event): void {
  if (event.type === 'keydown' || event.type === 'keyup') {
    const key = (event as KeyboardEvent).key;
    if (key !== 'Enter' && key !== ' ') return;
  }
  event.stopPropagation();
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

/**
 * The journal: a visible button, the J key, and an overlay of real text that
 * lists everything found and hides the rest. Esc, J or the close button shuts
 * it. It will not open over a dialogue, a project panel or the terminal.
 */
export function Journal({
  store,
  isBlocked,
  onOpenChange,
}: {
  store: GameStore;
  isBlocked: () => boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const ui = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const blockedRef = useRef(isBlocked);
  blockedRef.current = isBlocked;
  const openRef = useRef(false);

  const change = (next: boolean): void => {
    openRef.current = next;
    setOpen(next);
    onOpenChange?.(next);
  };
  const changeRef = useRef(change);
  changeRef.current = change;

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;

      if (event.key === 'Escape' && openRef.current) {
        event.preventDefault();
        changeRef.current(false);
        return;
      }
      if (event.key.toLowerCase() !== 'j' || event.repeat) return;
      if (openRef.current) {
        event.preventDefault();
        changeRef.current(false);
      } else if (!blockedRef.current()) {
        event.preventDefault();
        changeRef.current(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Native listeners beat the game's own on the stage; React's arrive late.
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const types = ['pointerdown', 'pointerup', 'pointermove', 'keydown', 'keyup'] as const;
    for (const type of types) button.addEventListener(type, stopAtTheButton);
    return () => {
      for (const type of types) button.removeEventListener(type, stopAtTheButton);
    };
  }, []);

  // Focus goes in on open and back to where it was on close.
  useEffect(() => {
    if (!open) return;
    const previous =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus({ preventScroll: true });

    const keepIn = (event: FocusEvent): void => {
      const panel = panelRef.current;
      if (panel && event.target instanceof Node && !panel.contains(event.target)) {
        closeRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('focusin', keepIn);

    return () => {
      document.removeEventListener('focusin', keepIn);
      (buttonRef.current ?? previous)?.focus({ preventScroll: true });
    };
  }, [open]);

  const entries = journalEntries(ui.found);
  const foundCount = entries.filter((entry) => entry.found).length;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="journal-button px-panel"
        aria-label={copy.journal.buttonLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open && !blockedRef.current()) change(true);
        }}
      >
        <span aria-hidden="true">{copy.journal.button}</span>
        <kbd className="journal-key" aria-hidden="true">
          J
        </kbd>
      </button>

      {open ? (
        <div
          className="journal-backdrop"
          data-testid="journal-backdrop"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onClick={(event) => {
            if (event.target === event.currentTarget) change(false);
          }}
        >
          <div
            ref={panelRef}
            className="journal-panel px-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="journal-title"
          >
            <header className="journal-head">
              <h2 id="journal-title" className="journal-title">
                {copy.journal.title}
              </h2>
              <p className="journal-count" role="status">
                {copy.journal.count(foundCount, entries.length)}
              </p>
              <button
                ref={closeRef}
                type="button"
                className="journal-close"
                data-close
                aria-label={copy.journal.closeLabel}
                onClick={() => change(false)}
              >
                {copy.journal.close}
              </button>
            </header>

            <div className="journal-scroll">
              {SECTION_ORDER.map((section) => {
                const rows = entries.filter((entry) => sectionOf(entry.id) === section);
                if (rows.length === 0) return null;
                const got = rows.filter((row) => row.found).length;
                return (
                  <section key={section} className="journal-section">
                    <h3 className="journal-section-title">
                      {copy.journal.sections[section]}{' '}
                      <span className="journal-section-count">
                        {got}/{rows.length}
                      </span>
                    </h3>
                    <ul className="journal-list">
                      {rows.map((entry) => (
                        <li
                          key={entry.id}
                          className="journal-entry"
                          data-found={entry.found}
                          data-entry={entry.id}
                        >
                          <MiniStar on={entry.found} />
                          <div className="journal-entry-text">
                            <h4 className="journal-entry-title">{entry.title}</h4>
                            <p className="journal-entry-body">{entry.body}</p>
                            {entry.url ? (
                              <a
                                className="journal-link"
                                href={entry.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {copy.journal.repo}
                              </a>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
