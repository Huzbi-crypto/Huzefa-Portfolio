# Retro Game Portfolio: Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. In this project, tasks run as supervised Orca workers, per the routing table below.

**Goal:** Finish the whole game and site: every project as a playable exhibit, the clue trail, the ending, the journal pages, sound and themes, ready for Huzbi's Checkpoint 2 review before launch.

**Architecture:** Builds on the Phase 1 engine in `src/game/`. The dark becomes several connected spaces sharing one lighting and scene helper. Each exhibit splits into pure, tested logic (`src/game/exhibits/logic/`) and a drawn exhibit (`src/game/exhibits/`). Everything readable remains real DOM.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind 3, pnpm 9, Vitest, Playwright in Edge. No new runtime dependencies. Music is synthesized with Web Audio.

**Spec:** `docs/superpowers/specs/2026-11-02-retro-game-portfolio-design.md`. Phase 1 plan, for the engine's conventions: `docs/superpowers/plans/2026-11-02-retro-game-portfolio.md`.

## Global Constraints

- Every Global Constraint in the Phase 1 plan still applies: commit and push every individual change, stage only your own paths, stay on `Huzbi-crypto/Portfolio-Master`, real pixel art with whole-number scaling and no gradients, at most 32 colors per theme, original art and music only, no way to lose or get stuck, mysterious and playful but never scary, sound off until turned on, no invented facts, no corporate voice, all game text in `src/game/content/copy.ts`, a calm reduced-motion version, no fast full-screen flashing.
- The ending never requires collecting every star.
- The monster poster is one funny fake-out: it never chases or jumps out.
- Exhibits are playful illustrations, not claims. Factual text comes from `src/data/projects.ts`.
- No manga cover art: spines are colored bars and titles.
- The local review server may be running on port 3000. Don't kill it.

## Review Focus

- A visitor returning with a Phase 1 save, whose star total has since grown: their found stars stay, and the counter shows the new total. Test: Task 11.
- A visitor reaching the ending with very few stars, then returning later with all of them: they get the teasing line first, the full line later, and neither replays wrongly. Test: Task 15.
- A phone with no physical keyboard at the typing exhibit: on-screen choices let them use it and earn the star. Test: Task 14.
- Web Audio blocked or missing: the sound toggle stays calm, the game keeps working and nothing throws. Test: Task 18.
- A direct link to an unknown project slug, or any journal page with JavaScript off: a pixel not-found page, or full readable content. Test: Task 19.

## Worker Routing

Assigned by complexity. OpenCode takes logic that tests can fully verify, including hard algorithms. Sonnet 5.5 at medium effort takes work judged by how it looks, feels and reads.

| Task | Worker | Why | Depends on |
|---|---|---|---|
| 10. Window and doorway bugs (running) | OpenCode | Draw order and hotspot logic | none |
| 11. Spaces and exhibit framework | OpenCode | Engine refactor | 10 |
| 12. Exhibit logic | OpenCode | Algorithms: 3D math, particles, ASCII, compiler | 11 |
| 13. Workshop: four exhibits | Sonnet | Art and game feel | 11, 12 |
| 14. Archive: five exhibits, monster poster | Sonnet | Art and game feel | 11, 12 |
| 15. Trail, ending rules, nudges | OpenCode | State logic | 11 |
| 16. Observatory, nap room, the ending | Sonnet | The payoff; mood and comedy | 15 |
| 17. Full shelf, silly stars, in-game journal | Sonnet | UI and jokes | 15 |
| 18. Sound | OpenCode | Synth and state logic | 11 |
| 19. Journal pages, banner, error pages | Sonnet | Page design | 17 |
| 20. Rewrite project and About text | Sonnet | Writing | 19 |
| 21. Themes, CRT, terminal | Sonnet | Palette and UI | 16, 19 |
| 22. Cleanup and full journey tests | OpenCode | Verification | 13, 14, 16 to 21 |
| 23. Whole-branch code review | Fresh reviewer | Independent check | 22 |

**Every OpenCode worker** uses Codebase Memory before planning and names its calls. **Claude workers** use `frontend-design` and `hallmark`. Check each OpenCode session's model and `variant: max` after launch.

## File Map

```
src/game/scene/
  space.ts            createDarkSpace(def): shared lighting, collision, depth sort, exits
  dark.ts             first hall (existing, refactored onto space.ts)
  workshop.ts  archive.ts  observatory.ts  nap.ts
src/game/exhibits/
  types.ts  exhibit.ts
  logic/   diffusion.ts  agents.ts  translator.ts  miniShell.ts  cookies.ts
           asciify.ts  particles.ts  wire3d.ts  compilerBelt.ts
  aiAnime.ts  langProjects.ts  speechTranslator.ts  compilerBelt.ts
  termExp.ts  readCookies.ts  asciiArt.ts  creativeCoding.ts  renderer3d.ts
src/game/state/    story.ts  nudge.ts
src/game/audio/    synth.ts  tunes.ts  audio.ts
src/game/content/  stars.ts  copy.ts
src/components/game/   ProjectPanel.tsx  Journal.tsx  SoundToggle.tsx
src/components/journal/   JournalPage.tsx  MysteryBanner.tsx  PixelPanel.tsx
src/app/   about/ contact/ github/ projects/ projects/[slug]/ not-found.tsx error.tsx
docs/superpowers/claims-to-check.md
```

---

### Task 11: Spaces and exhibit framework

**Files:** Create `src/game/scene/space.ts`, `src/game/exhibits/types.ts`, `src/game/exhibits/exhibit.ts`, `src/components/game/ProjectPanel.tsx`. Modify `src/game/scene/types.ts`, `src/game/scene/dark.ts`, `src/game/game.ts`, `src/components/game/GameRoot.tsx`, `src/game/state/store.ts`. Tests beside each.

**Interfaces:**
- Consumes: `applyLighting`, `lanternPosition` from `render/lighting.ts`; `Hotspot`, `Scene`, `SceneCtx`, `GameApi`.
- Produces:
  - `SceneId = 'room' | 'dark' | 'workshop' | 'archive' | 'observatory' | 'nap'`; `Scene['id']: SceneId`; `GameApi.goTo(id: SceneId, entry?: string): void`
  - `GameApi.showProject(projectId: string): Promise<void>`, opening `ProjectPanel`: real text, repo link, and demo link if `demoUrl` exists
  - `SpaceDef = { id: SceneId; worldW: number; worldH: number; solids: Rect[]; spawn: Tile; entries: Record<string, Tile>; exits: SpaceExit[]; props: SpaceProp[]; exhibits: Exhibit[]; lights: Light[]; drawBackdrop(g, ctx): void }`
  - `createDarkSpace(def: SpaceDef, store: GameStore): Scene`
  - `SpaceExit = { id: string; rect: Rect; stand: Tile; label: string; to: SceneId; entry: string }`
  - `Exhibit = { id: string; projectId: string; rect: Rect; stand: Tile; footY: number; label: string; update(ms: number, ctx: SceneCtx): void; draw(g: CanvasRenderingContext2D, ctx: SceneCtx): void; use(api: GameApi): Promise<void> }`
  - `tryExhibit(api: GameApi, projectId: string): Promise<void>`: awards `project:<id>` once, then calls `showProject`

- [ ] **Step 1: Write failing tests.** `space_builds_a_scene_from_a_def`; `exits_go_to_named_entry`; `every_entry_and_exhibit_stand_is_reachable` (using `navMap`); `exhibits_sort_with_the_player_by_footY`; `tryExhibit_awards_once`; `old_save_keeps_found_stars_when_total_grows` (load a save holding `silly:read-note` and `project:routing-sim`).

- [ ] **Step 2: Implement `space.ts`, moving dark.ts's lighting and depth sort into it.** The first hall must look and behave exactly as before. Existing tests stay unchanged and pass. Commit and push after each moved piece.

- [ ] **Step 3: Implement exhibits and `ProjectPanel`.** Esc and a visible close control dismiss it; it's fully keyboard and touch usable, with input blocked while open. Convert the routing board to an `Exhibit`. Commit and push.

- [ ] **Step 4: Verify.** `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm e2e` all pass.

---

### Task 12: Exhibit logic

**Files:** Create `src/game/exhibits/logic/*.ts` with a test beside each. Pure functions only, with no canvas and no DOM. All take explicit seeds or time so results are deterministic.

**Interfaces:** Produces, with one commit per module:
- `diffusion.ts`: `resolveImage(target: PixelGrid, noiseSeed: number, progress: number): PixelGrid`; `pickRoll(seed: number): { target: string; flaw: string }`. Tests: `progress_0_is_noise`, `progress_1_equals_target`, `more_progress_matches_more_pixels`, `every_roll_has_a_flaw`.
- `agents.ts`: `createFlow(): Flow`, `stepFlow(f: Flow, ms: number): Flow`, `giveNote(f: Flow, note: string): Flow`. Tests: `note_visits_nodes_in_order`, `note_reaches_end`, `loop_robot_never_finishes_and_never_blocks_others`.
- `translator.ts`: `translate(phrase: string, seed: number): { bars: number[]; output: string }`. Tests: `bars_track_phrase_length`, `output_always_differs_from_input`, `same_seed_same_output`.
- `miniShell.ts`: `runCommand(line: string, s: ShellState): { output: string[]; state: ShellState; trying: boolean }`. Tests: `help_lists_commands`, `unknown_command_gets_a_rude_reply`, `empty_line_is_harmless`, `very_long_input_is_truncated`, `first_real_command_sets_trying`.
- `cookies.ts`: `unlockJar(): Cookie[]`, `eatCookie(c: Cookie[], id: string): { cookies: Cookie[]; line: string }`. Tests: `cookies_have_session_labels`, `eating_all_leaves_an_empty_jar_without_error`.
- `asciify.ts`: `luminanceToChar(l: number): string`, `asciifyCell(pixels: PixelGrid, x: number, y: number, cell: number): string`. Tests: `dark_maps_to_space`, `bright_maps_to_dense_char`, `out_of_range_clamps`.
- `particles.ts`: `createField(n: number, w: number, h: number, seed: number): Field`, `stepField(f: Field, ms: number, attractor: { x: number; y: number } | null): void`. Tests: `pulled_toward_attractor`, `stays_in_bounds`, `null_attractor_drifts`, `huge_ms_stays_finite`, `no_allocation_per_step`, plus a budget test: 200 particles under 1 ms on average.
- `wire3d.ts`: `rotation(yaw: number, pitch: number): Mat4`, `projectEdges(m: Mat4, shape: Shape, w: number, h: number): Edge2D[]`, `rasterLine(e: Edge2D): Point[]`. Tests: `identity_keeps_shape`, `known_90deg_rotation`, `perspective_shrinks_far_points`, `points_are_integers`, `behind_camera_is_clipped`.
- `compilerBelt.ts`: `compileLine(src: string): Stage[]`, with stages `tokens`, `tree`, `code`, `asm`; `jamAt(seed: number, tick: number): string | null`. Tests: `x_equals_1_plus_2_tokenizes`, `invalid_input_gets_fussy_error_not_crash`, `jam_is_rare_and_clears`.

- [ ] **Step 1: For each module, write its failing tests, then the module, and commit and push.** A small, readable real implementation is the goal; `compileLine` is a tiny illustration and not a full compiler.

- [ ] **Step 2: Verify.** `pnpm test`, `pnpm typecheck` pass.

---

### Task 13: Workshop, four exhibits

**Files:** Create `src/game/scene/workshop.ts`, `src/game/exhibits/aiAnime.ts`, `langProjects.ts`, `speechTranslator.ts`, `compilerBelt.ts`, `src/game/art/sprites/workshop.ts`. Modify `src/game/art/index.ts`, `src/game/content/copy.ts`, `src/game/scene/dark.ts` (add the exit).

**Interfaces:** Consumes `createDarkSpace`, `Exhibit`, `tryExhibit` from Task 11 and logic from Task 12. Produces `createWorkshop(store: GameStore): Scene`, with entry `fromHall`.

- [ ] **Step 1: Write failing tests.** `all_stands_reachable`; `each_exhibit_awards_its_star_when_tried`; `reduced_motion_exhibit_still_awards` for each exhibit; `art_uses_palette_only`.

- [ ] **Step 2: Build one exhibit at a time, committing and pushing each,** following the spec's table. Start with `ai-anime`, as the art benchmark. Each must read at a glance before any text appears, and be at least as charming as the routing board.

- [ ] **Step 3: Look at it.** Screenshot every exhibit in lantern light to `test-results/workshop/` and open each image. Report the paths.

---

### Task 14: Archive, five exhibits and the monster poster

**Files:** Create `src/game/scene/archive.ts`, `src/game/exhibits/termExp.ts`, `readCookies.ts`, `asciiArt.ts`, `creativeCoding.ts`, `renderer3d.ts`, `src/game/art/sprites/archive.ts`. Modify `src/game/art/index.ts`, `src/game/content/copy.ts`, `src/game/content/stars.ts` (add `silly:monster-poster`), `src/game/scene/dark.ts` (add the exit).

**Interfaces:** Consumes the same as Task 13. Produces `createArchive(store: GameStore): Scene`, with entry `fromHall`.

- [ ] **Step 1: Write failing tests.** `all_stands_reachable`; `each_exhibit_awards_its_star_when_tried`; `reduced_motion_exhibit_still_awards`; `phone_can_use_terminal_with_on_screen_choices` (with no key events, tapping suggested commands sets `trying`); `monster_never_moves_toward_player` (poster position is constant); `art_uses_palette_only`.

- [ ] **Step 2: Build the exhibits, committing and pushing each.** The ASCII frame converts only the lit cells, and it goes through `lanternPosition`, so keyboard and touch visitors get it too. Particles follow the lantern, and `creative-coding` links to its live demo. The 3D screen supports dragging with mouse or touch, and arrow keys while focused.

- [ ] **Step 3: Build the monster gag.** Two red eyes glow in the distance. Up close it's a pixel poster based on `public/assets/cwnilmm1twqb1.jpeg`, redrawn in the palette, with a dry remark and a star. It must read as funny, not as a horror beat.

- [ ] **Step 4: Look at it.** Screenshot to `test-results/archive/` and open each image. Report the paths.

---

### Task 15: Trail, ending rules, nudges

**Files:** Create `src/game/state/story.ts`, `src/game/state/nudge.ts`, tests. Modify `src/game/state/store.ts`, `src/game/game.ts`.

**Interfaces:**
- Produces:
  - `TRAIL = ['clue:note', 'clue:hall', 'clue:workshop', 'clue:archive', 'clue:observatory'] as const`
  - `store.markClue(id: string): void`, saved in `counters`; `store.hasClue(id: string): boolean`
  - `nextClue(p: Progress): string | null`; `endingUnlocked(p: Progress): boolean`, true once every `TRAIL` clue is found, regardless of stars
  - `endingLine(found: number, total: number): 'full' | 'most' | 'few'`: `full` only when `found === total`; `most` at half or more; otherwise `few`
  - `pickNudge(p: Progress, idleMs: number, hotspots: { id: string; found: boolean }[]): string | null`: null under 30000 ms idle; otherwise an unfound target
  - `onEndingSeen(p: Progress, line: EndingLine): Progress`

- [ ] **Step 1: Write failing tests.** `ending_unlocks_without_all_stars`; `ending_locked_until_trail_done`; `full_line_only_at_total`; `few_stars_then_all_stars_upgrades_the_line`; `ending_seen_is_idempotent`; `no_nudge_under_30s`; `no_nudge_when_everything_found`; `nudge_prefers_next_clue`; `clues_survive_reload`.

- [ ] **Step 2: Implement.** Tests pass. Commit and push each module.

---

### Task 16: Observatory, the nap room and the ending

**Files:** Create `src/game/scene/observatory.ts`, `src/game/scene/nap.ts`, `src/game/art/sprites/ending.ts`. Modify `src/game/content/copy.ts`, `src/game/scene/room.ts`, `dark.ts`, `workshop.ts`, `archive.ts` (place clues), `src/components/game/GameRoot.tsx`.

**Interfaces:** Consumes `TRAIL`, `endingUnlocked`, `endingLine`, `onEndingSeen` from Task 15; `github-snapshot.json`. Produces `createObservatory(store)`, `createNap(store)`.

- [ ] **Step 1: Write failing tests.** `constellation_uses_real_repo_data`; `found_stars_appear_in_sky`; `nap_door_stays_shut_until_endingUnlocked` with a hint and no dead end; `ending_shows_real_contact_details` (from `personalInfo`); `say_hi_is_a_mailto`; `can_leave_after_ending`.

- [ ] **Step 2: Build the Observatory.** A constellation of real repos in the dark, with an honest GitHub stats snapshot and the date it was taken. Commit and push.

- [ ] **Step 3: Place the clues across the spaces,** so each points toward the next without a puzzle.

- [ ] **Step 4: Build the ending.** Huzbi asleep on a sofa with a manga on their face; human, in hoodie and headphones with messy dark hair, as in the spec. Wakes, says the `endingLine` version ("...wait, you found everything? Nobody does that." for `full`). Then real contact details and a prepared email to say hi. Comedic timing matters: give the wake-up a beat. Commit and push.

- [ ] **Step 5: Look at it.** Screenshot every beat to `test-results/ending/` and open each image. Report the paths.

---

### Task 17: Full shelf, silly stars, in-game journal

**Files:** Create `src/components/game/Journal.tsx`. Modify `src/game/scene/room.ts`, `src/game/content/stars.ts`, `src/game/content/copy.ts`, `src/components/game/GameRoot.tsx`, `src/components/game/game.css`.

**Interfaces:** Consumes `store`. Produces `JournalEntry = { id: string; title: string; body: string; url?: string; found: boolean }`, `journalEntries(found: readonly string[]): JournalEntry[]`.

- [ ] **Step 1: Write failing tests.** `every_star_has_a_journal_entry`; `unfound_entries_hide_title_and_body`; `shelf_reaches_every_reading_item`; `each_shelf_item_awards_once`; `journal_opens_with_J_and_a_visible_button_and_closes_with_esc`.

- [ ] **Step 2: Make the whole shelf browsable,** with every title's opinion from `readingList` and its star. Keyboard, mouse and touch. Commit and push.

- [ ] **Step 3: Add silly stars,** at least 6 more, each with its own joke, such as the sofa, the lamp, and reading the note a third time. Add them to `SILLY_STARS`. Commit and push each.

- [ ] **Step 4: Build the journal overlay.** Real DOM text, hiding what isn't found, and including everything discoverable so screen-reader users can reach it. Commit and push.

---

### Task 18: Sound

**Files:** Create `src/game/audio/synth.ts`, `tunes.ts`, `audio.ts`, `src/components/game/SoundToggle.tsx`, tests. Modify `src/components/game/GameRoot.tsx`, `src/game/game.ts`.

**Interfaces:** Produces `createAudio(ctxFactory: () => AudioContext | null, store: GameStore): GameAudio`, where `GameAudio = { setEnabled(v: boolean): void; playSfx(name: SfxName): void; setScene(id: SceneId): void; dispose(): void }`. `SfxName = 'step' | 'star' | 'door' | 'blip' | 'open' | 'close'`.

- [ ] **Step 1: Write failing tests with a fake context.** `silent_until_enabled`; `no_context_created_before_enabled`; `choice_persists_across_reload`; `null_context_never_throws`; `suspended_context_is_resumed_only_after_a_gesture`; `scene_change_swaps_tune`; `hidden_tab_suspends_and_returns`.

- [ ] **Step 2: Implement square and triangle wave synthesis and original tunes:** cozy for the room, sparse and quiet for the dark, and a lazy lullaby for the ending. Commit and push.

- [ ] **Step 3: Add the visible pixel toggle,** keyboard and touch usable, with a real label for screen readers. Wire in effects. Commit and push.

---

### Task 19: Journal pages, banner, error pages

**Files:** Create `src/components/journal/JournalPage.tsx`, `MysteryBanner.tsx`, `PixelPanel.tsx`. Modify `src/app/projects/page.tsx`, `src/app/projects/[slug]/page.tsx`, `src/app/about/page.tsx`, `src/app/github/page.tsx`, `src/app/contact/page.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/components/navigation/Navbar.tsx`.

**Interfaces:** Consumes `personalInfo`, `projects`, `github-*.json`, the pixel font and palette. Produces `MysteryBanner` (links to `/`), `JournalPage({ title, children })`.

- [ ] **Step 1: Write failing browser tests.** `every_route_has_quiet_banner_linking_home`; `content_readable_with_javascript_off` for each route; `unknown_slug_shows_pixel_not_found`; `every_project_has_a_page`; `no_rounded_cards_or_lucide_on_journal_pages`.

- [ ] **Step 2: Build the pixel-journal system and convert each page, one commit per page.** Hard-edged panels, pixel icons and the pixel font, readable as body text. The banner is **non-distracting**, along the lines of "click here to resolve the mystery". Keep the metadata and semantic headings. The contribution wall and repo data stay real and get redrawn in the system.

- [ ] **Step 3: Look at it.** Desktop and phone screenshots of each route to `test-results/journal/`; open each image. Report the paths.

---

### Task 20: Rewrite project and About text

**Files:** Modify `src/data/projects.ts`, `src/data/personal.ts`, `src/app/about/page.tsx`. Create `docs/superpowers/claims-to-check.md`.

**Interfaces:** Field names stay unchanged; only values change. Ids and slugs must not change, since saves and links depend on them.

- [ ] **Step 1: Rewrite every project's tagline, description and highlights, and the About text, in Huzbi's voice.** Keep every fact; invent none. Commit and push per project.

- [ ] **Step 2: List every claim you can't confirm from the repo in `claims-to-check.md`,** with its project and exact wording, such as "computed at 60 FPS", performance benchmarks, and "Over 6 GitHub stars". Do not silently drop or reword them.

- [ ] **Step 3: Verify.** `pnpm test`, `pnpm build`, and a check that ids and slugs are unchanged against `git show HEAD~1`.

---

### Task 21: Themes, CRT overlay, terminal

**Files:** Modify `src/game/art/palette.ts`, `src/components/world/ThemeSelector.tsx` (move to `src/components/game/`), `src/components/effects/CrtOverlay.tsx`, `src/components/terminal/TerminalModal.tsx`, `src/game/content/stars.ts`, `src/styles/globals.css`.

**Interfaces:** Consumes `spritesFor(theme)`, `useApp()`. `Theme` values stay unchanged.

- [ ] **Step 1: Write failing tests.** `each_theme_has_all_keys_and_at_most_32_colors`; `theme_change_recolors_without_reload`; `terminal_secret_awards_star`; `terminal_blocks_player_input`; `crt_has_no_fast_flicker_under_reduced_motion`.

- [ ] **Step 2: Draw real palettes for Warm Apartment and Moonlit Terminal.** Commit and push each.

- [ ] **Step 3: Restyle the terminal and CRT overlay into the pixel system, and add at least one hidden command worth a star (`silly:terminal-secret`).** Commit and push each.

---

### Task 22: Cleanup and full journey tests

**Files:** Delete `src/components/world/*` (after `ThemeSelector` moves), `src/components/projects/*`, unused parts of `src/components/github/*`, `src/hooks/useAvatarMotion.ts`, `src/styles/avatar-motion.css`, `src/types/avatar.ts`, `src/data/dialogues.ts`, `src/app/art-preview/`. Remove `lucide-react` if unused. Modify `tests/e2e/journey.spec.ts`, `README.md`.

- [ ] **Step 1: Find what's truly unused with Codebase Memory before deleting anything.** One commit per group. `pnpm build` passes after each.

- [ ] **Step 2: Write full journey tests.** `every_star_is_reachable` (visit every hotspot and exhibit, and reach the total); `trail_only_reaches_ending_with_few_stars`; `full_collection_gets_full_line`; `art_preview_is_gone`; `no_console_errors_across_full_journey`; `phone_full_trail`; `reduced_motion_full_trail`; `frame_time_stays_under_budget_in_the_busiest_space`.

- [ ] **Step 3: Update the README** to describe the game accurately, including the real deployment setup.

- [ ] **Step 4: Run everything.** `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm e2e` pass. Report any game bug rather than weakening a test.

---

### Task 23: Whole-branch code review

- [ ] **Step 1: Run a fresh, independent review of the whole branch against the spec,** covering correctness, accessibility and performance. Route the fixes to workers.

---

## Checkpoint 2: Stop Here

The plan stops before anything goes live. Huzbi plays the full game, edits all writing, including `src/game/content/copy.ts` and the rewritten project text, and answers `docs/superpowers/claims-to-check.md`. Merging to `main` happens only after Huzbi approves.
