# Signalworks

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

## Planned features

- A minimal, documented instruction set and single-pass assembler with
  line-numbered error reporting.
- A cycle-accurate CPU core with deterministic step/run/reset semantics.
- A visual step debugger: active-instruction highlighting, live registers,
  and animated signal traces between chips.
- A level format that's pure data, so new puzzles don't require new code.
- Cycle-count golf scoring with a shareable, self-contained score link.
- Synthesized WebAudio sound effects (no audio files) with a persistent
  mute toggle.
- A fully responsive board and editor, playable on desktop or phone.

## Stack

TypeScript, the HTML Canvas API, and [Vite](https://vitejs.dev/) for a
static, dependency-light build with no backend. [Vitest](https://vitest.dev/)
covers the assembler and CPU core. The production build is a single static
`dist/` directory that can be hosted from any subpath.

## Status

Early scope-and-plan stage. See [`docs/VISION.md`](docs/VISION.md) for the
full design and [`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## License

MIT — see [`LICENSE`](LICENSE).
