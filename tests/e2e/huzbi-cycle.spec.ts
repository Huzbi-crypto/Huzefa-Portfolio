import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { copy } from '../../src/game/content/copy';
import { TILE } from '../../src/game/world/grid';

const STAGE = '.game-stage';
const DIALOGUE = '.dialogue';
const CHOICE = '.dialogue-choice';
const PROGRESS_KEY = 'huzbi-game-v1';
const SHOTS = path.join('test-results', 'huzbi-final', 'shots');

const TRAIL = ['clue:note', 'clue:hall', 'clue:workshop', 'clue:archive', 'clue:observatory'];

async function seed(page: Page): Promise<void> {
  await page.addInitScript(
    ({ key, trail }) => {
      const counters: Record<string, number> = {};
      for (const id of trail) counters[id] = 1;
      window.localStorage.setItem(
        key,
        JSON.stringify({ version: 1, found: [], doorOpened: true, sound: false, counters }),
      );
    },
    { key: PROGRESS_KEY, trail: TRAIL },
  );
}

async function openGame(page: Page): Promise<void> {
  await page.goto('/?e2e=1');
  await expect(page.locator(STAGE)).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__huzbiGame) && Boolean(document.querySelector('canvas')));
  await page.locator(STAGE).focus();
}

async function goTo(page: Page, scene: string): Promise<void> {
  await page.evaluate((id) => window.__huzbiGame!.goTo(id as never), scene);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const s = window.__huzbiGame!.snapshot();
        return `${s.sceneId}:${s.transition ? 'busy' : 'none'}`;
      }),
    )
    .toBe(`${scene}:none`);
}

async function standAtSleeper(page: Page): Promise<void> {
  await goTo(page, 'nap');
  await page.evaluate((tile) => {
    const h = window.__huzbiGame!.snapshot().hotspots.find((x) => x.id === 'sleeper')!;
    const x = h.stand.x * tile + tile / 2;
    const y = h.stand.y * tile + tile / 2;
    window.__huzbiGame!.teleport(x, y, 'up');
  }, TILE);
  await page.waitForTimeout(150);
  await page.locator(STAGE).focus();
}

const said = (page: Page): Promise<string> => page.locator(DIALOGUE).innerText().catch(() => '');

/** Press Enter through lines until the choices are on screen. */
async function toChoices(page: Page): Promise<void> {
  for (let i = 0; i < 80 && (await page.locator(CHOICE).count()) === 0; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(40);
  }
  expect(await page.locator(CHOICE).count()).toBeGreaterThan(0);
}

async function pick(page: Page, label: string): Promise<void> {
  await toChoices(page);
  await page.getByRole('button', { name: label, exact: true }).click();
}

async function close(page: Page): Promise<void> {
  for (let i = 0; i < 60 && (await page.locator(DIALOGUE).count()) > 0; i += 1) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(40);
  }
  await expect(page.locator(DIALOGUE)).toHaveCount(0);
}

async function snap(page: Page, tag: string, label: string): Promise<void> {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${tag}-${label}.png`) });
}

async function firstWake(page: Page, tag: string): Promise<void> {
  await snap(page, tag, '01-asleep');
  await page.keyboard.press('Enter');
  await pick(page, copy.nap.sleeper.wakeLabel);
  // the comic beats: cough, slide, sit up, one line each
  for (const label of ['02-stir', '03-slide', '04-situp']) {
    await page.waitForTimeout(700);
    await snap(page, tag, label);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(500);
  await snap(page, tag, '05-awake-talking');
  await pick(page, copy.nap.leaveAloneLabel);
  await close(page);
}

for (const [tag, viewport] of [
  ['desktop', { width: 1366, height: 768 }],
  ['phone', { width: 390, height: 844 }],
] as const) {
  test.describe(`huzbi loop (${tag})`, () => {
    test.use({ viewport });

    test(`the_whole_loop_${tag}`, async ({ page }) => {
      test.setTimeout(180_000);
      await seed(page);
      await openGame(page);
      await standAtSleeper(page);
      await firstWake(page, tag);

      // the hand comes down, he sits, leans for the manga, reads
      await snap(page, tag, '06-hand-lowering');
      await page.waitForTimeout(2000);
      await snap(page, tag, '07-sitting');
      await page.waitForTimeout(3300);
      await snap(page, tag, '08-reaching');
      await page.waitForTimeout(1500);
      await snap(page, tag, '09-reading');

      // leave and come back: still reading, not a first wake
      await goTo(page, 'observatory');
      await standAtSleeper(page);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      expect(await said(page)).toContain(copy.nap.reading.look[0]);
      expect(await said(page)).not.toContain(copy.nap.sleeper.look[0]);
      await pick(page, copy.nap.reading.askLabel);
      await page.waitForTimeout(300);
      expect(await said(page)).toContain(copy.nap.reading.ask[0][0].slice(0, 20));
      await close(page);

      // keep standing there: he lies back and sleeps again
      const seen = new Set<string>();
      let n = 0;
      for (let i = 0; i < 80; i += 1) {
        await page.waitForTimeout(500);
        const buf = await page.screenshot();
        const key = String(buf.length) + buf.subarray(buf.length >> 1, (buf.length >> 1) + 64).toString('hex');
        if (!seen.has(key) && i >= 36 && n < 8) {
          seen.add(key);
          n += 1;
          fs.writeFileSync(path.join(SHOTS, `${tag}-10-late-${String(n).padStart(2, '0')}.png`), buf);
        }
      }
      await snap(page, tag, '11-asleep-again');

      // the second wake is a different conversation
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      expect(await said(page)).toContain(copy.nap.sleeper.lookAgain[0].slice(0, 20));
      await pick(page, copy.nap.sleeper.wakeLabel);
      await page.waitForTimeout(300);
      expect(await said(page)).toContain(copy.nap.sleeper.stirAgain[0].slice(0, 20));
    });
  });
}

test.describe('huzbi loop (reduced motion)', () => {
  test.use({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });

  test('the_cycle_and_interactions_still_work', async ({ page }) => {
    test.setTimeout(120_000);
    await seed(page);
    await openGame(page);
    await standAtSleeper(page);
    await firstWake(page, 'reduced');
    await page.waitForTimeout(7000);
    await snap(page, 'reduced', '09-reading');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    expect(await said(page)).toContain(copy.nap.reading.look[0]);
    await pick(page, copy.nap.reading.letLabel);
    await page.waitForTimeout(300);
    expect(await said(page)).toContain(copy.nap.reading.letReply[0][0].slice(0, 20));
    await close(page);
    await page.waitForTimeout(26000);
    await snap(page, 'reduced', '11-asleep-again');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    expect(await said(page)).toContain(copy.nap.sleeper.lookAgain[0].slice(0, 20));
  });
});
