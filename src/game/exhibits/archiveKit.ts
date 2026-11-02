import { projects } from '@/data/projects';
import type { Light } from '@/game/render/lighting';
import { createSpaceLights } from '@/game/scene/space';
import type { SceneCtx } from '@/game/scene/types';
import type { Exhibit } from './types';

/** An exhibit that may also give off light of its own, for the room to add. */
export type ArchiveExhibit = Exhibit & { light?: Light };

/** Where an exhibit sits: the top-left of its sprite, in world pixels. */
export type At = { x: number; y: number };

/** The project an exhibit belongs to, or a loud error if the data lost it. */
export function projectFor(id: string) {
  const found = projects.find((project) => project.id === id);
  if (!found) throw new Error(`The ${id} project is missing from the data`);
  return found;
}

/**
 * The lantern's world position, from the same rule the room's lighting uses,
 * so keyboard, mouse and touch visitors all get it. Each caller owns one.
 */
export function createLantern(): (ctx: SceneCtx) => { x: number; y: number } {
  const lights = createSpaceLights([]);
  return (ctx) => lights(ctx)[0];
}
