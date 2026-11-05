/**
 * Huzbi's day on the sofa. The phase lives in the game store, not in the nap
 * scene, so it survives leaving and re-entering the room: he is still reading
 * (or asleep) where the visitor left him.
 *
 * Scripted phases are driven by the wake-up dialogue. The rest run on their
 * own clock once the conversation is over: the hand lowers, he sits for a
 * beat, leans for the manga, reads for a while, lies back and sleeps again.
 */
export type HuzbiPhase =
  | 'asleep'
  | 'stir'
  | 'slide'
  | 'sitUp'
  | 'awake'
  | 'lowering'
  | 'sitting'
  | 'reaching'
  | 'reading'
  | 'laying';

export type HuzbiState = { phase: HuzbiPhase; ms: number };

/** How long each self-running phase lasts, and what follows it. */
export const HUZBI_CYCLE: Partial<Record<HuzbiPhase, { ms: number; next: HuzbiPhase }>> = {
  lowering: { ms: 900, next: 'sitting' },
  sitting: { ms: 4000, next: 'reaching' },
  reaching: { ms: 1200, next: 'reading' },
  reading: { ms: 22000, next: 'laying' },
  laying: { ms: 1600, next: 'asleep' },
};

export const initialHuzbi = (): HuzbiState => ({ phase: 'asleep', ms: 0 });

/** Moves the clock on, carrying any spare time across phase changes. */
export function stepHuzbi(state: HuzbiState, ms: number): HuzbiState {
  let { phase } = state;
  let elapsed = state.ms + ms;
  for (let guard = 0; guard < 16; guard += 1) {
    const step = HUZBI_CYCLE[phase];
    if (!step || elapsed < step.ms) break;
    elapsed -= step.ms;
    phase = step.next;
  }
  const moved = phase !== state.phase;
  return { phase, ms: moved && !HUZBI_CYCLE[phase] ? 0 : elapsed };
}
