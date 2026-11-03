import { describe, expect, it } from 'vitest';
import { compileLine } from './logic/compilerBelt';
import { beltItemX, planBelt } from './compilerBelt';

const STATIONS = [20, 54, 88, 122];

describe('compiler belt plan', () => {
  it('a_good_line_runs_every_station_and_reaches_the_end', () => {
    const plan = planBelt(compileLine('x = 1 + 2'), null);
    expect(plan.stopAt).toBeNull();
    expect(plan.message).toBeNull();
    expect(plan.durationMs).toBeGreaterThan(2000);
  });

  it('a_messy_line_stops_the_belt_at_the_fussy_station_with_its_message', () => {
    const stages = compileLine('x = ( 1 +');
    const first = stages.findIndex((s) => s.error);
    expect(first).toBeGreaterThanOrEqual(0);
    const plan = planBelt(stages, null);
    expect(plan.stopAt).toBe(first);
    expect(plan.message).toBe(stages[first].error);
    expect(plan.durationMs).toBeLessThan(planBelt(compileLine('x = 1 + 2'), null).durationMs);
  });

  it('a_rare_jam_stops_a_good_line_and_says_why', () => {
    const plan = planBelt(compileLine('x = 1 + 2'), { station: 2, message: 'CONVEYOR JAM: test' });
    expect(plan.stopAt).toBe(2);
    expect(plan.message).toBe('CONVEYOR JAM: test');
  });
});

describe('compiler belt item', () => {
  it('moves_forward_only_and_on_whole_pixels', () => {
    const plan = planBelt(compileLine('x = 1 + 2'), null);
    let last = -1;
    for (let t = 0; t <= plan.durationMs; t += 40) {
      const x = beltItemX(plan, t, STATIONS, 2, 138);
      expect(Number.isInteger(x)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(last);
      last = x;
    }
    expect(last).toBe(138);
  });

  it('a_jammed_item_stays_at_its_station', () => {
    const plan = planBelt(compileLine('x = 1 + 2'), { station: 1, message: 'm' });
    expect(beltItemX(plan, plan.durationMs, STATIONS, 2, 138)).toBe(STATIONS[1]);
  });

  it('starts_at_the_chute', () => {
    const plan = planBelt(compileLine('x = 1 + 2'), null);
    expect(beltItemX(plan, 0, STATIONS, 2, 138)).toBe(2);
  });
});
