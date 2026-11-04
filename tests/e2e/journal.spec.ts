import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { personalInfo } from '../../src/data/personal';
import { projects } from '../../src/data/projects';
import githubSnapshot from '../../src/data/github-snapshot.json';

/** Every plain page that is not the game. */
const ROUTES = ['/projects/', '/projects/routing-simulation/', '/about/', '/github/', '/contact/'] as const;
const SHOT_DIR = path.join('test-results', 'journal');
fs.mkdirSync(SHOT_DIR, { recursive: true });

/** One thing that only real page content could contain, per route. */
const PROOF: Record<(typeof ROUTES)[number], string> = {
  '/projects/': projects[projects.length - 1].title,
  '/projects/routing-simulation/': projects.find((p) => p.slug === 'routing-simulation')!.description.slice(0, 40),
  '/about/': personalInfo.education.institution,
  '/github/': githubSnapshot.repositories[0].name,
  '/contact/': personalInfo.email,
};

async function open(page: Page, route: string): Promise<void> {
  const response = await page.goto(route);
  expect(response?.status(), `${route} should load`).toBe(200);
}

test.describe('journal pages', () => {
  test('every_route_has_quiet_banner_linking_home', async ({ page }) => {
    for (const route of ROUTES) {
      await open(page, route);
      const banner = page.locator('.mystery-banner');
      await expect(banner, route).toHaveCount(1);
      const link = banner.locator('a[href="/"]');
      await expect(link, route).toBeVisible();
      // Quiet: one slim line of the page, never a floating overlay.
      const box = await banner.boundingBox();
      expect(box!.height, `${route} banner height`).toBeLessThanOrEqual(64);
      const position = await banner.evaluate((el) => getComputedStyle(el).position);
      expect(['static', 'relative'], `${route} banner position`).toContain(position);
    }
  });

  test('content_readable_with_javascript_off', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await open(page, route);
      await expect(page.locator('main h1').first(), route).toBeVisible();
      await expect(page.getByText(PROOF[route], { exact: false }).first(), route).toBeVisible();
    }
    // The projects index lists every project, not only the first screenful.
    await open(page, '/projects/');
    for (const project of projects) {
      await expect(page.getByRole('link', { name: project.title }).first()).toBeVisible();
    }
    await context.close();
  });

  test('unknown_slug_shows_pixel_not_found', async ({ page }) => {
    const response = await page.goto('/projects/no-such-project-here/');
    expect(response?.status()).toBe(404);
    await expect(page.locator('main h1')).toContainText(/nothing|not here|lost/i);
    await expect(page.locator('.mystery-banner a[href="/"]')).toBeVisible();
    await expect(page.locator('.journal-root')).toHaveCount(1);
    await page.screenshot({ path: path.join(SHOT_DIR, 'not-found-desktop.png'), fullPage: true });
  });

  test('every_project_has_a_page', async ({ page }) => {
    for (const project of projects) {
      const route = `/projects/${project.slug}/`;
      await open(page, route);
      await expect(page.locator('main h1'), route).toContainText(project.title);
      await expect(page.locator(`a[href="${project.githubUrl}"]`).first(), route).toBeVisible();
    }
  });

  test('no_rounded_cards_or_lucide_on_journal_pages', async ({ page }) => {
    for (const route of [...ROUTES, '/projects/no-such-project-here/']) {
      await page.goto(route);
      const found = await page.evaluate(() => {
        const lucide = document.querySelectorAll('svg.lucide, [class*="lucide"]').length;
        const rounded: string[] = [];
        for (const el of Array.from(document.body.querySelectorAll('*'))) {
          const style = getComputedStyle(el);
          const corners = [
            style.borderTopLeftRadius,
            style.borderTopRightRadius,
            style.borderBottomLeftRadius,
            style.borderBottomRightRadius,
          ];
          if (corners.some((c) => c !== '0px')) {
            rounded.push(`${el.tagName.toLowerCase()}.${String(el.getAttribute('class') ?? '').slice(0, 40)}`);
          }
        }
        const h1 = document.querySelector('main h1');
        const heading = h1 ? getComputedStyle(h1).fontFamily : '';
        return { lucide, rounded, heading };
      });
      expect(found.lucide, `${route} lucide icons`).toBe(0);
      expect(found.rounded, `${route} rounded elements`).toEqual([]);
      expect(found.heading, `${route} heading font`).not.toMatch(/-apple-system|Segoe|Courier/);
    }
  });
});

test.describe('journal screenshots', () => {
  const SLUGS: Record<string, string> = {
    '/projects/': 'projects',
    '/projects/routing-simulation/': 'project-detail',
    '/about/': 'about',
    '/github/': 'github',
    '/contact/': 'contact',
  };

  for (const [name, size] of [
    ['desktop', { width: 1280, height: 800 }],
    ['phone', { width: 390, height: 844 }],
  ] as const) {
    test(`shots_${name}`, async ({ browser }) => {
      fs.mkdirSync(SHOT_DIR, { recursive: true });
      const context = await browser.newContext({ viewport: size, deviceScaleFactor: 1 });
      const page = await context.newPage();
      for (const route of ROUTES) {
        await open(page, route);
        // Nothing may push the page sideways on a phone.
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} horizontal overflow at ${name}`).toBeLessThanOrEqual(0);
        await page.screenshot({ path: path.join(SHOT_DIR, `${SLUGS[route]}-${name}.png`), fullPage: true });
      }
      await page.goto('/projects/no-such-project-here/');
      await page.screenshot({ path: path.join(SHOT_DIR, `not-found-${name}.png`), fullPage: true });
      await context.close();
    });
  }
});
