import type { Input } from '@/game/core/input';
import type { GameStore } from '@/game/state/store';
import type { Entity } from '@/game/world/entity';
import type { Tile, TileMap } from '@/game/world/grid';

export type Rect = { x: number; y: number; w: number; h: number };

/** Something in a scene the visitor can walk to and inspect. */
export type Hotspot = {
  id: string;
  /** World pixels. Taps inside this rect, or close to it, target the hotspot. */
  rect: Rect;
  /** The walkable tile the visitor stands on to use it. */
  stand: Tile;
  label: string;
  onInteract(api: GameApi): void | Promise<void>;
};

export type GameApi = {
  store: GameStore;
  goTo(sceneId: 'room' | 'dark'): void;
  openTerminal(): void;
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
  id: 'room' | 'dark';
  worldW: number;
  worldH: number;
  map: TileMap;
  spawn: Tile;
  hotspots: Hotspot[];
  update(ms: number, ctx: SceneCtx): void;
  draw(g: CanvasRenderingContext2D, ctx: SceneCtx): void;
};
