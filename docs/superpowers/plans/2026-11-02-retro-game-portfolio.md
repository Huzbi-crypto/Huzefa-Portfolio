# Retro Game Portfolio: First Playable Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. In this project, tasks run as supervised Orca workers, per the routing table below.

**Goal:** Build the first playable slice: the redrawn room, walking, the extra door and the first seconds in the dark, in near-final art, ready for Huzbi's Checkpoint 1 review.

**Architecture:** A framework-free TypeScript game in `src/game/` draws to a single low-resolution canvas with integer scaling. React mounts it at `/` and renders all readable text (dialogue, star counter) as real DOM over the canvas. Game logic is pure and unit-tested; art is palette-indexed text grids decoded at runtime, so there are no binary sprite assets and themes can swap palettes.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind 3, pnpm 9. New dev dependencies only: `vitest`, `jsdom`, `@playwright/test` (run with `channel: 'msedge'`, so no browser download).

**Spec:** `docs/superpowers/specs/2026-11-02-retro-game-portfolio-design.md`. Read it before starting any task. Mood references: `docs/superpowers/specs/2026-11-02-retro-game-portfolio-mockups/`.

## Global Constraints

- Every individual change is committed and pushed as it's made, not batched by milestone or module. After each passing test-and-code step: `git add <only your paths>`, `git commit`, `git push`. Never use `git add -A` or `git add .`.
- All work is on branch `Huzbi-crypto/Portfolio-Master`. Never touch `main`.
- No backend, no accounts. Progress lives in the visitor's browser and the game still works if storage is unavailable.
- Real pixel art: low-resolution grid, whole-number scaling, no smoothing, no gradients, blurred glows or sub-pixel movement in the game world. Light and shadow use dithering or hard steps.
- One limited palette of at most 32 colors per theme.
- Original art and music only. No assets from Hollow Knight, Skyrim, Sekiro or any manga, including cover art. Any font or library needs a license allowing this use.
- No hard puzzles, timers, enemies, health, or ways to lose or get stuck. The visitor can always return to the room. Mysterious and playful, never scary.
- Sound never plays until the visitor turns it on.
- Never invent facts about Huzbi. Jokes are fine; false biography is not. Never use corporate voice.
- All jokes, notes and dialogue live in `src/game/content/copy.ts`.
- People with `prefers-reduced-motion: reduce` get no flicker, no typing effect, simple cuts. No fast full-screen flashing for anyone.
- Desktop supports both arrow keys and mouse fully; WASD also works. Enter or Space interacts; Esc closes a panel. Touch: tap to walk.
- In the dark: mouse cursor is the light; keyboard keeps the light around the character; touch drags the light and taps to walk or interact.
- Do not delete old pages or components in this slice. `/about`, `/projects`, `/github`, `/contact` keep working as they are until Phase 2.

## Review Focus

- `localStorage` throws or holds corrupt JSON: the game starts fresh with no error and keeps working for the visit. Test: Task 3.
- Window resized or phone rotated mid-play: scale stays a whole number and the camera stays in bounds. Test: Task 2.
- Tab hidden for minutes, then shown: the character doesn't jump or pass through walls. Test: Task 1.
- Click or tap on a wall, furniture or unreachable spot: the character walks to the nearest reachable tile and nothing hangs. Test: Task 2.
- Typing in the terminal or with dialogue open: the character doesn't move and arrows don't scroll the page. Tests: Tasks 1 and 8.

## Worker Routing

Assigned by complexity and by what the task is. Sonnet handles work judged by how it looks and feels; OpenCode handles logic that tests can fully verify.

| Task | Worker | Why | Depends on |
|---|---|---|---|
| 1. Test setup and engine core | OpenCode | Pure logic, verified by tests | none |
| 2. Movement, pathfinding, camera | OpenCode | Algorithms, verified by tests | 1 |
| 3. Progress, stars, dialogue, game state | OpenCode | State logic, verified by tests | 1 |
| 4. Palette, font and room art | Claude Sonnet 5.5, medium | Art quality is the main risk | 1 |
| 5. The room, playable at `/` | Claude Sonnet 5.5, medium | Composition, game feel, UI | 2, 3, 4 |
| 6. Lighting engine | OpenCode | Performance-sensitive algorithm | 1 |
| 7. The dark and the door transition | Claude Sonnet 5.5, medium | Mood and art | 5, 6 |
| 8. Browser journey tests | OpenCode | Automated verification | 7 |

**Every OpenCode worker** must use the Codebase Memory MCP tools to understand the existing code before planning anything, and must report which calls it made. **Claude workers** use the `frontend-design` and `hallmark` skills. **All workers** follow Superpowers planning and test-driven development; workers without a Skill tool read `SKILL.md` directly from `C:\Users\huzbi\.claude\plugins\cache\claude-plugins-official\superpowers\7.0.0\skills\`.

## File Map

```
src/game/
  core/      viewport.ts  loop.ts  input.ts
  render/    sprite.ts  lighting.ts  transition.ts
  world/     grid.ts  entity.ts  camera.ts
  state/     progress.ts  dialogue.ts  store.ts
  scene/     types.ts  room.ts  dark.ts
  content/   stars.ts  copy.ts
  art/       palette.ts  sprites/*.ts
  game.ts
src/components/game/   GameRoot.tsx  DialogueBox.tsx  StarCounter.tsx
src/app/art-preview/page.tsx    (404s in production; removed at launch)
src/app/page.tsx                (replaced)
tests/e2e/journey.spec.ts
```

Unit tests sit beside their code as `*.test.ts`.

---

### Task 1: Test setup and engine core

**Files:**
- Modify: `package.json`, `.gitignore` (add `/test-results`, `/playwright-report`)
- Create: `vitest.config.ts`, `src/game/core/viewport.ts`, `src/game/core/loop.ts`, `src/game/core/input.ts`, `src/game/render/sprite.ts`, plus tests

**Interfaces:**
- Produces:
  - `computeViewport(cssW: number, cssH: number): { scale: number; viewW: number; viewH: number }`
  - `createLoop(opts: { step: (ms: number) => void; render: () => void; stepMs?: number; maxFrameMs?: number; raf?: typeof requestAnimationFrame; caf?: typeof cancelAnimationFrame }): { start(): void; stop(): void }`
  - `createInput(target: HTMLElement, opts: { isBlocked: () => boolean }): Input`, where `Input = { move: { x: -1 | 0 | 1; y: -1 | 0 | 1 }; pointer: { x: number; y: number } | null; mode: 'mouse' | 'keyboard' | 'touch'; drain(): InputEvent[]; dispose(): void }` and `InputEvent = { type: 'tap'; x: number; y: number } | { type: 'interact' } | { type: 'cancel' }`. Coordinates are CSS pixels relative to `target`.
  - `decodeSprite(rows: string[], palette: Record<string, string>): Sprite`, where `Sprite = { w: number; h: number; pixels: (string | null)[] }`, and `drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, opts?: { flipX?: boolean }): void`. `.` means transparent.

- [ ] **Step 1: Install tooling.** `pnpm install`, then `pnpm add -D vitest jsdom @playwright/test`. Add scripts `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`, `"e2e": "playwright test"`. Commit and push.

- [ ] **Step 2: Write failing viewport tests.**

```ts
expect(computeViewport(1920, 1080)).toEqual({ scale: 6, viewW: 320, viewH: 180 });
expect(computeViewport(1366, 768)).toEqual({ scale: 4, viewW: 342, viewH: 192 });
expect(computeViewport(390, 844)).toEqual({ scale: 2, viewW: 195, viewH: 422 });
expect(computeViewport(200, 200).scale).toBe(2); // floor of 2, never below
```

- [ ] **Step 3: Implement `computeViewport`:** `scale = max(2, floor(min(cssW / 160, cssH / 180)))`, `viewW = ceil(cssW / scale)`, `viewH = ceil(cssH / scale)`. Run `pnpm test`; expected PASS. Commit and push.

- [ ] **Step 4: Write failing loop tests with a fake `raf`.** `loop_clamps_long_gap`: after a 5000 ms gap with `stepMs` 1000/60 and `maxFrameMs` 100, at most 6 steps run. `loop_stop_cancels`: no steps after `stop()`.

- [ ] **Step 5: Implement `createLoop`** as a fixed-step accumulator, defaulting to `stepMs = 1000 / 60`, `maxFrameMs = 100`. Tests PASS. Commit and push.

- [ ] **Step 6: Write failing input tests (`// @vitest-environment jsdom`).** `arrows_and_wasd_set_move`; `arrow_keys_prevent_default`; `blocked_input_ignores_keys` (with `isBlocked` true, `move` stays zero, no default prevented); `typing_in_input_ignored` (key events whose target is `input` or `textarea` change nothing); `enter_and_space_queue_interact`; `escape_queues_cancel`; `pointerup_queues_tap`; `mode_tracks_last_device`; `dispose_removes_listeners`.

- [ ] **Step 7: Implement `createInput`.** Tests PASS. Commit and push.

- [ ] **Step 8: Write failing sprite tests.** `decodes_rows`; `dot_is_transparent`; `throws_on_uneven_rows`; `throws_on_unknown_character`.

- [ ] **Step 9: Implement `decodeSprite` and `drawSprite`.** `drawSprite` floors coordinates and caches a per-sprite offscreen canvas. Tests PASS, `pnpm typecheck` clean. Commit and push.

---

### Task 2: Movement, pathfinding, camera

**Files:** Create `src/game/world/grid.ts`, `entity.ts`, `camera.ts`, plus tests.

**Interfaces:**
- Consumes: `Input['move']` from Task 1.
- Produces:
  - `TILE = 8`; `parseCollision(rows: string[]): TileMap`, where `#` is solid and `TileMap = { w: number; h: number; solid: Uint8Array }`
  - `findPath(map: TileMap, from: Tile, to: Tile): Tile[]`, with `Tile = { x: number; y: number }`
  - `Entity = { x: number; y: number; w: number; h: number; facing: 'up' | 'down' | 'left' | 'right'; moving: boolean; walkMs: number; path: Tile[] }`
  - `createEntity(x: number, y: number): Entity` (feet box of 10 by 6)
  - `stepEntity(e: Entity, move: { x: number; y: number }, map: TileMap, ms: number): void`, speed 60 world pixels per second
  - `computeCamera(target: { x: number; y: number }, viewW: number, viewH: number, worldW: number, worldH: number): { x: number; y: number }`

- [ ] **Step 1: Write failing grid tests.** `path_around_wall`; `path_to_self_is_empty`; `path_to_solid_tile_goes_to_nearest_reachable`; `path_to_enclosed_area_goes_to_nearest_reachable_and_returns`; `out_of_bounds_target_is_clamped`. A* with 4-way movement.

- [ ] **Step 2: Implement `parseCollision` and `findPath`.** Tests PASS. Commit and push.

- [ ] **Step 3: Write failing entity tests.** `moves_at_60px_per_second`; `diagonal_is_normalized`; `slides_along_wall` (axes resolved separately); `cannot_enter_solid`; `huge_ms_never_tunnels_through_wall` (`stepEntity` with `ms` 5000 next to a one-tile wall stays on its side); `keyboard_cancels_path`; `follows_path_then_stops`; `coordinates_at_draw_time_are_integers` (expose `drawPos(e)` returning floored values).

- [ ] **Step 4: Implement `entity.ts`.** Tests PASS. Commit and push.

- [ ] **Step 5: Write failing camera tests.** `centers_on_target`; `clamps_to_world_edges`; `centers_world_when_view_is_larger`; `result_is_integer`; `stays_in_bounds_after_view_size_change` (call with landscape then portrait sizes).

- [ ] **Step 6: Implement `computeCamera`.** Tests PASS, `pnpm typecheck` clean. Commit and push.

---

### Task 3: Progress, stars, dialogue, game state

**Files:** Create `src/game/state/progress.ts`, `dialogue.ts`, `store.ts`, `src/game/content/stars.ts`, plus tests.

**Interfaces:**
- Consumes: `projects` from `@/data/projects`; `personalInfo.readingList` from `@/data/personal`.
- Produces:
  - `Progress = { version: 1; found: string[]; doorOpened: boolean; sound: boolean; counters: Record<string, number> }`
  - `loadProgress(storage: Storage | null): Progress`, `saveProgress(storage: Storage | null, p: Progress): void`, `award(p: Progress, id: string): boolean` (true only the first time), key `huzbi-game-v1`
  - `SILLY_STARS: string[]`, `allStarIds(): string[]`, `starTotal(): number`. Ids are `project:<project.id>`, `read:<slugified title>`, `silly:<name>`; initial silly stars are `silly:pet-cat`, `silly:cold-tea`, `silly:read-note`.
  - `DialogueState`, `startDialogue(lines: string[], choices?: DialogueChoice[], opts?: { instant?: boolean }): DialogueState`, `tickDialogue(s: DialogueState, ms: number): DialogueState`, `advanceDialogue(s: DialogueState): { state: DialogueState | null; chosen?: string }`. `DialogueChoice = { id: string; label: string }`. Typing speed 40 characters per second.
  - `createStore(storage: Storage | null): GameStore`, where `GameStore = { getState(): GameUiState; subscribe(fn: () => void): () => void; say(lines: string[], choices?: DialogueChoice[]): Promise<string | undefined>; award(id: string): boolean; advance(): void; tick(ms: number): void; count(id: string): number; increment(id: string): number; setDoorOpened(): void; setReducedMotion(v: boolean): void }` and `GameUiState = { dialogue: DialogueState | null; found: readonly string[]; total: number; doorOpened: boolean }`.

- [ ] **Step 1: Write failing progress tests.** `fresh_when_empty`; `fresh_when_corrupt_json`; `fresh_when_wrong_version`; `fresh_when_getItem_throws`; `save_swallows_setItem_throw`; `null_storage_works`; `round_trip`; `award_is_idempotent`; `drops_found_ids_not_in_allStarIds` (a stale id from removed content doesn't inflate the count).

- [ ] **Step 2: Implement `progress.ts` and `stars.ts`.** Tests PASS. Include `total_equals_projects_plus_reading_plus_silly`, and assert ids are unique. Commit and push.

- [ ] **Step 3: Write failing dialogue tests.** `types_over_time`; `advance_completes_line_first_then_moves_on`; `instant_shows_full_text`; `choice_returned_on_advance`; `ends_with_null`.

- [ ] **Step 4: Implement `dialogue.ts`.** Tests PASS. Commit and push.

- [ ] **Step 5: Write failing store tests.** `subscribers_notified`; `say_resolves_with_choice`; `award_persists`; `state_snapshot_is_stable_between_changes` (same reference until a change, required by `useSyncExternalStore`); `reduced_motion_makes_dialogue_instant`.

- [ ] **Step 6: Implement `store.ts`.** Tests PASS, `pnpm typecheck` clean. Commit and push.

---

### Task 4: Palette, font and room art

Art quality is the main risk in the whole project, so this task is judged by looking at it.

**Files:** Create `src/game/art/palette.ts`, `src/game/art/sprites/*.ts`, `src/game/art/art.test.ts`, `src/app/art-preview/page.tsx`, the bundled font in `public/fonts/`, and modify `src/styles/globals.css` for `--font-pixel`.

**Interfaces:**
- Consumes: `decodeSprite`, `drawSprite` from Task 1.
- Produces:
  - `PALETTES: Record<Theme, Record<string, string>>` with the same keys in each theme; start with `cozy-crt`, and the others may alias it until Phase 2
  - `SPRITES`: named sprite grids, including `visitor` (walk frames in four directions, min 3 frames per direction, about 16 by 24), `cat` (sleeping, sitting, walking), `desk`, `crt`, `tea`, `note`, `shelf` with spine variants, `sofa`, `rug`, `window`, `lamp`, `doorClosed`, `doorOpen`, and floor and wall tiles

- [ ] **Step 1: Write failing art checks.** `all_sprites_decode`; `every_color_comes_from_palette`; `palette_has_at_most_32_colors`; `all_themes_share_keys`.

- [ ] **Step 2: Choose and bundle an openly licensed pixel font** via `next/font/local`, pointing `--font-pixel` at it, and include its license file. It must stay readable as journal body text, so judge it at body size, not just as a heading.

- [ ] **Step 3: Draw the palette and every sprite as character grids.** Commit and push each sprite family as you finish it. Tests PASS. Sprites need clean silhouettes, consistent light direction, selective outlines and consistent pixel density. Spines are colored bars and titles only, with no cover art.

- [ ] **Step 4: Build `/art-preview`,** which calls `notFound()` when `NODE_ENV === 'production'`. It shows every sprite at 6x on the room's wall and floor colors, with animations playing.

- [ ] **Step 5: Look at it.** Start the dev server, screenshot `/art-preview`, and open the image. If anything reads as a blob or looks like programmer art, redraw it and repeat. Include the final screenshot path in the `worker_done` report. Commit and push.

---

### Task 5: The room, playable at `/`

**Files:**
- Create: `src/game/scene/types.ts`, `src/game/scene/room.ts`, `src/game/game.ts`, `src/game/content/copy.ts`, `src/components/game/GameRoot.tsx`, `DialogueBox.tsx`, `StarCounter.tsx`
- Modify: `src/app/page.tsx`, `src/components/navigation/Navbar.tsx` (render nothing on `/`), `src/app/layout.tsx` if needed
- Test: `src/game/game.test.ts`, `src/game/scene/room.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1 to 4; `useApp().openTerminal` and `isTerminalOpen` from `@/context/AppContext`.
- Produces:
  - `Hotspot = { id: string; rect: { x: number; y: number; w: number; h: number }; stand: Tile; label: string; onInteract(api: GameApi): void | Promise<void> }`
  - `GameApi = { store: GameStore; goTo(sceneId: 'room' | 'dark'): void; openTerminal(): void }`
  - `Scene = { id: 'room' | 'dark'; worldW: number; worldH: number; map: TileMap; spawn: Tile; hotspots: Hotspot[]; update(ms: number, ctx: SceneCtx): void; draw(g: CanvasRenderingContext2D, ctx: SceneCtx): void }`
  - `SceneCtx = { t: number; player: Entity; input: Input; camera: { x: number; y: number }; viewW: number; viewH: number; reducedMotion: boolean; found: readonly string[] }`
  - `createGame(opts: { canvas: HTMLCanvasElement; store: GameStore; scenes: Scene[]; openTerminal(): void; isBlocked(): boolean }): { start(): void; stop(): void; resize(cssW: number, cssH: number): void; goTo(id: Scene['id']): void; setReducedMotion(v: boolean): void }`

- [ ] **Step 1: Write failing tests.** `tap_on_hotspot_walks_then_interacts`; `tap_on_floor_walks`; `interact_key_uses_facing_hotspot`; `input_blocked_during_dialogue`; `all_room_hotspots_reachable` (every `stand` tile has a path from `spawn`); `spawn_not_solid`.

- [ ] **Step 2: Implement `game.ts`** and the React mount. The canvas fills the viewport with `image-rendering: pixelated`. Dialogue and star count are real DOM in the pixel font, with an `aria-live` region for dialogue. `isBlocked` is true when dialogue or the terminal is open. Tests PASS. Commit and push.

- [ ] **Step 3: Compose the room** in `room.ts`, with these hotspots: `note` (Back in 5 mins. Don't touch anything. Awards `silly:read-note`), `tea` (cold; awards `silly:cold-tea`), `monitor` (opens the terminal), `shelf` (one manga opinion from `readingList`, awarding its `read:` star), `cat` (pet; ten pets awards `silly:pet-cat`), `window`, `door` (This door wasn't here yesterday, with `> OPEN IT` and `STAY`; opening calls `goTo('dark')`). The door must be noticeable but never forced. Commit and push after each hotspot.

- [ ] **Step 4: Add the game feel.** Walk cycles, idle cat with tail flick, monitor flicker, light under the door, a star lighting up in the window per star found, a small star-found flourish on the counter. Reduced motion removes flicker and typing. Commit and push.

- [ ] **Step 5: Look at it.** Run the dev server, play with keyboard, mouse and at phone size, and screenshot each. Compare against sketch B in the mockups: this must be clearly better than the sketch. Report screenshot paths.

---

### Task 6: Lighting engine

**Files:** Create `src/game/render/lighting.ts`, `lighting.test.ts`.

**Interfaces:**
- Consumes: `Input['mode']`, `Input['pointer']` from Task 1.
- Produces:
  - `Light = { x: number; y: number; radius: number; tint: 'warm' | 'cool' }`
  - `LIGHT_STEPS: readonly number[]`, `lightLevel(lights: Light[], x: number, y: number): number` (returns a value from `LIGHT_STEPS`, dithered with a 4 by 4 Bayer matrix)
  - `applyLighting(src: ImageData, dst: ImageData, lights: Light[]): void`
  - `lanternPosition(mode: Input['mode'], pointer: { x: number; y: number } | null, player: { x: number; y: number }, lastDrag: { x: number; y: number } | null): { x: number; y: number }`

- [ ] **Step 1: Write failing tests.** `center_is_full_level`; `far_is_near_black_but_never_exactly_zero`; `only_values_from_steps`; `second_light_adds`; `mouse_mode_uses_pointer`; `keyboard_mode_uses_player`; `mouse_mode_without_pointer_uses_player`; `touch_uses_last_drag_then_player`; `no_gradient_in_output` (distinct output colors bounded by source colors times steps).

- [ ] **Step 2: Implement.** `applyLighting` allocates nothing per frame.

- [ ] **Step 3: Add a budget test:** `applyLighting` on a 342 by 192 buffer with 2 lights averages under 4 ms over 100 runs. Tests PASS. Commit and push.

---

### Task 7: The dark and the door transition

**Files:** Create `src/game/scene/dark.ts`, `src/game/render/transition.ts`, `src/game/art/sprites/dark*.ts`, plus tests. Modify `src/game/game.ts`, `src/game/content/copy.ts`.

**Interfaces:**
- Consumes: `Scene`, `Hotspot`, `GameApi` from Task 5; `applyLighting`, `lanternPosition` from Task 6.
- Produces: `darkScene: Scene`; `irisMask(progress: number, cx: number, cy: number, viewW: number, viewH: number): (x: number, y: number) => boolean`.

- [ ] **Step 1: Write failing tests.** `iris_fully_open_and_fully_closed`; `exit_hotspot_returns_to_room`; `all_dark_hotspots_reachable`; `door_opened_is_remembered`; `reduced_motion_cuts_without_iris` (in `game.test.ts`).

- [ ] **Step 2: Implement the door transition:** opening animation, then a hard-edged pixel iris into the dark, and the reverse on returning. Commit and push.

- [ ] **Step 3: Build the first dark space.** Only enough for the review: a lit self-glowing monitor drawing the eye; notes on the wall that continue the story; one real project object using `project:routing-sim` with accurate details from `projects.ts`; a visible way back to the room. All text in `copy.ts`. Commit and push.

- [ ] **Step 4: Wire the lantern** for mouse, keyboard and touch, with a gentle flicker removed for reduced motion. Commit and push.

- [ ] **Step 5: Look at it.** Sweep the lantern and screenshot. It must feel mysterious and playful, not scary, and must be better than sketch C. Report screenshot paths.

---

### Task 8: Browser journey tests

**Files:** Create `playwright.config.ts` (`channel: 'msedge'`, runs `pnpm build && pnpm start`), `tests/e2e/journey.spec.ts`.

**Interfaces:**
- Consumes: the running site. If needed, read state through `window.__huzbiGame`, exposed only when `?e2e=1` is in the URL and with no effect otherwise.

- [ ] **Step 1: Write the desktop tests** at 1366 by 768: `no_navbar_on_home`; `arrow_keys_move_player`; `click_walks_to_spot`; `arrows_do_not_scroll_page`; `read_note_awards_star_and_counter_updates`; `open_door_enters_dark`; `cursor_moves_light`; `keyboard_keeps_light_on_player`; `return_to_room`; `progress_survives_reload`; `corrupt_save_starts_fresh`; `typing_in_terminal_does_not_move_player`; `no_console_errors`.

- [ ] **Step 2: Write the phone tests** at 390 by 844 with touch: `tap_walks`; `drag_moves_light`; `rotate_keeps_integer_scale`.

- [ ] **Step 3: Write the reduced-motion test** using `reducedMotion: 'reduce'`: dialogue text appears instantly.

- [ ] **Step 4: Write the old-pages test:** `/about/`, `/projects/`, `/projects/routing-simulation/`, `/github/`, `/contact/` still return 200.

- [ ] **Step 5: Run everything.** `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm e2e` must all pass. If a test exposes a game bug, report it in `worker_done` rather than weakening the test. Save screenshots of the journey to `test-results/checkpoint-1/`. Commit and push.

---

## Checkpoint 1: Stop Here

The plan stops for Huzbi's review of the room, walking, the door and the first seconds in the dark. No further art is produced until Huzbi approves.

## Phase 2 (planned in detail only after Checkpoint 1)

Review feedback may change the art direction and the engine's needs, so these get a separate plan: the remaining dark spaces and clue trail; all 10 projects and the full shelf; the monster poster gag; the GitHub constellation; the ending, with star-count lines; in-game journal and idle nudges; chiptune music and sound; pixel journal pages for every route with the quiet banner; not-found and error pages; theme palettes and CRT overlay; rewriting project and About text in Huzbi's voice, flagging unconfirmed claims; terminal restyle and secrets; removing old components and `/art-preview`; writing review; Checkpoint 2 before launch.
