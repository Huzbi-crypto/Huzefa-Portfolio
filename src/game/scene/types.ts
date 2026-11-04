import type { Input } from '@/game/core/input';
import type { GameStore } from '@/game/state/store';
import type { Entity } from '@/game/world/entity';
import type { Tile, TileMap } from '@/game/world/grid';

export type Rect = { x: number; y: number; w: number; h: number };

/** Every place in the dark reaches the same engine, with a stable id for saves. */
export type SceneId = 'room' | 'dark' | 'workshop' | 'archive' | 'observatory' | 'nap';

/** Something in a scene the visitor can walk to and inspect. */
export type Hotspot = {
  id: string;
  /** World pixels. The whole thing, used for walking range and facing. */
  rect: Rect;
  /**
   * Tighter world-pixel targets for the pointer. When present, only these
   * count as a click on the thing; a tap in the empty space around it walks
   * to that spot instead. Keyboard use still reads `rect`.
   */
  hitRects?: Rect[];
  /** The walkable tile the visitor stands on to use it. */
  stand: Tile;
  label: string;
  onInteract(api: GameApi): void | Promise<void>;
};

export type GameApi = {
  store: GameStore;
  goTo(sceneId: SceneId, entry?: string): void;
  openTerminal(): void;
  /** Opens the real project panel and resolves when it closes. */
  showProject(projectId: string): Promise<void>;
};

export type SceneCtx = {
  t: number;
  player: Entity;
  input: Input;
  camera: { x: number; y: number };
  viewW: number;
  viewH: number;
  /** Whole-number CSS pixels per game pixel, to turn pointer positions into game pixels. */
  scale: number;
  /** Where a finger last dragged the light (CSS pixels), or null once the visitor taps to walk. */
  drag: { x: number; y: number } | null;
  reducedMotion: boolean;
  found: readonly string[];
};

export type Scene = {
  id: SceneId;
  worldW: number;
  worldH: number;
  map: TileMap;
  spawn: Tile;
  /** Named arrival tiles, used by an exit that says where it leads. */
  entries?: Record<string, Tile>;
  /** Dark spaces follow the lantern with a touch drag. */
  dark?: boolean;
  hotspots: Hotspot[];
  update(ms: number, ctx: SceneCtx): void;
  draw(g: CanvasRenderingContext2D, ctx: SceneCtx): void;
  /** Stop timed exhibit beats before the visitor leaves this scene. */
  cancel?(): void;
};
