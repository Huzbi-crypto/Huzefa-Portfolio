'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useApp } from '@/context/AppContext';
import { copy } from '@/game/content/copy';
import { createGame, type Game, type GameHint } from '@/game/game';
import { createDarkScene } from '@/game/scene/dark';
import { createRoomScene } from '@/game/scene/room';
import { createStore, type GameStore } from '@/game/state/store';
import { DialogueBox } from './DialogueBox';
import { ProjectPanel } from './ProjectPanel';
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

function StarsFromStore({ store }: { store: GameStore }) {
  const ui = useSyncExternalStore(store.subscribe, store.getState, () => EMPTY_UI);
  return <StarCounter found={ui.found.length} total={ui.total} />;
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
  const openTerminalRef = useRef(openTerminal);
  const [store, setStore] = useState<GameStore | null>(null);
  const [hint, setHint] = useState<GameHint>(null);
  const [coarse, setCoarse] = useState(false);
  const [started, setStarted] = useState(false);

  terminalOpenRef.current = isTerminalOpen;
  openTerminalRef.current = openTerminal;

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const gameStore = createStore(browserStorage());
    const game: Game = createGame({
      canvas,
      store: gameStore,
      scenes: [createRoomScene(gameStore), createDarkScene(gameStore)],
      openTerminal: () => openTerminalRef.current(),
      isBlocked: () => {
        const state = gameStore.getState();
        return state.dialogue !== null || state.project !== null || terminalOpenRef.current;
      },
      onHint: setHint,
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
    };
  }, []);

  // And when the terminal closes.
  useEffect(() => {
    if (!isTerminalOpen) stageRef.current?.focus({ preventScroll: true });
  }, [isTerminalOpen]);

  const begin = (): void => setStarted(true);

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

      {store ? <UseHint hint={hint} /> : null}
      {store ? <DialogueBox store={store} /> : null}
      {store ? <ProjectPanel store={store} /> : null}
    </div>
  );
}
