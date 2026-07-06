# Signalworks — Backlog

Epics and stories for the build. Every story lists verifiable acceptance
criteria — concrete checks, not vibes. Story 1 of Epic 1 is the wow moment:
it must be reachable before anything else in this document is built.

## Epic 1 — Core VM and the first solve

- [ ] **Wow moment: assemble and run "route IN to OUT" end-to-end**
  - AC: typing `MOV IN OUT` into the editor and pressing Run animates a
    signal traveling from the input port to the output port on the board,
    and the level reports PASS with a cycle count.
  - AC: a program that produces the wrong output reports FAIL with an
    expected-vs-actual diff, not a silent hang or a crash.
- [ ] **Minimal instruction set and single-pass assembler**
  - AC: `MOV 5 ACC` followed by one step leaves `ACC` equal to `5`.
  - AC: an unrecognized mnemonic produces a line-numbered assembler error
    instead of a thrown exception or a silently-skipped instruction.
  - AC: labels resolve so a 3-instruction `MOV`/`JMP` loop runs indefinitely
    until the step limit is hit, proving `JMP` targets the right line.
- [ ] **Cycle-accurate stepped CPU with IN/OUT ports**
  - AC: a single-node program that reads one value from `IN` and `MOV`s it
    to `OUT` completes in the cycle count documented for that program.
  - AC: running the same program twice yields an identical cycle count and
    output sequence (determinism).
- [ ] **Step debugger with live registers and PC highlighting**
  - AC: pressing Step advances exactly one cycle and highlights the
    current instruction's line in the editor.
  - AC: the displayed register values update in the same frame as the Step
    that changed them.

## Epic 2 — Puzzle content and progression

- [ ] **Data-driven puzzle format**
  - AC: adding a new puzzle requires only a new data object (input stream,
    expected output stream, node/register budget) — no changes to the
    assembler, CPU, or renderer.
  - AC: a newly added puzzle object appears in the level-select list without
    further wiring.
- [ ] **8+ levels of increasing difficulty**
  - AC: at least 8 distinct puzzle definitions exist, spanning pass-through,
    arithmetic (`ADD`/`SUB`), and conditional routing (`JEZ`/`JNZ`).
  - AC: each level's data includes a documented minimum cycle count used
    later for score comparison.
- [ ] **Level select with pass/fail and best-score tracking**
  - AC: a completed level shows a checkmark and the player's best cycle
    count.
  - AC: best scores persist across a full page reload via `localStorage`.
- [ ] **Design polish — level select and editor states**
  - AC: level select, editor, and board share the tokens in
    `docs/DESIGN.md` and pass its D3 self-review checklist at 390/768/1440
    widths.

## Epic 3 — Scoring and sharing

- [ ] **Cycle-count golf scoring**
  - AC: on PASS, the score (cycles taken) displays immediately.
  - AC: a PASS with a lower cycle count than the stored best updates the
    "best" record for that level.
- [ ] **Shareable, backend-free score link**
  - AC: copying the share link and opening it in a fresh/incognito tab
    shows the same level and score without any network request to a
    Signalworks-owned server.
  - AC: a malformed or tampered share link falls back to a normal level
    start rather than crashing.
- [ ] **Win celebration screen**
  - AC: passing a level shows an overlay with cycle count, instruction
    count, and a single "Next Level" call to action.

## Epic 4 — Polish, audio, and accessibility

- [ ] **Synthesized WebAudio SFX with mute toggle**
  - AC: toggling mute silences all sound immediately and the muted state
    persists across a page reload via `localStorage`.
  - AC: the `AudioContext` is created lazily on first user gesture, with no
    autoplay-policy console errors on load.
- [ ] **Responsive layout with keyboard and touch controls**
  - AC: at 390px width, the editor and board stack with no horizontal
    scroll and no overlapping controls.
  - AC: Run/Step/Reset/Mute are all reachable and operable by keyboard,
    with a visible focus state on each.
- [ ] **Juice pass — tween, impact/goal feedback, reduced motion**
  - AC: signal movement is visibly tweened between positions, never a
    teleport.
  - AC: `prefers-reduced-motion` disables shake/particle effects while
    keeping the underlying pass/fail logic unchanged.
