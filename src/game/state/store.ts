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
import {
  hasClue as hasClueIn,
  markClue as markClueIn,
  onEndingSeen,
  seenEndingLine as seenEndingLineIn,
  type EndingLine,
} from './story';

export type GameUiState = {
  dialogue: DialogueState | null;
  found: readonly string[];
  total: number;
  doorOpened: boolean;
  /** The visitor's sound choice, remembered between visits. */
  sound: boolean;
  /** The project whose panel is open, or null. */
  project: string | null;
};

export type GameStore = {
  getState(): GameUiState;
  /** The live progress, for read-only checks. Change it through store methods. */
  getProgress(): Progress;
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
  /** Records a trail clue in the saved counters. */
  markClue(id: string): void;
  hasClue(id: string): boolean;
  /** Records the best ending line seen so far. */
  markEndingSeen(line: EndingLine): void;
  seenEndingLine(): EndingLine | null;
  setDoorOpened(): void;
  /** Remembers whether sound should play. Never starts it by itself. */
  setSound(v: boolean): void;
  setReducedMotion(v: boolean): void;
  /** Opens the project panel; resolves when it closes. */
  showProject(projectId: string): Promise<void>;
  closeProject(): void;
};

/**
 * The single mutable game state. Progress is persisted on every change and
 * the UI snapshot only changes when something actually changed, which is what
 * `useSyncExternalStore` needs.
 */
export function createStore(storage: Storage | null): GameStore {
  let progress: Progress = loadProgress(storage);
  const subscribers = new Set<() => void>();
  let dialogue: DialogueState | null = null;
  let reducedMotion = false;
  let project: string | null = null;
  let settleSay: ((value: string | undefined) => void) | null = null;
  let settleProject: (() => void) | null = null;

  const buildSnapshot = (): GameUiState => ({
    dialogue,
    found: [...progress.found],
    total: starTotal(),
    doorOpened: progress.doorOpened,
    sound: progress.sound,
    project,
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

  const closeProject = (): void => {
    if (project === null) return;

    project = null;
    notify();
    const resolve = settleProject;
    settleProject = null;
    if (resolve) resolve();
  };

  return {
    getState(): GameUiState {
      return state;
    },

    getProgress(): Progress {
      return {
        ...progress,
        found: [...progress.found],
        counters: { ...progress.counters },
      };
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

    markClue(id: string): void {
      const next = markClueIn(progress, id);
      if (next === progress) return;

      progress = next;
      persist();
      notify();
    },

    hasClue(id: string): boolean {
      return hasClueIn(progress, id);
    },

    markEndingSeen(line: EndingLine): void {
      const next = onEndingSeen(progress, line);
      if (next === progress) return;

      progress = next;
      persist();
      notify();
    },

    seenEndingLine(): EndingLine | null {
      return seenEndingLineIn(progress);
    },

    setDoorOpened(): void {
      if (progress.doorOpened) return;

      progress.doorOpened = true;
      persist();
      notify();
    },

    setSound(value: boolean): void {
      if (progress.sound === value) return;

      progress.sound = value;
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

    showProject(projectId: string): Promise<void> {
      closeProject();
      project = projectId;
      notify();

      return new Promise<void>((resolve) => {
        settleProject = resolve;
      });
    },

    closeProject,
  };
}
