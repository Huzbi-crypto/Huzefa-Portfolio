import { starTotal } from '@/game/content/stars';
import {
  advanceDialogue,
  startDialogue,
  tickDialogue,
  type DialogueChoice,
  type DialogueState,
} from './dialogue';
import {
  award as awardStar,
  loadProgress,
  saveProgress,
  type Progress,
} from './progress';

export type GameUiState = {
  dialogue: DialogueState | null;
  found: readonly string[];
  total: number;
  doorOpened: boolean;
};

export type GameStore = {
  getState(): GameUiState;
  subscribe(fn: () => void): () => void;
  say(
    lines: string[],
    choices?: DialogueChoice[],
  ): Promise<string | undefined>;
  award(id: string): boolean;
  advance(choiceId?: string): void;
  tick(ms: number): void;
  count(id: string): number;
  increment(id: string): void;
  setDoorOpened(): void;
  setReducedMotion(v: boolean): void;
};

/**
 * The single mutable game state. Progress is persisted on every change and
 * the UI snapshot only changes when something actually changed, which is what
 * `useSyncExternalStore` needs.
 */
export function createStore(storage: Storage | null): GameStore {
  const progress: Progress = loadProgress(storage);
  const subscribers = new Set<() => void>();
  let dialogue: DialogueState | null = null;
  let reducedMotion = false;
  let settleSay: ((value: string | undefined) => void) | null = null;

  const buildSnapshot = (): GameUiState => ({
    dialogue,
    found: [...progress.found],
    total: starTotal(),
    doorOpened: progress.doorOpened,
  });
  let state = buildSnapshot();

  const notify = (): void => {
    state = buildSnapshot();
    for (const subscriber of [...subscribers]) {
      subscriber();
    }
  };

  const persist = (): void => saveProgress(storage, progress);

  const settle = (value: string | undefined): void => {
    const resolve = settleSay;
    settleSay = null;
    if (resolve) resolve(value);
  };

  return {
    getState(): GameUiState {
      return state;
    },

    subscribe(fn: () => void): () => void {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    },

    say(
      lines: string[],
      choices: DialogueChoice[] = [],
    ): Promise<string | undefined> {
      settle(undefined);
      dialogue = startDialogue(lines, choices, { instant: reducedMotion });
      notify();

      return new Promise<string | undefined>((resolve) => {
        settleSay = resolve;
      });
    },

    award(id: string): boolean {
      const first = awardStar(progress, id);
      if (!first) return false;

      persist();
      notify();
      return true;
    },

    advance(choiceId?: string): void {
      if (!dialogue) return;

      const result = advanceDialogue(dialogue, choiceId);
      dialogue = result.state;
      if (dialogue === null) settle(result.chosen);
      notify();
    },

    tick(ms: number): void {
      if (!dialogue) return;

      const next = tickDialogue(dialogue, ms);
      if (next === dialogue) return;

      dialogue = next;
      notify();
    },

    count(id: string): number {
      return progress.counters[id] ?? 0;
    },

    increment(id: string): void {
      progress.counters[id] = (progress.counters[id] ?? 0) + 1;
      persist();
      notify();
    },

    setDoorOpened(): void {
      if (progress.doorOpened) return;

      progress.doorOpened = true;
      persist();
      notify();
    },

    setReducedMotion(value: boolean): void {
      if (reducedMotion === value) return;

      reducedMotion = value;
      if (!value || !dialogue) return;

      dialogue = {
        ...dialogue,
        instant: true,
        typed: dialogue.lines[dialogue.line]?.length ?? 0,
      };
      notify();
    },
  };
}
