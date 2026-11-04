# Claims to check

These are claims in the rewritten project and About text that I couldn't confirm from this repository. Most need a look at the project's own source, README, live deployment or analytics; a few are numbers that already disagree with the GitHub snapshot in `src/data/github-snapshot.json` (taken 2026-09-19).

Nothing here was silently dropped. Where the rewrite changed the wording, the original is quoted next to it. Feature statements carried over from the existing data are assumed accurate; this list concentrates on performance, scale, deployment status and quality claims that the data cannot show.

## Project claims

| Project | Claim (current wording) | Original wording | Why it needs checking |
|---|---|---|---|
| `routing-sim` | "whether the routes converge again in real time" | "packet convergence in real time" | There is no timing data or benchmark in this repo. Confirm that convergence is genuinely real-time rather than step-by-step. |
| `routing-sim` | "with performance benchmarks for both" | "Side-by-side performance benchmarks of Link-State vs Distance-Vector" | The benchmark results are not in the portfolio repo. Confirm the benchmarks exist and say what was measured. |
| `routing-sim` | "with the node matrix drawn out so I can see what changed" | "Graph-based SPF calculations with visual node matrix" | Visual/UI claim. Confirm the project actually draws a node matrix. |
| `ai-anime` | "Over 6 GitHub stars" | "Over 6 GitHub stars" | The snapshot lists exactly 6 stars, so "over 6" reads as 7 or more. Say 6, or update the number if it has grown since 2026-09-19. |
| `ai-anime` | "still actively deployed on Vercel" | "actively deployed on Vercel" | Deployment status can't be confirmed from the repo. Check the live demo URL. |
| `ai-anime` | "inspect high-resolution artwork" | "inspect generated high-resolution artworks" | The output resolution isn't recorded. Confirm what the diffusion endpoints return. |
| `ai-anime` | "with real-time feedback as it comes back" | "with real-time feedback" | Latency claim. Confirm it is real-time rather than simply asynchronous. |
| `ai-anime` | "A prompt suggestion engine with tag completion" | "Seamless prompt suggestion engine with tag completion" | The feature is assumed; "seamless" was dropped as unverifiable marketing. Confirm the suggestion engine and tag completion exist. |
| `ai-anime` | "Images cache on the client and open in a gallery viewer" | "Client-side image caching and gallery viewer" | Implementation claim. Confirm both in the project source. |
| `lang-projects` | "Multi-node state graph architectures built with LangGraph" | "Multi-node state graph architectures using LangGraph" | Implementation claim. Confirm the graphs are multi-node and built with LangGraph. |
| `lang-projects` | "Custom tool-calling integrations, plus fallback handling" | "Custom tool calling integrations and fallback handling" | Implementation claim. Confirm both the tool integrations and the fallbacks. |
| `lang-projects` | "RAG evaluation with dense embeddings and vector rerankers" | "RAG evaluation using dense embeddings and vector rerankers" | Implementation claim. Confirm the evaluation uses dense embeddings and rerankers. |
| `speech-translator` | "A real-time speech-to-speech and transcription pipeline" | "Real-time multilingual speech-to-speech and audio transcription pipeline" | Real-time claim with no latency data. The "multilingual" fact is still carried by the highlight below. |
| `speech-translator` | "Low-latency voice capture" | "Low-latency voice capture with threshold-based silence detection" | No latency figures. Confirm "low-latency" is fair, or give a number. |
| `speech-translator` | "tries to preserve phonetics across languages" | "Multilingual neural translation with cross-language phonetic preservation" | Behaviour/quality claim. Confirm this is implemented and observable. |
| `term-exp` | "Deployed on Vercel as a playable web utility" | "Deployed on Vercel as a playable web utility" | Deployment status. Check the live demo URL. |
| `term-exp` | "Simulated CRT scanlines and phosphor decay" | "Simulated hardware CRT scanlines and phosphor decay" | Implementation claim. "Hardware" was dropped because the simulation runs in the browser; confirm scanlines and decay are both present. |
| `read-cookies` | "decrypts the AES-GCM and DPAPI-protected value blobs" | "decrypts AES-GCM / DPAPI protected value blobs" | Implementation claim. Confirm both decryption paths work. |
| `read-cookies` | "Extracts the cryptographic master key" | "Cryptographic master key extraction" | Implementation claim. Confirm the master-key extraction. |
| `ascii-art-tui` | "Character ramp presets for high contrast, retro matrix and block symbols, plus your own" | "Custom character ramp presets (high-contrast, retro matrix, block symbols)" | "Plus your own" is a custom-ramp claim. Confirm users can supply their own ramps. |
| `ascii-art-tui` | "Renders straight to the terminal in 24-bit TrueColor" | "Direct terminal rendering with 24-bit TrueColor output" | Implementation claim. Confirm the TrueColor output. |
| `creative-coding` | "computed at 60 FPS" | "computed at 60 FPS" | Exact performance number with no benchmark in the repo. Measure it or soften it. |
| `creative-coding` | "a fluid velocity simulation" | "fluid velocity simulation" | Implementation claim. Confirm it is a velocity simulation rather than a force-field approximation. |
| `3d-renderer` | "Mesh rotation and translation happen in real time" | "Real-time mesh rotation, translation, and perspective projection" | Performance claim with no frame-time data. |
| `3d-renderer` | "straight into a framebuffer" | "polygon rasterization directly into framebuffers" | Implementation claim. Confirm the rasterizer writes into a framebuffer. |
| `compiler-project` | "including the conflicts I had to resolve to get it parsing" | "Context-free grammar specification with conflict resolution" | Coursework detail. Confirm conflict resolution was part of the grammar work. |

## About copy

These are biography facts carried over from `src/data/personal.ts`, not invented here. They can't be confirmed from the code, so they get a quick read-through rather than a technical check.

| Location | Claim (current wording) | Original wording |
|---|---|---|
| About metadata | "a Karachi-based FAST NU computer science graduate building systems, agents and cozy retro experiments" | "a FAST NU computer science graduate building systems, agents and cozy retro experiments" |
| About story | "I graduated with a Bachelor's in Computer Science from FAST National University (NUCES) in Karachi." | "I graduated with a Bachelor's in Computer Science from FAST National University (NUCES) in Karachi." |
| About story | "Current coordinates: Karachi, Pakistan." | "Current coordinates: Karachi, Pakistan." |

## Numbers that disagree with the GitHub snapshot

The `stars` fields were deliberately left unchanged by this task. They disagree with the snapshot for four projects, and `ai-anime` is the one the prose calls out.

| Project | `stars` in `src/data/projects.ts` | Snapshot, 2026-09-19 | Note |
|---|---|---|---|
| `ai-anime` | 6 | 6 | The highlight says "Over 6", which is not true at this snapshot. |
| `speech-translator` | 0 | 1 | Update the field if the snapshot is authoritative. |
| `term-exp` | 0 | 2 | Update the field if the snapshot is authoritative. |
| `read-cookies` | 0 | 1 | Update the field if the snapshot is authoritative. |
| `creative-coding` | 0 | 1 | Update the field if the snapshot is authoritative. |

`routing-sim` (1), `lang-projects` (0), `ascii-art-tui` (1), `3d-renderer` (0) and `compiler-project` (1) match the snapshot.

## Wording removed on purpose

These phrases were dropped as unverifiable or corporate-sounding. The underlying fact or feature is still in the text wherever it was a real fact.

- "A comprehensive Python simulator" (`routing-sim` description): "comprehensive" is vague puffery; the simulator itself is still described.
- "Seamless prompt suggestion engine" (`ai-anime` highlight): "seamless" is a quality claim; the prompt suggestion engine and tag completion are kept.
- "Simulated hardware CRT scanlines" (`term-exp` highlight): the simulation is in the browser, so "hardware" was misleading.
