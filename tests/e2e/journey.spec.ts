import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { copy } from '../../src/game/content/copy';

const STAGE = '.game-stage';
const DIALOGUE = '.dialogue';
const CHOICE = '.dialogue-choice';
const COUNTER = '.star-counter';
const CHECKPOINT_DIR = path.join('test-results', 'checkpoint-1');
const TOTAL_STARS = 26;

type Snapshot = {
  sceneId: 'room' | 'dark';
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

  test('cursor_moves_light', async ({ page }) => {
    await openGame(page);
    await enterDarkByDoor(page);

    const state = await snapshot(page);

    // A far floor point, lit only by the lantern.
    const point = cssPoint(state, 289, 150);
    const sampleX = 289 - state.camera.x;
    const sampleY = 150 - state.camera.y;

    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(150);
    const lit = await canvasBrightness(page, sampleX, sampleY);

    await page.mouse.move(84, 80);
    await page.waitForTimeout(150);
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
