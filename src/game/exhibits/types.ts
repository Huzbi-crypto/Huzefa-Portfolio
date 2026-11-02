import type { GameApi, Rect, SceneCtx } from '@/game/scene/types';
import type { Tile } from '@/game/world/grid';

/**
 * A project drawn as a physical thing in a dark space. Exhibits are depth
 * sorted with the visitor by `footY`, drawn into the lit layer, and can add a
 * full-brightness `glow` for screens, packets and other lit details.
 */
export type Exhibit = {
  id: string;
  projectId: string;
  /** World pixels. Taps inside this rect target the exhibit. */
  rect: Rect;
  /** The walkable tile the visitor stands on to use it. */
  stand: Tile;
  /** The line the exhibit stands on, for depth sorting. */
  footY: number;
  label: string;
  update(ms: number, ctx: SceneCtx): void;
  draw(g: CanvasRenderingContext2D, ctx: SceneCtx): void;
  /** Optional detail that emits its own light and is painted at full brightness. */
  glow?(g: CanvasRenderingContext2D, ctx: SceneCtx): void;
  use(api: GameApi): Promise<void>;
};
