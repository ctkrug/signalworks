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
    levels.ts        the level roster (pure data)
    scores.ts        best-cycle-count persistence (localStorage, per level)
  audio/
    sfx.ts           WebAudio-synthesized SFX + mute state (localStorage)
  board/
    renderer.ts      canvas rendering: chip/wires/hops/fault/goal/win, driven
                     by explicit event calls, not inferred from state
  ui/
    app.ts           DOM glue: wires buttons/editor/panels to the VM layer
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
   the win overlay.

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
  DOM-free state, so no browser is required to run `npm test`.
- `board/renderer.ts` and `ui/app.ts` are DOM/canvas glue with no unit
  tests; they're verified by manually driving the built app (see the
  design standard's D3 self-review) rather than mocking `HTMLCanvasElement`.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
npm run build      # tsc --noEmit && vite build -> dist/
```
