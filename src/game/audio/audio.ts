import type { SceneId } from '@/game/scene/types';
import type { GameStore } from '@/game/state/store';
import {
  createSynth,
  type AudioContextLike,
  type SfxName,
  type Synth,
} from './synth';
import { tuneForScene } from './tunes';

export type { SfxName };

export type GameAudio = {
  /** The visitor's choice. Enabling is always a gesture, so it may start audio. */
  setEnabled(value: boolean): void;
  isEnabled(): boolean;
  playSfx(name: SfxName): void;
  setScene(id: SceneId): void;
  dispose(): void;
};

export type AudioOptions = {
  /** Injected by tests; defaults to the page's document when there is one. */
  document?: Document | null;
};

/**
 * The game's sound: silent until the visitor asks for it, remembered across
 * visits, and never allowed to throw when Web Audio is missing or blocked.
 *
 * Music follows the scene. Small cues follow the store, so a star, a panel or
 * a new line of dialogue sounds the same wherever it happens.
 */
export function createAudio(
  ctxFactory: () => AudioContextLike | null,
  store: GameStore,
  opts: AudioOptions = {},
): GameAudio {
  const doc =
    opts.document === undefined
      ? typeof document === 'undefined'
        ? null
        : document
      : opts.document;

  let enabled = store.getState().sound;
  let scene: SceneId = 'room';
  let ctx: AudioContextLike | null = null;
  let synth: Synth | null = null;
  let hasGesture = false;
  let hidden = doc?.visibilityState === 'hidden';
  let disposed = false;
  let playingScene: SceneId | null = null;

  let lastFound = store.getState().found.length;
  let lastProject = store.getState().project;
  let lastDialogue = store.getState().dialogue !== null;

  function ensureContext(): AudioContextLike | null {
    if (ctx) return ctx;
    if (disposed) return null;

    let created: AudioContextLike | null;
    try {
      created = ctxFactory();
    } catch {
      return null; // a browser with Web Audio switched off entirely
    }
    if (!created) return null;

    try {
      synth = createSynth(created);
      ctx = created;
    } catch {
      synth = null;
      ctx = null;
      return null;
    }
    return ctx;
  }

  function stopMusic(): void {
    playingScene = null;
    synth?.stopMusic();
  }

  function startMusic(): void {
    if (!enabled || disposed || hidden || !hasGesture) return;
    const context = ensureContext();
    if (!context || !synth || context.state !== 'running') return;
    if (playingScene === scene) return;

    synth.playMusic(tuneForScene(scene));
    playingScene = scene;
  }

  function resumeAndPlay(): void {
    if (!ctx) return;
    if (ctx.state !== 'suspended') {
      startMusic();
      return;
    }

    try {
      void ctx
        .resume()
        .then(() => {
          if (!disposed && enabled && !hidden) startMusic();
        })
        .catch(() => undefined);
    } catch {
      // A blocked or broken context stays quiet, and the game carries on.
    }
  }

  function playSfx(name: SfxName): void {
    if (!enabled || disposed || hidden) return;
    if (!synth || !ctx || ctx.state !== 'running') return;
    synth.playSfx(name);
  }

  /**
   * The first real gesture is what browsers allow to unlock audio. Until then
   * a saved "on" choice waits, so reloading never plays anything by itself.
   */
  function onGesture(): void {
    if (disposed || !enabled) return;
    hasGesture = true;
    if (hidden) return;

    const context = ensureContext();
    if (!context) return;
    if (context.state === 'suspended') resumeAndPlay();
    else startMusic();
  }

  function onVisibilityChange(): void {
    if (!doc) return;
    const nextHidden = doc.visibilityState === 'hidden';
    if (nextHidden === hidden) return;
    hidden = nextHidden;

    if (hidden) {
      stopMusic();
      if (ctx && ctx.state === 'running') {
        try {
          void ctx.suspend().catch(() => undefined);
        } catch {
          // Best effort: the page is going away anyway.
        }
      }
      return;
    }

    if (enabled && hasGesture) resumeAndPlay();
  }

  function applyStoredChoice(value: boolean): void {
    if (value === enabled) return;
    enabled = value;
    if (value) startMusic();
    else stopMusic();
  }

  const unsubscribe = store.subscribe(() => {
    const state = store.getState();

    if (state.sound !== enabled) applyStoredChoice(state.sound);

    if (state.found.length > lastFound) playSfx('star');
    lastFound = state.found.length;

    if (state.project !== lastProject) {
      playSfx(state.project ? 'open' : 'close');
      lastProject = state.project;
    }

    const talking = state.dialogue !== null;
    if (talking && !lastDialogue) playSfx('blip');
    lastDialogue = talking;
  });

  const onPointer = (): void => onGesture();
  const onKey = (): void => onGesture();
  const onVisibility = (): void => onVisibilityChange();

  doc?.addEventListener('pointerdown', onPointer, { passive: true });
  doc?.addEventListener('keydown', onKey);
  doc?.addEventListener('visibilitychange', onVisibility);

  return {
    setEnabled(value: boolean): void {
      if (disposed) return;

      if (value) hasGesture = true;
      if (value === enabled) {
        if (value) startMusic();
        return;
      }

      enabled = value;
      if (store.getState().sound !== value) store.setSound(value);

      if (!value) {
        stopMusic();
        return;
      }
      if (hidden) return;

      const context = ensureContext();
      if (!context) return;
      if (context.state === 'suspended') resumeAndPlay();
      else startMusic();
    },

    isEnabled(): boolean {
      return enabled;
    },

    playSfx,

    setScene(id: SceneId): void {
      if (disposed || id === scene) return;
      scene = id;
      if (!enabled) return;
      stopMusic();
      startMusic();
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      doc?.removeEventListener('pointerdown', onPointer);
      doc?.removeEventListener('keydown', onKey);
      doc?.removeEventListener('visibilitychange', onVisibility);
      stopMusic();
      synth?.dispose();
      synth = null;
      ctx = null;
    },
  };
}
