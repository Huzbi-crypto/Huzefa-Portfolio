import { describe, expect, it } from 'vitest';
import type { Input } from '@/game/core/input';
import { createGameController } from '@/game/game';
import { createDarkScene } from '@/game/scene/dark';
import { createRoomScene } from '@/game/scene/room';
import type { SceneId } from '@/game/scene/types';
import { createStore } from '@/game/state/store';
import type { GameAudio } from './audio';
import type { SfxName } from './synth';

type Cue = { kind: 'scene'; id: SceneId } | { kind: 'sfx'; name: SfxName };

const STEP = 1000 / 60;

function recorder(): {
  audio: Pick<GameAudio, 'setScene' | 'playSfx'>;
  cues: Cue[];
} {
  const cues: Cue[] = [];
  return {
    cues,
    audio: {
      setScene: (id) => cues.push({ kind: 'scene', id }),
      playSfx: (name) => cues.push({ kind: 'sfx', name }),
    },
  };
}

function setup() {
  const store = createStore(null);
  const queue: never[] = [];
  const input: Input = {
    move: { x: 0, y: 0 },
    pointer: null,
    mode: 'mouse',
    drain: () => queue.splice(0, queue.length),
    dispose: () => undefined,
  };
  const { audio, cues } = recorder();
  const game = createGameController({
    store,
    scenes: [createRoomScene(store), createDarkScene(store)],
    input,
    audio,
    openTerminal: () => undefined,
    isBlocked: () => store.getState().dialogue !== null,
  });
  game.resize(1366, 768);
  return { game, input, cues };
}

function run(game: ReturnType<typeof setup>['game'], frames: number): void {
  for (let i = 0; i < frames; i += 1) game.step(STEP);
}

describe('game audio wiring', () => {
  it('the_first_scene_sets_the_tune', () => {
    const { cues } = setup();
    expect(cues).toContainEqual({ kind: 'scene', id: 'room' });
  });

  it('swapping_scenes_swaps_the_tune', () => {
    const { game, cues } = setup();
    game.setReducedMotion(true);
    game.goTo('dark');

    expect(cues.at(-1)).toEqual({ kind: 'scene', id: 'dark' });
  });

  it('opening_the_door_plays_a_door_sound', () => {
    const { game, cues } = setup();
    game.setReducedMotion(true);
    game.goTo('dark');

    expect(cues).toContainEqual({ kind: 'sfx', name: 'door' });
  });

  it('walking_plays_step_sounds_at_a_walking_pace', () => {
    const { game, input, cues } = setup();
    input.move.x = 1;
    run(game, 120); // two seconds of walking
    input.move.x = 0;

    const steps = cues.filter((cue) => cue.kind === 'sfx' && cue.name === 'step').length;
    expect(steps).toBeGreaterThan(0);
    expect(steps).toBeLessThan(20);
  });

  it('standing_still_makes_no_footsteps', () => {
    const { game, cues } = setup();
    run(game, 120);

    expect(cues.filter((cue) => cue.kind === 'sfx')).toHaveLength(0);
  });
});
