# Signalworks

**▶ Live demo — [apps.charliekrug.com/signalworks](https://apps.charliekrug.com/signalworks/)**

[![CI](https://github.com/ctkrug/signalworks/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/signalworks/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Write assembly, route signals, golf your cycles.

Signalworks is a browser puzzle game for people who love
[TIS-100](https://en.wikipedia.org/wiki/TIS-100) and
[EXAPUNKS](https://en.wikipedia.org/wiki/EXAPUNKS): you program a tiny chip in
a small assembly language to move a stream of numbers from an `IN` port to an
`OUT` port, pass the test case, then race to solve it in fewer cycles. No
account, no install, no Steam purchase. Open a tab and start writing code.

## Try a level in ten seconds

The first puzzle hands you one value on `IN` and asks you to route it to `OUT`.
The whole program is one instruction:

```asm
MOV IN OUT
```

A few puzzles later you are writing loops. "Running Total" reads a stream and
writes the cumulative sum after each value. The trick is keeping the total in
`ACC` and only ever adding to it:

```asm
loop:
  ADD IN       ; ACC += the next input value
  MOV ACC OUT  ; emit the running total so far
  JMP loop     ; the program counter also wraps past the last line on its own
```

Input `[2, 3, 4]` produces output `[2, 5, 9]` in 8 cycles, which matches this
level's documented minimum. Solutions that read into `ACC` with a separate
`MOV` first, or leave a stray instruction in the loop, run longer. Closing that
gap is the whole game.

## How it works

- **Write assembly.** A single-accumulator instruction set: `MOV`, `ADD`,
  `SUB`, `JMP`, `JEZ` (jump if zero), `JNZ` (jump if not zero), `NOP`, labels,
  and the `IN` / `OUT` ports. The assembler reports every error at once, each
  tied to its source line.
- **Run it deterministically.** A cycle-accurate virtual machine executes one
  instruction per step, so the same program always takes the same number of
  cycles. A documented step limit ends a runaway loop instead of hanging.
- **Watch the signal move.** Run or single-step your program and watch the
  value hop `IN` to chip to `OUT` on the board while `ACC`, `PC`, the cycle
  count, and the I/O ports update live, with the active instruction highlighted
  in the trace panel.
- **Golf your score.** When your program passes, the win screen shows your
  cycle count and your best. Beat it, then copy a link that encodes the score
  and hand it to someone else as a challenge. The link carries everything;
  there is no server.

## What is in the box

- A single-pass assembler with labels, `IN` / `OUT` ports, and collected,
  line-numbered error reporting.
- A cycle-accurate CPU: one instruction per step, deterministic output, a
  documented step limit instead of a silent infinite loop.
- A step debugger: Run or Step, watch the signal hop across the canvas board,
  and read live `ACC` / `PC` / cycle / I/O registers.
- 8 puzzles spanning passthrough, `ADD` / `SUB` arithmetic, and `JEZ` / `JNZ`
  conditional routing, each with PASS / FAIL reporting, a cycle count, and an
  expected-versus-actual diff on failure.
- A level-select screen showing a checkmark and best cycle count per solved
  level, plus each level's documented minimum for comparison.
- Best-cycle scores that persist across reloads via `localStorage`, and a
  backend-free share link. A malformed link just falls back to a normal start.
- Synthesized WebAudio sound effects (tick / route / success / error / win,
  zero audio files) with a mute toggle that persists across reloads.

## Run it locally

```sh
npm install
npm run dev      # local dev server on http://localhost:5173
npm test         # run the Vitest suite
npm run build    # type-check + production build to dist/
```

The production build is a single static `dist/` directory with no backend, so
it can be hosted from any subpath.

## Under the hood

TypeScript and the HTML Canvas API, built with [Vite](https://vitejs.dev/).
The virtual machine, assembler, session, and scoring logic are pure and
DOM-free, so [Vitest](https://vitest.dev/) covers them without a browser
(including [fast-check](https://github.com/dubzzz/fast-check) property tests
that fuzz the assembler and assert the CPU always halts). See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for how the layers fit together,
[`docs/VISION.md`](docs/VISION.md) for the design goals, and
[`docs/DESIGN.md`](docs/DESIGN.md) for the visual direction.

## License

MIT license. See [`LICENSE`](LICENSE).

More of Charlie's projects → https://apps.charliekrug.com
</content>
