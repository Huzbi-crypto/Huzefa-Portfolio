'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { personalInfo } from '@/data/personal';
import { useApp } from '@/context/AppContext';
import { setGameTheme } from '@/game/art';
import { createAudio, type GameAudio } from '@/game/audio/audio';
import type { AudioContextLike } from '@/game/audio/synth';
import { copy } from '@/game/content/copy';
import { isTermPromptOpen } from '@/game/exhibits/termExp';
import { createGame, type Game, type GameHint } from '@/game/game';
import { createArchive } from '@/game/scene/archive';
import { createDarkScene } from '@/game/scene/dark';
import {
  CONTACT_LINKS,
  contactCardOpen,
  createNap,
  mailtoHref,
  setContactCardOpen,
  subscribeContactCard,
} from '@/game/scene/nap';
import { createObservatory } from '@/game/scene/observatory';
import { createWorkshop } from '@/game/scene/workshop';
import { createRoomScene } from '@/game/scene/room';
import { createStore, type GameStore } from '@/game/state/store';
import { clearLiveStore, setLiveStore } from '@/game/state/liveStore';
import { DialogueBox } from './DialogueBox';
import { Journal } from './Journal';
import { ProjectPanel } from './ProjectPanel';
import { SoundToggle } from './SoundToggle';
import { StarCounter } from './StarCounter';
import { TermPrompt } from './TermPrompt';
import { hasWalked, noteWalked } from './controlsHint';
import { useFocusTrap } from './useFocusTrap';
import './game.css';

const EMPTY_UI = {
  dialogue: null,
  found: [],
  total: 0,
  doorOpened: false,
  sound: false,
  project: null,
} as const;

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null; // private browsing: the game still works for this visit
  }
}

/** Web Audio, or nothing at all on a browser that will not give it to us. */
function browserAudioContext(): AudioContextLike | null {
  try {
    const Candidate =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    return Candidate ? new Candidate() : null;
  } catch {
    return null;
  }
}

function StarsFromStore({ store }: { store: GameStore }) {
  const ui = useSyncExternalStore(store.subscribe, store.getState, () => EMPTY_UI);
  return <StarCounter found={ui.found.length} total={ui.total} />;
}

function SoundFromStore({ store, audio }: { store: GameStore; audio: GameAudio }) {
  // A boolean snapshot: the toggle re-renders only when the choice changes,
  // not on every typed character of dialogue.
  const enabled = useSyncExternalStore(store.subscribe, () => store.getState().sound);
  return <SoundToggle enabled={enabled} onToggle={() => audio.setEnabled(!enabled)} />;
}

/**
 * The real contact card the ending opens. A prepared mailto, and the places
 * Huzbi actually reads, straight from `src/data/personal.ts`.
 */
function EndingContact() {
  const open = useSyncExternalStore(subscribeContactCard, contactCardOpen, () => false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(open, panelRef, closeRef);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setContactCardOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="project-panel-backdrop"
      data-testid="contact-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) setContactCardOpen(false);
      }}
    >
      <div
        ref={panelRef}
        className="project-panel px-panel"
        role="dialog"
        aria-modal="true"
        aria-label={copy.nap.contact.dialogLabel}
      >
        <button
          ref={closeRef}
          type="button"
          className="project-panel-close"
          aria-label={copy.nap.contact.closeLabel}
          onClick={() => setContactCardOpen(false)}
        >
          {copy.nap.contact.close}
        </button>

        <h2 className="project-panel-title">{copy.nap.contact.title}</h2>
        <p className="project-panel-body">{copy.nap.contact.lead}</p>
        <p className="project-panel-tagline">
          {copy.nap.contact.emailLabel}:{' '}
          <a className="project-panel-link" href={mailtoHref()}>
            {personalInfo.email}
          </a>
        </p>

        <div className="project-panel-links">
          {CONTACT_LINKS.map((link) => (
            <a
              key={link.id}
              className="project-panel-link"
              href={link.href}
              {...(link.id === 'email'
                ? {}
                : { target: '_blank', rel: 'noreferrer' })}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function UseHint({ hint }: { hint: GameHint }) {
  if (!hint) return null;
  const verb =
    hint.via === 'key' ? copy.ui.useVerbKey : hint.via === 'tap' ? copy.ui.useVerbTap : copy.ui.useVerbClick;
  return (
    <div className="use-hint px-panel" aria-hidden="true">
      <span className="keycap">{verb}</span>
      <span>{hint.label}</span>
    </div>
  );
}

/**
 * Mounts the canvas game and its DOM text. The canvas is decoration for the
 * eyes; everything readable (dialogue, star count) is real text.
 */
export default function GameRoot() {
  const { theme, isTerminalOpen, openTerminal } = useApp();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terminalOpenRef = useRef(false);
  const journalOpenRef = useRef(false);
  const openTerminalRef = useRef(openTerminal);
  const [store, setStore] = useState<GameStore | null>(null);
  const [audio, setAudio] = useState<GameAudio | null>(null);
  const [hint, setHint] = useState<GameHint>(null);
  const [coarse, setCoarse] = useState(false);
  // Null until the saved progress has been read on the client: no hint on the
  // server render, and none flashed before we know whether it was dismissed.
  const [walked, setWalked] = useState<boolean | null>(null);
  const [nudge, setNudge] = useState<string | null>(null);

  terminalOpenRef.current = isTerminalOpen;
  openTerminalRef.current = openTerminal;

  // The canvas is palette-indexed; re-decode its sprites when the room's light
  // changes so the world recolours on the next frame, with no reload.
  useEffect(() => {
    setGameTheme(theme);
  }, [theme]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const gameStore = createStore(browserStorage());
    const gameAudio = createAudio(browserAudioContext, gameStore);
    setLiveStore(gameStore);
    setWalked(hasWalked(gameStore));
    const game: Game = createGame({
      canvas,
      store: gameStore,
      scenes: [
        createRoomScene(gameStore),
        createDarkScene(gameStore),
        createWorkshop(gameStore),
        createArchive(gameStore),
        createObservatory(gameStore),
        createNap(gameStore),
      ],
      audio: gameAudio,
      openTerminal: () => openTerminalRef.current(),
      isBlocked: () => {
        const state = gameStore.getState();
        return (
          isTermPromptOpen() ||
          state.dialogue !== null ||
          state.project !== null ||
          terminalOpenRef.current ||
          journalOpenRef.current ||
          contactCardOpen()
        );
      },
      onHint: setHint,
      onNudge: setNudge,
    });

    const fit = (): void => game.resize(stage.clientWidth, stage.clientHeight);
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    fit();

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotion = (): void => game.setReducedMotion(motion.matches);
    applyMotion();
    motion.addEventListener('change', applyMotion);

    setCoarse(window.matchMedia('(pointer: coarse)').matches);
    setStore(gameStore);
    setAudio(gameAudio);
    game.start();
    stage.focus({ preventScroll: true });

    // Hand focus back to the world when a dialogue ends.
    let hadDialogue = false;
    const unsubscribe = gameStore.subscribe(() => {
      const has = gameStore.getState().dialogue !== null;
      if (hadDialogue && !has) stage.focus({ preventScroll: true });
      hadDialogue = has;
    });

    return () => {
      unsubscribe();
      motion.removeEventListener('change', applyMotion);
      observer.disconnect();
      game.stop();
      gameAudio.dispose();
      clearLiveStore(gameStore);
    };
  }, []);

  // And when the terminal closes.
  useEffect(() => {
    if (!isTerminalOpen) stageRef.current?.focus({ preventScroll: true });
  }, [isTerminalOpen]);

  const begin = (): void => {
    if (store) noteWalked(store);
    setWalked(true);
  };
  const blocked = (): boolean => {
    const state = store?.getState();
    return (
      isTermPromptOpen() ||
      Boolean(state && (state.dialogue || state.project)) ||
      terminalOpenRef.current ||
      contactCardOpen()
    );
  };

  return (
    <div
      ref={stageRef}
      className="game-stage"
      tabIndex={0}
      role="application"
      aria-label="Huzbi's room, a small game. Walk with the arrow keys or WASD, or click. Press Enter to use things."
      data-over={hint?.via === 'click' ? 'click' : undefined}
      onKeyDownCapture={(event) => {
        if (event.key.startsWith('Arrow') || 'wasd'.includes(event.key.toLowerCase())) begin();
      }}
      onPointerUp={begin}
    >
      <canvas ref={canvasRef} className="game-canvas" aria-hidden="true" />

      {store ? <StarsFromStore store={store} /> : null}
      {store && audio ? <SoundFromStore store={store} audio={audio} /> : null}

      {walked === null ? null : (
        <div className="controls-hint px-panel" data-gone={walked} aria-hidden="true">
          {coarse ? (
            <span>{copy.ui.controlsTouch}</span>
          ) : (
            <>
              <span>{copy.ui.controlsKeys}</span>
              <span>{copy.ui.controlsMouse}</span>
              <span>{copy.ui.controlsInteract}</span>
            </>
          )}
        </div>
      )}

      {store ? (
        <Journal
          store={store}
          isBlocked={blocked}
          onOpenChange={(open) => {
            journalOpenRef.current = open;
            if (!open) stageRef.current?.focus({ preventScroll: true });
          }}
        />
      ) : null}

      {store && nudge ? (
        <div className="nudge-hint px-panel" role="status">
          {copy.ui.nudge}
        </div>
      ) : null}
      {store ? <UseHint hint={hint} /> : null}
      {store ? <TermPrompt /> : null}
      {store ? <DialogueBox store={store} /> : null}
      {store ? <ProjectPanel store={store} /> : null}
      <EndingContact />
    </div>
  );
}
