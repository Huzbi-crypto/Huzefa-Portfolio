# Claims to check

Updated 2026-11-05. Every project description and highlight in `src/data/projects.ts` was rewritten from that project's GitHub README. Taglines were left exactly as they were. READMEs were read through the GitHub API (`gh api repos/Huzbi-crypto/<repo>/readme`), and every default branch turned out to be `main`; `SpeechTranslator` was checked through the API after a raw `main`/`master` guess returned 404.

## Unconfirmed claims still in the current text

These are the bits I could not confirm from the README. Most are in taglines, which were deliberately left untouched. A few are soft inferences in the new copy. Nothing here should be treated as checked just because the description around it is now accurate.

| Project | Claim (current wording) | Why it needs checking |
|---|---|---|
| `routing-sim` | Tagline: "kill a link, change a weight" | The README confirms a dynamic topology, but not link-failure or weight-editing controls specifically. |
| `routing-sim` | "watch the packets take the long way round" | The README confirms PyQt6 visualisation, not that individual packet paths are drawn. |
| `ai-anime` | Tagline: "enough knobs to keep tweaking the result" | The README describes one prompt and four images; it lists no guidance or tuning controls. |
| `ai-anime` | "the API key lives in an environment file" | Inferred from `dotenv-webpack`; the README says "secure ways to store the API key" without naming `.env`. |
| `lang-projects` | Tagline: "multi-agent workflows that mostly behave" | The README calls the repo a playground for autonomous multi-agent systems; it does not list a multi-agent workflow that currently exists. |
| `speech-translator` | Tagline: "real-time speech-to-speech" | The README describes record, translate, play, exit. It makes no latency or streaming claim. |
| `term-exp` | Tagline: "entirely unnecessary CRT scanlines" | The README describes commands and a terminal-style site; it does not mention scanlines. |
| `read-cookies` | Tagline: "opens locked browser cookie and session-storage databases" | The README reads Firefox `cookies.sqlite`; it says nothing about locked databases or session storage. |
| `read-cookies` | Title: "Read Cookies SQLite Forensic Tool" | The README calls it "a basic program"; "forensic" is framing, not a described feature. |
| `ascii-art-tui` | Tagline: "custom dithering" | The README describes character mapping, TrueColor and grayscale. Dithering is not mentioned. |
| `creative-coding` | Tagline: "particles chase the cursor, gravity does its thing, and the noise field never quite settles" | The README lists only the Constellation Effect and Image Warping Effect; no particles, gravity or noise field. |
| `3d-renderer` | Tagline: "3D matrix math, transformations and wireframe projection, written from scratch" | The README's entire text is one sentence about making a 3D renderer in Java. |
| `compiler-project` | Tagline: "syntax tree and assembly output" | The README confirms lexical, syntax and semantic analysis plus code generation, and names `result.mp`; it does not say "syntax tree" or "assembly". |

## Claims removed because the README contradicts them

These were in the old descriptions, highlights or stacks. They are gone from the site because the README says something different, not because they were quietly dropped.

| Project | Removed claim | What the README says instead |
|---|---|---|
| `routing-sim` | Dijkstra's SPF and Bellman-Ford distance vector; link-state vs distance-vector benchmarks; "visual node matrix" | The algorithms are Dijkstra, Floyd-Warshall, Q-learning and deep Q-learning. The README lists performance metrics tracking and PyQt6 visualisation, but no Bellman-Ford, no algorithm-vs-algorithm benchmark and no node matrix. |
| `ai-anime` | Open AI diffusion endpoints, guidance parameters, high-resolution artwork, real-time feedback, prompt suggestion with tag completion, client-side cache and gallery viewer, async web workers | The README describes a Hugging Face API call to FLUX.1-dev, one prompt producing four images, a Webpack build, a live site and occasional failed resource fetches. None of the other features are listed. |
| `lang-projects` | Multi-node state graphs, custom tool-calling with fallbacks, RAG evaluation with dense embeddings and vector rerankers | The README lists `LangChain-Rag` (a standard RAG system) and `LangGraph-Reflection-Agent` (self-critique and refinement). |
| `speech-translator` | Whisper ASR, voice activity detection, spoken dialects, low latency, configurable output devices, cross-language phonetic preservation | The README uses `speech_recognition`, `googletrans`, `gTTS` and `playsound` in a one-shot script that records, translates and plays. |
| `term-exp` | Simulated filesystem, banner art, scrolling history, keyboard sounds, `cat`/`ls`/`clear`/`theme`/`secret` commands, CRT scanlines and phosphor decay | The README describes a terminal-style site, a `help` command, some secret commands, opening `index.html`, and themes plus more interactive commands on the bucket list. |
| `read-cookies` | Chromium profiles, unlocking the SQLite master cookie table, AES-GCM/DPAPI decryption, PyCryptodome, master-key extraction, CSV reports, parsing locked files directly | The README reads Firefox `cookies.sqlite` by website name, searches all Firefox profile folders on Windows, prints the cookies and saves JSON. Decoding cookies is an unchecked future item. |
| `ascii-art-tui` | Custom character-ramp presets, user-supplied ramps, Curses/TUI, dithering | The README uses Pillow and Rich, supports 24-bit TrueColor, compensates for character aspect ratio and offers grayscale. Custom palettes are an unchecked roadmap item. |
| `creative-coding` | HTML5 Canvas particles, Newtonian physics, gravity, collisions, noise fields, cursor ripples, fluid velocity simulation, 60 FPS | The README lists two projects: Constellation Effect and Image Warping Effect, collected into one site. |
| `3d-renderer` | 4x4 matrices, perspective projection, vertex shading, polygon rasterization, framebuffer, real-time mesh rotation, hand-written matrix math, Z-buffering | The README says only: "A practice on making a 3D renderer in Java." The stack was reduced to Java and 3D rendering. If those details are real, they need Huzbi to confirm them from the source before they go back on the site. |
| `compiler-project` | Domain-specific procedural language, intermediate representation, target assembly, Lex/Flex, Yacc/Bison, AST, grammar conflict resolution, symbol-table scoping, type validation | The README describes a Cshort compiler for TinyC, written in C, doing lexical, syntax and semantic analysis then code generation from `.cshort` to `result.mp`, built with gcc from `Analex.c`, `main.c`, `Anasynt.c`, `Anasem.c`, `CodeGenerator.c` and `TabIdent.c`. Syntax analysis is confirmed; a generated syntax tree and assembly output are not named. |

## Tech-stack and language corrections

- `routing-sim`: replaced Bellman-Ford and "Graph Algorithms" with Dijkstra, Floyd-Warshall, Q-learning, deep Q-learning and PyQt6.
- `ai-anime`: replaced REST APIs, "Diffusion Models", Tailwind and Async Web Workers with Webpack, the Hugging Face inference API and FLUX.1-dev.
- `lang-projects`: dropped Vector DBs, dense embeddings and rerankers; kept LangChain, LangGraph, RAG and agents. `Jupyter Notebook` was removed from `languages` because the repository language breakdown is Python only and the tree contains no notebooks.
- `speech-translator`: replaced Whisper with `speech_recognition`, `googletrans`, `gTTS` and `playsound`.
- `term-exp`: replaced generic jQuery, CRT scanlines, "Virtual CLI" and DOM Audio with Tailwind CSS and jQuery Terminal, which the repo description names.
- `read-cookies`: replaced Windows DPAPI, PyCryptodome and "System Forensics" with SQLite3, Firefox profiles and JSON.
- `ascii-art-tui`: replaced ANSI colour codes, Curses and dithering with Pillow, Rich and argparse.
- `creative-coding`: replaced Canvas, vector math and physics simulation with HTML, CSS and JavaScript.
- `3d-renderer`: reduced to Java and 3D rendering.
- `compiler-project`: replaced Lex/Flex, Yacc/Bison, AST and Assembly with lexical analysis, parsing, semantic analysis, code generation and GCC.

## Claims the README now confirms

These were checked and removed from the list rather than left as open questions:

- `routing-sim`: changing topology, Dijkstra/Floyd-Warshall/Q-learning/deep Q-learning, PyQt6 visualisation, performance metrics, CLI options, screenshot fallback.
- `ai-anime`: Hugging Face API, FLUX.1-dev, four images per prompt, Webpack/dotenv-webpack, live site, generation can fail.
- `lang-projects`: `LangChain-Rag` and `LangGraph-Reflection-Agent`.
- `speech-translator`: the four-package record/translate/play pipeline and the one-shot workflow.
- `term-exp`: `help`, secret commands, clone-and-open-`index.html`, the themes/interactive-commands bucket list.
- `read-cookies`: Firefox `cookies.sqlite`, automatic profile-folder search on Windows, JSON output.
- `ascii-art-tui`: PNG/JPG/WebP input, Pillow + Rich, 24-bit TrueColor, aspect-ratio correction, grayscale mode, importable converter and renderer.
- `creative-coding`: the Constellation and Image Warping effects and the single-site build.
- `compiler-project`: lexical, syntax and semantic analysis, code generation, `.cshort` to `result.mp`, the gcc build file list.
- `3d-renderer`: Java and the practice-project purpose.

## About copy

The About page's project cards were brought in line with the README rewrites on 2026-11-05. The old "Dijkstra SPF and Bellman-Ford", "Flex/Bison and assembly output", "Whisper speech-to-speech" and "prompt-driven diffusion" wording is gone; the cards now name the routing algorithms, the hand-written `.cshort` compiler pipeline, the LangChain/LangGraph projects, the speech translator's actual job and FLUX.1-dev. The old "low-latency networking" current-focus line also became "Dynamic routing simulations and network algorithms", because no project README carries a latency claim. The statements below are biography or personal interests that the project repos can't confirm; they were carried over rather than invented.

| Location | Claim (current wording) | Why it still needs checking |
|---|---|---|
| About metadata | "a Karachi-based FAST NU computer science graduate building systems, agents and cozy retro experiments" | Biography. Not confirmable from the repos. |
| About story | "I graduated with a Bachelor's in Computer Science from FAST National University (NUCES) in Karachi." | Biography. Not confirmable from the repos. |
| About story | "Current coordinates: Karachi, Pakistan." | Biography. Not confirmable from the repos. |
| Low-level & systems card | "OS internals in C and Python" | Personal interest; there is no OS project in the portfolio repos to check it against. |

## Numbers that disagree with the GitHub snapshot

The `stars` fields were deliberately left unchanged by this task. They disagree with the snapshot for five projects. The old `ai-anime` prose said "Over 6 GitHub stars"; that claim was removed in this rewrite, but the field still says 6.

| Project | `stars` in `src/data/projects.ts` | Snapshot, 2026-09-19 | Note |
|---|---|---|---|
| `ai-anime` | 6 | 6 | The old "Over 6" highlight is gone. The field stays 6. |
| `speech-translator` | 0 | 1 | Update the field if the snapshot is authoritative. |
| `term-exp` | 0 | 2 | Update the field if the snapshot is authoritative. |
| `read-cookies` | 0 | 1 | Update the field if the snapshot is authoritative. |
| `creative-coding` | 0 | 1 | Update the field if the snapshot is authoritative. |

`routing-sim` (1), `lang-projects` (0), `ascii-art-tui` (1), `3d-renderer` (0) and `compiler-project` (1) match the snapshot.
