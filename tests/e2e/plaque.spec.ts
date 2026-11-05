import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { PLAQUE } from '../../src/game/art/sprites/ending';
import { TILE } from '../../src/game/world/grid';

const STAGE = '.game-stage';
const DIALOGUE = '.dialogue';
const SHOTS = path.join('test-results', 'plaque');
const PLAQUE_AT = { x: 60, y: 74 };
const PADDING = 6;

async function openGame(page: Page): Promise<void> {
  await page.goto('/?e2e=1');
  await expect(page.locator(STAGE)).toBeVisible();
  await page.waitForFunction(
    () => Boolean(window.__huzbiGame) && Boolean(document.querySelector('canvas')),
    undefined,
    { timeout: 10_000 },
  );
  await page.locator(STAGE).focus();
}

async function dismissDialogue(page: Page): Promise<void> {
  for (let i = 0; i < 60; i += 1) {
    if ((await page.locator(DIALOGUE).count()) === 0) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }
  throw new Error('The observatory intro dialogue did not close');
}

async function standAtPlaque(page: Page): Promise<void> {
  const current = await page.evaluate(() => window.__huzbiGame!.snapshot().sceneId);
  if (current !== 'observatory') {
    await page.evaluate(() => window.__huzbiGame!.goTo('observatory' as never));
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const state = window.__huzbiGame!.snapshot();
            return `${state.sceneId}:${state.transition ? 'busy' : 'none'}`;
          }),
        { timeout: 20_000 },
      )
      .toBe('observatory:none');
  }

  await page.evaluate((tile) => {
    const plaque = window.__huzbiGame!.snapshot().hotspots.find((h) => h.id === 'stats-plaque')!;
    window.__huzbiGame!.teleport(
      plaque.stand.x * tile + tile / 2,
      plaque.stand.y * tile + tile / 2,
      'up',
    );
  }, TILE);

  await page.waitForTimeout(200);
  await dismissDialogue(page);
  await page.locator(STAGE).focus();
  await page.waitForTimeout(250);
}

async function shot(page: Page, tag: string): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${tag}-room.png`) });

  const crop = await page.evaluate(
    ({ at, size, padding }) => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas');
      if (!canvas) throw new Error('The game canvas is missing');
      const rect = canvas.getBoundingClientRect();
      const state = window.__huzbiGame!.snapshot();
      return {
        x: rect.left + (at.x - padding - state.camera.x) * state.scale,
        y: rect.top + (at.y - padding - state.camera.y) * state.scale,
        width: (size.w + padding * 2) * state.scale,
        height: (size.h + padding * 2) * state.scale,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scale: state.scale,
      };
    },
    { at: PLAQUE_AT, size: PLAQUE, padding: PADDING },
  );

  const x = Math.max(0, Math.round(crop.x));
  const y = Math.max(0, Math.round(crop.y));
  const width = Math.min(Math.round(crop.width), crop.viewport.width - x);
  const height = Math.min(Math.round(crop.height), crop.viewport.height - y);
  expect(width, 'plaque crop width').toBeGreaterThan(0);
  expect(height, 'plaque crop height').toBeGreaterThan(0);
  await page.screenshot({
    path: path.join(SHOTS, `${tag}-plaque.png`),
    clip: { x, y, width, height },
  });
}

for (const [tag, viewport] of [
  ['desktop', { width: 1366, height: 768 }],
  ['phone', { width: 390, height: 844 }],
] as const) {
  test.describe(`observatory plaque (${tag})`, () => {
    test.use({ viewport });

    test(`the_plaque_fits_inside_its_brass_${tag}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

      const feed = page.waitForResponse(
        (response) =>
          response.url().includes('/api/github') && response.request().method() === 'GET',
      );

      await openGame(page);
      const response = await feed;
      expect(response.ok(), 'the client fetched the cached GitHub feed').toBe(true);
      expect(response.headers()['x-github-data']).toMatch(/^(live|snapshot)$/);

      await standAtPlaque(page);
      await shot(page, tag);
      expect(errors).toEqual([]);
    });
  });
}
