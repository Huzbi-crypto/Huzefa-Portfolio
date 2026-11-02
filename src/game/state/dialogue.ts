export type DialogueChoice = {
  id: string;
  label: string;
};

export type DialogueState = {
  lines: readonly string[];
  choices: readonly DialogueChoice[];
  /** Index of the line currently on screen. */
  line: number;
  /** Characters of the current line revealed so far. */
  typed: number;
  instant: boolean;
};

const CHARS_PER_SECOND = 40;

function currentLineLength(state: DialogueState): number {
  return state.lines[state.line]?.length ?? 0;
}

export function startDialogue(
  lines: string[],
  choices: DialogueChoice[] = [],
  opts: { instant?: boolean } = {},
): DialogueState {
  const instant = opts.instant === true;

  return {
    lines: [...lines],
    choices: [...choices],
    line: 0,
    typed: instant ? (lines[0]?.length ?? 0) : 0,
    instant,
  };
}

/** Reveal typed text at 40 characters per second. Instant text never ticks. */
export function tickDialogue(state: DialogueState, ms: number): DialogueState {
  if (state.instant || ms <= 0 || state.line >= state.lines.length) {
    return state;
  }

  const target = currentLineLength(state);
  const typed = Math.min(target, state.typed + (ms * CHARS_PER_SECOND) / 1000);

  if (typed === state.typed) return state;
  return { ...state, typed };
}

/**
 * Advance the dialogue. The first press finishes the current line, the next
 * moves on; advancing past the last line ends the dialogue. When choices were
 * supplied, the chosen id (or the first choice by default) comes back.
 */
export function advanceDialogue(
  state: DialogueState,
  choiceId?: string,
): { state: DialogueState | null; chosen?: string } {
  if (state.lines.length === 0) {
    return { state: null, chosen: choiceId ?? state.choices[0]?.id };
  }

  const target = currentLineLength(state);
  if (state.typed < target) {
    return { state: { ...state, typed: target } };
  }

  if (state.line < state.lines.length - 1) {
    const line = state.line + 1;
    return {
      state: {
        ...state,
        line,
        typed: state.instant ? state.lines[line].length : 0,
      },
    };
  }

  return { state: null, chosen: choiceId ?? state.choices[0]?.id };
}
