# Huzbi's Room: Retro Pixel-Art Game Portfolio

Design document, 2026-11-02. Each decision is marked as **Huzbi's** (the site owner decided or approved it) or **builder's call** (left open).

## Intent

Today the site feels like a normal website with one unusual section: an "interactive" room on the homepage whose pixel art, animation and interactivity all fall short. Huzbi wants the whole site to be retro, pixel art and game-like.

This is not a site built to please recruiters. It is an experience for people curious enough to visit. It should have an element of mystery that makes them want to explore further, without ever being hard enough to make them give up. It should also make them laugh.

Huzbi's persona is chill, curious, nerdy and slightly lazy, and the site should sound like someone good at building things who can't be bothered to look corporate. The tone references are Hollow Knight, Skyrim and Sekiro: dropped somewhere unexplained, small discoveries, the pull of "what's behind that?" Huzbi hasn't played pixel-art games, so these references are about feeling and not graphics.

## The experience

### The story

**The mystery is "where did Huzbi go?"**

The visitor arrives in Huzbi's room at 2 AM and plays as themselves, the visitor. Huzbi isn't there. A note on the desk says something like "Back in 5 mins. Don't touch anything." The tea has gone cold. There is a door in the room that shouldn't be there. Touching everything is the point.

### Part 1: The room (warm and safe)

A top-down room the visitor walks around, with the warmth of sketch B in the approved mockups. It holds the desk and CRT monitor, the bookshelf, the cat, the sofa and a window onto the night sky.

- The monitor opens the existing `huzbi@room` terminal.
- The shelf holds the manga and books, each with Huzbi's opinion.
- The extra door is noticeable but never forced. Dialogue offers a choice, in the spirit of `> OPEN IT` / `STAY`.

### Part 2: The dark (mysterious)

Opening the door leads to a dark world, in the style of sketch C from the mockups: nearly black, and the visitor's light reveals what's there. Lit objects such as a monitor can glow by themselves to draw the eye.

This world holds what Huzbi left behind: the projects as physical objects, notes, old experiments and Huzbi's story. Each discovery hints at where Huzbi went. The tone is mysterious and playful, **not scary**.

**The monster gag (Huzbi's decision):** somewhere in the dark, the visitor spots red eyes glowing in the distance. Getting closer reveals it's only Huzbi's avatar poster, based on `public/assets/cwnilmm1twqb1.jpeg`, a green monster with red eyes. This is a single, funny fake-out, not a threat, and it never chases or jumps out. It may be worth a star and a dry remark.

The world is split into a small number of connected spaces that the visitor can move between, with the room always reachable. The GitHub repo and star data belong here as a constellation or map. Exact spaces and layout are the builder's call, as long as every piece of real content below has a home.

### Part 3: The ending (a joke)

After all the build-up, the visitor finds Huzbi asleep on a sofa with a manga on their face. Huzbi wakes up and says something like "...wait, you found everything? Nobody does that." Then they offer their real contact details and a way to say hi. The big mystery turns out to be a lazy guy taking a nap.

**Reaching the ending (builder's call within this rule):** the ending must not require collecting every star, because that would make giving up the sensible choice. It unlocks by following a short trail of clues through the dark. Huzbi's line changes depending on the star count, with the "you found everything" line reserved for a full collection and a line teasing lazier visitors otherwise. Visitors can keep exploring afterwards and can come back for the full-collection line.

### Stars (the game layer)

**Everything the visitor discovers earns a star.**

- Each project is a physical thing to find. Inspecting it shows the real project details and earns a star.
- Each manga or book on the shelf shows Huzbi's opinion and earns a star.
- Silly things earn stars too, such as petting the cat ten times or reading a note clearly not meant for anyone. These supply most of the laughs.
- The terminal hides at least one secret worth a star.

Each star lights up in the room's window, so the night sky fills in as the visitor explores. "Stars" deliberately echoes GitHub stars.

A small star counter stays on screen. An in-game journal lists everything found so far and hides what hasn't been found. Stars and the total are computed from the content data, so adding a project adds a star.

### Staying easy (Huzbi's requirement)

The visitor must always have something obvious to do next.

- There are no hard puzzles, timers, enemies, health, or ways to lose or get stuck. The worst outcome is missing something.
- The visitor can always return to the room.
- A visitor who has been idle or lost gets a gentle nudge. For example, the cat wanders toward something unfound (builder's call on the mechanism).
- Controls are learnable in seconds with no tutorial wall.

### Direct links and journal pages (Huzbi's decision)

Each section keeps its normal URL (`/projects/`, `/projects/[slug]/`, `/about/`, `/github/`, `/contact/`). Someone arriving by direct link sees that content straight away as a **pixel-art journal page**, not the game, with a **non-distracting banner** inviting them in, along the lines of "click here to resolve the mystery". The exact wording is the builder's call.

- `/` is the game.
- Journal pages use the same visual system as the game and must read as part of the same world.
- Journal pages show their content in full, since someone followed a link to read it, whereas the in-game journal hides what hasn't been found.
- Reading a journal page does not award stars; stars come from discovering things in the world (builder's call).
- The not-found and error pages get the same treatment.

## Controls (Huzbi's decision)

- **Desktop:** both arrow keys and mouse are fully supported, so people can use whichever they prefer. WASD also works. Clicking somewhere walks there; clicking an object walks to it and interacts.
- **Phones and touch:** tap to walk.
- **In the dark, mouse:** the cursor is the light. Clicking walks and interacts as above.
- **In the dark, keyboard:** the light stays around the character as they walk.
- **In the dark, touch:** drag a finger to move the light, tap to walk or interact.
- Interacting by keyboard has an obvious key (Enter or Space), and Esc closes any open panel.

## Look and feel

- **Real pixel art:** original art on a low-resolution grid, scaled by whole numbers with no smoothing. Everything aligns to that pixel grid. No gradients, blurred glows, or sub-pixel movement in the game world; light and shadow use dithering or hard steps, as in the mockups.
- **One limited palette** across the site.
- **A proper pixel font.** The existing `--font-pixel` token actually points to Courier New. Use an openly licensed font that is bundled with the site and stays readable at journal-page body-text size.
- **The current room gets redrawn, not patched.** It is built from hundreds of styled `div`s and SVG shapes, which is why it can't look correct.
- **Rounded cards, pill badges, Lucide icons and the system font all go.** Replace them with pixel UI: hard-edged panels, dialogue boxes and pixel icons.
- **Animation is part of the art:** walk cycles, an idle cat, a flickering monitor, a flickering lantern, a typing effect on dialogue, and game-style transitions between places and pages. There are currently no page transitions at all.
- **Sound:** chiptune music and sound effects, **off until the visitor turns them on**. A visible toggle remembers the choice.
- **Color themes stay**, redrawn to suit the new art. Cozy CRT, Warm Apartment and Moonlit Terminal may become palette variants of the world.
- **The CRT overlay toggle stays.**
- **A pixel version of Huzbi** exists for the ending (Huzbi's decision): a human in a hoodie and headphones with messy dark hair, as in the current `src/components/world/Character.tsx`. The monster artwork at `public/assets/cwnilmm1twqb1.jpeg` is not a likeness. It is the source for the poster in the monster gag and remains the social share image.

## Project exhibits (Huzbi's decision, after playing Checkpoint 1)

Huzbi liked how the routing board shows a broken network link and leads to the repo, and asked for the same treatment for every project: **you see the idea working before you read about it.**

| Project id | Exhibit | What the visitor does | The payoff |
|---|---|---|---|
| `routing-sim` | Board of tiny routers (built) | Inspects it | A link is broken, so a packet takes the long way round |
| `ai-anime` | Rickety machine with a canvas | Pulls the lever; dithered noise resolves into a pixel portrait | Every roll comes out slightly wrong, like six fingers |
| `lang-projects` | Tiny robots passing notes around a flow chart | Hands one a note and watches it travel | One robot is stuck in a loop, consulting itself |
| `speech-translator` | Two tin cans on a string | Speaks into one; sound bars travel down the string and a bubble comes out in other words | Something is always lost in translation |
| `term-exp` | Tiny terminal on a stool | Types at a small working prompt | It's rude about the visitor's commands |
| `read-cookies` | Cookie jar with a padlock | Unlocks it; cookies are labeled like browser sessions | "Please stop eating the evidence" |
| `ascii-art-tui` | Framed picture of the cat | The lantern turns whatever it lights into ASCII characters | Only the lit part converts |
| `creative-coding` | Field of drifting particles | They're pulled toward the lantern and swirl | Pure toy; links to the live demo |
| `3d-renderer` | Old screen with a spinning wireframe shape | Grabs it to spin it, using real 3D math | Parts occasionally pop through each other |
| `compiler-project` | Small factory conveyor belt | Drops in a line of code; it passes through stations and comes out as assembly | One station jams now and then with a fussy error |

Every exhibit:

- Takes a few seconds to try and can't be failed.
- Earns the project's star when tried, then shows a short description in Huzbi's voice and a link to the repo, plus a live demo where `demoUrl` exists.
- Is a playful illustration of the idea, not a claim about what the project does. Factual text comes from `src/data/projects.ts`, and unconfirmed claims go to Huzbi's writing review.
- Works by keyboard, mouse and touch, and has a calm version under reduced motion that still earns the star.

## Content

Real content is the existing data and must stay accurate:

| Content | Source | Home in the game |
|---|---|---|
| 10 projects | `src/data/projects.ts` | Physical objects in the dark, plus journal pages |
| Manga and books | `readingList` in `src/data/personal.ts` | Shelf in the room |
| Bio, education, interests, focus | `src/data/personal.ts`, `src/app/about/page.tsx` | Notes and story in the dark, plus journal page |
| GitHub stats, repos, contribution wall | `src/data/github-*.json`, `src/hooks/useGitHubData.ts`, `src/components/github/` | Constellation or map in the dark, plus journal page |
| Contact and socials | `src/data/personal.ts`, `src/app/contact/page.tsx` | The ending, plus journal page |
| Terminal commands | `src/components/terminal/TerminalModal.tsx` | CRT monitor; add secrets |

**Writing (Huzbi's decision):** jokes, notes, dialogue and manga opinions are drafted in Huzbi's voice from what's on the site, and Huzbi edits them. All of this text must live in one easily edited place. Existing manga notes are good and should be reused.

**Existing project and About text gets rewritten in Huzbi's voice (Huzbi's decision)**, because lines like "A comprehensive Python simulator" clash with the persona. Keep the facts. Claims that can't be confirmed from the repo, such as "computed at 60 FPS" or "performance benchmarks", are flagged for Huzbi to check in the writing review and are not silently reworded or dropped.

- Never invent facts about Huzbi, such as jobs, dates or achievements. Jokes are fine; false biography is not.
- Never use corporate voice.

## Constraints

- **Stack:** stay on the existing Next.js 15, React 19, TypeScript, Tailwind and pnpm setup, deployed to Vercel. Adding a dependency needs a good reason. Choice of canvas, DOM or a mix is the builder's call, but the result must look like real pixel art and run smoothly.
- **No backend or accounts.** Progress lives in the visitor's browser. If storage is unavailable (private browsing), the game still works for that visit. The existing code handles this in `AppContext`.
- **"A way to say hi" uses no server,** for example a prepared email to the existing address.
- **Original art and music only.** No assets taken from Hollow Knight, Skyrim, Sekiro or any manga, including cover art. Shelf volumes can be colored spines with titles. Any font or library must have a license that allows this use.
- **Accessibility:**
  - People with reduced-motion set get a calmer version: no flicker, no typing effect, simple cuts.
  - No fast full-screen flashing for anyone.
  - The whole game is playable by keyboard, with visible focus in menus and panels.
  - Journal pages are real, semantic pages that work without JavaScript and for screen readers. They carry the SEO, and the existing metadata stays.
  - In-game text a visitor discovers is also reachable in the journal.
- **Responsive:** works on phones and desktop. The world must stay legible on a phone; layout approach is the builder's call.

## Goals

1. Within seconds of landing, a visitor knows they're in a game, and walks around without instructions.
2. A curious visitor sees the door and wants to open it.
3. The dark feels mysterious, and each find gives a small hit of discovery.
4. At least a few moments make someone laugh out loud.
5. The ending lands as a joke and leads naturally to saying hi.
6. No page on the site still feels like a normal website.

## Non-goals

- Pleasing recruiters or skimmers. Direct-link journal pages are the only accommodation, and they stay in the same world.
- Accounts, leaderboards, multiplayer, or any server-side state.
- Combat or difficulty.
- A long story. Comedy and curiosity carry it, not lore.

## Anti-goals (a failure even if it technically works)

- Fake pixel art: blurry scaling, mixed pixel sizes, gradients, a "pixel" look that's really CSS shapes.
- Visitors giving up because they don't know what to do, or real content being stuck behind something hard.
- Horror: creepy instead of intriguing, or any jump scare.
- Sound playing without being asked.
- Corporate voice, or invented facts about Huzbi.
- Leftover normal-website pieces, such as a game homepage with ordinary cards on the other pages.

## Review checkpoints and delivery (Huzbi's decisions)

Work stays on the working branch and does not replace the live site until Huzbi approves it.

1. **First playable slice:** the room, walking, the door and the first seconds in the dark, in near-final art. Huzbi approves this before the rest of the art is produced. Art was the main failure of the current version, so the plan must stop here.
2. **Before launch:** the full game, plus all writing for Huzbi to edit.

**Every individual change is committed and pushed as it's made,** not batched by milestone or module. Plans and worker instructions must require this.

## Left to the builder

The rendering approach, code architecture, sprite pipeline, engine structure, map layouts, number of dark spaces, star thresholds, hint mechanism, font choice, palette values, transition styles, music composition, and the first draft of all writing.

The approved mockups in `2026-11-02-retro-game-portfolio-mockups/` are throwaway references for mood: sketch B (the room) followed by sketch C (the dark). Sketch A was not chosen. They are not code to keep and not final art.

## Verification notes

The repo has no automated test setup today. `pnpm build` must pass. The plan must define how the game logic (stars, saving, ending rules) and the visual results are checked, including walking through the full journey in a real browser on desktop and at phone size.

Note: the README says the site uses Next.js static export, but `next.config.ts` doesn't set `output: 'export'`. The requirement is simply that no server logic is needed.
