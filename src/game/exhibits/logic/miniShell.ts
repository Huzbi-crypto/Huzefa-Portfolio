/**
 * The tiny, rude terminal on the stool in the Archive. It is a toy prompt, not
 * a real shell: a few commands, a short memory and no way to break anything.
 */

import { copy } from '@/game/content/copy';

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
      return { output: [...copy.archive.shell.help], state, trying: true };
    case 'ls':
      return {
        output: [...copy.archive.shell.ls],
        state,
        trying: true,
      };
    case 'cat': {
      const file = args.join(' ');
      return {
        output: [
          file
            ? copy.archive.shell.catDenied(file)
            : copy.archive.shell.catWhich,
        ],
        state,
        trying: true,
      };
    }
    case 'whoami':
      return {
        output: [copy.archive.shell.whoami],
        state,
        trying: true,
      };
    case 'clear':
      return {
        output: [copy.archive.shell.clear],
        state,
        trying: true,
      };
    default:
      return {
        output: [copy.archive.shell.unknown(command)],
        state,
        trying: true,
      };
  }
}
