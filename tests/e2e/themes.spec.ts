import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const STAGE = '.game-stage';
const DIALOGUE = '.dialogue';
const SHOT_DIR = path.join('test-results', 'themes');
fs.mkdirSync(SHOT_DIR, { recursive: true });

const THEMES = ['cozy-crt', 'warm-apartment', 'moonlit-terminal'] as const;

type Snapshot = { x: number; y: number; path: number; moving: boolean };

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const game = window.__huzbiGame;
    if (!game) throw new Error('window.__huzbiGame is missing; open the page with ?e2e=1');
    const state = game.snapshot();
    return {
      x: state.player.x,
      y: state.player.y,
      path: state.player.path.length,
      moving: state.player.moving,
    };
  });
}

async function openGame(page: Page): Promise<void> {
  await page.goto('/?e2e=1');
  await expect(page.locator(STAGE)).toBeVisible();
  await page.waitForFunction(
    () => Boolean(window.__huzbiGame) && Boolean(document.querySelector('canvas')),
    undefined,
    { timeout: 10_000 },
  );
  await page.locator(STAGE).focus();
  await page.waitForTimeout(100);
}

async function dismissDialogue(page: Page): Promise<void> {
  const dialogue = page.locator(DIALOGUE);
  for (let i = 0; i < 60; i += 1) {
    if ((await dialogue.count()) === 0) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }
  throw new Error('Dialogue did not close');
}

async function clickWorld(page: Page, wx: number, wy: number): Promise<void> {
  const state = await page.evaluate(() => {
    const game = window.__huzbiGame;
    if (!game) throw new Error('missing game');
    const s = game.snapshot();
    return { camera: s.camera, scale: s.scale };
  });
  await page.mouse.click((wx - state.camera.x) * state.scale, (wy - state.camera.y) * state.scale);
}

async function withTheme(page: Page, theme: string): Promise<void> {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem('huzbi-theme', value);
      localStorage.setItem('huzbi-crt', 'true');
    } catch {
      // A storage-less browser still plays; it just starts on cozy-crt.
    }
  }, theme);
}

test.describe('themes and terminal', () => {
  test('theme_change_recolors_without_reload', async ({ page }) => {
    await withTheme(page, 'cozy-crt');
    await page.goto('/projects/');
    await expect(page.locator('.journal-root')).toBeVisible();

    const before = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      ink: getComputedStyle(document.querySelector('.journal-root')!).getPropertyValue('--j-ink').trim(),
      url: window.location.href,
      probe: (window as Window & { __probe?: number }).__probe,
    }));
    expect(before.theme).toBe('cozy-crt');

    await page.evaluate(() => {
      (window as Window & { __probe?: number }).__probe = 7;
    });
    await page.getByRole('button', { name: /^Theme/ }).click();
    await page.waitForTimeout(100);

    const after = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute('data-theme'),
      ink: getComputedStyle(document.querySelector('.journal-root')!).getPropertyValue('--j-ink').trim(),
      url: window.location.href,
      probe: (window as Window & { __probe?: number }).__probe,
    }));

    expect(after.theme).toBe('warm-apartment');
    expect(after.ink).not.toBe(before.ink);
    expect(after.url).toBe(before.url);
    // A reload would have thrown the probe away.
    expect(after.probe).toBe(7);
  });

  test('theme_change_repaints_the_canvas_without_reload', async ({ page }) => {
    await openGame(page);
    await page.evaluate(() => {
      (window as Window & { __probe?: number }).__probe = 11;
    });

    const patch = () =>
      page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) throw new Error('no game canvas');
        const g = canvas.getContext('2d');
        if (!g) throw new Error('no 2d context');
        // A still patch of the room's wall: no cat, monitor or visitor in it.
        return Array.from(g.getImageData(0, 0, 24, 40).data);
      });

    const before = await patch();

    // The global shell shortcut opens the CRT anywhere, including the game.
    await page.keyboard.press('Control+Backquote');
    const prompt = page.getByRole('textbox', { name: 'Terminal command prompt input' });
    await expect(prompt).toBeFocused({ timeout: 5_000 });
    await prompt.fill('theme warm-apartment');
    await prompt.press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.locator('.term-backdrop')).toHaveCount(0);
    await page.waitForTimeout(400);

    const after = await patch();
    expect(after).not.toEqual(before);
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(
      'warm-apartment',
    );
    // A reload would have thrown the probe away.
    expect(await page.evaluate(() => (window as Window & { __probe?: number }).__probe)).toBe(11);
  });

  test('home_theme_and_crt_controls_work_without_reload', async ({ page }) => {
    await openGame(page);
    await page.evaluate(() => {
      (window as Window & { __probe?: number }).__probe = 13;
    });

    const selector = page.locator('.theme-selector');
    await expect(selector).toBeVisible();
    await expect(page.locator('[data-theme-id="warm-apartment"]')).toBeVisible();
    await expect(page.locator('[data-crt-toggle]')).toBeVisible();

    const patch = () =>
      page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) throw new Error('no game canvas');
        const g = canvas.getContext('2d');
        if (!g) throw new Error('no 2d context');
        return Array.from(g.getImageData(0, 0, 24, 40).data);
      });
    const before = await patch();

    await page.locator('[data-theme-id="warm-apartment"]').click();
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe(
      'warm-apartment',
    );
    expect(await patch()).not.toEqual(before);
    expect(await page.evaluate(() => (window as Window & { __probe?: number }).__probe)).toBe(13);

    await expect(page.locator('[data-crt-overlay]')).toHaveCount(1);
    await page.locator('[data-crt-toggle]').click();
    await expect(page.locator('[data-crt-overlay]')).toHaveCount(0);
    expect(await page.evaluate(() => window.location.pathname)).toBe('/');
  });

  test('terminal_blocks_player_input', async ({ page }) => {
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
    for (const key of ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'a', 'b']) {
      await page.keyboard.press(key);
    }
    await page.waitForTimeout(200);

    const after = await snapshot(page);
    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
    expect(after.path).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('screenshots_in_every_theme', async ({ browser }) => {
    for (const theme of THEMES) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      await withTheme(page, theme);
      await page.goto('/projects/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SHOT_DIR, `projects-${theme}.png`) });

      await page.getByRole('button', { name: 'Toggle the retro terminal' }).click();
      const prompt = page.getByRole('textbox', { name: 'Terminal command prompt input' });
      await prompt.waitFor({ state: 'visible' });
      await prompt.fill('neofetch');
      await prompt.press('Enter');
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(SHOT_DIR, `terminal-${theme}.png`) });

      await prompt.fill('xyzzy');
      await prompt.press('Enter');
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(SHOT_DIR, `terminal-secret-${theme}.png`) });

      await page.goto('/?e2e=1', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(SHOT_DIR, `room-${theme}.png`) });

      await context.close();
    }
  });
});
