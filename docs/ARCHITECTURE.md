# Signalworks — Architecture

A map of the codebase for anyone (including a future build/QA pass) picking
this up cold. See `docs/VISION.md` for *why*, `docs/BACKLOG.md` for *what's
left*, and `docs/DESIGN.md` for the visual direction.

## Layers

```
src/
  vm/            pure, DOM-free game logic — fully unit tested
    types.ts        Opcode/Operand/Instruction/AssembledProgram/Level shapes
    tokenizer.ts     source line -> tokens, comment/blank stripping
    errors.ts        AssemblerError (message + 1-based source line)
    assembler.ts     tokens -> AssembledProgram, collects every diagnostic
    cpu.ts           Cpu: one instruction executes per step(), IN/OUT ports,
                     PC wraps past the last instruction, faults on bad input
    session.ts       LevelSession: wraps a Cpu, re-evaluates PASS/FAIL vs.
                     the level's expected output after every step
    events.ts        diffSessionSnapshots(): pure diff of two SessionSnapshots
                     into the presentation events the UI/audio layer needs
    levels.ts        the level roster (pure data) — 8 levels spanning
                     passthrough, ADD/SUB arithmetic, and JEZ/JNZ routing
    scores.ts        best-cycle-count persistence (localStorage, per level)
    share.ts         encode/decode a `?level=&score=` query string for
                     backend-free score links
  audio/
    sfx.ts           WebAudio-synthesized SFX + mute state (localStorage)
  board/
    renderer.ts      canvas rendering: chip/wires/hops/fault/goal/win, driven
                     by explicit event calls, not inferred from state
  ui/
    app.ts           DOM glue: wires buttons/editor/panels to the VM layer,
                     the level-select overlay, and share-link copy/parse
  main.ts            bootstraps App
```

## Data flow

1. **Assemble.** `assemble(source)` tokenizes and parses the editor's text
   into an `AssembledProgram` (instructions + resolved label table), or
   returns every `AssemblerError` found (line-numbered).
2. **Run a level.** `new LevelSession(program, level)` wraps a `Cpu` seeded
   with the level's `input` stream. Each `session.step()` executes one CPU
   cycle, then re-evaluates the CPU's `outQueue` against `level.expectedOutput`:
   - a value mismatch -> `status: "fail"` with a `mismatchIndex`
   - `outQueue` fully matches -> `status: "pass"`
   - the CPU halted (fault or step limit) before completing -> `status: "fail"`
     with the CPU's fault message
3. **Present it.** The UI (`ui/app.ts`) keeps the previous `SessionSnapshot`
   around and diffs it against the new one via `diffSessionSnapshots()` to
   decide what to *show*: a signal hop IN->chip or chip->OUT, a fault flash,
   or the win overlay. This keeps "what happened" (tested, pure) separate
   from "how it looks" (canvas/DOM glue, exercised by manual D3 review since
   there's no browser test harness in this repo).
4. **Score it.** On PASS, `recordScore(level.id, cycles)` keeps the lower of
   the new and previously-stored best in `localStorage` and returns it for
   the win overlay. The win overlay's CTA reads `LEVELS` for the entry after
   the current one and advances to it ("Next Level"), or offers "Replay" on
   the last level.
5. **Select or share a level.** The Levels button renders one card per
   `LEVELS` entry (checkmark + best from `scores.ts`, plus the documented
   minimum) and `loadLevel()` on click. Separately, `share.ts` turns a level
   id + cycle count into a `?level=&score=` query string; `App` parses
   `location.search` on boot via `parseShareQuery()` and, if it names a real
   level with a valid positive-integer score, loads that level and shows a
   "beat N cycles" banner — anything malformed or unknown returns `null` and
   the app falls back to its default level.

The level-select overlay carries `role="dialog"`/`aria-modal`, moves focus
to its Close button on open and back to the Levels button on close, and
closes on Escape — the one piece of app.ts dialog behavior worth knowing
about before extending it (e.g. adding a second overlay).

## Why the CPU wraps the program counter

TIS-100-style puzzles often expect a program to loop forever, reading and
routing values until the level's expected output is satisfied or a step
limit is hit. Rather than requiring an explicit backward `JMP` at the end
of every program, `Cpu.step()` wraps `pc` to `0` once it runs past the last
instruction — so a single `MOV IN OUT` naturally re-executes each cycle
until `IN` is exhausted (at which point reading it is a fault, ending the
run deterministically).

## Testing approach

- `vm/` and `audio/sfx.ts` are unit tested (`tests/`) — pure logic and
  DOM-free state, so no browser is required to run `npm test`. Coverage on
  `vm/` sits at ~98% lines; the defensive CPU fault paths the assembler
  makes unreachable are exercised via hand-built programs.
- `tests/vm/properties.test.ts` adds fast-check property tests: tokenizer
  invariants, immediate round-trips, blank-line insensitivity, passthrough
  and running-sum reproduction over random streams, and a fuzzer asserting
  the CPU never throws or fails to halt on arbitrary assembled source.
- `board/renderer.ts` and `ui/app.ts` are DOM/canvas glue with no unit
  tests; they're verified by driving the built app in headless Chromium
  (the design standard's D3 self-review) rather than mocking `HTMLCanvasElement`.

The level-select dialog additionally **traps Tab focus** (wraps between its
Close button and the last level card) on top of the open/close focus
management and Escape-to-close, so a keyboard user can't tab out to the
controls behind the modal overlay.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
npm run build      # tsc --noEmit && vite build -> dist/
```
