/**
 * The tiny robots in the Lang-Projects exhibit. A note hops from robot to
 * robot while one of them is stuck consulting itself: the loop never ends, but
 * it also never stops the note from getting through.
 */

export type Robot = { id: string; label: string; x: number; y: number };

export type NoteState = {
  text: string;
  /** Index of the robot holding the note, or the last one it reached. */
  at: number;
  /** Milliseconds banked toward the next hop. */
  waitMs: number;
  /** Robot ids in the order the note met them. */
  visited: string[];
  done: boolean;
};

export type Flow = {
  robots: readonly Robot[];
  /** Index of the robot stuck in its own loop. */
  loopIndex: number;
  /** How many times the loop robot has consulted itself. */
  loops: number;
  note: NoteState | null;
  elapsedMs: number;
};

export const HOP_MS = 400;
export const LOOP_MS = 250;

const ROBOTS: readonly Robot[] = [
  { id: 'greeter', label: 'NEEDS INPUT', x: 16, y: 26 },
  { id: 'router', label: 'ROUTE', x: 52, y: 18 },
  { id: 'looper', label: 'THINK', x: 88, y: 30 },
  { id: 'writer', label: 'WRITE', x: 124, y: 20 },
];

export function createFlow(): Flow {
  return {
    robots: ROBOTS,
    loopIndex: 2,
    loops: 0,
    note: null,
    elapsedMs: 0,
  };
}

/** Hand the flow a note, starting at the first robot. */
export function giveNote(f: Flow, note: string): Flow {
  return {
    ...f,
    note: {
      text: note,
      at: 0,
      waitMs: 0,
      visited: [f.robots[0].id],
      done: f.robots.length === 1,
    },
  };
}

export function stepFlow(f: Flow, ms: number): Flow {
  const dt = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const elapsedMs = f.elapsedMs + dt;
  const loops =
    f.loops +
    Math.floor(elapsedMs / LOOP_MS) -
    Math.floor(f.elapsedMs / LOOP_MS);

  let note = f.note;
  if (note && !note.done) {
    let waitMs = note.waitMs + dt;
    let at = note.at;
    let done = false;
    const visited = [...note.visited];

    while (waitMs >= HOP_MS) {
      if (at >= f.robots.length - 1) {
        done = true;
        break;
      }
      waitMs -= HOP_MS;
      at += 1;
      visited.push(f.robots[at].id);
      if (at >= f.robots.length - 1) {
        done = true;
        break;
      }
    }

    note = {
      ...note,
      at,
      waitMs: done ? 0 : waitMs,
      visited,
      done,
    };
  }

  return { ...f, loops, note, elapsedMs };
}
