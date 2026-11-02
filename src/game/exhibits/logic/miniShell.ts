/**
 * The tiny, rude terminal on the stool in the Archive. It is a toy prompt, not
 * a real shell: a few commands, a short memory and no way to break anything.
 */

export const MAX_INPUT = 48;

export const COMMANDS = ['help', 'ls', 'cat', 'whoami', 'clear'] as const;

export type ShellState = {
  /** The folder the prompt claims to be in. */
  cwd: string;
  /** Commands actually run, in order, already truncated. */
  history: string[];
  /** True once the visitor has typed a real command, which earns the star. */
  trying: boolean;
};

export type ShellResult = {
  output: string[];
  state: ShellState;
  trying: boolean;
};

const HELP_LINES = [
  'help    - read this, then forget it',
  'ls      - list the evidence',
  'cat     - read a file',
  'whoami  - ask a question you will regret',
  'clear   - wipe the screen, not the guilt',
];

export function createShell(): ShellState {
  return { cwd: '~', history: [], trying: false };
}

export function runCommand(line: string, s: ShellState): ShellResult {
  const input = line.trim().slice(0, MAX_INPUT);
  if (!input) return { output: [], state: s, trying: s.trying };

  const state: ShellState = {
    ...s,
    history: [...s.history, input],
    trying: true,
  };
  const [rawCommand, ...args] = input.split(/\s+/);
  const command = rawCommand.toLowerCase();

  switch (command) {
    case 'help':
      return { output: [...HELP_LINES], state, trying: true };
    case 'ls':
      return {
        output: ['nothing', 'a cat', 'a suspiciously empty folder'],
        state,
        trying: true,
      };
    case 'cat': {
      const file = args.join(' ');
      return {
        output: [
          file
            ? `cat: ${file}: permission denied. Nice try.`
            : 'cat: which file? Use your words.',
        ],
        state,
        trying: true,
      };
    }
    case 'whoami':
      return {
        output: ['A visitor with too much time.'],
        state,
        trying: true,
      };
    case 'clear':
      return {
        output: ['The screen is no cleaner. You are.'],
        state,
        trying: true,
      };
    default:
      return {
        output: [`${command}? That is not a command. It is barely a word.`],
        state,
        trying: true,
      };
  }
}
