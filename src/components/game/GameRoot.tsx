'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useApp } from '@/context/AppContext';
import { createAudio, type GameAudio } from '@/game/audio/audio';
import type { AudioContextLike } from '@/game/audio/synth';
import { copy } from '@/game/content/copy';
import { createGame, type Game, type GameHint } from '@/game/game';
import { createArchive } from '@/game/scene/archive';
import { createDarkScene } from '@/game/scene/dark';
import { createWorkshop } from '@/game/scene/workshop';
import { createRoomScene } from '@/game/scene/room';
import { createStore, type GameStore } from '@/game/state/store';
import { DialogueBox } from './DialogueBox';
import { Journal } from './Journal';
import { ProjectPanel } from './ProjectPanel';
import { SoundToggle } from './SoundToggle';
import { StarCounter } from './StarCounter';
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
  const { isTerminalOpen, openTerminal } = useApp();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terminalOpenRef = useRef(false);
  const journalOpenRef = useRef(false);
  const openTerminalRef = useRef(openTerminal);
  const [store, setStore] = useState<GameStore | null>(null);
  const [audio, setAudio] = useState<GameAudio | null>(null);
  const [hint, setHint] = useState<GameHint>(null);
  const [coarse, setCoarse] = useState(false);
  const [started, setStarted] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);

  terminalOpenRef.current = isTerminalOpen;
  openTerminalRef.current = openTerminal;

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const gameStore = createStore(browserStorage());
    const gameAudio = createAudio(browserAudioContext, gameStore);
    const game: Game = createGame({
      canvas,
      store: gameStore,
      scenes: [
        createRoomScene(gameStore),
        createDarkScene(gameStore),
        createWorkshop(gameStore),
        createArchive(gameStore),
      ],
      audio: gameAudio,
      openTerminal: () => openTerminalRef.current(),
      isBlocked: () => {
        const state = gameStore.getState();
        return (
          state.dialogue !== null ||
          state.project !== null ||
          terminalOpenRef.current ||
          journalOpenRef.current
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
    };
  }, []);

  // And when the terminal closes.
  useEffect(() => {
    if (!isTerminalOpen) stageRef.current?.focus({ preventScroll: true });
  }, [isTerminalOpen]);

  const begin = (): void => setStarted(true);
  const blocked = (): boolean => {
    const state = store?.getState();
    return Boolean(state && (state.dialogue || state.project)) || terminalOpenRef.current;
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

      <div className="controls-hint px-panel" data-gone={started} aria-hidden="true">
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
      {store ? <DialogueBox store={store} /> : null}
      {store ? <ProjectPanel store={store} /> : null}
    </div>
  );
}
