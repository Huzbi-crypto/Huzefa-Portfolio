import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const STAGE = '.game-stage';
const SHOTS = path.join('test-results', 'player-art');

async function openRoom(page: Page): Promise<void> {
  await page.goto('/?e2e=1');
  await expect(page.locator(STAGE)).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__huzbiGame) && Boolean(document.querySelector('canvas')));
  await page.locator(STAGE).focus();
}

/** The player's on-screen box, in CSS pixels of the stage, with some room around it. */
async function clipAround(page: Page): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = (await page.locator(STAGE).boundingBox())!;
  const r = await page.evaluate(() => {
    const s = window.__huzbiGame!.snapshot();
    return { px: (s.player.x - s.camera.x) * s.scale, py: (s.player.y - s.camera.y) * s.scale, scale: s.scale };
  });
  const half = r.scale * 20;
  const x = Math.max(box.x, box.x + r.px - half);
  const y = Math.max(box.y, box.y + r.py - half * 1.6);
  return { x, y, width: Math.min(half * 2, box.width - (x - box.x)), height: Math.min(half * 2.4, box.height - (y - box.y)) };
}

for (const [tag, viewport] of [
  ['desktop', { width: 1366, height: 768 }],
  ['phone', { width: 390, height: 844 }],
] as const) {
  test.describe(`player art (${tag})`, () => {
    test.use({ viewport });

    test(`the_player_reads_in_the_room_${tag}`, async ({ page }) => {
      fs.mkdirSync(SHOTS, { recursive: true });
      await openRoom(page);
      await page.evaluate(() => window.__huzbiGame!.setReducedMotion(true));
      const start = await page.evaluate(() => {
        const s = window.__huzbiGame!.snapshot();
        return { x: s.player.x, y: s.player.y };
      });
      for (const facing of ['down', 'up', 'right', 'left'] as const) {
        await page.evaluate(([x, y, f]) => window.__huzbiGame!.teleport(x as number, y as number, f as never), [start.x, start.y, facing]);
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(SHOTS, `room-${tag}-${facing}.png`), clip: await clipAround(page) });
      }
      await page.screenshot({ path: path.join(SHOTS, `room-${tag}-full.png`) });
    });
  });
}
