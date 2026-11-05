import { describe, expect, it } from 'vitest';
import { initialHuzbi, stepHuzbi } from './huzbi';

describe('huzbi clock', () => {
  it('starts_asleep_and_stays_asleep_on_his_own', () => {
    expect(stepHuzbi(initialHuzbi(), 999999).phase).toBe('asleep');
  });

  it('carries_spare_time_across_phases_in_one_step', () => {
    expect(stepHuzbi({ phase: 'lowering', ms: 0 }, 900 + 4000 + 100).phase).toBe('reaching');
    expect(stepHuzbi({ phase: 'lowering', ms: 0 }, 900 + 4000 + 1200 + 5).phase).toBe('reading');
    expect(stepHuzbi({ phase: 'reading', ms: 0 }, 100000).phase).toBe('asleep');
  });

  it('never_moves_a_scripted_phase_by_time', () => {
    for (const phase of ['stir', 'slide', 'sitUp', 'awake'] as const) {
      expect(stepHuzbi({ phase, ms: 0 }, 100000).phase).toBe(phase);
    }
  });
});
