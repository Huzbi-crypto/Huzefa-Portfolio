import { describe, expect, it } from 'vitest';
import {
  advanceDialogue,
  startDialogue,
  tickDialogue,
  type DialogueChoice,
} from './dialogue';

const CHOICES: DialogueChoice[] = [
  { id: 'open', label: 'OPEN IT' },
  { id: 'stay', label: 'STAY' },
];

describe('dialogue', () => {
  it('types_over_time', () => {
    const started = startDialogue(['Hello there']);

    expect(started.typed).toBe(0);

    let state = tickDialogue(started, 100);
    expect(state.typed).toBe(4);

    state = tickDialogue(state, 100);
    expect(state.typed).toBe(8);

    state = tickDialogue(state, 100);
    expect(state.typed).toBe(11);

    // Typing never runs past the end of the line, and leaves it alone.
    expect(tickDialogue(state, 1000)).toBe(state);

    // Ticking is immutable: the original state is untouched.
    expect(started.typed).toBe(0);
  });

  it('advance_completes_line_first_then_moves_on', () => {
    const started = startDialogue(['First', 'Second']);
    const partial = tickDialogue(started, 25);

    expect(partial.typed).toBe(1);

    const completed = advanceDialogue(partial);
    expect(completed.state).not.toBeNull();
    expect(completed.state?.line).toBe(0);
    expect(completed.state?.typed).toBe(5);

    const moved = advanceDialogue(completed.state!);
    expect(moved.state).not.toBeNull();
    expect(moved.state?.line).toBe(1);
    expect(moved.state?.typed).toBe(0);
  });

  it('instant_shows_full_text', () => {
    const started = startDialogue(['Hello', 'World'], [], { instant: true });

    expect(started.typed).toBe(5);
    expect(tickDialogue(started, 500)).toBe(started);

    const next = advanceDialogue(started).state;
    expect(next).not.toBeNull();
    expect(next?.line).toBe(1);
    expect(next?.typed).toBe(5);
  });

  it('choice_returned_on_advance', () => {
    const started = startDialogue(['Open the door?'], CHOICES, {
      instant: true,
    });

    expect(advanceDialogue(started)).toEqual({ state: null, chosen: 'open' });
    expect(advanceDialogue(started, 'stay')).toEqual({
      state: null,
      chosen: 'stay',
    });
  });

  it('ends_with_null', () => {
    const started = startDialogue(['That is all.'], [], { instant: true });

    const result = advanceDialogue(started);

    expect(result.state).toBeNull();
    expect(result.chosen).toBeUndefined();
  });
});
