import { describe, expect, it } from 'vitest';
import { HOP_MS, createFlow, giveNote, stepFlow } from './agents';

function run(f: ReturnType<typeof createFlow>, totalMs: number, stepMs = 100) {
  let flow = f;
  for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) {
    flow = stepFlow(flow, stepMs);
  }
  return flow;
}

describe('agents', () => {
  it('note_visits_nodes_in_order', () => {
    let flow = giveNote(createFlow(), 'hello');

    flow = stepFlow(flow, HOP_MS);
    expect(flow.note?.visited).toEqual(['greeter', 'router']);

    flow = run(flow, HOP_MS * 2);
    expect(flow.note?.visited).toEqual(flow.robots.map((robot) => robot.id));
  });

  it('note_reaches_end', () => {
    const flow = run(giveNote(createFlow(), 'hello'), HOP_MS * 20);

    expect(flow.note?.done).toBe(true);
    expect(flow.note?.at).toBe(flow.robots.length - 1);
    expect(flow.note?.visited[flow.note.visited.length - 1]).toBe(
      flow.robots[flow.robots.length - 1].id,
    );
    expect(flow.note?.text).toBe('hello');
  });

  it('loop_robot_never_finishes_and_never_blocks_others', () => {
    const early = run(giveNote(createFlow(), 'hello'), HOP_MS * 20);
    const later = stepFlow(early, 60_000);

    expect(early.note?.done).toBe(true);
    expect(early.loops).toBeGreaterThan(0);
    expect(later.note?.done).toBe(true);
    expect(later.loops).toBeGreaterThan(early.loops);
    expect(later.note?.visited).toEqual(later.robots.map((robot) => robot.id));
  });

  it('gives_every_note_a_fresh_run', () => {
    const finished = run(giveNote(createFlow(), 'first'), HOP_MS * 20);
    const again = giveNote(finished, 'second');

    expect(again.note?.text).toBe('second');
    expect(again.note?.visited).toEqual(['greeter']);
    expect(again.note?.done).toBe(false);
  });
});
