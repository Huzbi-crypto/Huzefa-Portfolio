import { expect, test, type Page } from '@playwright/test';

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
