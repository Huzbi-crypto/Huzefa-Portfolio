# Optional game entry: the site first, the room behind a door

Design document, 2026-11-15. Each decision is marked **Huzbi's** (the site owner decided or approved it) or **builder's call** (left open).

## Intent

The retro pixel-journal site is the portfolio Huzbi wants to ship. The game is a large, optional experience inside it. A visitor who came to read about projects, GitHub or contact details should never be forced through the game. A visitor who is curious should see an invitation strong enough to click, and should be able to leave at any moment without losing progress.

Today the game owns `/`. The navbar hides there, and the only invitation is a one-line banner on the other pages. That makes the game the front door, which is the opposite of what Huzbi wants.

**Huzbi's decision:** the journal site becomes the main site. The game moves to its own route and is entered through a visible invitation.

## Goals

- `/` is a real, readable front page in the journal style.
- The game lives at `/play/` and is reachable in one click from `/` and from every journal page.
- Esc opens a pause menu with **Resume** and **Exit to the site**.
- Touch users get a visible menu button, because phones have no Esc key.
- Progress is saved automatically and survives Exit, reload, and a new visit.
- The home page shows whether a save exists, so a returning visitor can continue.
- All existing game content, routes and tests keep working after the route move.

## Non-goals

- No new game scenes, stars, story beats or art.
- No reset-progress button, accounts, cloud saves or cross-device sync.
- No redesign of the journal pages.
- No analytics or tracking.
- No modal game over the site. The game gets a real route.
- No changes to the game's saved format or storage key.

## Anti-goals

- The game must not be the default landing experience.
- Esc must never trap the visitor in the game.
- The pause menu must not be the only way out on touch devices.
- No fake screenshots, fake statistics or invented game features on the home page.
- No second visual system: the home page uses the journal palette, pixel font and hard-edged panels.

## Approaches considered

**Approach 1, front door (chosen).** `/` is a normal front page. A large door section invites play, `/play/` is the full-screen game, and the nav and quiet banner point to it.

**Approach 2, game overlay.** Keep `/` as the journal site and open the game in a full-screen overlay. No new page, but the game has no shareable URL, the back button behaves oddly, and focus and scroll handling on mobile are harder. Rejected.

**Approach 3, game stays at `/`.** Add a "browse the portfolio" banner inside the game. Least work, but it forces the game on everyone and reverses the intent. Rejected.

## Constraints from the existing codebase

- `main` is a direct ancestor of `Huzbi-crypto/Portfolio-Master`, so the site merge is a fast-forward, not a conflict resolution.
- The game stores progress under `huzbi-game-v1`. Keep that key and the version 1 shape so existing saves survive.
- The game is a fixed, full-viewport canvas with its own HUD, keyboard input and focus handling.
- The journal pages share `JournalPage`, `MysteryBanner`, `Navbar`, the pixel palette and the Pixelify Sans font.
- Next.js uses `trailingSlash: true`. New links and redirects use trailing slashes.
- Existing end-to-end tests assume `/` is the game. They will be retargeted to `/play/`.

## The site after this change

### Routes

| Route | What it is |
|---|---|
| `/` | Journal-style front page, real content, real links, no canvas. |
| `/play/` | Full-screen game. No navbar, no site banner. |
| `/projects/`, `/github/`, `/about/`, `/contact/` | Unchanged journal pages. |

The game route is `/play/` because it is the clearest label for a visitor and the least ambiguous in a URL. The game is still called "the room" in copy.

### Navigation

**Huzbi's decision:** the site is entered normally, and the game is one visible option.

- The brand links to `/`.
- The tabs become: **Play** (`/play/`), Projects, GitHub, About, Contact.
- "Play" replaces the old "Room" tab. It is the only nav item that leads into the game.
- The navbar is hidden only on `/play/`, where the game owns the viewport.
- On every journal page, the existing quiet banner stays under the nav and points to `/play/`.
- On `/`, the big door section replaces the thin banner. The home page does not show both.

### The front page

The home page is a front door, not a second About page. It has four parts.

1. **Hero.** `h1` "Huzbi's room", one line under it, and a short intro from `personalInfo`. Primary link: play. Secondary link: projects. A small pixel vignette using existing art (`SCENE.doorOpen`, `SCENE.crt`, `SCENE.catSitting`, `SCENE.tea`).
2. **The door.** The main invitation. A wide pixel panel with the open door art, three or four lines of story copy, and a large "Play the room" link. If a save exists it says "Continue the room" and shows `found` of `total` stars. The story copy uses only facts that are true in the game: it is 2 AM, Huzbi is not there, the note says he will be back in five minutes, and there is a door that should not be there.
3. **Three featured projects.** Real project cards from `src/data/projects.ts`, with title, one-line tagline, languages and a link to the full page. A link to all projects. The three are an explicit home-page list, chosen by Huzbi: `routing-sim`, `ai-anime`, `term-exp`. This does not change the `featured` flags or the six-featured count on `/projects/`.
4. **One closing strip.** Links to About, GitHub and Contact, in one compact row. No newsletter, no fake social proof.

The exact composition, spacing and pixel-art arrangement are builder's calls, within the journal system. The page must read with scripts off and must not duplicate the whole About page.

### The play invitation and save state

`PlayDoor` is a small client component. It reads `loadProgress(window.localStorage)` after mount. It must not touch storage during server rendering.

- No save: link text "Play the room".
- Save with any found star or an opened door: link text "Continue the room", plus a line "12 of 35 stars found".
- The line has reserved height and appears only after mount, so there is no hydration mismatch or layout jump.
- No reset control. A fresh run is a future feature.

### The quiet banner

`MysteryBanner` stays quiet, but it now points to `/play/` and uses the language of an invitation rather than a mysterious aside.

Suggested copy:

- Lead: "Huzbi stepped out and left the door open."
- Link: "Play the room."
- Note: "A small game, if you want it."

The exact words are builder's call within that meaning. The link is a real link and works with scripts off.

## The game route

`/play/` is a server page with metadata, a `<GameRoot />`, the existing screen-reader fallback and a `<noscript>` message with links back to the site. It does not render the site navbar or the thin banner.

The root layout still renders the CRT overlay and the global terminal shell. The game's own theme controls remain the source of truth for its palette.

## Pause and exit

### Opening the menu

**Huzbi's decision:** Esc opens a menu with "Resume" and "Exit".

- Esc opens the pause menu only when no other game overlay is open.
- If a dialogue, terminal prompt, project panel, journal or contact card is open, Esc closes that first, exactly as it does today.
- If the pause menu is open, Esc resumes.
- The game's input listener must not also receive the Esc that opens the menu.
- A visible **Menu** button sits in the game HUD during normal play, at least 44 by 44 CSS pixels, with an accessible name. It opens the same menu. This is the touch path.
- The Menu button is hidden while a dialogue, terminal prompt, project panel, journal or contact card is open. Those overlays already own the modal state and their own close controls, so there is never more than one focus trap or two competing Esc targets.
- The desktop controls hint gains "Esc: menu". The phone controls hint points at the Menu button.

Priority, in order:

1. Pause menu open: Esc closes it.
2. Any game panel or dialogue open: Esc closes that panel, not the game.
3. Nothing open: Esc opens the pause menu.

### The menu

- A modal panel in the game's pixel style, over a dimmed, static last frame.
- Title: "Paused."
- One line: "The room will wait."
- Primary button: "Resume".
- Secondary link: "Exit to the site", a real link to `/`.
- Small line: "Progress saves automatically." It may also show the current star count, but the saved format does not change.
- Focus moves to Resume, Tab stays inside the panel, Esc closes it, and focus returns to the game stage on close.
- Clicking the dimmed backdrop resumes. Clicking inside the panel does not.
- No confirmation on Exit. The save is already written.

### What pause means

- The game simulation stops stepping. The last frame stays visible under the panel.
- Game input is blocked, including walking, interacting and pointer taps.
- Music is suspended without changing the visitor's saved sound choice. Resuming restores music if sound was on.
- Reduced motion changes nothing about the menu's behavior, only its transitions.

### Exit

"Exit to the site" navigates to `/`. It does not clear progress. The browser back button has the same effect as Exit, and is equally safe.

## Implementation shape

- `Game.setPaused(value)` stops simulation steps without disposing input listeners. It must not reuse `Game.stop()`, which disposes input.
- `GameAudio.setPaused(value)` suspends and resumes the audio context and music without changing `enabled` or the saved `sound` value.
- `GameRoot` owns the pause state, the Esc priority rule and the menu button, and renders `PauseMenu`.
- `PauseMenu` owns the dialog semantics and the focus trap.
- `PlayDoor` owns the home-page save read and the play link.
- `JournalPage` gains an optional `showBanner` flag, default true, so the home page can omit the thin banner.
- `Navbar` hides on `/play/` and shows a "Play" tab everywhere else.

## Content and copy rules

- No em dashes in any new text.
- Use the game's real facts only. The star total comes from `starTotal()`, never a hard-coded number.
- The page is readable with JavaScript off.
- All new links point to real routes.

## Accessibility

- The Menu button and both menu actions are keyboard and touch operable.
- The pause panel has `role="dialog"`, `aria-modal="true"`, an accessible name and a focus trap.
- Focus is visible on every control.
- Esc is never the only way out.
- The home page keeps one `h1`, semantic landmarks and logical heading order.
- Contrast meets WCAG AA in all three themes.
- Reduced motion removes the menu's transition and keeps the game static while paused.

## Testing

### Unit and component

- `PauseMenu`: opens on Esc, closes on Esc and Resume, Exit link points to `/`, focus is trapped, "Progress saves automatically" is present.
- `PlayDoor`: no save shows "Play the room"; a saved star shows "Continue the room" and the count; server render does not read storage.
- `Navbar`: not rendered on `/play/`, rendered on `/`, Play tab active on `/play/`.
- `MysteryBanner`: links to `/play/`.
- Audio: pause suspends without changing the saved sound choice; resume restores when enabled.
- Game wrapper: paused steps do not move the player.

### Browser

- `/` has a real `h1`, a play link, the nav and no game canvas.
- Clicking the play link reaches `/play/` and the game starts.
- Esc opens the menu; Resume returns to play; Exit returns to `/`.
- A collected star survives Exit and reload, and the home page shows "Continue".
- The mobile Menu button opens the menu with no keyboard.
- Esc closes an open panel before it opens the menu.
- No console errors on the home page or the game.
- Existing journey, journal, theme and art tests pass with the game at `/play/`.

### Build

- `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm e2e` all pass.

## File map

- `src/app/page.tsx` (rewrite as the front page)
- `src/app/play/page.tsx` (new game route)
- `src/components/home/PlayDoor.tsx` (new)
- `src/components/home/PlayDoor.test.tsx` (new)
- `src/components/game/PauseMenu.tsx` (new)
- `src/components/game/PauseMenu.test.tsx` (new)
- `src/components/game/GameRoot.tsx` (pause state, Esc priority, Menu button)
- `src/components/game/game.css` (menu and HUD styles)
- `src/game/game.ts` (setPaused)
- `src/game/audio/audio.ts` (setPaused)
- `src/game/content/copy.ts` (pause copy)
- `src/components/navigation/Navbar.tsx` (hide on `/play/`, Play tab)
- `src/components/journal/MysteryBanner.tsx` (link to `/play/`)
- `src/components/journal/journalText.ts` (banner, not-found and error copy)
- `src/components/journal/JournalPage.tsx` (optional banner)
- `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/error.test.tsx` (links)
- `tests/e2e/*.spec.ts` (retarget the game route, add home and pause coverage)
- `README.md` (describe the site and the optional game)

## Risks

- **Esc conflict.** Existing panels already own Esc. The priority rule and capture-phase handling must be tested, not assumed.
- **Route move churn.** Every e2e helper and a few sr-only links assume `/` is the game. This is mechanical but easy to miss.
- **Audio pause.** Suspending audio must not change the saved sound choice or break browsers without Web Audio.
- **Hydration.** The save read must happen after mount and must not cause a layout jump.
- **Home page bloat.** The front page should stay a front door. It must not repeat the whole About or Projects page.

## What is left to the builder

- The exact home page composition, spacing and pixel-art arrangement within the journal system.
- The exact copy for the door section, within the facts and tone above.
- The visual treatment of the pause panel and Menu button.
- Whether the page transition into the game gets a short pixel fade, as long as reduced motion removes it.
- The exact wording of the 404 and error page links, as long as they offer the front page and the game.
