import { describe, expect, it } from 'vitest';
import { createFlow, giveNote, HOP_MS, stepFlow } from './logic/agents';
import { loopArrowDot, noteAt } from './langProjects';

const anchors = [
  { x: 0, y: 0 },
  { x: 40, y: 10 },
  { x: 80, y: 0 },
  { x: 120, y: 20 },
];

describe('lang-projects note travel', () => {
  it('no_note_means_no_position', () => {
    expect(noteAt(createFlow(), anchors)).toBeNull();
  });

  it('a_new_note_sits_on_the_first_robot', () => {
    const flow = giveNote(createFlow(), 'hello');
    expect(noteAt(flow, anchors)).toEqual({ x: 0, y: 0 });
  });

  it('mid_hop_the_note_is_between_two_robots_on_whole_pixels', () => {
    const flow = stepFlow(giveNote(createFlow(), 'hello'), HOP_MS * 1.5);
    const at = noteAt(flow, anchors)!;
    expect(at.x).toBeGreaterThan(40);
    expect(at.x).toBeLessThan(80);
    expect(Number.isInteger(at.x) && Number.isInteger(at.y)).toBe(true);
  });

  it('a_finished_note_rests_on_the_last_robot', () => {
    const flow = stepFlow(giveNote(createFlow(), 'hello'), HOP_MS * 10);
    expect(flow.note?.done).toBe(true);
    expect(noteAt(flow, anchors)).toEqual({ x: 120, y: 20 });
  });
});

describe('lang-projects loop arrow', () => {
  it('the_dot_goes_all_the_way_round_and_comes_back', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 8; i += 1) {
      const p = loopArrowDot(i);
      seen.add(`${p.x},${p.y}`);
    }
    expect(seen.size).toBe(8);
    expect(loopArrowDot(8)).toEqual(loopArrowDot(0));
    expect(loopArrowDot(-1)).toEqual(loopArrowDot(7));
  });
});
