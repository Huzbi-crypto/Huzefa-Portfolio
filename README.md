# Huzbi's Room // Portfolio

> A small pixel-art game about a developer who stepped out for five minutes. **Huzefa Saifuddin (Huzbi)** is a FAST NU CS graduate, low-level systems and multi-agent tinkerer, and manga reader. The site is his 2 AM room, and the visitor is early.

This is not a normal portfolio with an interactive corner. `/` is the game. The project, About, GitHub and contact pages are pixel-art journal pages inside the same world, so a direct link still reads as a real page.

## What the game is

- **The room.** Walk around the desk and CRT monitor, the shelf, the cat, the sofa and the window. Read the note, poke the tea, pet the cat ten times, browse every spine on the shelf, or stay at the door until the door notices.
- **The dark.** The door that should not be there leads to a hall with five connected spaces: the hall, the workshop, the archive, the observatory and the nap room. A lantern reveals the dark; its light follows the pointer on desktop, the character on keyboard, and a dragging finger on touch.
- **Ten project exhibits.** Each project is a physical, playable thing rather than a card: a routing board, an AI portrait machine, a robot flow chart, tin cans on a string, a rude little terminal, a cookie jar, an ASCII frame, a particle field, a spinning wireframe and a compiler conveyor belt. Trying one earns its star and then shows the real project details from `src/data/projects.ts`.
- **Thirty-five stars.** Ten projects, thirteen shelf items and twelve silly discoveries. The counter stays on screen, the room window fills with stars, and the in-game journal hides what has not been found yet. Stars are derived from content, so a new project or book adds a star automatically.
- **A trail, not a checklist.** Five scraps of paper lead to the nap room. The ending unlocks by following the trail, never by collecting every star. Huzbi's line changes with the collection, and the "you found everything" version is reserved for a full run.
- **The joke.** The monster in the dark is a poster. It never chases, never jumps out and never moves. The big mystery ends with a nap, a manga on someone's face and a real way to say hi.

The full design is in `docs/superpowers/specs/2026-11-02-retro-game-portfolio-design.md`. The implementation plans and worker notes live beside it in `docs/superpowers/plans/`.

## Journal pages

These routes are semantic, server-rendered pages with the existing metadata. They work with JavaScript off and carry the SEO.

| Route | Content |
|---|---|
| `/` | The game |
| `/projects/` and `/projects/[slug]/` | Every project, in full, with its real repository and demo links |
| `/about/` | Bio, education, interests and focus |
| `/github/` | Real GitHub snapshot, languages, contribution wall and repositories |
| `/contact/` | Real contact details and a prepared email |
| unknown route / error | The same pixel system, not a default framework page |

Each page carries a quiet banner inviting the visitor back to the game. Reading a journal page does not award stars.

## Controls

- **Desktop:** arrow keys, WASD or click to walk. Click an object to walk to it and use it. Enter or Space uses the nearest object; Esc closes any panel. The journal opens with `J`.
- **Phone and touch:** tap to walk, tap an object to use it, drag to move the lantern in the dark.
- **Accessibility:** reduced-motion visitors get instant dialogue, still lighting and simple cuts. The game is playable by keyboard with visible focus. Sound is off until the visible toggle is turned on. There is no fast full-screen flashing and no way to lose or get stuck.

Themes (**Cozy CRT**, **Warm Apartment**, **Moonlit Terminal**), the CRT overlay and the terminal all stay in the pixel system. The terminal hides one command worth a star.

## Tech stack and deployment

- **Next.js 15** App Router, **React 19**, **TypeScript** strict mode, **Tailwind 3**, **pnpm 9**.
- **No new runtime dependencies** beyond the existing Next/React setup. The music is synthesized with Web Audio; the art and font are bundled with the site.
- **No backend and no accounts.** Progress lives in `localStorage` under `huzbi-game-v1`, and a missing or corrupt save simply starts a fresh visit.
- **Deployment is Vercel** (`vercel.json`), using the standard Next.js runtime. `next.config.ts` does not use a static export; the requirement is that nothing needs server-side state. The GitHub page reads a committed snapshot, not a live API.
- **Vitest** covers pure game logic, containers and rendering helpers. **Playwright** (Microsoft Edge channel) drives the real browser journey, including phone touch and reduced motion.

## Getting started

Prerequisites: Node.js 18+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Refreshing the GitHub snapshot

The GitHub page and the Observatory plaque read a committed snapshot, not a
live API. When Huzbi's numbers change, refresh that file from an authenticated
machine:

```bash
pnpm refresh:github
```

The script asks the authenticated `gh` CLI first (falling back to the REST API
with `GITHUB_TOKEN` or `GH_TOKEN`) for the profile, every public repository and
the number of starred repos, then rewrites `src/data/github-snapshot.json` with
today's date. If any request fails it prints the real error and leaves the old
snapshot in place. Nothing on the site makes a live GitHub request.

## Verification

```bash
pnpm test        # Vitest unit and integration tests
pnpm typecheck   # tsc --noEmit
pnpm build       # production Next.js build
pnpm e2e         # Playwright journey, journal and theme tests
```

`pnpm e2e` builds and starts the app on `http://127.0.0.1:3000` unless a server is already responding there, and runs in Microsoft Edge. The journey suite covers every star, the trail-only ending, the full-collection line, phone touch, reduced motion, console errors and frame-time budget.

Screenshots from the visual checks are written under `test-results/` (`checkpoint-1/`, `fix/`, `themes/`, `journal/`).

## Contact

- **Email**: [xhuzbi@proton.me](mailto:xhuzbi@proton.me)
- **GitHub**: [@Huzbi-crypto](https://github.com/Huzbi-crypto)
- **Twitter / X**: [@HuzbiC](https://twitter.com/HuzbiC)
- **LinkedIn**: [Huzefa Saifuddin](https://www.linkedin.com/in/huzefa-saifuddin-95720b241/)
- **MyAnimeList**: [profile/Huzbi](https://myanimelist.net/profile/Huzbi)

## License

MIT © [Huzefa Saifuddin](LICENSE)
