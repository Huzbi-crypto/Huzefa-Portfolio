import { describe, expect, it } from 'vitest';
import {
  COMMANDS,
  MAX_INPUT,
  createShell,
  runCommand,
} from './miniShell';

describe('miniShell', () => {
  it('help_lists_commands', () => {
    const { output } = runCommand('help', createShell());
    const text = output.join('\n');

    for (const command of COMMANDS) {
      expect(text).toMatch(new RegExp(`\\b${command}\\b`));
    }
  });

  it('unknown_command_gets_a_rude_reply', () => {
    const { output, state } = runCommand('dance', createShell());

    expect(output).toHaveLength(1);
    expect(output[0]).not.toMatch(/^help/i);
    expect(output[0]).toMatch(/command|word/i);
    expect(state.trying).toBe(true);
  });

  it('empty_line_is_harmless', () => {
    const shell = createShell();
    const result = runCommand('   ', shell);

    expect(result.output).toEqual([]);
    expect(result.state).toEqual(shell);
    expect(result.state.history).toEqual([]);
    expect(result.trying).toBe(false);
  });

  it('very_long_input_is_truncated', () => {
    const long = 'x'.repeat(500);
    const { output, state } = runCommand(long, createShell());

    expect(MAX_INPUT).toBeLessThan(long.length);
    expect(state.history[0]).toHaveLength(MAX_INPUT);
    expect(state.history[0].length).toBeLessThan(long.length);
    expect(output.join(' ').length).toBeLessThan(MAX_INPUT + 80);
  });

  it('first_real_command_sets_trying', () => {
    const empty = runCommand('', createShell());
    expect(empty.trying).toBe(false);
    expect(empty.state.trying).toBe(false);

    const first = runCommand('ls', createShell());
    expect(first.trying).toBe(true);
    expect(first.state.trying).toBe(true);

    const second = runCommand('whoami', first.state);
    expect(second.trying).toBe(true);
    expect(second.state.trying).toBe(true);
  });

  it('does_not_mutate_the_old_state', () => {
    const shell = createShell();
    const copy = { ...shell, history: [...shell.history] };

    runCommand('ls', shell);

    expect(shell).toEqual(copy);
  });
});
