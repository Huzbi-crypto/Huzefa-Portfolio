# Optional Game Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the journal site the default experience at `/`, move the game to `/play/`, invite visitors in from a front-page door section, and add a pause menu that exits safely because progress is saved.

**Architecture:** The game's route moves from `/` to `/play/`; the existing journal shell gains a real front page. A small `PlayDoor` client component reads saved stars after mount. Inside the game, `GameRoot` owns a paused flag, an Esc priority rule and a Menu button; the game controller and audio expose `setPaused` so the simulation and music stop without changing the visitor's saved sound choice.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, the existing canvas game engine, Vitest with jsdom, Playwright with the msedge channel.

**Spec:** `docs/superpowers/specs/2026-11-15-optional-game-entry-design.md`

## Global Constraints

- No em dash in any new text. Use commas, periods, colons or parentheses.
- Keep the progress key `huzbi-game-v1` and the version 1 shape. Never clear or migrate a visitor's save in this change.
- Use trailing slashes in every route: `/play/`, `/projects/`, `/about/`, `/github/`, `/contact/`.
- Use the existing journal palette, Pixelify Sans font, `PixelPanel`, `PixelArt` and `--j-*` tokens. No new colour system, no new fonts, no new dependencies.
- Every control is at least 44 by 44 CSS pixels, has a visible focus state, and works with keyboard and touch. Esc is never the only way out.
- Honour `prefers-reduced-motion: reduce`; no new transition is required by this plan.
- Do not change game content, star ids, scene art or the save format.
- The home page must read with JavaScript off. The continue state may only appear after mount.
- Use `journalText` for site copy and `game/content/copy.ts` for in-game copy. Do not hard-code the star total; use `starTotal()`.
- Run commands from the repo root. This repo uses `pnpm` but the executable may be reached through `node_modules/.bin` on this machine; use the equivalent local binary if `pnpm` is not on PATH.

## Review Focus

These are the failure modes most likely to bite a real visitor. Each one has a test in the task that owns the code.

1. **Esc conflict.** With a dialogue, terminal prompt, project panel, journal or contact card open, Esc must close that overlay and must not open the pause menu. Esc on the next press then opens the menu.
2. **Touch exit.** A phone has no Esc key. The Menu button must be visible during normal play, reachable at 44px, and must open the same menu.
3. **Save continuity.** A returning visitor's stars must survive Exit, reload and a new visit, and the home page must show the correct count without changing `huzbi-game-v1`.
4. **Hydration and no-JS.** The home page must render its real content and play link with scripts off, and must not read storage during render or jump when the continue line appears.
5. **Route retargeting.** No banner, nav item, 404, error page, sr-only link or e2e helper may still send the game to `/`, and `/` must never render the canvas.

---

## File Structure

**Created**

- `src/app/play/page.tsx`: the game route, metadata, sr-only fallback and noscript text.
- `src/components/home/PlayDoor.tsx`: save-aware play link for the front page.
- `src/components/home/PlayDoor.test.tsx`: save and no-save states.
- `src/components/home/home.css`: home-only layout for the door section and featured strip.
- `src/components/game/PauseMenu.tsx`: pause dialog, focus trap and exit link.
- `src/components/game/PauseMenu.test.tsx`: dialog behaviour and focus.
- `tests/e2e/game-entry.spec.ts`: home, pause, persistence, mobile and console coverage.

**Modified**

- `src/app/page.tsx`: the journal front page.
- `src/components/journal/JournalPage.tsx`: optional banner.
- `src/components/journal/journalText.ts`: home, banner, 404 and error copy.
- `src/components/journal/MysteryBanner.tsx`: link to `/play/`.
- `src/components/navigation/Navbar.tsx`: Play tab, hide on `/play/`.
- `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/error.test.tsx`: front-page and game links.
- `src/components/game/GameRoot.tsx`: paused state, Esc rule, Menu button.
- `src/components/game/game.css`: Menu button and pause panel.
- `src/game/game.ts`: `setPaused` on the controller and wrapper.
- `src/game/game.test.ts`: paused controller behaviour.
- `src/game/audio/audio.ts`: `setPaused` without changing the sound choice.
- `src/game/audio/audio.test.ts`: pause and resume sound.
- `src/game/content/copy.ts`: pause copy.
- `tests/e2e/journey.spec.ts`, `huzbi-cycle.spec.ts`, `plaque.spec.ts`, `themes.spec.ts`, `player-art.spec.ts`, `journal.spec.ts`: game route and banner links.
- `README.md`: site and game routes, pause and save behaviour.

---

### Task 1: Move the game to `/play/` and make `/` a real page

**Files:**
- Create: `src/app/play/page.tsx`
- Rewrite: `src/app/page.tsx`
- Modify: `src/components/journal/JournalPage.tsx`
- Modify: `src/components/navigation/Navbar.tsx`
- Modify: `src/components/journal/MysteryBanner.tsx`
- Modify: `src/components/journal/journalText.ts`
- Modify: `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/error.test.tsx`
- Test: `src/components/journal/JournalPage.test.tsx` (new)
- Test: `tests/e2e/journey.spec.ts`, `tests/e2e/journal.spec.ts`, `tests/e2e/huzbi-cycle.spec.ts`, `tests/e2e/plaque.spec.ts`, `tests/e2e/themes.spec.ts`, `tests/e2e/player-art.spec.ts`

**Interfaces:**
- Produces: `JournalPage` accepts `showBanner?: boolean`, default `true`.
- Produces: `journalText.nav.play: string`, `journalText.notFound.toHome/toPlay/toProjects`, `journalText.error.toHome/toPlay`.
- Produces: `/play/` renders `GameRoot`; `/` renders journal markup and no canvas.

- [ ] **Step 1: Write the failing `JournalPage` test**

Create `src/components/journal/JournalPage.test.tsx` with the same jsdom and React root setup as `src/components/game/ProjectPanel.test.tsx`. Assert:

```tsx
it('shows_the_quiet_banner_by_default', async () => {
  await mount({ title: 'A page', children: 'Body' });
  expect(container.querySelector('.mystery-banner')).not.toBeNull();
});

it('can_hide_the_banner_for_the_front_page', async () => {
  await mount({ title: 'A page', children: 'Body', showBanner: false });
  expect(container.querySelector('.mystery-banner')).toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- src/components/journal/JournalPage.test.tsx`
Expected: FAIL because `showBanner` is not a prop yet.

- [ ] **Step 3: Add the optional banner**

In `JournalPage.tsx`, add `showBanner?: boolean` to `Props`, default it to `true`, and render `<MysteryBanner />` only when true. Keep the server-component shape.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test -- src/components/journal/JournalPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Update the error test first**

In `src/app/error.test.tsx`, replace the single `a[href="/"]` assertion with both:

```tsx
expect(container.querySelector('a[href="/"]')).not.toBeNull();
expect(container.querySelector('a[href="/play/"]')).not.toBeNull();
```

Run: `pnpm test -- src/app/error.test.tsx`
Expected: FAIL because the error page has no `/play/` link yet.

- [ ] **Step 6: Update copy, links and navigation**

In `src/components/journal/journalText.ts`:

- Replace `nav.room` with `nav.play: 'Play'`.
- Banner copy: lead `Huzbi stepped out and left the door open.`, link `Play the room.`, note `A small game, if you want it.`
- 404: `toHome: 'Back to the front page'`, `toPlay: 'Play the room'`, `toProjects: 'See the projects'`.
- Error: `toHome: 'Back to the front page'`, `toPlay: 'Play the room'`; change the lede to `The page broke while loading. Try again, or go back to the front page.`

In `MysteryBanner.tsx`, point the link at `/play/`.

In `Navbar.tsx`:

- `NAV_LINKS` becomes Play (`/play/`), Projects, GitHub, About, Contact.
- Normalise the pathname once: `const path = pathname.replace(/\/$/, '') || '/';`
- Return `null` when `path === '/play'`.
- Keep the brand link at `/`.

In `not-found.tsx`, render three links: `/` with `toHome`, `/play/` with `toPlay`, `/projects/` with `toProjects`. The first uses `j-btn`, the others use `j-btn` with `data-kind="ghost"`.

In `error.tsx`, render `/` with `toHome` and `/play/` with `toPlay` next to Retry.

- [ ] **Step 7: Create the game route and the simple front page**

Create `src/app/play/page.tsx` with metadata:

```ts
export const metadata: Metadata = {
  title: "Play Huzbi's room | A small 2 AM game",
  description:
    "Walk around Huzbi's room at 2 AM, find the note, the cold tea and the door that should not be there. Progress saves in your browser.",
};
```

Move the existing sr-only block and noscript text from `src/app/page.tsx` into this page. Keep the screen-reader links to `/projects/`, `/about/`, `/github/` and `/contact/`. Render `<GameRoot />`.

Rewrite `src/app/page.tsx` as a server component:

```tsx
export const metadata: Metadata = {
  title: "Huzbi's room | Developer & Creative Coder",
  description: personalInfo.bio,
};
```

Use `<JournalPage showBanner={false} title="Huzbi's room" lede="A portfolio you can walk around, or read like a notebook.">` with a `PixelPanel` containing:

- an `h2` with id `play-heading`: `The room is open.`
- the body: `It is 2 AM. Huzbi is not here. The note says he will be back in five minutes, and there is a door that should not be there.`
- `<Link href="/play/" className="j-btn">Play the room</Link>`
- `<Link href="/projects/" className="j-btn" data-kind="ghost">Read the project notes</Link>`

Add a second `PixelPanel` with real links to Projects, About, GitHub and Contact. This is the working front page that Task 3 upgrades; do not add the featured strip yet.

- [ ] **Step 8: Retarget every browser helper and banner assertion**

Change the game URL in all of these from `/?e2e=1` to `/play/?e2e=1`:

- `tests/e2e/journey.spec.ts`, `openGame`
- `tests/e2e/huzbi-cycle.spec.ts`, `openGame`
- `tests/e2e/plaque.spec.ts`, `openGame`
- `tests/e2e/themes.spec.ts`, `openGame` and the direct navigation near line 229
- `tests/e2e/player-art.spec.ts`

In `tests/e2e/journal.spec.ts`:

- Rename `every_route_has_quiet_banner_linking_home` to `every_route_has_quiet_banner_linking_game`.
- Change both `a[href="/"]` banner selectors to `a[href="/play/"]`.

In `tests/e2e/journey.spec.ts`, rename `no_navbar_on_home` to `no_navbar_in_game`, keep `openGame`, and assert:

```ts
await expect(page.locator('.j-nav')).toHaveCount(0);
await expect(page.locator('.game-stage')).toBeVisible();
```

- [ ] **Step 9: Run the focused checks**

Run: `pnpm test -- src/components/journal/JournalPage.test.tsx src/app/error.test.tsx`
Expected: PASS.

Run: `pnpm typecheck`
Expected: no errors.

Run: `pnpm e2e -- journal.spec.ts journey.spec.ts`
Expected: both specs PASS. The full suite runs in Task 5.

- [ ] **Step 10: Commit**

```bash
git add src/app/page.tsx src/app/play/page.tsx src/app/not-found.tsx src/app/error.tsx src/app/error.test.tsx src/components/journal/JournalPage.tsx src/components/journal/JournalPage.test.tsx src/components/journal/MysteryBanner.tsx src/components/journal/journalText.ts src/components/navigation/Navbar.tsx tests/e2e
git commit -m "feat: move the game to /play and give the site a front page"
```

---

### Task 2: Pause the simulation and the music without losing the sound choice

**Files:**
- Modify: `src/game/game.ts`
- Test: `src/game/game.test.ts`
- Modify: `src/game/audio/audio.ts`
- Test: `src/game/audio/audio.test.ts`

**Interfaces:**
- Produces: `Game.setPaused(value: boolean): void`.
- Produces: `GameAudio.setPaused(value: boolean): void`.
- Consumes: nothing from Task 1.

- [ ] **Step 1: Write the failing controller test**

Add to `src/game/game.test.ts`:

```ts
it('paused_controller_does_not_step', () => {
  const { game, queue } = setup();
  const target = { x: 20, y: 20 };
  queue.push({ type: 'tap', ...cssOf(game, target.x * TILE + 4, target.y * TILE + 4) });

  game.setPaused(true);
  const before = { ...game.snapshot().player };
  run(game, 120);
  expect(game.snapshot().player).toEqual(before);

  game.setPaused(false);
  run(game, 120);
  expect(game.snapshot().player).not.toEqual(before);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- src/game/game.test.ts`
Expected: FAIL because `setPaused` does not exist.

- [ ] **Step 3: Add `setPaused` to the controller and wrapper**

In `createGameController`, add `let paused = false;`. At the top of `step(ms)`, return immediately when paused. Add to the returned object:

```ts
setPaused(value: boolean): void {
  paused = value;
},
```

In the `Game` type, add `setPaused(value: boolean): void;`. In `createGame`, delegate `setPaused: (v) => controller.setPaused(v)`. Keep `stop()` disposing input; do not use it for pause.

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test -- src/game/game.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing audio test**

Add to `src/game/audio/audio.test.ts`:

```ts
it('pause_suspends_without_changing_the_sound_choice', async () => {
  const ctx = new FakeAudioContext();
  const store = createStore(null);
  const audio = createAudio(() => ctx, store);

  audio.setEnabled(true);
  const playing = ctx.oscillators.length;
  expect(playing).toBeGreaterThan(0);

  audio.setPaused(true);
  expect(store.getState().sound).toBe(true);
  expect(ctx.suspendCalls).toBe(1);

  audio.setPaused(false);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(ctx.resumeCalls).toBeGreaterThan(0);
  expect(ctx.oscillators.length).toBeGreaterThan(playing);

  audio.dispose();
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm test -- src/game/audio/audio.test.ts`
Expected: FAIL because `setPaused` does not exist.

- [ ] **Step 7: Add pause to the audio**

In `createAudio`, add `let paused = false;`. Make `startMusic`, `playSfx` and `onGesture` return early while paused. Add to `GameAudio`:

```ts
setPaused(value: boolean): void;
```

Implement:

```ts
setPaused(value: boolean): void {
  if (disposed || paused === value) return;
  paused = value;
  if (value) {
    stopMusic();
    if (ctx && ctx.state === 'running') {
      try {
        void ctx.suspend().catch(() => undefined);
      } catch {
        // Best effort: a broken context stays quiet.
      }
    }
    return;
  }
  if (enabled && hasGesture) resumeAndPlay();
},
```

Also guard `resumeAndPlay`'s promise callback and the visible branch of `onVisibilityChange` with `!paused`. Do not change `enabled` or call `store.setSound`.

- [ ] **Step 8: Run the audio test and typecheck**

Run: `pnpm test -- src/game/audio/audio.test.ts src/game/game.test.ts`
Expected: PASS.

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/game/game.ts src/game/game.test.ts src/game/audio/audio.ts src/game/audio/audio.test.ts
git commit -m "feat: pause the game loop and music without changing the sound choice"
```

---

### Task 3: Build the front-page door, featured projects and continue state

**Files:**
- Rewrite: `src/app/page.tsx`
- Create: `src/components/home/PlayDoor.tsx`
- Create: `src/components/home/PlayDoor.test.tsx`
- Create: `src/components/home/home.css`
- Modify: `src/components/journal/journalText.ts`

**Interfaces:**
- Consumes: `JournalPage`'s `showBanner` from Task 1.
- Produces: `PlayDoor(): JSX.Element`, no props.
- Produces: `journalText.home` with `lede`, `doorTitle`, `doorBody`, `play`, `continue`, `stars(found, total)`, `secondary`, `featuredTitle`, `allProjects`.

- [ ] **Step 1: Write the failing `PlayDoor` tests**

Create `src/components/home/PlayDoor.test.tsx` with jsdom and a React root like `ProjectPanel.test.tsx`. Clear `localStorage` in `beforeEach`. Import `PROGRESS_KEY` from `@/game/state/progress`.

```tsx
it('offers_a_fresh_start_when_there_is_no_save', async () => {
  await mount();
  expect(container.textContent).toContain('Play the room');
  expect(container.querySelector('a[href="/play/"]')).not.toBeNull();
  expect(container.textContent).not.toContain('stars found');
});

it('offers_continue_with_the_saved_star_count', async () => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({
    version: 1,
    found: ['silly:read-note'],
    doorOpened: false,
    sound: false,
    counters: {},
  }));
  await mount();
  expect(container.textContent).toContain('Continue the room');
  expect(container.textContent).toContain('1 of 35 stars found');
});

it('treats_an_opened_door_as_progress_even_with_no_stars', async () => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({
    version: 1,
    found: [],
    doorOpened: true,
    sound: false,
    counters: {},
  }));
  await mount();
  expect(container.textContent).toContain('Continue the room');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- src/components/home/PlayDoor.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement `PlayDoor`**

Create a `'use client'` component with no props. In `useEffect`, call `loadProgress(window.localStorage)` and, when `found.length > 0 || doorOpened`, store `{ found: found.length, total: starTotal() }`. Render:

```tsx
<div className="play-door">
  <Link href="/play/" className="j-btn play-door-link">
    {saved ? journalText.home.continue : journalText.home.play}
  </Link>
  <p className="play-door-save" aria-live="polite">
    {saved ? journalText.home.stars(saved.found, saved.total) : null}
  </p>
</div>
```

The `p` keeps its reserved line height in CSS. Do not read storage during render.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- src/components/home/PlayDoor.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add the home copy**

In `journalText.ts`, add `home`:

```ts
home: {
  lede: 'A portfolio you can walk around, or read like a notebook.',
  doorTitle: 'The room is open.',
  doorBody:
    'It is 2 AM. Huzbi is not here. The note says he will be back in five minutes, and there is a door that should not be there.',
  play: 'Play the room',
  continue: 'Continue the room',
  stars: (found: number, total: number) => `${found} of ${total} stars found`,
  secondary: 'Read the project notes',
  featuredTitle: 'Three things from the lab',
  allProjects: 'See every artifact',
},
```

- [ ] **Step 6: Rewrite the front page**

Keep the server component and metadata from Task 1. Use `JournalPage showBanner={false}` with:

- Header art: `SCENE.catSitting` at scale 5 and `SCENE.crt` at scale 6, with a decorative label.
- Door section: `<section className="home-door" aria-labelledby="door-heading">` containing a `PixelPanel` with a kicker `2:00 AM / the front door`, an `h2` with the door title, the door body, a `j-row` with `<PlayDoor />` and the secondary `/projects/` link, and a decorative `PixelArt` of `SCENE.doorOpen` at scale 8 in `.home-door-art`.
- Featured section: `h2` with `featuredTitle`, a `j-grid` at `data-cols="3"`, and one `PixelPanel as="article"` per project. Use this explicit list: `routing-sim`, `ai-anime`, `term-exp`. Build it with `HOME_PROJECT_IDS.map` and throw if an id is missing. Each card shows `PixelArt` from `PROJECT_ICONS[project.visual.type]`, the title as a link to `/projects/${project.slug}/`, the tagline, language chips, and no invented facts.
- A closing `PixelPanel` with real links to About, GitHub and Contact.
- A link to all projects using `allProjects`.

Create `src/components/home/home.css` and import it from `page.tsx`. Use only `--j-*` tokens. The door section is two columns above 720px and one column below it. Do not create horizontal overflow at 390px.

- [ ] **Step 7: Check the page in the browser at both sizes**

Start the dev server and capture `/` at 1440 by 900 and 390 by 844. Confirm:

- The `h1` is visible and there is no canvas.
- The door section and both links are visible without horizontal scrolling.
- The featured cards use the three chosen projects.
- With scripts off, the play link and real content are still visible.

- [ ] **Step 8: Run unit, typecheck and build**

Run: `pnpm test -- src/components/home/PlayDoor.test.tsx`
Expected: PASS.

Run: `pnpm typecheck`
Expected: no errors.

Run: `pnpm build`
Expected: success, and `/` and `/play` both appear in the route output.

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx src/components/home src/components/journal/journalText.ts
git commit -m "feat: invite visitors into the room from a front-page door"
```

---

### Task 4: Add the pause menu, Esc priority and touch Menu button

**Files:**
- Create: `src/components/game/PauseMenu.tsx`
- Create: `src/components/game/PauseMenu.test.tsx`
- Modify: `src/components/game/GameRoot.tsx`
- Modify: `src/components/game/game.css`
- Modify: `src/game/content/copy.ts`
- Test: `tests/e2e/game-entry.spec.ts` (new, minimal)

**Interfaces:**
- Consumes: `Game.setPaused` and `GameAudio.setPaused` from Task 2.
- Produces: `PauseMenu({ open, found, total, onResume })`, where `open: boolean`, `found: number`, `total: number`, `onResume: () => void`.
- Produces: `copy.ui.pause` with `button`, `buttonLabel`, `title`, `body`, `resume`, `resumeLabel`, `exit`, `exitLabel`, `saved`, `stars(found, total)`.

- [ ] **Step 1: Write the failing `PauseMenu` tests**

Create `src/components/game/PauseMenu.test.tsx` with jsdom and a React root. Mount with `open: true`, `found: 12`, `total: 35`, and a `vi.fn()` resume.

Assert:

```tsx
expect(container.querySelector('[role="dialog"]')).not.toBeNull();
expect(container.textContent).toContain('Paused.');
expect(container.textContent).toContain('The room will wait.');
expect(container.textContent).toContain('12 of 35 stars found');
expect(container.textContent).toContain('Progress saves automatically.');
expect(container.querySelector('a[href="/"]')).not.toBeNull();
```

Add behaviour tests:

- The Resume button has focus after mount.
- Clicking Resume calls `onResume` once.
- Pressing Escape calls `onResume` once.
- Tab from the last focusable element stays inside the panel, and Shift+Tab from the first stays inside.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- src/components/game/PauseMenu.test.tsx`
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the pause copy and component**

Add to `copy.ui`:

```ts
pause: {
  button: 'MENU',
  buttonLabel: 'Open the pause menu. Shortcut: Escape.',
  title: 'Paused.',
  body: 'The room will wait.',
  resume: 'RESUME',
  resumeLabel: 'Resume the game',
  exit: 'EXIT TO THE SITE',
  exitLabel: 'Exit to the site. Progress is saved.',
  saved: 'Progress saves automatically.',
  stars: (found: number, total: number) => `${found} of ${total} stars found`,
},
```

`PauseMenu` renders nothing when `open` is false. When open, render a backdrop with `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, a `px-panel pause-panel`, an `h2`, the body, a star line, a primary Resume `<button>`, a secondary `<Link href="/">`, and the saved line. Use `useFocusTrap(open, panelRef, resumeRef)`. Add a window `keydown` listener for Escape that prevents default and calls `onResume`. Backdrop click calls `onResume`; clicking the panel does not.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test -- src/components/game/PauseMenu.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire pause into `GameRoot`**

Add imports for `PauseMenu`, `subscribeTermPrompt`, `termPromptState`, `contactCardOpen` and `subscribeContactCard`.

Add state and refs:

- `const [paused, setPaused] = useState(false);`
- `const pausedRef = useRef(false); pausedRef.current = paused;`
- `const [journalOpen, setJournalOpen] = useState(false);`
- `const journalOpenRef = useRef(false); journalOpenRef.current = journalOpen;`
- `const gameRef = useRef<Game | null>(null);`
- `const audioRef = useRef<GameAudio | null>(null);`

Read live modal state:

- Define module-level `const noSubscribe = (): (() => void) => () => undefined;` and `const emptyUi = (): typeof EMPTY_UI => EMPTY_UI;`.
- `const ui = useSyncExternalStore(store ? store.subscribe : noSubscribe, store ? store.getState : emptyUi, () => EMPTY_UI);`
- `const term = useSyncExternalStore(subscribeTermPrompt, termPromptState, () => null);`
- `const contact = useSyncExternalStore(subscribeContactCard, contactCardOpen, () => false);`
- `const overlayOpen = Boolean(ui.dialogue || ui.project || term || contact || isTerminalOpen || journalOpen);`
- Keep an `overlayOpenRef` mirror for the Esc handler.

Add the Esc capture listener on `window`:

```ts
if (event.key !== 'Escape') return;
if (pausedRef.current) return;      // PauseMenu closes it
if (overlayOpenRef.current) return; // the open panel closes it
event.preventDefault();
event.stopPropagation();
setPaused(true);
```

Add an effect on `paused` that calls `gameRef.current?.setPaused(paused)` and `audioRef.current?.setPaused(paused)`. Set both refs when the game and audio are created, and clear them on cleanup.

In the existing `Journal` `onOpenChange`, call `setJournalOpen(open)` as well as updating the ref.

Render the Menu button only when `store && !paused && !overlayOpen`:

```tsx
<button
  type="button"
  className="game-menu-button"
  aria-label={copy.ui.pause.buttonLabel}
  onClick={() => setPaused(true)}
>
  {copy.ui.pause.button}
</button>
```

Render `<PauseMenu open={paused} found={ui.found.length} total={ui.total} onResume={() => setPaused(false)} />` after the other overlays. Pass `pausedRef.current` into the game's `isBlocked` closure and include `journalOpenRef.current` in the existing `isBlocked` checks.

- [ ] **Step 6: Style the button and panel**

In `game.css`:

- `.game-menu-button`: absolute, right gutter, one row below the sound toggle, minimum 44px height, pixel font, panel background, pointer cursor, visible focus outline.
- `.pause-backdrop`: absolute inset 0, z-index above the HUD and below nothing else, ink at high opacity, grid centering.
- `.pause-panel`: max width `min(92vw, 520px)`, padding, centered text, hard edges from `px-panel`.
- `.pause-actions`: row that wraps on narrow screens.
- `.pause-saved`: dim, smaller line.
- Under `prefers-reduced-motion: reduce`, no transition or animation.

- [ ] **Step 7: Add the minimal browser test**

Create `tests/e2e/game-entry.spec.ts` with a local `openGame` helper that goes to `/play/?e2e=1` and waits for `window.__huzbiGame`. Add:

```ts
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
```

- [ ] **Step 8: Run the checks**

Run: `pnpm test -- src/components/game/PauseMenu.test.tsx`
Expected: PASS.

Run: `pnpm typecheck`
Expected: no errors.

Run: `pnpm e2e -- game-entry.spec.ts`
Expected: PASS for the three tests.

- [ ] **Step 9: Commit**

```bash
git add src/components/game/PauseMenu.tsx src/components/game/PauseMenu.test.tsx src/components/game/GameRoot.tsx src/components/game/game.css src/game/content/copy.ts tests/e2e/game-entry.spec.ts
git commit -m "feat: pause menu with resume and a saved exit"
```

---

### Task 5: Cover the whole journey, update the README and verify everything

**Files:**
- Modify: `tests/e2e/game-entry.spec.ts`
- Modify: `README.md`
- Modify: any e2e spec still asserting the old game route

**Interfaces:**
- Consumes: every interface from Tasks 1 to 4.
- Produces: a browser suite that proves the home page, the play link, pause, exit, persistence and touch access.

- [ ] **Step 1: Add the home and persistence browser tests**

In `tests/e2e/game-entry.spec.ts`, add:

```ts
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
    localStorage.setItem('huzbi-game-v1', JSON.stringify({
      version: 1,
      found: ['silly:read-note'],
      doorOpened: false,
      sound: false,
      counters: {},
    }));
  });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Continue the room' })).toBeVisible();
  await expect(page.getByText('1 of 35 stars found')).toBeVisible();
  await page.getByRole('link', { name: 'Continue the room' }).click();
  await expect(page.locator('.star-counter')).toContainText('1/35');
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
```

- [ ] **Step 2: Add the no-JavaScript home test**

In the same spec, add:

```ts
test('home_reads_with_javascript_off', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('main h1')).toContainText("Huzbi's room");
  await expect(page.getByRole('link', { name: 'Play the room' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'See every artifact' })).toBeVisible();
  await context.close();
});
```

- [ ] **Step 3: Run the new spec and fix any route leftovers**

Run: `pnpm e2e -- game-entry.spec.ts`
Expected: PASS.

If another spec fails, search for `/?e2e=1`, `href="/"` in the banner, or `no_navbar_on_home` and retarget it. Do not weaken an assertion to make a route pass.

- [ ] **Step 4: Update the README**

Add or replace the route section with:

- `/` is the journal front page.
- `/play/` is the game.
- Esc, or the Menu button on a phone, opens Resume and Exit.
- Progress is saved in the browser under `huzbi-game-v1`.
- Leaving with Exit does not erase progress.

Keep the existing setup, test and deployment instructions accurate.

- [ ] **Step 5: Run the full verification**

Run: `pnpm test`
Expected: all unit tests PASS.

Run: `pnpm typecheck`
Expected: no errors.

Run: `pnpm build`
Expected: success, with `/` and `/play` in the route output.

Run: `pnpm e2e`
Expected: the full browser suite PASS, including the old journey, journal, themes, plaque and player-art specs.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e README.md
git commit -m "test: cover the optional game entry, pause and saved progress"
```

---

## Self-Review Notes

- **Spec coverage:** route move (Task 1), front page and continue state (Task 3), pause menu and touch access (Task 4), save continuity and full journey (Task 5), audio and simulation pause (Task 2), copy and links (Tasks 1, 3, 4), README (Task 5).
- **Deliberate omissions:** no progress reset, no cloud save, no new game content, no home-page project filtering beyond the explicit three.
- **Review Focus mapping:** Esc conflict (Task 4), touch (Task 5), save continuity (Task 5), hydration and no-JS (Tasks 3 and 5), route retargeting (Task 1).
