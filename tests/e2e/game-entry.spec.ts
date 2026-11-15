import { expect, test, type Page } from '@playwright/test';
import { starTotal } from '../../src/game/content/stars';

/** The game, with its e2e handle exposed and nothing else changed. */
async function openGame(page: Page): Promise<void> {
  await page.goto('/play/?e2e=1');
  await page.waitForFunction(() => Boolean(window.__huzbiGame));
}

test('escape_opens_and_resumes_the_menu', async ({ page }) => {
  await openGame(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('exit_returns_to_the_site', async ({ page }) => {
  await openGame(page);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'EXIT TO THE SITE' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('main h1')).toBeVisible();
});

test('escape_closes_an_open_panel_before_the_menu', async ({ page }) => {
  await openGame(page);
  await page.keyboard.press('j');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toContainText('Paused.');
});

test('home_is_the_site_and_the_play_link_opens_the_game', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main h1')).toContainText("Huzbi's room");
  await expect(page.locator('.j-nav')).toBeVisible();
  await expect(page.locator('.game-stage')).toHaveCount(0);
  await page.getByRole('link', { name: 'Play the room' }).click();
  await expect(page).toHaveURL('/play/');
  await expect(page.locator('.game-stage')).toBeVisible();
  await expect(page.locator('.j-nav')).toHaveCount(0);
});

test('a_saved_star_shows_continue_on_home_and_in_the_game', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'huzbi-game-v1',
      JSON.stringify({
        version: 1,
        found: ['silly:read-note'],
        doorOpened: false,
        sound: false,
        counters: {},
      }),
    );
  });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Continue the room' })).toBeVisible();
  await expect(page.getByText(`1 of ${starTotal()} stars found`)).toBeVisible();
  await page.getByRole('link', { name: 'Continue the room' }).click();
  await expect(page.locator('.star-counter')).toContainText(`1/${starTotal()}`);
});

test('the_menu_button_works_on_a_phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGame(page);
  await page.getByRole('button', { name: /open the pause menu/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'RESUME' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('no_console_errors_on_home_or_in_the_game', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await page.goto('/play/?e2e=1');
  await page.waitForFunction(() => Boolean(window.__huzbiGame));
  expect(errors).toEqual([]);
});

test('home_reads_with_javascript_off', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('main h1')).toContainText("Huzbi's room");
  await expect(page.getByRole('link', { name: 'Play the room' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'See every artifact' })).toBeVisible();
  await context.close();
});
