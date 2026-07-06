---
title: "I built a TIS-100-style assembly puzzle game that runs in a browser tab"
published: false
tags: javascript, typescript, gamedev, webdev
---

I love Zachtronics puzzle games like TIS-100 and EXAPUNKS, where you solve a
problem by writing tiny assembly programs and then compete with yourself to do
it in fewer cycles. The catch is that they live behind a Steam purchase and a
desktop install. I wanted that exact loop, the write-run-golf cycle, to open in
a browser tab with nothing to set up. So I built **Signalworks**.

Live: https://apps.charliekrug.com/signalworks/
Source: https://github.com/ctkrug/signalworks

Here is the whole first level:

```asm
MOV IN OUT
```

Read the value on the `IN` port, write it to `OUT`, done. By the sixth puzzle
you are writing loops that keep a running total. The instruction set is small
on purpose: `MOV`, `ADD`, `SUB`, `JMP`, `JEZ`, `JNZ`, `NOP`, labels, and two
I/O ports. That is enough to teach branching and iteration without a manual.

I want to share two decisions that made the build cleaner than I expected.

## Keeping the virtual machine free of the DOM

The core is a cycle-accurate CPU: one instruction per `step()`, one accumulator,
deterministic output. The temptation with a game like this is to reach into the
canvas from inside the execution loop, animating a signal the moment a value
moves. That couples your logic to your renderer and makes the interesting part,
the VM, impossible to test without a browser.

Instead the VM only produces plain snapshots of its state. A separate pure
function diffs two consecutive snapshots and returns a list of presentation
events: a value was read from `IN`, a value was written to `OUT` and it matched
the expected output, a fault happened, the level passed. The renderer and the
sound layer consume those events. The decision of *what happened this cycle*
stays testable and covered; the canvas is dumb glue that reacts to events. The
VM, assembler, and scoring code sit around 99% line coverage in plain Node with
no DOM mock in sight.

## Letting the program counter wrap

TIS-100 solutions usually loop forever until the input is exhausted. My first
instinct was to require an explicit backward `JMP` at the end of every program.
That felt like paperwork. So the CPU wraps its program counter back to zero once
it runs past the last instruction. Now a one-line `MOV IN OUT` naturally
re-executes every cycle and routes the whole input stream, and reading an empty
`IN` port becomes a clean runtime fault that ends the run deterministically.
The trade-off is that you cannot "fall off the end" to stop, but for this style
of puzzle that turned out to be the right default and it removed a whole class
of boilerplate from every solution.

## The share link, and a bug I nearly shipped

Scores are shared with a link that encodes the level and cycle count in the
query string, so there is no server and no account. That means the score is
attacker-controlled text, and my first validation was a loose numeric check.
A string like `"1e3"` passes `!isNaN(Number(x))` and parses to 1000, which is
not a score anyone earned. I tightened it to a strict positive-integer test plus
a finite-number guard, and pinned it with tests for the tampered cases. A good
reminder that any value from a URL is input from a stranger.

## What I would do differently

The editor is a plain `<textarea>`. It works, but syntax highlighting and inline
error underlines would make the golf loop feel better. I would also add
multi-chip levels, where signals pass between nodes, which is where these
puzzles get genuinely hard.

If you try it, I would love to hear which level made you rewrite your solution to
save cycles. That rewrite is the whole game.
</content>
