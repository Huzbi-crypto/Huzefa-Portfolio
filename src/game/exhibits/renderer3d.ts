import { PALETTES, SPRITES } from '@/game/art';
import { VECTOR, VECTOR_SCREEN } from '@/game/art/sprites/archive';
import { copy } from '@/game/content/copy';
import { projectStarId } from '@/game/content/stars';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { SceneCtx } from '@/game/scene/types';
import { TILE } from '@/game/world/grid';
import {
  projectEdges,
  rasterLine,
  rotation,
  type Edge2D,
  type Point,
  type Shape,
} from './logic/wire3d';
import { tryExhibit } from './exhibit';
import { createLantern, projectFor, type ArchiveExhibit, type At } from './archiveKit';

const COLORS = PALETTES['cozy-crt'];
const PROJECT_ID = '3d-renderer';
const { w: SCREEN_W, h: SCREEN_H } = VECTOR_SCREEN;
/** How far the shape sits from the camera, so the cube fills about half the glass. */
const DISTANCE = 3.4;
/** The slow spin it does when nobody is touching it, in radians per second. */
const IDLE_SPIN = 0.55;
/** An impulse from a tapped choice, in radians per second. */
const NUDGE = 3.2;
/** How strongly a light held over the glass pushes the shape round. */
const PUSH = 0.045;
const FRICTION = 0.96;
/** Radians per world pixel dragged over the glass. */
const DRAG_YAW = 0.035;
const DRAG_PITCH = 0.028;
/** Radians per second while an arrow key is held during the exhibit's use. */
const KEY_SPIN = 2.6;
/** The inner shape is usually inside the cube. Now and then it pokes through. */
const POP_EVERY_MS = 6400;
const POP_FOR_MS = 700;
const INNER_SIZE = 0.62;
const POKING_SIZE = 1.28;
/** Still frame for visitors who asked for calm: the corners already poke through. */
const CALM_YAW = 0.7;
const CALM_PITCH = 0.45;

const CUBE_VERTICES = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
] as const;
const CUBE_EDGES: readonly [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];
const OCTA_VERTICES = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
] as const;
const OCTA_EDGES: readonly [number, number][] = [
  [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 2], [1, 3], [1, 4], [1, 5],
  [2, 4], [4, 3], [3, 5], [5, 2],
];

/** The cube, and an octahedron breathing inside it. */
function buildShape(inner: number): { shape: Shape; cubeEdges: number } {
  const vertices = [
    ...CUBE_VERTICES.map(([x, y, z]) => ({ x, y, z })),
    ...OCTA_VERTICES.map(([x, y, z]) => ({ x: x * inner, y: y * inner, z: z * inner })),
  ];
  const edges: [number, number][] = [
    ...CUBE_EDGES,
    ...OCTA_EDGES.map(([a, b]): [number, number] => [a + 8, b + 8]),
  ];
  return { shape: { vertices, edges }, cubeEdges: CUBE_EDGES.length };
}

export type ShapePixel = Point & { inner: boolean };

/**
 * Every pixel of the wireframe at one pose, in whole screen pixels. `inner`
 * marks the octahedron's pixels, which are drawn in a different colour.
 */
export function shapePixels(yaw: number, pitch: number, innerSize: number): ShapePixel[] {
  const { shape, cubeEdges } = buildShape(innerSize);
  const m = rotation(yaw, pitch);
  m[11] = DISTANCE;
  const edges: Edge2D[] = projectEdges(m, shape, SCREEN_W, SCREEN_H);

  // projectEdges drops clipped edges, so match each kept edge back to its group
  // by projecting the cube alone.
  const cube = projectEdges(m, { vertices: shape.vertices, edges: shape.edges.slice(0, cubeEdges) }, SCREEN_W, SCREEN_H);
  const pixels: ShapePixel[] = [];
  edges.forEach((edge, i) => {
    const inner = i >= cube.length;
    for (const p of rasterLine(edge)) {
      if (p.x < 0 || p.y < 0 || p.x >= SCREEN_W || p.y >= SCREEN_H) continue;
      pixels.push({ x: p.x, y: p.y, inner });
    }
  });
  return pixels;
}

export type RendererExhibit = ArchiveExhibit & {
  /** The shape's current angles, so a test can see that touching it turns it. */
  view(): { yaw: number; pitch: number };
};

/**
 * An old vector screen spinning a cube with something inside it. The 3D maths
 * is the real thing from the logic module. A light held over the glass pushes
 * the shape round, which covers a mouse, a finger and the keyboard's lantern
 * alike, and the dialogue's spin choices do the same for anyone else.
 */
export function createRenderer3d(at: At): RendererExhibit {
  const project = projectFor(PROJECT_ID);
  const lantern = createLantern();
  const screen = { x: at.x + VECTOR_SCREEN.x, y: at.y + VECTOR_SCREEN.y };
  const centre = { x: screen.x + SCREEN_W / 2, y: screen.y + SCREEN_H / 2 };
  const light: Light = { x: centre.x, y: centre.y, radius: 26, tint: 'cool' };

  let yaw = CALM_YAW;
  let pitch = CALM_PITCH;
  let yawSpeed = IDLE_SPIN;
  let pitchSpeed = 0;
  let clock = 0;
  let calm = false;
  let focused = false;
  let dragFrom: { x: number; y: number } | null = null;
  let lastDrag: { x: number; y: number } | null = null;

  const poking = (): boolean => clock % POP_EVERY_MS > POP_EVERY_MS - POP_FOR_MS;
  const innerSize = (): number => (calm ? POKING_SIZE : poking() ? POKING_SIZE : INNER_SIZE);

  const clampPitch = (): void => {
    pitch = Math.max(-1.3, Math.min(1.3, pitch));
  };

  /** A pointer in the same world pixels as the glass. */
  const pointerWorld = (ctx: SceneCtx): { x: number; y: number } | null => {
    const p = ctx.input.pointer;
    if (!p) return null;
    return { x: p.x / ctx.scale + ctx.camera.x, y: p.y / ctx.scale + ctx.camera.y };
  };

  const onGlass = (point: { x: number; y: number }): boolean =>
    point.x >= screen.x &&
    point.x <= screen.x + SCREEN_W &&
    point.y >= screen.y &&
    point.y <= screen.y + SCREEN_H;

  return {
    id: PROJECT_ID,
    projectId: PROJECT_ID,
    rect: { x: at.x, y: at.y, w: VECTOR.w, h: VECTOR.h },
    stand: { x: Math.floor((at.x + VECTOR.w / 2) / TILE), y: Math.floor((at.y + VECTOR.h) / TILE) },
    footY: at.y + VECTOR.h,
    label: copy.archive.renderer.label,
    light,
    view: () => ({ yaw, pitch }),

    update(ms, ctx) {
      const dt = Math.min(ms, 100) / 1000;
      const wasCalm = calm;
      calm = ctx.reducedMotion;
      if (calm && !wasCalm) {
        // Entering the calm version settles on a still pose. From there it
        // only moves when the visitor drags or presses an arrow.
        yaw = CALM_YAW;
        pitch = CALM_PITCH;
      }

      // A press that begins on the glass grabs the screen for as long as it is
      // held. The exhibit claims the press so it never turns into a walk.
      const pointer = pointerWorld(ctx);
      const down = ctx.input.pointerDown ?? null;
      let grabbed = false;
      if (down && pointer) {
        if (!dragFrom) {
          const origin = {
            x: down.x / ctx.scale + ctx.camera.x,
            y: down.y / ctx.scale + ctx.camera.y,
          };
          if (onGlass(origin)) {
            dragFrom = origin;
            lastDrag = origin;
          }
        }
        if (dragFrom) {
          ctx.input.consumePress?.();
          if (lastDrag) {
            yaw += (pointer.x - lastDrag.x) * DRAG_YAW;
            pitch += (pointer.y - lastDrag.y) * DRAG_PITCH;
            clampPitch();
          }
          lastDrag = pointer;
          grabbed = true;
        }
      } else {
        dragFrom = null;
        lastDrag = null;
      }

      // Arrow keys also turn it while its own dialogue is up and focused.
      const arrows = ctx.input.arrows;
      if (focused && arrows && (arrows.x !== 0 || arrows.y !== 0)) {
        yaw += arrows.x * KEY_SPIN * dt;
        pitch += arrows.y * KEY_SPIN * dt;
        clampPitch();
        grabbed = true;
      }

      if (calm) {
        yawSpeed = 0;
        pitchSpeed = 0;
        clock += ms;
        return;
      }

      clock += ms;
      if (grabbed) {
        // Being held stops the idle spin and the light's push.
        yawSpeed = 0;
        pitchSpeed = 0;
        return;
      }

      // A light held over the glass pushes the shape round, harder the further from the middle.
      const held = lantern(ctx);
      const dx = held.x - centre.x;
      const dy = held.y - centre.y;
      if (Math.abs(dx) <= SCREEN_W / 2 + 4 && Math.abs(dy) <= SCREEN_H / 2 + 4) {
        yawSpeed += dx * PUSH;
        pitchSpeed += dy * PUSH;
      }

      yaw += yawSpeed * dt;
      pitch += pitchSpeed * dt;
      // Friction settles the shape back to its idle spin, never to a standstill.
      yawSpeed = IDLE_SPIN + (yawSpeed - IDLE_SPIN) * Math.pow(FRICTION, dt * 60);
      pitchSpeed *= Math.pow(FRICTION, dt * 60);
      clampPitch();
    },

    draw(g) {
      drawSprite(g, SPRITES.archVector, at.x, at.y);
    },

    glow(g) {
      g.fillStyle = COLORS.a;
      g.fillRect(screen.x, screen.y, SCREEN_W, SCREEN_H);
      // The faint grid a vector screen keeps when nothing is on it.
      g.fillStyle = COLORS.b;
      for (let x = 3; x < SCREEN_W; x += 6) g.fillRect(screen.x + x, screen.y, 1, SCREEN_H);
      for (let y = 3; y < SCREEN_H; y += 6) g.fillRect(screen.x, screen.y + y, SCREEN_W, 1);

      for (const p of shapePixels(yaw, pitch, innerSize())) {
        g.fillStyle = p.inner ? COLORS.s : COLORS.t;
        g.fillRect(screen.x + p.x, screen.y + p.y, 1, 1);
      }
    },

    async use(api) {
      const text = copy.archive.renderer;
      const star = projectStarId(PROJECT_ID);
      const choices = [
        { id: 'left', label: text.left },
        { id: 'right', label: text.right },
        { id: 'up', label: text.up },
        { id: 'down', label: text.down },
        { id: 'leave', label: text.leaveLabel },
      ];
      let lines: string[] = [...text.intro];

      focused = true;
      try {
        for (let guard = 0, spins = 0; guard < 200; guard += 1) {
          const picked = await api.store.say(lines, choices);
          const push: Record<string, [number, number]> = {
            left: [-NUDGE, 0],
            right: [NUDGE, 0],
            up: [0, -NUDGE],
            down: [0, NUDGE],
          };
          const impulse = picked ? push[picked] : undefined;
          if (!impulse) break;

          yawSpeed += impulse[0];
          pitchSpeed += impulse[1];
          // Turning it is the try. It can't be done wrong.
          api.store.award(star);
          lines = [text.spun[Math.min(spins, text.spun.length - 1)]];
          if (spins === 1) lines.push(text.pop);
          spins += 1;
        }
      } finally {
        focused = false;
      }

      await tryExhibit(api, project.id);
    },
  };
}
