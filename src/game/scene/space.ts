import { ACTIVE_PALETTE, ANIMS, SPRITES } from '@/game/art';
import { copy } from '@/game/content/copy';
import type { Exhibit } from '@/game/exhibits/types';
import {
  applyLighting,
  lanternPosition,
  type Light,
} from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
import { drawPos } from '@/game/world/entity';
import { parseCollision, TILE, type Tile, type TileMap } from '@/game/world/grid';
import type {
  GameApi,
  Hotspot,
  Rect,
  Scene,
  SceneCtx,
  SceneId,
} from './types';

export const LANTERN_RADIUS = 46;
/** A gentle shimmer in whole pixels, one step at a time. */
const FLICKER = [0, 1, 0, -1, 0, 1, 1, 0, -1, 0] as const;
const FLICKER_MS = 160;

/** Something with height in the lit layer, sorted by the line it stands on. */
export type SpaceProp = {
  id: string;
  /** The line the prop stands on, for depth sorting against the visitor. */
  footY: number;
  /** Drawn into the lit layer, before the lighting pass. */
  draw?(g: CanvasRenderingContext2D, ctx: SceneCtx): void;
  /** Drawn after lighting at full brightness, layered by foot line. */
  glow?(g: CanvasRenderingContext2D, ctx: SceneCtx): void;
  /** When present the prop is also a hotspot the visitor can walk to. */
  interact?: {
    rect: Rect;
    /** Tighter pointer targets, when the prop's bounds include empty space. */
    hitRects?: Rect[];
    stand: Tile;
    label: string;
    use(api: GameApi): void | Promise<void>;
  };
};

export type SpaceExit = {
  id: string;
  rect: Rect;
  stand: Tile;
  label: string;
  to: SceneId;
  /** Named entry in the target space; empty means its normal spawn. */
  entry: string;
  /** Optional goodbye lines; the shared ones are used otherwise. */
  lines?: readonly string[];
  goLabel?: string;
  stayLabel?: string;
  stayReply?: readonly string[];
};

/** One connected dark space: its shell, its things, and where it leads. */
export type SpaceDef = {
  id: SceneId;
  worldW: number;
  worldH: number;
  /** Solid world-pixel rectangles. A one-tile safety border is added. */
  solids: Rect[];
  spawn: Tile;
  entries: Record<string, Tile>;
  exits: SpaceExit[];
  props: SpaceProp[];
  exhibits: Exhibit[];
  /** Things that give off their own light, besides the lantern. */
  lights: Light[];
  drawBackdrop(g: CanvasRenderingContext2D, ctx: SceneCtx): void;
};

/**
 * The lantern plus a space's own lights. The returned function reuses one
 * array and the same light objects, so a frame allocates nothing.
 */
export function createSpaceLights(fixed: Light[]): (ctx: SceneCtx) => Light[] {
  const lantern: Light = { x: 0, y: 0, radius: LANTERN_RADIUS, tint: 'warm' };
  const lights: Light[] = [lantern, ...fixed];
  const pointerWorld = { x: 0, y: 0 };
  const dragWorld = { x: 0, y: 0 };
  const bodyPoint = { x: 0, y: 0 };
  // A space can be drawn for the first time behind a transition. Give the
  // flame a sensible home on the visitor instead of leaving it at 0,0.
  let placed = false;

  return (ctx) => {
    const { input, player, camera, scale, drag, t, reducedMotion, blocked } = ctx;

    // A panel or dialogue owns the room now: freeze the flame where it was so
    // the pointer no longer pulls the light around behind the UI.
    if (blocked) {
      if (!placed) {
        lantern.x = Math.floor(player.x);
        lantern.y = Math.floor(player.y) - 10;
        lantern.radius = LANTERN_RADIUS;
        placed = true;
      }
      return lights;
    }

    const pointer = input.pointer;
    if (pointer) {
      pointerWorld.x = Math.floor(pointer.x / scale + camera.x);
      pointerWorld.y = Math.floor(pointer.y / scale + camera.y);
    }
    if (drag) {
      dragWorld.x = Math.floor(drag.x / scale + camera.x);
      dragWorld.y = Math.floor(drag.y / scale + camera.y);
    }
    // The flame sits around the chest, not the feet.
    bodyPoint.x = Math.floor(player.x);
    bodyPoint.y = Math.floor(player.y) - 10;

    const at = lanternPosition(
      input.mode,
      pointer ? pointerWorld : null,
      bodyPoint,
      drag ? dragWorld : null,
    );
    lantern.x = at.x;
    lantern.y = at.y;
    lantern.radius =
      LANTERN_RADIUS +
      (reducedMotion ? 0 : FLICKER[Math.floor(t / FLICKER_MS) % FLICKER.length]);
    placed = true;

    return lights;
  };
}

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

function buildCollision(def: SpaceDef): TileMap {
  if (def.worldW % TILE !== 0 || def.worldH % TILE !== 0) {
    throw new Error(`Space ${def.id} must be a whole number of tiles`);
  }

  const cols = def.worldW / TILE;
  const rows = def.worldH / TILE;
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => '.'),
  );

  const fill = (rect: Rect): void => {
    const left = Math.max(0, Math.floor(rect.x / TILE));
    const right = Math.min(cols - 1, Math.ceil((rect.x + rect.w) / TILE) - 1);
    const top = Math.max(0, Math.floor(rect.y / TILE));
    const bottom = Math.min(rows - 1, Math.ceil((rect.y + rect.h) / TILE) - 1);
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) grid[y][x] = '#';
    }
  };

  for (const rect of def.solids) fill(rect);

  // Every space keeps its visitor inside, whatever the shell looks like.
  for (let y = 0; y < rows; y += 1) {
    grid[y][0] = '#';
    grid[y][cols - 1] = '#';
  }
  for (let x = 0; x < cols; x += 1) {
    grid[0][x] = '#';
    grid[rows - 1][x] = '#';
  }

  return parseCollision(grid.map((row) => row.join('')));
}

async function useExit(exit: SpaceExit, api: GameApi): Promise<void> {
  const { store } = api;
  const choice = await store.say([...(exit.lines ?? copy.spaces.exit.lines)], [
    { id: 'back', label: exit.goLabel ?? copy.spaces.exit.goLabel },
    { id: 'stay', label: exit.stayLabel ?? copy.spaces.exit.stayLabel },
  ]);

  if (choice === 'back') {
    if (exit.entry) api.goTo(exit.to, exit.entry);
    else api.goTo(exit.to);
    return;
  }
  await store.say([...(exit.stayReply ?? copy.spaces.exit.stayReply)]);
}

function buildHotspots(def: SpaceDef): Hotspot[] {
  const hotspots: Hotspot[] = [];

  for (const exit of def.exits) {
    hotspots.push({
      id: exit.id,
      rect: exit.rect,
      stand: exit.stand,
      label: exit.label,
      onInteract: (api) => useExit(exit, api),
    });
  }

  for (const prop of def.props) {
    if (!prop.interact) continue;
    const { rect, hitRects, stand, label, use } = prop.interact;
    hotspots.push({
      id: prop.id,
      rect,
      hitRects,
      stand,
      label,
      onInteract: (api) => use(api),
    });
  }

  for (const exhibit of def.exhibits) {
    hotspots.push({
      id: exhibit.id,
      rect: exhibit.rect,
      hitRects: exhibit.hitRects,
      stand: exhibit.stand,
      label: exhibit.label,
      onInteract: (api) => exhibit.use(api),
    });
  }

  return hotspots;
}

function frameOf(anim: string, index: number, frames: Record<string, string[]>): string {
  const list = frames[anim];
  return list[index % list.length];
}

/** The visitor's current sprite name, before any lighting or composition. */
function visitorFrame(ctx: SceneCtx): string {
  const walkFrame = Math.floor(ctx.player.walkMs / 130);
  return ctx.player.moving
    ? frameOf(`visitor-${ctx.player.facing}`, walkFrame, ANIMS)
    : `visitor-${ctx.player.facing}-0`;
}

type DrawPiece = { y: number; draw: () => void };

type Layers = {
  canvas: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  src: ImageData;
  dst: ImageData;
  viewLights: Light[];
};

const BAYER_4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
] as const;

type VoidPattern = { ink: string; panel: string; accent: string; pattern: CanvasPattern | null };

/** One cached dither pattern per canvas, rebuilt when the theme changes. */
const voidPatterns = new WeakMap<CanvasRenderingContext2D, VoidPattern>();

function voidPatternFor(g: CanvasRenderingContext2D): CanvasPattern | null {
  const ink = ACTIVE_PALETTE.a;
  const panel = ACTIVE_PALETTE.b;
  const accent = ACTIVE_PALETTE.g;
  const cached = voidPatterns.get(g);
  if (cached && cached.ink === ink && cached.panel === panel && cached.accent === accent) {
    return cached.pattern;
  }

  const tile = document.createElement('canvas');
  tile.width = 4;
  tile.height = 4;
  const t = tile.getContext('2d');
  let pattern: CanvasPattern | null = null;
  if (t) {
    t.fillStyle = ink;
    t.fillRect(0, 0, 4, 4);
    t.fillStyle = panel;
    BAYER_4.forEach((threshold, index) => {
      if (threshold < 5) t.fillRect(index % 4, Math.floor(index / 4), 1, 1);
    });
    t.fillStyle = accent;
    t.fillRect(3, 3, 1, 1);
    pattern =
      typeof g.createPattern === 'function' ? g.createPattern(tile, 'repeat') : null;
  }
  voidPatterns.set(g, { ink, panel, accent, pattern });
  return pattern;
}

/**
 * A deliberate dithered frame for view areas beyond the world. Tall phones
 * centre a short world with room above and below; this keeps that space part
 * of the art instead of leaving flat ink.
 */
function drawOutOfWorld(g: CanvasRenderingContext2D, ctx: SceneCtx, w: number, h: number): void {
  const { camera, viewW, viewH } = ctx;
  const left = Math.round(-camera.x);
  const top = Math.round(-camera.y);
  const right = left + w;
  const bottom = top + h;
  const outside =
    left > 0 || top > 0 || right < viewW || bottom < viewH;
  if (!outside) return;

  const pattern = voidPatternFor(g);
  g.save();
  g.fillStyle = pattern ?? ACTIVE_PALETTE.a;
  if (top > 0) g.fillRect(0, 0, viewW, top);
  if (bottom < viewH) g.fillRect(0, bottom, viewW, viewH - bottom);
  const bandTop = Math.max(0, top);
  const bandBottom = Math.min(viewH, bottom);
  if (left > 0) g.fillRect(0, bandTop, left, bandBottom - bandTop);
  if (right < viewW) g.fillRect(right, bandTop, viewW - right, bandBottom - bandTop);

  // A hard step where the world begins, so the frame reads as intentional.
  g.fillStyle = ACTIVE_PALETTE.q;
  g.fillRect(left, top - 1, w, 1);
  g.fillRect(left, bottom, w, 1);
  g.fillRect(left - 1, top, 1, h);
  g.fillRect(right, top, 1, h);
  g.restore();
}

function makeLayers(w: number, h: number, lightCount: number): Layers {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) throw new Error('2D canvas is not available');
  g.imageSmoothingEnabled = false;
  return {
    canvas,
    g,
    src: g.createImageData(w, h),
    dst: g.createImageData(w, h),
    viewLights: Array.from({ length: lightCount }, () => ({
      x: 0,
      y: 0,
      radius: 0,
      tint: 'warm' as const,
    })),
  };
}

/**
 * Build a dark space from its definition. The shared engine owns lighting,
 * collision and depth sorting: the definition only says what is there.
 */
export function createDarkSpace(def: SpaceDef, _store: GameStore): Scene {
  const map = buildCollision(def);
  const lightsFor = createSpaceLights(def.lights);
  let layers: Layers | null = null;
  let visitorBlit: { canvas: HTMLCanvasElement; g: CanvasRenderingContext2D } | null = null;

  /** Pieces with height, sorted by the line they stand on, with the player among them. */
  function drawWorld(
    s: CanvasRenderingContext2D,
    ctx: SceneCtx,
    playerName: string,
  ): void {
    def.drawBackdrop(s, ctx);

    const p = drawPos(ctx.player);
    const things: DrawPiece[] = [];

    for (const prop of def.props) {
      if (!prop.draw) continue;
      things.push({ y: prop.footY, draw: () => prop.draw?.(s, ctx) });
    }
    for (const exhibit of def.exhibits) {
      things.push({ y: exhibit.footY, draw: () => exhibit.draw(s, ctx) });
    }
    things.push({
      y: p.y + 3,
      draw: () => drawSprite(s, sprite(playerName), p.x - 8, p.y + 3 - 24),
    });

    things.sort((a, b) => a.y - b.y);
    for (const thing of things) thing.draw();
  }

  /**
   * What makes its own light is drawn after the dark, at full brightness. Each
   * piece carries the foot line of the thing it belongs to, so it can be
   * layered on the correct side of the visitor.
   */
  function glowPieces(ctx: SceneCtx): DrawPiece[] {
    const pieces: DrawPiece[] = [];

    for (const prop of def.props) {
      if (!prop.glow) continue;
      pieces.push({ y: prop.footY, draw: () => prop.glow?.(layers!.g, ctx) });
    }
    for (const exhibit of def.exhibits) {
      if (!exhibit.glow) continue;
      pieces.push({ y: exhibit.footY, draw: () => exhibit.glow?.(layers!.g, ctx) });
    }

    return pieces.sort((a, b) => a.y - b.y);
  }

  /**
   * Copy the already-lit visitor pixels out of the lit layer, keeping only the
   * sprite's opaque pixels. Glow pieces behind the visitor are drawn, this is
   * blitted back over them, then the glow pieces in front are drawn.
   */
  function visitorSlice(
    l: Layers,
    ctx: SceneCtx,
    playerName: string,
    x: number,
    y: number,
  ): HTMLCanvasElement {
    const card = sprite(playerName);
    if (
      !visitorBlit ||
      visitorBlit.canvas.width !== card.w ||
      visitorBlit.canvas.height !== card.h
    ) {
      const canvas = document.createElement('canvas');
      canvas.width = card.w;
      canvas.height = card.h;
      const g = canvas.getContext('2d');
      if (!g) throw new Error('2D canvas is not available');
      g.imageSmoothingEnabled = false;
      visitorBlit = { canvas, g };
    }

    const blit = visitorBlit;
    const viewX = Math.round(x - ctx.camera.x);
    const viewY = Math.round(y - ctx.camera.y);
    blit.g.setTransform(1, 0, 0, 1, 0, 0);
    blit.g.globalCompositeOperation = 'source-over';
    blit.g.clearRect(0, 0, card.w, card.h);
    blit.g.drawImage(l.canvas, viewX, viewY, card.w, card.h, 0, 0, card.w, card.h);
    blit.g.globalCompositeOperation = 'destination-in';
    drawSprite(blit.g, card, 0, 0);
    blit.g.globalCompositeOperation = 'source-over';
    return blit.canvas;
  }

  return {
    id: def.id,
    worldW: def.worldW,
    worldH: def.worldH,
    map,
    spawn: def.spawn,
    entries: def.entries,
    dark: true,
    hotspots: buildHotspots(def),

    update(ms, ctx) {
      for (const exhibit of def.exhibits) exhibit.update(ms, ctx);
    },

    cancel() {
      for (const exhibit of def.exhibits) exhibit.cancel?.();
    },

    draw(g, ctx) {
      const { viewW, viewH, camera } = ctx;
      if (!layers || layers.canvas.width !== viewW || layers.canvas.height !== viewH) {
        layers = makeLayers(viewW, viewH, def.lights.length + 1);
      }
      const l = layers;
      const s = l.g;

      const p = drawPos(ctx.player);
      const playerName = visitorFrame(ctx);
      const playerX = p.x - 8;
      const playerY = p.y + 3 - 24;
      const playerFoot = p.y + 3;

      // 1. The world, unlit, into a scratch canvas the size of the view.
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.fillStyle = ACTIVE_PALETTE.a;
      s.fillRect(0, 0, viewW, viewH);
      s.setTransform(1, 0, 0, 1, -camera.x, -camera.y);
      drawWorld(s, ctx, playerName);

      // 2. Light it in hard, dithered steps.
      const lights = lightsFor(ctx);
      for (let i = 0; i < lights.length; i += 1) {
        const v = l.viewLights[i];
        v.x = lights[i].x - camera.x;
        v.y = lights[i].y - camera.y;
        v.radius = lights[i].radius;
        v.tint = lights[i].tint;
      }
      s.setTransform(1, 0, 0, 1, 0, 0);
      l.src = s.getImageData(0, 0, viewW, viewH);
      applyLighting(l.src, l.dst, l.viewLights);
      s.putImageData(l.dst, 0, 0);
      drawOutOfWorld(s, ctx, def.worldW, def.worldH);

      // 3. What glows by itself, at full brightness, with the visitor layered
      // in by foot line so a doorway never paints over their head.
      const glows = glowPieces(ctx);
      const behind = glows.filter((piece) => piece.y <= playerFoot);
      const inFront = glows.filter((piece) => piece.y > playerFoot);

      const visitor = visitorSlice(l, ctx, playerName, playerX, playerY);

      s.setTransform(1, 0, 0, 1, -camera.x, -camera.y);
      for (const piece of behind) piece.draw();

      s.setTransform(1, 0, 0, 1, 0, 0);
      s.drawImage(visitor, Math.round(playerX - camera.x), Math.round(playerY - camera.y));

      s.setTransform(1, 0, 0, 1, -camera.x, -camera.y);
      for (const piece of inFront) piece.draw();

      // 4. Onto the game canvas, which is already translated by the camera.
      s.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(l.canvas, camera.x, camera.y);
    },
  };
}
