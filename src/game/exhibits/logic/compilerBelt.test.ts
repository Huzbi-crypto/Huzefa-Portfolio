import { describe, expect, it } from 'vitest';
import { STAGES, compileLine, jamAt } from './compilerBelt';

describe('compileLine', () => {
  it('x_equals_1_plus_2_tokenizes', () => {
    const stages = compileLine('x = 1 + 2');

    expect(stages.map((stage) => stage.stage)).toEqual([...STAGES]);
    expect(stages.every((stage) => stage.error === undefined)).toBe(true);

    const [tokens, tree, code, asm] = stages;
    expect(tokens.lines).toEqual(['x = 1 + 2']);
    expect(tree.lines.join(' ')).toContain('x');
    expect(tree.lines.join(' ')).toContain('1');
    expect(tree.lines.join(' ')).toContain('2');
    expect(tree.lines.join(' ')).toContain('+');

    expect(code.lines).toContain('PUSH 1');
    expect(code.lines).toContain('PUSH 2');
    expect(code.lines).toContain('ADD');
    expect(code.lines).toContain('STORE x');

    expect(asm.lines[0]).toMatch(/^LDI R\d+, 1$/);
    expect(asm.lines[asm.lines.length - 1]).toMatch(/^ST x, R\d+$/);
  });

  it('invalid_input_gets_fussy_error_not_crash', () => {
    const broken = ['x =', 'this is not code', '', '= 5', 'x = 1 +', 'x = 1 $ 2'];

    for (const source of broken) {
      expect(() => compileLine(source)).not.toThrow();

      const stages = compileLine(source);
      expect(stages.map((stage) => stage.stage)).toEqual([...STAGES]);

      const firstError = stages.findIndex((stage) => stage.error);
      expect(firstError).toBeGreaterThanOrEqual(0);
      expect(stages[firstError].error).toMatch(/expected|value|nothing|number|character/i);

      for (const later of stages.slice(firstError + 1)) {
        expect(later.lines).toEqual([]);
      }
    }
  });

  it('reads_without_spaces', () => {
    const stages = compileLine('x=1+2');

    expect(stages[0].lines).toEqual(['x = 1 + 2']);
    expect(stages[3].lines).toContain('ST x, R0');
  });
});

describe('jamAt', () => {
  it('jam_is_rare_and_clears', () => {
    let jams = 0;
    let ticks = 0;

    for (let seed = 0; seed < 10; seed += 1) {
      for (let tick = 0; tick < 1000; tick += 1) {
        ticks += 1;
        const message = jamAt(seed, tick);

        if (message === null) continue;
        jams += 1;
        expect(message.length).toBeGreaterThan(0);
        expect(jamAt(seed, tick + 1)).toBeNull();
      }
    }

    expect(jams).toBeGreaterThan(0);
    expect(jams / ticks).toBeLessThan(0.05);
    expect(jamAt(7, 7)).toBe(jamAt(7, 7));
  });
});
