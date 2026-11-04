# Phase 2 review: Huzbi's Room

**Date:** 2026-11-04
**Reviewer:** independent worker (Task 23), not the Phase 2 implementer
**Branch:** `Huzbi-crypto/Portfolio-Master`
**Phase 1 checkpoint reviewed from:** `e41eb46` (the last commit before `d1b1087 docs: add project exhibits to the design and plan Phase 2`)
**Tree reviewed at:** `433ce46` plus one review fix, `3f9483b` (the report commit follows this one)
**Scope:** the whole Phase 2 diff, `e41eb46..HEAD`: 124 commits, 155 files changed, +20,823 / −10,273 lines, plus the working tree.

This is a prioritised review, not a rewrite. I did not change features or weaken tests. One small,
unambiguous content defect was fixed with a failing test first (`3f9483b`); everything else is
reported below for routing.

**Summary:** 1 high, 4 medium (one already fixed), 10 low. The game is content-complete and its core
rules hold under test; the high finding is that the home page is missing its visible theme/CRT
controls. The medium findings are tall-phone framing in the dark scenes, keyboard focus continuity
after two panels, missing modal focus traps, and the journal copy gap (fixed here).

## Method

- Read both required documents in full:
  `docs/superpowers/specs/2026-11-02-retro-game-portfolio-design.md` and
  `docs/superpowers/plans/2026-11-03-retro-game-portfolio-phase-2.md`.
- Mapped the tree with Codebase Memory first (`index_status`, `get_architecture`; 2,196 nodes,
  7,704 edges, 186 files) and then read the state, scene, exhibit, art, audio, journal and page code.
- Reviewed every Phase 2 commit range, not just the latest commit, plus the current tree.
- Ran the unit suite, typecheck and production build against the tree, then the full Playwright
  suite against an **isolated production server on port 3101**. Port 3000 was never stopped or used.
- Used three throwaway Playwright probes for the things a static read cannot settle: tall-phone
  framing, focus continuity, whether the home page has its theme/CRT controls, and whether the two
  multi-step exhibits award stars without a try. Probe scripts live under `test-results/`
  (gitignored) and are not part of the deliverable.

## Verification results (exact)

| Command | Result |
|---|---|
| `pnpm test` | **PASS** — 59 test files, **465 tests passed**, 22.7 s |
| `pnpm typecheck` | **PASS** — `tsc --noEmit`, exit 0 |
| `pnpm build` | **PASS** — Next.js 15.5.25 production build, all routes prerendered, exit 0 |
| `npx playwright test --config=playwright.review.config.ts` | **PASS** — **40/40 tests**, 9.6 min, Edge channel, isolated `http://127.0.0.1:3101` (the run after the copy-only fix is in `test-results/final-e2e.log`; the pre-fix run was also 40/40) |
| Browser probe: tall phone dark scene | **FAIL (confirmed)** — `camera.y = -115`, `viewH = 422`, `world.h = 192`; the top and bottom 115 rows are flat ink (`avg RGB 5`) while the world strip occupies rows 115–306 |
| Browser probe: home controls | **FAIL (confirmed)** — `.theme-selector` count `0`, `[data-crt-toggle]` count `0`, `[data-crt-overlay]` count `1` |
| Browser probe: focus after small terminal → project panel | **FAIL (confirmed)** — active element is `BODY`; `ArrowRight` leaves player x at 76 |
| Browser probe: focus after ending contact card | **FAIL (confirmed)** — active element is `BODY`; `ArrowRight` leaves player x at 164 |
| Browser probe: stars without trying | **FAIL (confirmed)** — opening and closing the small terminal saves `project:term-exp`; opening the 3D screen and pressing Esc saves `project:3d-renderer` |

The full Playwright suite (40 tests across journal, journey and themes) includes every star, the
trail-only ending, the full-collection line, the keyboard-only workshop clue, phone touch, reduced
motion, console errors and the archive frame budget. It passes.

## Findings by severity

### High

#### H1. The visible theme and CRT controls are never mounted on `/`

**Where:** `src/components/game/GameRoot.tsx:283-335` (render tree), `src/components/game/ThemeSelector.tsx:48-120` (the component), `src/components/navigation/Navbar.tsx:46` (returns null on `/`).

**What is wrong:** `ThemeSelector` is the intended in-game theme buttons and CRT toggle, but no
shipping component imports it. `GameRoot` renders the canvas, star counter,
sound toggle, journal, nudge, hints, small terminal, dialogue, project panel and contact card — not
`ThemeSelector`. `Navbar` hides itself on `/`. Journal pages have equivalent Theme/CRT buttons in the
navbar, but the primary page does not. As a result a visitor on the game can change
the theme only by discovering the documented-but-hidden terminal `theme` command, and **cannot turn
the CRT scanlines off at all**. The spec says themes stay and "the CRT overlay toggle stays"; Phase 2
Task 21 says to move the selector into the game.

**Evidence:** Browser probe on `/?e2e=1`: `themeSelector: 0`, `crtToggle: 0`, `crtOverlay: 1`.
`ThemeSelector` is imported only by `src/components/game/ThemeSelector.test.tsx`, which mounts the
component directly, so the unit test proves the component works but not that the game uses it.

**Fix:** Render `<ThemeSelector />` in `GameRoot`'s HUD (for example under the star counter or above
the journal button), wire `onThemeChange` so it calls the same `setGameTheme`/`AppContext` path as
the terminal command, and add an e2e test that finds `[data-theme-id="warm-apartment"]` and
`[data-crt-toggle]` on `/`, clicks them, and asserts the canvas patch and `data-theme` change with no
navigation.

### Medium

#### M1. Tall phones letterbox every dark scene in solid ink

**Where:** `src/game/world/camera.ts:3-10`, `src/game/scene/space.ts:384-425` (compare `src/game/scene/room.ts:364-423`, which extends the room shell and dithers the fade).

**What is wrong:** On a 390×844 phone `computeViewport` gives `scale = 2`, `viewW = 195`,
`viewH = 422`. Every dark world is 192–224 px tall, so `computeCamera.axis` centres it with
`camera.y = (worldH − viewH) / 2` (for the hall, −115). `createDarkSpace.draw` paints the world only
between 0 and `worldH` and leaves the rest of the lit layer at the initial ink fill; unlike the room
it has no shell extension or dithered margin. The result is roughly **115 px of flat ink above and
below every dark space**. The probe measured rows 0–114 and 307–421 at average RGB 5, with the world
strip only in rows 115–306. This is the tall-phone issue Task 16 noticed, still present.

**Evidence:** `docs/superpowers/reviews/2026-11-04-phase-2-dark-phone.png`; probe output
`{"camera":{"x":0,"y":-115},"viewW":195,"viewH":422,"world":{"w":320,"h":192}}`.
The top and bottom 115 rows are flat ink (average RGB 5), while the world strip spans rows 115–306.
The only phone-framing test (`tests/e2e/journey.spec.ts:562-602`) asserts integer scale and view
size, not what the extra view area looks like.

**Fix:** Add a shared out-of-world treatment to `createDarkSpace` — either extend each space's own
shell (wall/floor tiles plus the seven-step Bayer fade used by `room.ts:403-423`) or paint a
deliberate bordered letterbox with a stepped/dithered edge rather than flat ink. Add a phone test
that checks the painted rows above and below the world are an intentional pattern, or that the world
occupies the whole view (whichever framing is chosen).

#### M2. Focus is lost after the small terminal and the ending contact card; keyboard movement stops

**Where:** `src/components/game/TermPrompt.tsx:30-47` (input focused, no restore on unmount),
`src/components/game/ProjectPanel.tsx:19-37` (restores focus to whatever was focused when it opened),
`src/components/game/GameRoot.tsx:81-96` and `:119` (contact card focuses close, never restores),
`src/components/game/GameRoot.tsx:265-267` (only terminal close restores focus) and `:315-323`
(only journal close restores focus), `src/game/game.ts:577` (keys listen on `.game-stage`).

**What is wrong:** On the small terminal the focused `<input>` is unmounted when the prompt closes,
so focus falls to `<body>`. The subsequent project panel captures `body` as its "previous" element
and returns focus there when closed. The ending contact card closes the same way. Once focus is on
`body`, the stage's keydown listener is no longer in the event path, so **arrows, WASD, Enter and
Space stop working** until the visitor clicks the canvas. This affects the keyboard-only and
screen-reader path after two ordinary interactions.

**Evidence:** Probe: active element `BODY`, `ArrowRight` moved player x 76 → 76 (small terminal) and
164 → 164 (contact card). The e2e helper `standAt` re-focuses `.game-stage` before each hotspot
(`tests/e2e/journey.spec.ts:711`), so the suite masks the defect.

**Fix:** Restore focus to `.game-stage` in the `TermPrompt` cleanup, in `ProjectPanel` when the
captured previous element is not focusable, and when `EndingContact` closes; or have `GameRoot` watch
`isTermPromptOpen()` and `contactCardOpen()` the way it already watches `isTerminalOpen`. Add an e2e
that closes the small terminal's project panel, presses `ArrowRight`, and asserts the player moved.

#### M3. Modals announce `aria-modal` but do not contain Tab focus

**Where:** `src/components/game/ProjectPanel.tsx:49-54` and `src/components/game/GameRoot.tsx:108-113` (`aria-modal="true"`), `src/components/game/DialogueBox.tsx:88-95` (`role="dialog"`, no modal semantics).

**What is wrong:** `Journal` and `TermPrompt` trap `focusin`, but the project panel, contact card and
dialogue only focus their first control. Tab then walks into the HUD controls and links behind the
backdrop. For a modal project panel this is a genuine focus-order failure, not cosmetic.

**Fix:** Use one shared focus-trap helper (the `focusin` pattern in `Journal.tsx:177-195` already
exists) for `ProjectPanel`, `EndingContact` and `DialogueBox`, or mark the stage HUD `inert` while a
modal is open. Add a test that Tab from the project panel's close button stays inside the panel.

#### M4. `silly:terminal-secret` had no journal words (fixed)

**Where:** `src/game/content/copy.ts:39-56`, `src/components/game/Journal.tsx:41-47`,
`src/components/game/Journal.test.tsx:70-81` (strengthened here).

**What was wrong:** `SILLY_STARS` includes `silly:terminal-secret` (`src/game/content/stars.ts:20`)
but `copy.journal.silly` stopped at `silly:door-chicken`. `openEntry` therefore fell back to a
machine-derived title ("terminal secret") and the generic `fallbackBody`. The old test only asserted
non-empty strings, so it passed through the fallback.

**Fix applied in `3f9483b`:** added authored `xyzzy` copy and changed
`every_silly_star_has_its_own_words` to require every `SILLY_STARS` id to have a real entry whose body
is not the fallback. The test failed first with `silly:terminal-secret: expected undefined to be
defined`, then passed.

### Low

#### L1. Idle nudges stop after the trail and never say what to look at

**Where:** `src/game/game.ts:390-393`, `src/components/game/GameRoot.tsx:326-330`, `src/game/state/nudge.ts:14-27`.

**What is wrong:** `game.ts` feeds `pickNudge` only the hotspots whose ids are in `TRAIL`. The
function's documented fallback ("otherwise any unfound thing") therefore never fires in the real
game: after the five clues are found there is no nudge at all, even with every star still unfound.
Separately, `GameRoot` renders the static `copy.ui.nudge` ("Psst. Something nearby is worth a look.")
and ignores the selected target, so the target plumbing has no visible effect.

**Fix:** Pass every unfound interactable hotspot to `pickNudge` (keeping the clue preference first),
and render the target's label in the nudge, e.g. `Psst. ${label}`. Add a test that a post-trail room
with unfound objects still nudges, and that the visible text names the target.

#### L2. The small terminal and the 3D screen award a star without being tried

**Where:** `src/game/exhibits/termExp.ts:221-247`, `src/game/exhibits/renderer3d.ts:262-299`.

**What is wrong:** `termExp.use` awaits the prompt closing and then always calls `tryExhibit`, which
awards the star and opens the panel. `renderer3d.use` breaks its loop on Esc/leave and then always
calls `tryExhibit`. A visitor can open either interaction and immediately close it to collect
`project:term-exp` or `project:3d-renderer` without typing or spinning. Other exhibits gate correctly
(`readCookies` only awards on unlock; `speechTranslator` only after a phrase; `compiler` after a line
is chosen), which shows the intended rule.

**Evidence:** Probes saved `["project:term-exp"]` after closing the prompt untyped, and
`["project:3d-renderer"]` after Esc before any spin.

**Fix:** Only call `tryExhibit` when the exhibit recorded a real try (`shell().trying` / `spins > 0`);
otherwise close quietly, or show the real project details without awarding the star. Add a
`walking_away_without_trying_earns_nothing` test for both.

#### L3. Exhibit playback keeps running when the visitor walks out of the scene

**Where:** `src/game/exhibits/playback.ts:32-49`, `src/game/game.ts:502` (only the current scene is
updated), `src/game/exhibits/aiAnime.ts:399-409`, `langProjects.ts:168-177`,
`speechTranslator.ts:201-209`, `compilerBelt.ts:244-253`.

**What is wrong:** Playback is not part of `isBlocked()` in `GameRoot.tsx:215-225`, so the visitor can
walk to a ladder and leave during the 0.4–2.8 s beat. The old scene's `update` stops, so the promise
stays pending until the visitor returns; when they do, the panel opens mid-scene. Clicking a second
exhibit during the first beat can also overlap two pending dialogues/panels.

**Fix:** Either block movement while an exhibit beat is active (a small `exhibitBusy` flag in the
store/blocked predicate) or give each exhibit a `cancel()` called by `swapScene`, resolving its
playback with `false`. Add a test that leaving the workshop during a beat cancels it and does not open
a panel on return.

#### L4. Per-frame allocations in the busiest draw paths

**Where:** `src/game/scene/space.ts:277-293` and `:301-314` and `:407-411`,
`src/game/scene/observatory.ts:162-165` and `:267-286`, `src/game/scene/room.ts:492-512`.

**What is wrong:** Every frame `drawWorld` builds a `DrawPiece[]` plus one closure per prop and
exhibit; `glowPieces` builds another array and closures; `draw` filters it into two more arrays. The
observatory calls `skyStars([])` and `skyStars(found)` every frame, each doing `new Set` plus a
35-object map; `room.draw` builds a four-item array and four closures. Nothing leaks (the important
buffers and typed arrays are reused), and the archive frame-budget test passes, but this is avoidable
GC pressure at 60 fps, especially on phones.

**Fix:** Build static piece lists once per scene, add camera-culling while iterating, reuse
`behind`/`inFront` arrays, and cache the sky star array, rebuilding it only when the found set
changes.

#### L5. Journal art does not follow the theme; one rounded/system-font control remains

**Where:** `src/components/journal/PixelArt.tsx:18` (hard-coded `PALETTES['cozy-crt']`),
`src/app/layout.tsx:82-86` (skip link `focus:rounded-md focus:font-mono focus:shadow-crt`).

**What is wrong:** On `warm-apartment` and `moonlit-terminal` journal pages the chrome and panels
recolour, but the pixel-art icons and vignettes keep Cozy CRT colours. The theme test only asserts
`--j-ink`, so it does not catch this. The skip link is otherwise fine but on focus becomes the one
rounded, system-font, glow-shadowed element left in the site.

**Fix:** Paint `PixelArt` from the active theme (pass the theme from `AppContext`, or use CSS custom
properties for the palette keys), or deliberately document that journal art is always Cozy CRT. Drop
the three Tailwind focus classes from the skip link and use the pixel panel/focus tokens.

#### L6. In-game journal does not expose all discovered text or link to journal pages

**Where:** `src/components/game/Journal.tsx:29-47` and `:280-289`.

**What is wrong:** A found project becomes `title + project.description + githubUrl`; a book becomes
`title + note`; a silly star becomes its one-line journal body. The exhibit dialogue, clue lines,
terminal replies and other text a visitor actually read are not represented, and the only link is
GitHub, not the full `/projects/[slug]/` journal page. The spec says "In-game text a visitor discovers
is also reachable in the journal"; a screen-reader visitor cannot read the jokes they earned, and the
full journal page is not linked from the in-game entry.

**Fix:** Add a `pageUrl` to project (and arguably book) entries and link it; store or derive the
discovered lines for each star and render them in the entry (or add a "read the full entry" link for
every entry that has a journal page).

#### L7. Hard-coded repository count in four journal pages

**Where:** `src/app/contact/page.tsx:19`, `src/app/github/page.tsx:19`,
`src/app/projects/page.tsx:116`, `src/app/projects/[slug]/page.tsx:212`.

**What is wrong:** The copy says "38 public repositories" while the source of truth is
`github-snapshot.json` (`stats.totalRepos` and `repositories.length`, currently 38). The number will
drift silently when the snapshot is refreshed.

**Fix:** Derive the number from the snapshot in those strings (or interpolate
`data.repositories.length`), the way the GitHub page already does elsewhere.

#### L8. Re-entering the nap room replays the wake-up animation

**Where:** `src/game/scene/nap.ts:341-343`.

**What is wrong:** `createNap` creates `ref = { current: 'asleep' }` per scene instance. Leaving and
re-entering the nap room makes the sleeper asleep again; pressing Enter replays the stir/slide/sit-up
beats before `contactBeat` decides to use the short `again` line. `seenEndingLine` only shortens the
spoken line, not the performance.

**Fix:** Initialise the pose from `seenEndingLine()` (awake if any line has been seen), or persist
"woke" in the store.

#### L9. Test names that claim more than they prove (no product behaviour changed)

**Where and what:**
- `src/game/art/art.test.ts:81` — `every_sprite_has_visible_pixels_and_no_empty_rows_at_edges` only
  checks that some pixel is visible; it never checks edge rows.
- `src/game/exhibits/logic/particles.test.ts:81` — `no_allocation_per_step` checks that the typed
  arrays keep identity and the return value is `undefined`; any other allocation would pass.
- `src/components/effects/CrtOverlay.test.tsx:59` — checks CSS text for `.crt-flicker`, an unused
  legacy class, rather than rendering the overlay under reduced motion. The overlay itself is static,
  so the product is fine; the test is not the proof it claims.
- `tests/e2e/journey.spec.ts:1023` — `every_star_is_reachable` teleports to each stand and clicks;
  real walkability is proven separately by the per-scene `findPath` tests, and the project-panel
  assertion is `panels.length >= 10` rather than the set of the ten titles.
- `tests/e2e/journal.spec.ts` — no test for `src/app/error.tsx`; the not-found page is tested, the
  error page is not.
- `tests/e2e/themes.spec.ts` — theme tests exercise the navbar button on `/projects/` and the terminal
  command on `/`, but never the missing home selector (H1).

**Fix:** Correct the names or the assertions, and add the missing error-page and home-selector cases.

#### L10. Unused leftovers from the cleanup pass

**Where:** `src/components/icons.tsx` (no imports anywhere), `src/hooks/useGitHubData.ts` (no
imports), `public/fonts/fontsfree-net-thehistoriademo-webfont.woff{,2}` (the old font; only
`PixelifySans.ttf` is loaded), and dead CRT classes in `src/styles/globals.css:244-290`.

**What is wrong:** They are tree-shaken or unused, so they do not affect the bundle much, but they are
contradictory to Task 22's cleanup and make the next review noisier. `globals.css` also still contains
`.crt-scanlines`/`.crt-vignette` gradients and the `.crt-flicker` 0.15 s animation; nothing uses them,
but a future contributor could.

**Fix:** Delete the unused files and the dead CRT rules after confirming with Codebase Memory, or add
a short note explaining why they are kept.

## What I verified as good

- **Star model:** `allStarIds()` derives from projects + `readingList` + `SILLY_STARS`, totals 35,
  ids are unique, and the counter reads the same total. Every star in the e2e run was awarded exactly
  once and the saved `found` set equalled `allStarIds()`.
- **Backward-compatible saves:** `loadProgress` reads version 1, keeps known ids, drops removed ids,
  preserves counters and survives corrupt/blocked storage. `old_save_keeps_found_stars_when_total_grows`
  and the corrupt-save browser test pass.
- **Trail and ending:** all five clues are obtainable and persist; the moon door stays shut with a
  clue-specific hint and opens with zero stars once the trail is done; `endingLine` reserves `full`
  for `found === total`, `most` at half, and upgrades but never downgrades a seen line. The
  full-collection and trail-only e2e paths pass, and the door can be declined.
- **No dead ends:** every space has a visible way back; the hall reaches room/workshop/archive/
  observatory; the nap room exits to the observatory. Every hotspot's stand was checked for a real
  `findPath` route in each scene test, and every stand is within the 14 px interaction range. The
  stall guard abandons an impossible walk.
- **Journal correctness:** every star has an entry; unfound entries render only `???` with no title,
  body or URL; found entries show real project/book/silly text; `J`, the visible button and Esc open
  and close it; focus returns to the button. Direct-link pages render full content with JS off; the
  unknown slug returns 404 with the pixel not-found page.
- **Accessibility basics:** reduced motion makes dialogue instant, cuts transitions, freezes the 3D
  shape and particles, holds the lantern and stops flicker/bumps; the overlays are static; Esc closes
  every panel; the journal, terminal and project panel have visible focus rings; buttons have labels;
  no fast full-screen flashing was found. The scene/level tests include a calm-mode draw for every
  dark space.
- **Theme palette:** every theme has exactly the same 31 keys and 31 distinct colours, under the
  32-colour cap; sprite decoding uses only the active palette; warm and moonlit are genuinely
  different palettes; the canvas repaints without a reload (browser test and probe).
- **Phone parity:** tap walks, drag moves the lantern without walking, the terminal works from
  on-screen choices with no keyboard, the phone full trail passes, and the canvas uses whole-number
  scaling in portrait and landscape.
- **Performance:** the archive frame-budget test passes (average < 40 ms, p95 < 90 ms, worst < 250 ms)
  and I found no leak: offscreen canvases are cached per sprite, lighting buffers are reused, audio
  voices are released on `ended`, and scene layer buffers are recreated only on resize.
- **Cleanup:** `lucide-react` is gone, the old `world`/`projects`/avatar/art-preview code is gone, and
  `/art-preview/` returns 404.

## Accepted notes (not defects)

Per the coordinator: the GitHub journal page is intentionally a static snapshot dated 2026-09-19, and
`docs/superpowers/claims-to-check.md` is deliberately for Huzbi to answer. I did not rewrite either.

## Suggested routing

| Finding | Suggested owner | Why |
|---|---|---|
| H1 | Sonnet (visual/UI) | Needs HUD placement and a real integration test |
| M1 | Sonnet (art/visual) | Shared dark-space framing treatment |
| M2, M3 | OpenCode (logic/test) | Small, testable focus fixes |
| M4 | **fixed here** (`3f9483b`) | Content + test strengthening |
| L1, L2, L3 | OpenCode (state logic) | Gating and cancellation rules |
| L4 | OpenCode (performance) | Hoist allocations and cull |
| L5, L6, L7 | Sonnet (UI/content) | Visual and copy integration |
| L8, L9, L10 | OpenCode / cleanup | Small follow-ups |

Everything above is on the working branch; nothing was merged to `main`, and the review did not touch
the port-3000 review server.
