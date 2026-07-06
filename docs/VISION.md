# Signalworks — Vision

## The problem

Assembly-golf puzzle games — TIS-100, EXAPUNKS, Shenzhen I/O, Human Resource
Machine — are some of the best-loved puzzle games for programmers, but every
one of them is a paid, installed, desktop application. There's no equivalent
you can hand someone with a link: "try this one level, right now, in your
browser." Simplified "visual block" coding games fill that gap for beginners,
but they aren't the real thing — no registers, no cycle counting, no actual
assembly to write. There's a gap between "toy" and "$15 Steam purchase" that
nobody has filled with a genuine, browser-native assembly puzzle.

## Who it's for

- Programmers who like optimization/golf puzzles (Advent of Code regulars,
  code-golf enthusiasts) and want something they can play in a spare ten
  minutes without installing anything.
- People nostalgic for TIS-100/EXAPUNKS who want a quick fix without booting
  Steam.
- Students and hobbyists learning assembly-level concepts (registers, jumps,
  conditional branches, cycle cost) who benefit from a low-stakes, visual,
  immediately-runnable sandbox.

## The core idea

You're handed one or more "chips" (nodes) on a board, a small, real assembly
instruction set, and a set of registers and I/O ports. Each puzzle defines an
input stream and the output stream your program must produce. You write the
program, run it, and watch a step debugger execute it one cycle at a time —
signals visibly travel across the board as your program runs. When your
output matches the puzzle's expectation, you pass, and your score is the
number of cycles your program took. Lower is better; the whole point is to
come back and shave your score down. A shareable link encodes your score
(and eventually your program) so you can hand a solved puzzle — or a
challenge to beat your number — to someone else with no backend involved.

## Key design decisions

- **A real instruction set, not a simplified stand-in.** `MOV`, `ADD`, `SUB`,
  `JMP`, `JEZ`, `JNZ`, `NOP`, plus `IN`/`OUT` ports and an `ACC` register.
  Small enough to learn in a few minutes, expressive enough that puzzles
  have genuinely different, non-obvious solutions.
- **Cycle-accurate, deterministic execution.** The CPU executes exactly one
  instruction per cycle. The same program always takes the same number of
  cycles and produces the same output sequence — that determinism is what
  makes cycle-count golf a fair, comparable score rather than a fuzzy metric.
- **Puzzles are data, not code.** A level is an input stream, an expected
  output stream, a node/register budget, and a documented minimum cycle
  count. Adding a level never touches the assembler, CPU, or renderer.
- **No backend, ever.** Progress and best scores live in `localStorage`.
  Shareable score links encode state directly in the URL. The whole game is
  a static `dist/` directory — no server to run, scale, or pay for.
- **The debugger is not an afterthought.** Step-through execution with
  live register values and active-instruction highlighting ships with the
  first playable puzzle, not as a later polish pass — understanding *why*
  a program takes the cycles it does is half the fun of golfing it down.

## What "v1 done" looks like

- A working assembler (tokenizer → parser → line-numbered errors) and a
  cycle-accurate CPU core, both covered by tests.
- A playable board: write a program, Run or Step it, watch signals animate
  between chips, see PASS/FAIL with a cycle count and an expected-vs-actual
  diff on failure.
- 8–12 levels of increasing difficulty, from a straight pass-through to
  multi-node arithmetic and conditional routing, each with a documented
  minimum cycle count.
- Cycle-count golf scoring, a level-select screen with best-score tracking
  persisted locally, and a shareable score link that needs no server.
- Synthesized WebAudio sound effects with a persistent mute toggle, and a
  fully responsive, keyboard- and touch-operable board and editor, polished
  to the standard in `docs/DESIGN.md`.
