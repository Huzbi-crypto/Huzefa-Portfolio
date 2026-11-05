import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { personalInfo } from '../../src/data/personal';
import { projects } from '../../src/data/projects';
import { copy } from '../../src/game/content/copy';
import { allStarIds, starTotal } from '../../src/game/content/stars';
import { VISITOR_GRIDS } from '../../src/game/art/sprites/visitor';
import type { SceneId } from '../../src/game/scene/types';
import { TILE } from '../../src/game/world/grid';

const STAGE = '.game-stage';
const DIALOGUE = '.dialogue';
const CHOICE = '.dialogue-choice';
const COUNTER = '.star-counter';
const PROJECT_PANEL = '[data-testid="project-panel-backdrop"]';
const CONTACT_CARD = '[data-testid="contact-backdrop"]';
const TERM_PROMPT = '[data-testid="term-prompt-backdrop"]';
const PROGRESS_KEY = 'huzbi-game-v1';
const CHECKPOINT_DIR = path.join('test-results', 'checkpoint-1');
const FIX_DIR = path.join('test-results', 'fix');
const TOTAL_STARS = starTotal();

type Snapshot = {
  sceneId: SceneId;
  x: number;
  y: number;
  path: number;
  moving: boolean;
  facing: string;
  camera: { x: number; y: number };
  scale: number;
  viewW: number;
  viewH: number;
  transition: { phase: string; progress: number; cx: number; cy: number } | null;
  drag: { x: number; y: number } | null;
};

/** Read the controller state the game exposes only behind `?e2e=1`. */
async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const game = window.__huzbiGame;
    if (!game) {
      throw new Error('window.__huzbiGame is missing; open the page with ?e2e=1');
    }
    const state = game.snapshot();
    return {
      sceneId: state.sceneId,
      x: state.player.x,
      y: state.player.y,
      path: state.player.path.length,
      moving: state.player.moving,
      facing: state.player.facing,
      camera: { x: state.camera.x, y: state.camera.y },
      scale: state.scale,
      viewW: state.viewW,
      viewH: state.viewH,
      transition: state.transition
        ? {
            phase: state.transition.phase,
            progress: state.transition.progress,
            cx: state.transition.cx,
            cy: state.transition.cy,
          }
        : null,
      drag: state.drag ? { x: state.drag.x, y: state.drag.y } : null,
    };
  });
}

async function openGame(page: Page): Promise<void> {
  await page.goto('/?e2e=1');
  await expect(page.locator(STAGE)).toBeVisible();
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas');
      return Boolean(window.__huzbiGame) && Boolean(canvas && canvas.width > 0);
    },
    undefined,
    { timeout: 10_000 },
  );
  await page.locator(STAGE).focus();
  await page.waitForTimeout(100);
}

function cssPoint(state: Snapshot, wx: number, wy: number): { x: number; y: number } {
  return {
    x: (wx - state.camera.x) * state.scale,
    y: (wy - state.camera.y) * state.scale,
  };
}

async function clickWorld(page: Page, wx: number, wy: number): Promise<void> {
  const state = await snapshot(page);
  const point = cssPoint(state, wx, wy);
  await page.mouse.click(point.x, point.y);
}

async function tapWorld(page: Page, wx: number, wy: number): Promise<void> {
  const state = await snapshot(page);
  const point = cssPoint(state, wx, wy);
  await page.touchscreen.tap(point.x, point.y);
}

/** Press Enter until Enter would pick a choice rather than finish a line. */
async function advanceToChoices(page: Page): Promise<void> {
  const choices = page.locator(CHOICE);
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    if ((await choices.count()) > 0) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }
  throw new Error('Dialogue choices never appeared');
}

async function dismissDialogue(page: Page): Promise<void> {
  const dialogue = page.locator(DIALOGUE);

  for (let i = 0; i < 60; i += 1) {
    if ((await dialogue.count()) === 0) return;
    if ((await page.locator(CHOICE).count()) > 0) {
      throw new Error('dismissDialogue met a dialogue that still had choices');
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }
  throw new Error('Dialogue did not close');
}

async function waitForScene(page: Page, sceneId: Snapshot['sceneId']): Promise<void> {
  await expect
    .poll(
      async () => {
        const state = await snapshot(page);
        return `${state.sceneId}:${state.transition ? state.transition.phase : 'none'}`;
      },
      { timeout: 20_000 },
    )
    .toBe(`${sceneId}:none`);
}

/** The real door journey: walk to the door, choose OPEN IT, wait out the iris. */
async function enterDarkByDoor(page: Page, touch = false): Promise<void> {
  if (touch) {
    // On a phone the room is wider than the view, so walk right until the
    // door comes into sight before tapping it.
    await tapWorld(page, 250, 100);
    await expect
      .poll(async () => (await snapshot(page)).x, { timeout: 10_000 })
      .toBeGreaterThan(240);
  }

  if (touch) await tapWorld(page, 300, 28);
  else await clickWorld(page, 300, 28);

  await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 15_000 });
  await advanceToChoices(page);
  await page.getByRole('button', { name: 'OPEN IT', exact: true }).click();
  await waitForScene(page, 'dark');
  await dismissDialogue(page);
}

async function screenshot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(CHECKPOINT_DIR, name) });
}

/** RGB sum of one canvas pixel, for checking what is actually on top. */
async function canvasPixel(page: Page, x: number, y: number): Promise<number> {
  return page.evaluate(
    ({ x: px, y: py }) => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas');
      const context = canvas?.getContext('2d');
      if (!canvas || !context) throw new Error('The game canvas is missing');
      const data = context.getImageData(Math.round(px), Math.round(py), 1, 1).data;
      return data[0] + data[1] + data[2];
    },
    { x, y },
  );
}

/**
 * The topmost pixel that stays ink in every standing frame for a direction.
 * A fixed coordinate breaks when the idle beat nudges the loose tuft.
 */
function stableHeadPixel(frames: string[]): { x: number; y: number } {
  const grids = frames.map((name) => VISITOR_GRIDS[name]);
  for (let y = 0; y < grids[0].length; y += 1) {
    for (let x = 0; x < grids[0][y].length; x += 1) {
      const c = grids[0][y][x];
      if (c !== '.' && grids.every((g) => g[y][x] === c)) return { x, y };
    }
  }
  throw new Error(`no stable head pixel in ${frames.join(', ')}`);
}

/** Average RGB of a small canvas-pixel patch, for judging the lantern. */
async function canvasBrightness(page: Page, x: number, y: number): Promise<number> {
  return page.evaluate(
    ({ x: px, y: py }) => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas');
      const context = canvas?.getContext('2d');
      if (!canvas || !context) throw new Error('The game canvas is missing');

      const size = 7;
      const left = Math.max(0, Math.min(canvas.width - size, Math.round(px) - 3));
      const top = Math.max(0, Math.min(canvas.height - size, Math.round(py) - 3));
      const data = context.getImageData(left, top, size, size).data;
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        total += data[i] + data[i + 1] + data[i + 2];
      }
      return total / (data.length / 4);
    },
    { x, y },
  );
}

test.describe('desktop journey at 1366 by 768', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('no_navbar_on_home', async ({ page }) => {
    await openGame(page);

    await expect(page.locator('header')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main Navigation' })).toHaveCount(0);
    await expect(page.locator(STAGE)).toBeVisible();
  });

  test('arrow_keys_move_player', async ({ page }) => {
    await openGame(page);
    const before = await snapshot(page);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');

    await expect
      .poll(async () => (await snapshot(page)).x, { timeout: 5_000 })
      .toBeGreaterThan(before.x + 10);
    expect((await snapshot(page)).sceneId).toBe('room');
  });

  test('click_walks_to_spot', async ({ page }) => {
    await openGame(page);
    const before = await snapshot(page);

    await clickWorld(page, 120, 130);

    await expect
      .poll(
        async () => {
          const state = await snapshot(page);
          return {
            done: state.path === 0 && !state.moving,
            near: Math.abs(state.x - 124) <= 3 && Math.abs(state.y - 132) <= 3,
          };
        },
        { timeout: 10_000 },
      )
      .toEqual({ done: true, near: true });

    const after = await snapshot(page);
    expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(20);
  });

  test('arrows_do_not_scroll_page', async ({ page }) => {
    await openGame(page);

    // Give the document somewhere to scroll to; the fixed game stage is not affected.
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.style.height = '2000px';
      document.body.appendChild(spacer);
    });
    await page.locator(STAGE).focus();
    expect(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(
      true,
    );

    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft']) {
      await page.keyboard.press(key);
    }

    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('read_note_awards_star_and_counter_updates', async ({ page }) => {
    await openGame(page);
    await screenshot(page, 'room-desktop.png');

    await clickWorld(page, 161, 39);
    await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 15_000 });
    await screenshot(page, 'note-dialogue.png');

    const counter = page.locator(COUNTER);
    await expect(counter).toHaveAttribute('aria-label', `Stars: 1 of ${TOTAL_STARS}`);

    await dismissDialogue(page);
    await expect(counter).toContainText(`1/${TOTAL_STARS}`);

    const saved = await page.evaluate(() => {
      const raw = window.localStorage.getItem('huzbi-game-v1');
      return raw ? (JSON.parse(raw) as { found: string[] }) : null;
    });
    expect(saved?.found).toContain('silly:read-note');
  });

  test('both_windows_open_the_star_dialogue', async ({ page }) => {
    await openGame(page);

    // The left window.
    await clickWorld(page, 40, 20);
    await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.dialogue-text')).toContainText(copy.window.none[0]);
    await dismissDialogue(page);

    // The right window, walking across the room from the left one.
    await clickWorld(page, 248, 20);
    await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.dialogue-text')).toContainText(copy.window.none[0]);
    await dismissDialogue(page);

    await expect(page.locator(COUNTER)).toContainText(`0/${TOTAL_STARS}`);
  });

  test('open_door_enters_dark', async ({ page }) => {
    await openGame(page);

    await enterDarkByDoor(page);

    const state = await snapshot(page);
    expect(state.sceneId).toBe('dark');
    expect(state.transition).toBeNull();

    await page.mouse.move(600, 400);
    await page.waitForTimeout(150);
    await screenshot(page, 'dark-desktop.png');
  });

  test('doorway_keeps_the_whole_head_visible', async ({ page }) => {
    await openGame(page);
    await enterDarkByDoor(page);

    // Stand exactly on the exit's stand tile, facing the lit doorway.
    await page.evaluate(() => {
      window.__huzbiGame!.teleport(36, 52, 'up');
    });
    await page.waitForTimeout(150);

    const state = await snapshot(page);
    expect(state.sceneId).toBe('dark');
    expect(state.x).toBe(36);
    expect(state.y).toBe(52);

    fs.mkdirSync(FIX_DIR, { recursive: true });
    await page.screenshot({ path: path.join(FIX_DIR, 'doorway.png') });

    // The top of the visitor's head is ink. Derive a pixel that stays ink in
    // both standing frames, since the idle beat shifts the loose tuft, then
    // apply the same sprite offset the dark scene uses. If the doorway glow
    // paints over the head, this pixel is the glow's bright amber instead.
    const head = stableHeadPixel(['visitor-up-0', 'visitor-up-idle']);
    const spriteLeft = Math.round(state.x - 8 - state.camera.x);
    const spriteTop = Math.round(state.y + 3 - 24 - state.camera.y);
    const headTop = await canvasPixel(page, spriteLeft + head.x, spriteTop + head.y);
    expect(headTop, 'the top of the visitor head must be visible').toBeLessThan(150);
  });

  test('cursor_moves_light', async ({ page }) => {
    await openGame(page);
    await enterDarkByDoor(page);
    // Let the door's arrival beat finish and the first lit frame settle.
    await page.waitForTimeout(300);

    const state = await snapshot(page);

    // A far floor point, lit only by the lantern. The light steps are
    // quantised, so sample a patch that is genuinely dark beyond the radius.
    const target = { x: 300, y: 160 };
    const point = cssPoint(state, target.x, target.y);
    const sampleX = target.x - state.camera.x;
    const sampleY = target.y - state.camera.y;

    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(300);
    const lit = await canvasBrightness(page, sampleX, sampleY);

    // Move the pointer to another empty patch of the same room. A plain
    // viewport coordinate can land on a HUD control, whose pointer events
    // never reach the canvas, so derive it from world coordinates.
    const away = cssPoint(state, 60, 100);
    await page.mouse.move(away.x, away.y);
    await page.waitForTimeout(300);
    const dark = await canvasBrightness(page, sampleX, sampleY);

    expect(lit).toBeGreaterThan(dark + 20);
  });

  test('keyboard_keeps_light_on_player', async ({ page }) => {
    await openGame(page);
    await enterDarkByDoor(page);

    const state = await snapshot(page);

    // Leave the pointer far away, then switch to the keyboard.
    const farPoint = cssPoint(state, 289, 150);
    await page.mouse.move(farPoint.x, farPoint.y);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(250);
    await page.keyboard.up('ArrowRight');

    const moved = await snapshot(page);
    const playerPatch = {
      x: moved.x - moved.camera.x,
      y: moved.y - 10 - moved.camera.y,
    };
    const farPatch = {
      x: 289 - moved.camera.x,
      y: 150 - moved.camera.y,
    };

    await page.waitForTimeout(150);
    const onPlayer = await canvasBrightness(page, playerPatch.x, playerPatch.y);
    const onPointer = await canvasBrightness(page, farPatch.x, farPatch.y);

    expect(onPlayer).toBeGreaterThan(onPointer + 20);
  });

  test('return_to_room', async ({ page }) => {
    await openGame(page);
    await enterDarkByDoor(page);

    await clickWorld(page, 36, 28);
    await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 15_000 });
    await advanceToChoices(page);
    await page.getByRole('button', { name: 'GO BACK', exact: true }).click();

    await waitForScene(page, 'room');
    expect((await snapshot(page)).sceneId).toBe('room');
  });

  test('progress_survives_reload', async ({ page }) => {
    await openGame(page);

    await clickWorld(page, 161, 39);
    await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 15_000 });
    await dismissDialogue(page);
    await expect(page.locator(COUNTER)).toContainText(`1/${TOTAL_STARS}`);

    await page.reload();
    await page.waitForFunction(() => Boolean(window.__huzbiGame), undefined, { timeout: 10_000 });
    await expect(page.locator(COUNTER)).toContainText(`1/${TOTAL_STARS}`);
    await expect(page.locator(COUNTER)).toHaveAttribute('aria-label', `Stars: 1 of ${TOTAL_STARS}`);
  });

  test('corrupt_save_starts_fresh', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('huzbi-game-v1', '{not valid json');
      } catch {
        // A storage-less context is not what this test is about.
      }
    });
    await openGame(page);

    await expect(page.locator(COUNTER)).toContainText(`0/${TOTAL_STARS}`);
    expect((await snapshot(page)).sceneId).toBe('room');
    expect(pageErrors).toEqual([]);
  });

  test('typing_in_terminal_does_not_move_player', async ({ page }) => {
    await openGame(page);

    // Use the CRT: it says its line, then opens the shell.
    await clickWorld(page, 176, 30);
    await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 15_000 });
    await dismissDialogue(page);

    const terminal = page.getByRole('dialog', { name: 'Retro Terminal Interactive Shell' });
    await expect(terminal).toBeVisible({ timeout: 10_000 });
    const prompt = page.getByRole('textbox', { name: 'Terminal command prompt input' });
    await expect(prompt).toBeFocused({ timeout: 5_000 });

    const before = await snapshot(page);
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'a', 'b']) {
      await page.keyboard.press(key);
    }
    await page.waitForTimeout(200);

    const after = await snapshot(page);
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.path).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.keyboard.press('Escape');
    await expect(terminal).toBeHidden({ timeout: 5_000 });
  });

  test('no_console_errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

    await openGame(page);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');
    await clickWorld(page, 161, 39);
    await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 15_000 });
    await dismissDialogue(page);
    await page.waitForTimeout(300);

    expect(errors).toEqual([]);
  });
});

test.describe('phone journey at 390 by 844 with touch', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test('tap_walks', async ({ page }) => {
    await openGame(page);
    await screenshot(page, 'room-phone.png');
    const before = await snapshot(page);

    await tapWorld(page, 250, 100);

    await expect
      .poll(async () => (await snapshot(page)).x, { timeout: 10_000 })
      .toBeGreaterThan(before.x + 40);
    expect((await snapshot(page)).sceneId).toBe('room');
  });

  test('drag_moves_light', async ({ page }) => {
    await openGame(page);
    await enterDarkByDoor(page, true);

    const before = await snapshot(page);

    const client = await page.context().newCDPSession(page);
    const from = { x: 240, y: 480 };
    const to = { x: 320, y: 560 };
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: from.x, y: from.y }],
    });
    await page.waitForTimeout(80);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: to.x, y: to.y }],
    });
    await page.waitForTimeout(120);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(150);
    await client.detach();

    const after = await snapshot(page);
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.drag).not.toBeNull();
    expect(Math.abs((after.drag?.x ?? 0) - to.x)).toBeLessThan(2);
    expect(Math.abs((after.drag?.y ?? 0) - to.y)).toBeLessThan(2);

    // The dragged light lights the world there, not where the pointer started.
    const lit = await canvasBrightness(page, to.x / after.scale, to.y / after.scale);
    const dark = await canvasBrightness(page, 30, 40);
    expect(lit).toBeGreaterThan(dark + 20);

    await screenshot(page, 'dark-phone.png');
  });

  test('rotate_keeps_integer_scale', async ({ page }) => {
    await openGame(page);

    const portrait = await snapshot(page);
    expect(Number.isInteger(portrait.scale)).toBe(true);
    expect(portrait.scale).toBeGreaterThanOrEqual(2);
    expect(portrait.viewW * portrait.scale).toBeGreaterThanOrEqual(390);
    expect(portrait.viewH * portrait.scale).toBeGreaterThanOrEqual(844);

    const canvasSize = async (): Promise<{ width: string; height: string }> =>
      page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('canvas');
        if (!canvas) throw new Error('The game canvas is missing');
        return { width: canvas.style.width, height: canvas.style.height };
      });
    expect(await canvasSize()).toEqual({
      width: `${portrait.viewW * portrait.scale}px`,
      height: `${portrait.viewH * portrait.scale}px`,
    });

    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(async () => (await snapshot(page)).viewW, { timeout: 5_000 })
      .toBe(422);

    const landscape = await snapshot(page);
    expect(Number.isInteger(landscape.scale)).toBe(true);
    expect(landscape.scale).toBeGreaterThanOrEqual(2);
    expect(landscape.viewW * landscape.scale).toBeGreaterThanOrEqual(844);
    expect(landscape.viewH * landscape.scale).toBeGreaterThanOrEqual(390);
    expect(await canvasSize()).toEqual({
      width: `${landscape.viewW * landscape.scale}px`,
      height: `${landscape.viewH * landscape.scale}px`,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(async () => (await snapshot(page)).viewH, { timeout: 5_000 })
      .toBe(422);
    expect(Number.isInteger((await snapshot(page)).scale)).toBe(true);
  });
});

test.describe('reduced motion', () => {
  test.use({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });

  test('dialogue_text_appears_instantly', async ({ page }) => {
    await openGame(page);

    await clickWorld(page, 161, 39);
    await page.locator(DIALOGUE).waitFor({ state: 'visible', timeout: 15_000 });

    // With typing animation this is empty or a few characters; instant is the
    // whole first line straight away.
    expect(await page.locator('.dialogue-text').textContent()).toBe(copy.note.lines[0]);

    await screenshot(page, 'reduced-motion.png');
  });
});

test.describe('the HUD', () => {
  test('sound_and_journal_use_the_same_pixel_font_as_the_rest_of_the_hud', async ({ page }) => {
    await openGame(page);

    const families = await page.evaluate(() => {
      const fontOf = (selector: string): string | null => {
        const element = document.querySelector<HTMLElement>(selector);
        return element ? getComputedStyle(element).fontFamily : null;
      };
      return {
        hud: fontOf('.star-counter'),
        sound: fontOf('.sound-toggle'),
        journal: fontOf('.journal-button'),
        journalKey: fontOf('.journal-key'),
        controls: fontOf('.controls-hint'),
        useHint: fontOf('.use-hint'),
      };
    });

    expect(families.hud).toBeTruthy();
    expect(families.sound).toBe(families.hud);
    expect(families.journal).toBe(families.hud);
    expect(families.journalKey).toBe(families.hud);
    expect(families.controls).toBe(families.hud);
  });
});

test.describe('old pages', () => {
  test('old_pages_still_respond', async ({ request }) => {
    const urls = [
      '/about/',
      '/projects/',
      '/projects/routing-simulation/',
      '/github/',
      '/contact/',
    ];

    for (const url of urls) {
      const response = await request.get(url);
      expect(response.status(), url).toBe(200);
    }
  });
});

// --- the whole game ---------------------------------------------------------

type WorldRect = { x: number; y: number; w: number; h: number };

type HotspotView = {
  id: string;
  rect: WorldRect;
  /** Tighter pointer targets, when the visible thing is smaller than its bounds. */
  hitRects?: WorldRect[];
  stand: { x: number; y: number };
};

/** The centre of the first visible piece, which is what a visitor would click. */
function hotspotTarget(hotspot: HotspotView): { x: number; y: number } {
  const target = hotspot.hitRects?.[0] ?? hotspot.rect;
  return { x: target.x + target.w / 2, y: target.y + target.h / 2 };
}

type PlayOptions = {
  /** Which of a dialogue's choices to take. The first is the obvious one. */
  choice?: 'first' | 'last';
  /** Per-choice picks, for exhibits that need a try and then a way out. */
  choices?: ('first' | 'last')[];
  /** On a phone, drive the dialogue with taps rather than the keyboard. */
  touch?: boolean;
  /** Every full dialogue line seen, in order. */
  lines?: string[];
  /** Every project panel title opened, in order. */
  panels?: string[];
  /** Keep waiting through an exhibit animation until its project panel opens. */
  panel?: boolean;
  timeout?: number;
};

/** The scene, camera and player state the controller exposes behind `?e2e=1`. */
async function gameState(page: Page): Promise<Snapshot> {
  return snapshot(page);
}

async function goToScene(page: Page, sceneId: SceneId): Promise<void> {
  const current = await gameState(page);
  if (current.sceneId === sceneId) return;

  await page.evaluate((id) => {
    window.__huzbiGame!.goTo(id as SceneId);
  }, sceneId);
  await waitForScene(page, sceneId);
}

async function hotspotView(page: Page, id: string): Promise<HotspotView> {
  return page.evaluate((hotspotId) => {
    const game = window.__huzbiGame;
    if (!game) throw new Error('window.__huzbiGame is missing; open the page with ?e2e=1');
    const found = game.snapshot().hotspots.find((hotspot) => hotspot.id === hotspotId);
    if (!found) throw new Error(`No hotspot ${hotspotId} in this scene`);
    return {
      id: found.id,
      rect: found.rect,
      hitRects: found.hitRects,
      stand: found.stand,
    };
  }, id);
}

/** Stand on a hotspot's own stand tile, exactly as the game's walk would. */
async function standAt(page: Page, sceneId: SceneId, id: string): Promise<HotspotView> {
  await goToScene(page, sceneId);
  const hotspot = await hotspotView(page, id);

  await page.evaluate(
    ({ stand, rect, tile }) => {
      const x = stand.x * tile + tile / 2;
      const y = stand.y * tile + tile / 2;
      const dx = rect.x + rect.w / 2 - x;
      const dy = rect.y + rect.h / 2 - y;
      const facing =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      window.__huzbiGame!.teleport(x, y, facing);
    },
    { stand: hotspot.stand, rect: hotspot.rect, tile: TILE },
  );
  await page.waitForTimeout(100);

  // Entering the dark greets a first visitor with one short line. It is a
  // dialogue, not part of the hotspot about to be used.
  if ((await page.locator(DIALOGUE).count()) > 0) {
    await playUntilQuiet(page, { timeout: 8_000 });
  }

  await page.locator(STAGE).focus();
  return hotspot;
}

/**
 * Let one interaction run to completion: advance dialogue, answer choices,
 * close project panels and the contact card, and tap through the small
 * terminal when it appears. This is a visitor, not a back door: every line,
 * choice and close control is the real one the game renders.
 */
async function playUntilQuiet(page: Page, options: PlayOptions = {}): Promise<{
  lines: string[];
  panels: string[];
}> {
  const choice = options.choice ?? 'first';
  const touch = options.touch ?? false;
  const lines = options.lines ?? [];
  const panels = options.panels ?? [];
  const deadline = Date.now() + (options.timeout ?? 30_000);
  let sawSomething = false;
  let sawPanel = false;
  let quietSince = 0;
  let smallTerminalUsed = false;
  let choiceIndex = 0;

  while (Date.now() < deadline) {
    const contact = page.locator(CONTACT_CARD);
    if ((await contact.count()) > 0) {
      sawSomething = true;
      quietSince = 0;
      const close = page.getByRole('button', { name: copy.nap.contact.closeLabel });
      if ((await close.count()) > 0) {
        if (touch) await close.tap();
        else await close.click();
      } else if (touch) await contact.tap();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(80);
      continue;
    }

    const panel = page.locator(PROJECT_PANEL);
    if ((await panel.count()) > 0) {
      sawSomething = true;
      sawPanel = true;
      quietSince = 0;
      const title = (await page.locator('.project-panel-title').textContent())?.trim();
      if (title && !panels.includes(title)) panels.push(title);
      const close = page.locator(`${PROJECT_PANEL} [data-close]`);
      if ((await close.count()) > 0) {
        if (touch) await close.tap();
        else await close.click();
      } else if (touch) await panel.tap();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(80);
      continue;
    }

    const smallTerminal = page.locator(TERM_PROMPT);
    if ((await smallTerminal.count()) > 0) {
      sawSomething = true;
      quietSince = 0;
      if (!smallTerminalUsed) {
        const command = page.locator('.term-prompt-choice').first();
        if (touch) await command.tap();
        else await command.click();
        smallTerminalUsed = true;
      } else {
        const close = page.locator('.term-prompt-close');
        if (touch) await close.tap();
        else await close.click();
      }
      await page.waitForTimeout(100);
      continue;
    }

    const dialogue = page.locator(DIALOGUE);
    if ((await dialogue.count()) > 0) {
      sawSomething = true;
      quietSince = 0;
      const full = (await page.locator('.sr-live').textContent())?.trim();
      if (full && lines[lines.length - 1] !== full) lines.push(full);

      const choices = page.locator(CHOICE);
      const count = await choices.count();
      if (count > 0) {
        const pick =
          options.choices?.[Math.min(choiceIndex, options.choices.length - 1)] ?? choice;
        choiceIndex += 1;
        const target = choices.nth(pick === 'last' ? count - 1 : 0);
        if (touch) await target.tap();
        else await target.click();
      } else if (touch) {
        await dialogue.tap();
      } else {
        await page.keyboard.press('Enter');
      }
      await page.waitForTimeout(35);
      continue;
    }

    if (sawSomething) {
      if (!quietSince) quietSince = Date.now();
      else if (Date.now() - quietSince >= 500 && (!options.panel || sawPanel)) {
        return { lines, panels };
      }
    }
    await page.waitForTimeout(80);
  }

  throw new Error(
    `interaction never settled; last line: ${lines[lines.length - 1] ?? '(none)'}`,
  );
}

/**
 * Walk to a hotspot with the game's own stand tile, then click the object
 * itself. Clicking targets the exact hotspot, which is how a visitor chooses
 * one of two things standing close together.
 */
async function useHotspot(
  page: Page,
  sceneId: SceneId,
  id: string,
  options: PlayOptions = {},
): Promise<{ lines: string[]; panels: string[] }> {
  const hotspot = await standAt(page, sceneId, id);
  const state = await gameState(page);
  const target = hotspotTarget(hotspot);
  await page.mouse.click(
    (target.x - state.camera.x) * state.scale,
    (target.y - state.camera.y) * state.scale,
  );
  return playUntilQuiet(page, options);
}

/** The phone path: tap the object itself rather than pressing Enter. */
async function tapHotspot(
  page: Page,
  sceneId: SceneId,
  id: string,
  options: PlayOptions = {},
): Promise<{ lines: string[]; panels: string[] }> {
  const hotspot = await standAt(page, sceneId, id);
  const state = await gameState(page);
  const target = hotspotTarget(hotspot);
  await page.touchscreen.tap(
    (target.x - state.camera.x) * state.scale,
    (target.y - state.camera.y) * state.scale,
  );
  return playUntilQuiet(page, { ...options, touch: true });
}

/**
 * Walk with real arrow-key events, releasing each key on the frame the feet
 * enter the target tile. Checking inside the page avoids the overshoot that
 * a round-trip poll causes at 60 world pixels per second.
 */
async function walkArrowKeysToTile(
  page: Page,
  stand: { x: number; y: number },
): Promise<void> {
  await page.evaluate(
    ({ stand: target, tile }) =>
      new Promise<void>((resolve, reject) => {
        const stage = document.querySelector<HTMLElement>('.game-stage');
        const game = window.__huzbiGame;
        if (!stage || !game) {
          reject(new Error('The game stage is missing'));
          return;
        }
        const send = (type: 'keydown' | 'keyup', key: string): void => {
          stage.dispatchEvent(
            new KeyboardEvent(type, { key, bubbles: true, cancelable: true }),
          );
        };

        const targetX = target.x * tile + tile / 2;
        const targetY = target.y * tile + tile / 2;
        let phase: 'right' | 'up' | 'done' = 'right';
        let frames = 0;
        send('keydown', 'ArrowRight');

        const step = (): void => {
          frames += 1;
          if (frames > 1200) {
            send('keyup', 'ArrowRight');
            send('keyup', 'ArrowUp');
            reject(new Error('The keyboard walk never reached the stand'));
            return;
          }

          const player = game.snapshot().player;
          if (phase === 'right') {
            if (player.x < targetX) {
              requestAnimationFrame(step);
              return;
            }
            send('keyup', 'ArrowRight');
            phase = 'up';
            send('keydown', 'ArrowUp');
            requestAnimationFrame(step);
            return;
          }

          if (phase === 'up') {
            if (player.y > targetY) {
              requestAnimationFrame(step);
              return;
            }
            send('keyup', 'ArrowUp');
            phase = 'done';
            resolve();
          }
        };

        requestAnimationFrame(step);
      }),
    { stand, tile: TILE },
  );
  await page.waitForTimeout(100);
}

/** The CRT's hidden command, the one star that lives outside the dark. */
async function useMainTerminal(page: Page): Promise<void> {
  await standAt(page, 'room', 'monitor');
  await page.locator(STAGE).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 10_000 });
  await dismissDialogue(page);

  const terminal = page.getByRole('dialog', { name: 'Retro Terminal Interactive Shell' });
  await expect(terminal).toBeVisible({ timeout: 10_000 });
  const prompt = page.getByRole('textbox', { name: 'Terminal command prompt input' });
  await prompt.fill('xyzzy');
  await prompt.press('Enter');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect(terminal).toBeHidden({ timeout: 5_000 });
}

/** The small terminal on the stool earns its star through its first command. */
async function useSmallTerminal(
  page: Page,
  panels: string[] = [],
): Promise<{ lines: string[]; panels: string[] }> {
  await standAt(page, 'archive', 'term-exp');
  await page.locator(STAGE).focus();
  await page.keyboard.press('Enter');

  const prompt = page.locator(TERM_PROMPT);
  await expect(prompt).toBeVisible({ timeout: 10_000 });
  await page.locator('.term-prompt-choice').first().click();
  await page.waitForTimeout(120);
  await page.locator('.term-prompt-close').click();
  return playUntilQuiet(page, { panels, panel: true });
}

async function savedFound(page: Page): Promise<string[]> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as { found?: unknown };
      return Array.isArray(parsed.found)
        ? parsed.found.filter((id): id is string => typeof id === 'string')
        : [];
    } catch {
      return [];
    }
  }, PROGRESS_KEY);
}

async function seedCompleteSave(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key, found }) => {
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            found,
            doorOpened: true,
            sound: false,
            counters: {},
          }),
        );
      } catch {
        // A storage-less browser still plays; this test needs storage.
      }
    },
    { key: PROGRESS_KEY, found: allStarIds() },
  );
}

/** Follow the five-paper trail in order, without collecting anything else. */
async function followTrail(
  use: (scene: SceneId, id: string, options?: PlayOptions) => Promise<{ lines: string[] }>,
  lines: string[],
): Promise<void> {
  await use('room', 'clue:note', { lines });
  await use('dark', 'clue:hall', { lines });
  await use('workshop', 'clue:workshop', { lines });
  await use('archive', 'clue:archive', { lines });
  await use('observatory', 'clue:observatory', { lines });
}

/** Reach the nap room, wake Huzbi, and collect every line of the ending. */
async function wakeHuzbi(
  page: Page,
  use: (scene: SceneId, id: string, options?: PlayOptions) => Promise<{ lines: string[] }>,
  lines: string[],
): Promise<void> {
  await use('observatory', 'nap-door', { lines });
  await waitForScene(page, 'nap');
  await use('nap', 'sleeper', { lines });
}

test.describe('the full collection', () => {
  test('every_star_is_reachable', async ({ page }) => {
    test.setTimeout(300_000);
    const panels: string[] = [];
    await openGame(page);

    // The room's stars: the note and tea, each worth an extra one on the third
    // look; the cat on the tenth pet; the shelf, one book at a time; the three
    // silly floor things; the window on the fifth wave; and staying put.
    for (let i = 0; i < 3; i += 1) await useHotspot(page, 'room', 'note');
    for (let i = 0; i < 3; i += 1) await useHotspot(page, 'room', 'tea');
    for (let i = 0; i < 10; i += 1) await useHotspot(page, 'room', 'cat');
    for (let i = 0; i < 3; i += 1) {
      await useHotspot(page, 'room', 'door', { choice: 'last' });
    }
    for (let i = 0; i < personalInfo.readingList.length; i += 1) {
      await useHotspot(page, 'room', 'shelf');
    }
    await useHotspot(page, 'room', 'sofa');
    await useHotspot(page, 'room', 'lamp');
    await useHotspot(page, 'room', 'rug');
    for (let i = 0; i < 3; i += 1) await useHotspot(page, 'room', 'window');
    for (let i = 0; i < 2; i += 1) await useHotspot(page, 'room', 'window-two');
    await useMainTerminal(page);

    // Every project, plus the monster poster.
    await useHotspot(page, 'dark', 'routing-sim', { panels, panel: true });
    await useHotspot(page, 'workshop', 'ai-anime', { panels, panel: true });
    await useHotspot(page, 'workshop', 'lang-projects', { panels, panel: true });
    await useHotspot(page, 'workshop', 'speech-translator', { panels, panel: true });
    await useHotspot(page, 'workshop', 'compiler-project', { panels, panel: true });
    await useSmallTerminal(page, panels);
    await useHotspot(page, 'archive', 'read-cookies', { panels, panel: true });
    await useHotspot(page, 'archive', 'ascii-art-tui', { panels, panel: true });
    await useHotspot(page, 'archive', 'creative-coding', { panels, panel: true });
    await useHotspot(page, 'archive', '3d-renderer', {
      choices: ['first', 'last'],
      panels,
      panel: true,
    });
    await useHotspot(page, 'archive', 'monster-poster');

    await expect(page.locator(COUNTER)).toHaveAttribute(
      'aria-label',
      `Stars: ${starTotal()} of ${starTotal()}`,
    );
    await expect
      .poll(async () => (await savedFound(page)).length, { timeout: 20_000 })
      .toBe(starTotal());
    expect([...new Set(await savedFound(page))].sort()).toEqual([...allStarIds()].sort());

    // Every project panel showed its own real details, not a spinner or a blank.
    expect(new Set(panels)).toEqual(new Set(projects.map((project) => project.title)));
  });

  test('trail_only_reaches_ending_with_few_stars', async ({ page }) => {
    test.setTimeout(180_000);
    const lines: string[] = [];
    await openGame(page);

    const use = (scene: SceneId, id: string, options?: PlayOptions) =>
      useHotspot(page, scene, id, options);
    await use('room', 'clue:note', { lines });
    await use('dark', 'clue:hall', { lines });
    await use('workshop', 'clue:workshop', { lines });
    await use('archive', 'clue:archive', { lines });

    // Four clues are not enough: the little round door stays shut and points
    // at the paper still waiting in the observatory.
    await goToScene(page, 'observatory');
    const locked = await useHotspot(page, 'observatory', 'nap-door', { lines });
    expect(locked.lines.join(' ')).toContain(copy.observatory.napDoor.shut[0]);

    // The fifth paper opens it. The ending needs the trail, not the stars.
    await useHotspot(page, 'observatory', 'clue:observatory', { lines });
    await wakeHuzbi(
      page,
      (scene, id, options) => useHotspot(page, scene, id, options),
      lines,
    );

    expect((await savedFound(page)).length).toBe(0);
    expect(lines).toEqual(expect.arrayContaining([...copy.nap.wake.few]));
    for (const line of copy.nap.wake.full) expect(lines).not.toContain(line);
  });

  test('full_collection_gets_full_line', async ({ page }) => {
    test.setTimeout(180_000);
    await seedCompleteSave(page);
    const lines: string[] = [];
    await openGame(page);

    await expect(page.locator(COUNTER)).toContainText(`${starTotal()}/${starTotal()}`);
    await followTrail((scene, id, options) => useHotspot(page, scene, id, options), lines);
    await wakeHuzbi(
      page,
      (scene, id, options) => useHotspot(page, scene, id, options),
      lines,
    );

    expect(lines).toEqual(expect.arrayContaining([...copy.nap.wake.full]));
    for (const line of copy.nap.wake.few) expect(lines).not.toContain(line);
  });

  test('keyboard_only_workshop_clue_unlocks_the_ending', async ({ page }) => {
    test.setTimeout(180_000);
    // Four papers are already in hand; the workshop scrap is the last one,
    // and it must be usable without touching the mouse.
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            found: [],
            doorOpened: true,
            sound: false,
            counters: {
              'clue:note': 1,
              'clue:hall': 1,
              'clue:archive': 1,
              'clue:observatory': 1,
            },
          }),
        );
      },
      { key: PROGRESS_KEY },
    );
    await openGame(page);
    await goToScene(page, 'workshop');

    const clue = await hotspotView(page, 'clue:workshop');
    await page.locator(STAGE).focus();

    // Walk along the free floor row, then one step up onto the stand tile.
    await walkArrowKeysToTile(page, clue.stand);

    const stood = await snapshot(page);
    expect(Math.floor(stood.x / TILE)).toBe(clue.stand.x);
    expect(Math.floor(stood.y / TILE)).toBe(clue.stand.y);

    await page.keyboard.press('Enter');
    await expect(page.locator(DIALOGUE)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.sr-live')).toHaveText(copy.clues.workshop.lines[0]);
    const persisted = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw
        ? (JSON.parse(raw) as { counters?: Record<string, number> }).counters ?? {}
        : {};
    }, PROGRESS_KEY);
    expect(persisted['clue:workshop']).toBe(1);
    await dismissDialogue(page);

    // The fifth clue unlocks the moon door, and the ending is still reachable
    // with no stars at all.
    await goToScene(page, 'observatory');
    await standAt(page, 'observatory', 'nap-door');
    await page.keyboard.press('Enter');
    await advanceToChoices(page);
    await page.keyboard.press('Enter');
    await waitForScene(page, 'nap');

    await standAt(page, 'nap', 'sleeper');
    await page.keyboard.press('Enter');
    const ending = await playUntilQuiet(page);
    expect(ending.lines).toEqual(expect.arrayContaining([...copy.nap.wake.few]));
  });

  test('no_console_errors_across_full_journey', async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

    await openGame(page);
    await useHotspot(page, 'room', 'note');
    await useMainTerminal(page);
    await useHotspot(page, 'dark', 'routing-sim', { panel: true });
    await useHotspot(page, 'workshop', 'ai-anime', { panel: true });
    await useSmallTerminal(page);
    await useHotspot(page, 'observatory', 'stats-plaque');
    await useHotspot(page, 'nap', 'sleeper');
    await page.waitForTimeout(300);

    expect(errors).toEqual([]);
  });
});

test.describe('focus and modals', () => {
  test('focus_returns_to_the_stage_after_the_small_terminal_panel', async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page);
    await standAt(page, 'archive', 'term-exp');
    await page.locator(STAGE).focus();
    await page.keyboard.press('Enter');

    const prompt = page.locator(TERM_PROMPT);
    await expect(prompt).toBeVisible({ timeout: 10_000 });
    await page.locator('.term-prompt-choice').first().click();
    await page.waitForTimeout(120);
    await page.locator('.term-prompt-close').click();
    await expect(page.locator(PROJECT_PANEL)).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator(PROJECT_PANEL)).toHaveCount(0);

    await expect
      .poll(async () => page.evaluate(() => document.activeElement?.className ?? ''))
      .toContain('game-stage');
    const before = await snapshot(page);
    await page.keyboard.down('ArrowRight');
    await expect
      .poll(async () => (await snapshot(page)).x, { timeout: 5_000 })
      .toBeGreaterThan(before.x + 4);
    await page.keyboard.up('ArrowRight');
  });

  test('focus_returns_to_the_stage_after_the_ending_contact_card', async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            found: [],
            doorOpened: true,
            sound: false,
            counters: {
              'clue:note': 1,
              'clue:hall': 1,
              'clue:workshop': 1,
              'clue:archive': 1,
              'clue:observatory': 1,
            },
          }),
        );
      },
      { key: PROGRESS_KEY },
    );
    await openGame(page);
    await goToScene(page, 'nap');
    await standAt(page, 'nap', 'sleeper');
    await page.keyboard.press('Enter');
    await advanceToChoices(page);
    await page.keyboard.press('Enter'); // WAKE THEM
    await advanceToChoices(page);
    await page.keyboard.press('Enter'); // SAY HI

    await expect(page.locator(CONTACT_CARD)).toBeVisible();
    // The reply dialogue sits under the card; close it first, then the card if
    // Enter on the focused close button did not already do so.
    await dismissDialogue(page);
    if ((await page.locator(CONTACT_CARD).count()) > 0) {
      await page.getByRole('button', { name: copy.nap.contact.closeLabel }).click();
    }
    await expect(page.locator(CONTACT_CARD)).toHaveCount(0);

    await expect
      .poll(async () => page.evaluate(() => document.activeElement?.className ?? ''))
      .toContain('game-stage');
    const before = await snapshot(page);
    await page.keyboard.down('ArrowRight');
    await expect
      .poll(async () => (await snapshot(page)).x, { timeout: 5_000 })
      .toBeGreaterThan(before.x + 4);
    await page.keyboard.up('ArrowRight');
  });

  test('idle_nudge_names_an_unfound_object_after_the_trail', async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            found: [],
            doorOpened: true,
            sound: false,
            counters: {
              'clue:note': 1,
              'clue:hall': 1,
              'clue:workshop': 1,
              'clue:archive': 1,
              'clue:observatory': 1,
            },
          }),
        );
      },
      { key: PROGRESS_KEY },
    );
    await openGame(page);

    const nudge = page.locator('.nudge-hint');
    await expect(nudge).toBeVisible({ timeout: 36_000 });
    await expect(nudge).toContainText(copy.ui.nudgeTarget('Read the note'));
  });

  test('project_panel_keeps_tab_focus_inside', async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page);
    await standAt(page, 'dark', 'routing-sim');
    await page.keyboard.press('Enter');
    await dismissDialogue(page);
    await expect(page.locator(PROJECT_PANEL)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(`${PROJECT_PANEL} [data-close]`)).toBeFocused();

    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() =>
        Boolean(document.activeElement?.closest('.project-panel')),
      );
      expect(inside, `Tab ${i + 1} left the project panel`).toBe(true);
    }
  });
});

test.describe('phone journey', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test('tall_phone_dark_space_has_a_dithered_frame', async ({ page }) => {
    await openGame(page);
    await goToScene(page, 'dark');
    await page.waitForTimeout(500);

    const stats = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas');
      const g = canvas?.getContext('2d');
      if (!canvas || !g) throw new Error('The game canvas is missing');

      const measure = (top: number, height: number) => {
        const data = g.getImageData(0, top, canvas.width, height).data;
        const colors = new Set<string>();
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
          total += data[i] + data[i + 1] + data[i + 2];
        }
        return { colors: colors.size, average: total / (data.length / 4) };
      };

      return {
        top: measure(0, 40),
        bottom: measure(canvas.height - 40, 40),
      };
    });

    // Not flat ink: the shared dark-space frame is a dither of two palette
    // colours plus the hard step where the world starts.
    expect(stats.top.colors).toBeGreaterThan(2);
    expect(stats.bottom.colors).toBeGreaterThan(2);
    expect(stats.top.average).toBeGreaterThan(20);
    expect(stats.bottom.average).toBeGreaterThan(20);
  });

  test('phone_full_trail', async ({ page }) => {
    test.setTimeout(180_000);
    const lines: string[] = [];
    await openGame(page);
    const tap = (scene: SceneId, id: string, options?: PlayOptions) =>
      tapHotspot(page, scene, id, options);

    await followTrail(tap, lines);
    await wakeHuzbi(page, tap, lines);

    expect(lines).toEqual(expect.arrayContaining([...copy.nap.wake.few]));
    // The contact beat carries the real details from src/data/personal.ts.
    expect(lines.join(' ')).toContain(personalInfo.email);
    expect(lines.join(' ')).toContain(personalInfo.socials.github);
  });
});

test.describe('reduced motion journey', () => {
  test.use({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });

  test('reduced_motion_full_trail', async ({ page }) => {
    test.setTimeout(180_000);
    const lines: string[] = [];
    await openGame(page);
    const use = (scene: SceneId, id: string, options?: PlayOptions) =>
      useHotspot(page, scene, id, options);

    await followTrail(use, lines);
    await wakeHuzbi(page, use, lines);

    expect(lines).toEqual(expect.arrayContaining([...copy.nap.wake.few]));
  });
});

test.describe('performance budget', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('frame_time_stays_under_budget_in_the_busiest_space', async ({ page }) => {
    test.setTimeout(120_000);
    await openGame(page);
    // The archive carries the most exhibits and lights at once.
    await goToScene(page, 'archive');
    await page.waitForTimeout(600);

    const stats = await page.evaluate(async () => {
      const frame = (): Promise<number> =>
        new Promise((resolve) => requestAnimationFrame((time) => resolve(time)));

      const deltas: number[] = [];
      let previous = await frame();
      for (let i = 0; i < 120; i += 1) {
        const next = await frame();
        deltas.push(next - previous);
        previous = next;
      }
      deltas.sort((a, b) => a - b);
      return {
        average: deltas.reduce((sum, value) => sum + value, 0) / deltas.length,
        p95: deltas[Math.floor(deltas.length * 0.95)],
        worst: deltas[deltas.length - 1],
      };
    });

    // A 40 ms average is 25 fps: the floor for calling this smooth. The p95
    // catches a run of slow frames while allowing the odd garbage-collection
    // pause, and the worst-frame bound catches a true stall.
    expect(stats.average, `average frame ${stats.average.toFixed(1)} ms`).toBeLessThan(40);
    expect(stats.p95, `p95 frame ${stats.p95.toFixed(1)} ms`).toBeLessThan(90);
    expect(stats.worst, `worst frame ${stats.worst.toFixed(1)} ms`).toBeLessThan(250);
  });
});

test.describe('removed pages', () => {
  test('art_preview_is_gone', async ({ page }) => {
    // The development-only art sheet is not part of the game any more, in the
    // source tree or in the built site.
    expect(fs.existsSync(path.join('src', 'app', 'art-preview'))).toBe(false);

    const response = await page.goto('/art-preview/');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/art preview/i)).toHaveCount(0);
    await expect(page.locator('.journal-root')).toHaveCount(1);
  });
});
