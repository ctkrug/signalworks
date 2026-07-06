# Signalworks — Design Direction

## 1. Aesthetic direction

**Blueprint/technical.** Signalworks is a circuit-routing puzzle game about
writing real assembly — the direction leans into that directly: an engineer's
drafting table, not a retro arcade cabinet. Deep blueprint-blue surfaces, a
faint cyan grid like drafting paper, cyan signal traces that glow when live,
and amber annotation marks where something needs attention. It reads as
"schematic diagram you can execute," which is exactly what the product is.

Recent ships have leaned CRT/retro-terminal (Cathode) and warm-tactile
(Shove); blueprint/technical is a distinct family from both — cool, precise,
drafting-desk rather than nostalgic-arcade or toy-box.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b2545` | page background (deep blueprint blue) |
| `--surface-1` | `#123a63` | board / panel surface |
| `--surface-2` | `#1b4b7a` | raised surface, borders |
| `--text` | `#eaf2fb` | primary text (paper white) |
| `--text-muted` | `#8fb0d1` | secondary text, inactive trace color |
| `--accent` | `#4fd1ff` | live signal / cyan trace / primary actions |
| `--accent-support` | `#ffb454` | amber annotation, warnings, secondary accent |
| `--success` | `#6ee7a0` | PASS, goal reached |
| `--danger` | `#ff6b6b` | FAIL, runtime fault |

- **Type pairing:** display = **Space Grotesk** (wordmark, headings — a
  geometric, technical-feeling sans); UI/code = **JetBrains Mono** (body
  text, the editor, register readouts — monospace so columns of numbers and
  code actually align). Both via Google Fonts with system-ui/monospace
  fallbacks.
- **Spacing scale:** 4/8px unit — `4, 8, 16, 24, 40`.
- **Corner radius:** `4px` — sharp enough to feel drafted, not soft/toylike.
- **Shadow/glow:** `--glow-accent` — a thin cyan outline plus soft glow
  (`0 0 0 1px rgba(79,209,255,.4), 0 0 18px rgba(79,209,255,.25)`) on the
  board shell and on any live/active trace or focused control.
- **Motion:** UI transitions 150–200ms ease-out; in-game feedback
  (signal hop, impact flash) 90–130ms ease-out, matching the 80–140ms game
  feel band.

## 3. Layout intent

The **board** (the chip grid where signals travel) is the hero. Desktop
(1440×900): board + code editor split roughly 65/35, board on the left,
editor and register/IO readout stacked on the right — the board alone
covers well over 60% of the viewport. Phone (390×844): stacked vertically,
board on top at a fixed aspect ratio, editor and controls below, collapsible
so the board is never squeezed below a legible size. The topbar (animated
wordmark + tagline) stays compact — a strip, not a hero section of its own —
so the board reads as the point of the page immediately on load.

## 4. Signature detail

The wordmark **"SIGNALWORKS"** lights up letter-by-letter on a loop, like a
signal trace running under the name — each letter briefly glows accent-cyan
with a soft text-shadow, in sequence, then fades back to muted. It's the
first thing that moves on the page and it previews the core visual language
(a pulse traveling along a path) before the player ever touches the board.

## 5. Juice plan (game feel)

- **Movement tween:** a signal traveling between chips/ports animates along
  its wire path over 90–130ms per hop — never teleports between positions.
- **Impact feedback:** a chip that receives an invalid or unexpected signal
  flashes amber and does a tiny (2–3px) shake.
- **Goal/success pop:** the output port glows success-green and pulses once
  when it receives the value a test case expects.
- **Win celebration:** on PASS, an overlay shows cycle count and instruction
  count over a shower of small cyan/amber spark particles along the
  board's traces, with one clear "Next Level" call to action.
- **Synth SFX (WebAudio, generated in code — no audio files):**
  - `tick` — a very short, quiet blip on every CPU cycle step.
  - `route` — a soft rising blip when a signal moves between chips.
  - `error` — a short low buzz on a runtime fault or FAIL.
  - `success` — a brief rising two-note chime when a goal port is hit.
  - `win` — an ascending three-note chord with a light sparkle tail on
    level PASS.
  - A mute toggle persists in `localStorage`; the `AudioContext` is created
    lazily on first user gesture and all SFX code is guarded for
    environments where `AudioContext` doesn't exist (tests, some browsers).
  - `prefers-reduced-motion` drops shake/particles but keeps ticks/chimes
    and all pass/fail logic unchanged.
