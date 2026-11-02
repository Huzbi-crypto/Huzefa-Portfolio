import { hashPixel } from './types';

/**
 * The belt in the compiler exhibit: a line of code tokenised, turned into a
 * little tree, emitted as stack code and finally as toy assembly. It is an
 * illustration, not a compiler; it only understands names, numbers, + - * and
 * one assignment per line.
 */

export const STAGES = ['tokens', 'tree', 'code', 'asm'] as const;
export type StageName = (typeof STAGES)[number];

export type Stage = {
  stage: StageName;
  lines: string[];
  /** Set when the belt refuses to continue. Fussy, but never fatal. */
  error?: string;
};

type Token =
  | { kind: 'name'; value: string }
  | { kind: 'number'; value: string }
  | { kind: 'assign'; value: '=' }
  | { kind: 'operator'; value: '+' | '-' | '*' }
  | { kind: 'lparen'; value: '(' }
  | { kind: 'rparen'; value: ')' };

type Expr =
  | { kind: 'number'; value: string }
  | { kind: 'name'; value: string }
  | { kind: 'binary'; op: '+' | '-' | '*'; left: Expr; right: Expr };

type Program = { name: string; value: Expr };

type Parsed<T> = T | string;

const JAM_LINES = [
  'CONVEYOR JAM: the parser found a comma it did not invite.',
  'CONVEYOR JAM: station 2 is having a moment.',
  'CONVEYOR JAM: the assembly says no, politely.',
];
const JAM_EVERY = 43;

function tokenize(src: string): { tokens: Token[]; error?: string } {
  if (!src.trim()) {
    return {
      tokens: [],
      error: 'Nothing to compile. The belt does not run on vibes.',
    };
  }

  const tokens: Token[] = [];
  let index = 0;

  while (index < src.length) {
    const character = src[index];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (/[A-Za-z_]/.test(character)) {
      let end = index + 1;
      while (end < src.length && /[A-Za-z0-9_]/.test(src[end])) end += 1;
      tokens.push({ kind: 'name', value: src.slice(index, end) });
      index = end;
      continue;
    }

    if (/[0-9]/.test(character)) {
      let end = index + 1;
      while (end < src.length && /[0-9]/.test(src[end])) end += 1;
      tokens.push({ kind: 'number', value: src.slice(index, end) });
      index = end;
      continue;
    }

    if (character === '=') {
      tokens.push({ kind: 'assign', value: '=' });
      index += 1;
      continue;
    }

    if (character === '+' || character === '-' || character === '*') {
      tokens.push({ kind: 'operator', value: character });
      index += 1;
      continue;
    }

    if (character === '(' || character === ')') {
      tokens.push({
        kind: character === '(' ? 'lparen' : 'rparen',
        value: character,
      });
      index += 1;
      continue;
    }

    return {
      tokens,
      error: `Unexpected character "${character}". The belt refuses to chew it.`,
    };
  }

  return { tokens };
}

function parseExpr(
  tokens: Token[],
  start: number,
): Parsed<{ expr: Expr; index: number }> {
  const first = parseTerm(tokens, start);
  if (typeof first === 'string') return first;

  let expr = first.expr;
  let index = first.index;

  while (index < tokens.length) {
    const token = tokens[index];
    if (
      token.kind !== 'operator' ||
      (token.value !== '+' && token.value !== '-')
    ) {
      break;
    }
    const right = parseTerm(tokens, index + 1);
    if (typeof right === 'string') return right;
    expr = { kind: 'binary', op: token.value, left: expr, right: right.expr };
    index = right.index;
  }

  return { expr, index };
}

function parseTerm(
  tokens: Token[],
  start: number,
): Parsed<{ expr: Expr; index: number }> {
  const token = tokens[start];
  if (!token) return 'Expected a value, got the end of the line.';

  if (token.kind === 'number' || token.kind === 'name') {
    return {
      expr: { kind: token.kind, value: token.value },
      index: start + 1,
    };
  }

  if (token.kind === 'lparen') {
    const inner = parseExpr(tokens, start + 1);
    if (typeof inner === 'string') return inner;
    const close = tokens[inner.index];
    if (!close || close.kind !== 'rparen') {
      return 'Expected ")" after the value.';
    }
    return { expr: inner.expr, index: inner.index + 1 };
  }

  if (token.kind === 'operator') {
    const right = parseTerm(tokens, start + 1);
    if (typeof right === 'string') return right;
    return {
      expr: {
        kind: 'binary',
        op: token.value,
        left: { kind: 'number', value: '0' },
        right: right.expr,
      },
      index: right.index,
    };
  }

  return `Expected a value, got "${token.value}".`;
}

function parseProgram(tokens: Token[]): Parsed<Program> {
  const name = tokens[0];
  if (!name || name.kind !== 'name') {
    return 'Expected a name at the start of the line.';
  }

  const equals = tokens[1];
  if (!equals || equals.kind !== 'assign') {
    return `Expected "=" after "${name.value}".`;
  }

  const parsed = parseExpr(tokens, 2);
  if (typeof parsed === 'string') return parsed;

  if (parsed.index < tokens.length) {
    return `Expected the end of the line, got "${tokens[parsed.index].value}".`;
  }

  return { name: name.value, value: parsed.expr };
}

function formatExpr(expr: Expr): string {
  if (expr.kind === 'number' || expr.kind === 'name') return expr.value;
  return `(${expr.op} ${formatExpr(expr.left)} ${formatExpr(expr.right)})`;
}

function emitCodeExpr(expr: Expr): string[] {
  if (expr.kind === 'number') return [`PUSH ${expr.value}`];
  if (expr.kind === 'name') return [`LOAD ${expr.value}`];

  const op = expr.op === '+' ? 'ADD' : expr.op === '-' ? 'SUB' : 'MUL';
  return [...emitCodeExpr(expr.left), ...emitCodeExpr(expr.right), op];
}

function emitCode(program: Program): string[] {
  return [...emitCodeExpr(program.value), `STORE ${program.name}`];
}

function emitAsmExpr(
  expr: Expr,
  nextRegister: number,
): { lines: string[]; register: number; nextRegister: number } {
  if (expr.kind === 'number') {
    return {
      lines: [`LDI R${nextRegister}, ${expr.value}`],
      register: nextRegister,
      nextRegister: nextRegister + 1,
    };
  }

  if (expr.kind === 'name') {
    return {
      lines: [`LD R${nextRegister}, ${expr.value}`],
      register: nextRegister,
      nextRegister: nextRegister + 1,
    };
  }

  const left = emitAsmExpr(expr.left, nextRegister);
  const right = emitAsmExpr(expr.right, left.nextRegister);
  const op = expr.op === '+' ? 'ADD' : expr.op === '-' ? 'SUB' : 'MUL';

  return {
    lines: [
      ...left.lines,
      ...right.lines,
      `${op} R${left.register}, R${left.register}, R${right.register}`,
    ],
    register: left.register,
    nextRegister: right.nextRegister,
  };
}

function emitAsm(program: Program): string[] {
  const compiled = emitAsmExpr(program.value, 0);
  return [...compiled.lines, `ST ${program.name}, R${compiled.register}`];
}

export function compileLine(src: string): Stage[] {
  const stages: Stage[] = STAGES.map((stage) => ({ stage, lines: [] }));

  const tokenized = tokenize(src);
  if (tokenized.error) {
    stages[0].error = tokenized.error;
    return stages;
  }

  stages[0].lines = [tokenized.tokens.map((token) => token.value).join(' ')];

  const program = parseProgram(tokenized.tokens);
  if (typeof program === 'string') {
    stages[1].error = program;
    return stages;
  }

  stages[1].lines = [`(= ${program.name} ${formatExpr(program.value)})`];
  stages[2].lines = emitCode(program);
  stages[3].lines = emitAsm(program);
  return stages;
}

/**
 * Whether the belt jams on this tick. Jams are seeded, rare and last exactly
 * one tick, so the machine can be fussy without ever blocking the visitor.
 */
export function jamAt(seed: number, tick: number): string | null {
  const safeSeed = Math.abs(Math.floor(Number.isFinite(seed) ? seed : 0));
  const safeTick = Math.floor(Number.isFinite(tick) ? tick : 0);
  if (safeTick < 0 || safeTick % JAM_EVERY !== safeSeed % JAM_EVERY) {
    return null;
  }
  return JAM_LINES[hashPixel(safeSeed, safeTick, 7) % JAM_LINES.length];
}
