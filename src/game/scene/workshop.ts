import { SPRITES } from '@/game/art';
import { copy } from '@/game/content/copy';
import { createAiAnime } from '@/game/exhibits/aiAnime';
import { createCompilerBelt } from '@/game/exhibits/compilerBelt';
import { createLangProjects } from '@/game/exhibits/langProjects';
import { createSpeechTranslator } from '@/game/exhibits/speechTranslator';
import type { Exhibit } from '@/game/exhibits/types';
import type { Light } from '@/game/render/lighting';
import { drawSprite } from '@/game/render/sprite';
import type { GameStore } from '@/game/state/store';
import { TILE } from '@/game/world/grid';
import { createDarkSpace, type SpaceDef } from './space';
import type { Scene } from './types';

const WORLD_W = 384;
const WORLD_H = 224;
const WALL_BOTTOM = 48; // rows 0..2 are wall, the floor starts at y = 48

/** Where the fixed things stand, in world pixels. */
export const WORKSHOP_AT = {
  ladder: { x: 26, y: 4 },
  pegboardOne: { x: 78, y: 12 },
  jarsOne: { x: 150, y: 14 },
  blueprintOne: { x: 206, y: 18 },
  pegboardTwo: { x: 258, y: 12 },
  jarsTwo: { x: 324, y: 14 },
  machine: { x: 40, y: 56 },
  board: { x: 136, y: 70 },
  cans: { x: 30, y: 176 },
  belt: { x: 216, y: 166 },
} as const;

function sprite(name: string) {
  const found = SPRITES[name];
  if (!found) throw new Error(`Missing sprite: ${name}`);
  return found;
}

/** Exhibits keep their own state, so every workshop gets its own set and its own lights. */
function buildExhibits(): { exhibits: Exhibit[]; lights: Light[] } {
  const ladderLight: Light = {
    x: WORKSHOP_AT.ladder.x + 10,
    y: WORKSHOP_AT.ladder.y + 10,
    radius: 22,
    tint: 'cool',
  };
  const aiAnime = createAiAnime(WORKSHOP_AT.machine, { x: 9, y: 16 });
  const lang = createLangProjects(WORKSHOP_AT.board, { x: 26, y: 17 });
  const speech = createSpeechTranslator(WORKSHOP_AT.cans, { x: 4, y: 24 });
  const belt = createCompilerBelt(WORKSHOP_AT.belt, { x: 30, y: 24 });
  return {
    exhibits: [aiAnime.exhibit, lang.exhibit, speech.exhibit, belt.exhibit],
    lights: [ladderLight, aiAnime.light, lang.light, speech.light, belt.light],
  };
}

function drawShell(g: CanvasRenderingContext2D): void {
  for (let y = 0; y < WORLD_H; y += TILE) {
    for (let x = 0; x < WORLD_W; x += TILE) {
      let name: string;
      if (y < 32) name = 'workshopWall';
      else if (y === 32) name = 'workshopWallBase';
      else name = ((x / TILE) * 5 + (y / TILE) * 3) % 7 === 0 ? 'workshopFloorAlt' : 'workshopFloor';
      drawSprite(g, sprite(name), x, y);
    }
  }
  // The same inky border the hall has, so every dark space ends the same way.
  g.fillStyle = '#1b1428';
  g.fillRect(0, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(WORLD_W - TILE, WALL_BOTTOM, TILE, WORLD_H - WALL_BOTTOM);
  g.fillRect(0, WORLD_H - TILE, WORLD_W, TILE);
}

function drawBackdrop(g: CanvasRenderingContext2D): void {
  drawShell(g);
  const at = WORKSHOP_AT;
  drawSprite(g, sprite('workshopLadder'), at.ladder.x, at.ladder.y);
  drawSprite(g, sprite('workshopPegboard'), at.pegboardOne.x, at.pegboardOne.y);
  drawSprite(g, sprite('workshopJars'), at.jarsOne.x, at.jarsOne.y);
  drawSprite(g, sprite('workshopBlueprint'), at.blueprintOne.x, at.blueprintOne.y);
  drawSprite(g, sprite('workshopPegboard'), at.pegboardTwo.x, at.pegboardTwo.y);
  drawSprite(g, sprite('workshopJars'), at.jarsTwo.x, at.jarsTwo.y);
}

function buildSpaceDef(): SpaceDef {
  const { exhibits, lights } = buildExhibits();
  return {
    id: 'workshop',
    worldW: WORLD_W,
    worldH: WORLD_H,
    solids: [
      { x: 0, y: 0, w: WORLD_W, h: WALL_BOTTOM },
      // The machine's legs. Its body is raised on them, so the visitor can pass behind.
      { x: WORKSHOP_AT.machine.x + 8, y: WORKSHOP_AT.machine.y + 62, w: 44, h: 10 },
      // The conveyor belt and its legs.
      { x: WORKSHOP_AT.belt.x, y: WORKSHOP_AT.belt.y + 4, w: 148, h: 18 },
      // Two crates for the tin cans to stand on.
      { x: WORKSHOP_AT.cans.x, y: WORKSHOP_AT.cans.y + 2, w: 26, h: 14 },
      { x: WORKSHOP_AT.cans.x + 140, y: WORKSHOP_AT.cans.y + 2, w: 26, h: 14 },
      // The drafting table's legs and front; robots stand on top and can be passed behind.
      { x: WORKSHOP_AT.board.x + 4, y: WORKSHOP_AT.board.y + 46, w: 144, h: 16 },
    ],
    spawn: { x: 5, y: 7 },
    entries: { fromHall: { x: 5, y: 7 } },
    exits: [
      {
        id: 'exit',
        rect: { x: WORKSHOP_AT.ladder.x - 2, y: WORKSHOP_AT.ladder.y, w: 24, h: 44 },
        stand: { x: 4, y: 6 },
        label: copy.workshop.exit.label,
        to: 'dark',
        entry: 'fromWorkshop',
        lines: copy.workshop.exit.lines,
        goLabel: copy.workshop.exit.backLabel,
        stayLabel: copy.workshop.exit.stayLabel,
        stayReply: copy.workshop.exit.stayReply,
      },
    ],
    props: [],
    exhibits,
    lights,
    drawBackdrop,
  };
}

export function createWorkshop(store: GameStore): Scene {
  return createDarkSpace(buildSpaceDef(), store);
}
