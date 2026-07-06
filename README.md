# Signalworks

[![CI](https://github.com/ctkrug/signalworks/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/signalworks/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A browser puzzle game about writing tiny assembly programs for in-game chips.
Route signals from input to output, satisfy the test cases, and golf your
cycle count down as low as it'll go — then share your score.

Think [TIS-100](https://en.wikipedia.org/wiki/TIS-100) or
[EXAPUNKS](<https://en.wikipedia.org/wiki/EXAPUNKS>), but free, in the
browser, and with nothing to install.

## Why

Assembly-golf puzzle games are a beloved niche, but they live behind a Steam
purchase and a desktop install. Signalworks is a real assembler and a real
cycle-accurate virtual machine — not a simplified "block coding" stand-in —
running entirely client-side, so anyone with a browser tab can solve a level
and share a score link in the time it takes to read this sentence.

## How it works

- **Write assembly.** Each level gives you one or more chips (nodes), a
  small instruction set (`MOV`, `ADD`, `SUB`, `JMP`, `JEZ`, `JNZ`, `NOP`,
  and I/O ports), and a set of registers.
- **Run it.** The virtual machine executes your program one cycle at a
  time, deterministically, so the same program always takes the same
  number of cycles.
- **Watch it.** A step debugger highlights the active instruction and live
  register values as signals travel across the board.
- **Golf it.** Once your program passes, the game reports your cycle count.
  Beat your own best, then copy a link that encodes your score to challenge
  someone else — no account, no server round-trip required.

## Playable now

- A single-pass assembler (`MOV`, `ADD`, `SUB`, `JMP`, `JEZ`, `JNZ`, `NOP`,
  labels, `IN`/`OUT` ports) with line-numbered, collected error reporting.
- A cycle-accurate CPU: one instruction per step, deterministic output,
  a documented step limit instead of a silent infinite loop.
- A step debugger: Run or Step through a program, watch the signal hop
  across the board, and see live `ACC`/`PC`/cycle/IO registers with the
  current instruction highlighted in the trace panel.
- The first puzzle, **Signal Passthrough** — route the value on `IN`
  straight to `OUT` — with PASS/FAIL reporting, a cycle count, and an
  expected-vs-actual diff on failure.
- Cycle-count golf scoring: your best cycle count for a level persists
  across reloads via `localStorage`.
- Synthesized WebAudio sound effects (tick/route/success/error/win —
  zero audio files) with a mute toggle that persists across reloads.

## Planned features

- More puzzle levels spanning arithmetic and conditional routing.
- A level-select screen showing pass/fail and best score per level.
- A shareable, backend-free score link.
- Broader accessibility and input passes (touch controls, full keyboard
  operability audit).

## Stack

TypeScript, the HTML Canvas API, and [Vite](https://vitejs.dev/) for a
static, dependency-light build with no backend. [Vitest](https://vitest.dev/)
covers the assembler, CPU, session, and scoring logic. The production build
is a single static `dist/` directory that can be hosted from any subpath.

## Getting started

```sh
npm install
npm run dev      # local dev server
npm test         # run the test suite
npm run build    # type-check + production build to dist/
```

## Status

Core VM and the first playable puzzle are done — see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the pieces fit
together, [`docs/VISION.md`](docs/VISION.md) for the full design, and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for what's left.

## License

MIT — see [`LICENSE`](LICENSE).
