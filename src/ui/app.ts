import { assemble } from "../vm/assembler";
import { AssemblerError } from "../vm/errors";
import { diffSessionSnapshots } from "../vm/events";
import { LEVELS } from "../vm/levels";
import { getBestCycles, recordScore } from "../vm/scores";
import { LevelSession, type SessionSnapshot } from "../vm/session";
import type { AssembledProgram, Level } from "../vm/types";
import { BoardRenderer } from "../board/renderer";
import { isMuted, playError, playRoute, playSuccess, playTick, playWin, toggleMute } from "../audio/sfx";

const RUN_TICK_MS = 130;

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Signalworks: expected #${id} in the document`);
  }
  return node as T;
}

/** Wires the DOM to the VM: assembling, stepping, and reflecting every result back into the page. */
export class App {
  private readonly canvas = el<HTMLCanvasElement>("board");
  private readonly editor = el<HTMLTextAreaElement>("editor");
  private readonly errorList = el<HTMLUListElement>("errors");
  private readonly listing = el<HTMLOListElement>("listing");
  private readonly runBtn = el<HTMLButtonElement>("run-btn");
  private readonly stepBtn = el<HTMLButtonElement>("step-btn");
  private readonly resetBtn = el<HTMLButtonElement>("reset-btn");
  private readonly muteBtn = el<HTMLButtonElement>("mute-toggle");
  private readonly statusBadge = el<HTMLSpanElement>("status-badge");
  private readonly failReasonEl = el<HTMLParagraphElement>("fail-reason");
  private readonly winOverlay = el<HTMLDivElement>("win-overlay");
  private readonly winNextBtn = el<HTMLButtonElement>("win-next");
  private readonly regAcc = el<HTMLElement>("reg-acc");
  private readonly regPc = el<HTMLElement>("reg-pc");
  private readonly regCycle = el<HTMLElement>("reg-cycle");
  private readonly regIn = el<HTMLElement>("reg-in");
  private readonly regOut = el<HTMLElement>("reg-out");
  private readonly regExpected = el<HTMLElement>("reg-expected");
  private readonly levelsBtn = el<HTMLButtonElement>("levels-btn");
  private readonly levelSelectOverlay = el<HTMLDivElement>("level-select");
  private readonly levelSelectCloseBtn = el<HTMLButtonElement>("level-select-close");
  private readonly levelList = el<HTMLUListElement>("level-list");

  private readonly renderer: BoardRenderer;
  private level: Level = LEVELS[0];

  private program: AssembledProgram | null = null;
  private session: LevelSession | null = null;
  private runHandle: ReturnType<typeof setTimeout> | null = null;
  private nextLevelForWin: Level | null = null;

  constructor() {
    this.renderer = new BoardRenderer(this.canvas);

    const resizeObserver = new ResizeObserver(() => this.renderer.resize());
    resizeObserver.observe(this.canvas);
    this.renderer.resize();
    this.renderer.start();

    this.runBtn.addEventListener("click", () => this.run());
    this.stepBtn.addEventListener("click", () => this.stepOnce());
    this.resetBtn.addEventListener("click", () => this.reset());
    this.winNextBtn.addEventListener("click", () => this.onWinNext());
    this.muteBtn.addEventListener("click", () => this.onToggleMute());
    this.levelsBtn.addEventListener("click", () => this.openLevelSelect());
    this.levelSelectCloseBtn.addEventListener("click", () => this.closeLevelSelect());
    this.levelSelectOverlay.addEventListener("click", (event) => {
      if (event.target === this.levelSelectOverlay) {
        this.closeLevelSelect();
      }
    });

    this.loadLevel(this.level);
    this.syncMuteButton();
  }

  private openLevelSelect(): void {
    this.renderLevelList();
    this.levelSelectOverlay.hidden = false;
  }

  private closeLevelSelect(): void {
    this.levelSelectOverlay.hidden = true;
  }

  private renderLevelList(): void {
    this.levelList.innerHTML = "";
    for (const level of LEVELS) {
      const best = getBestCycles(level.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = level.id === this.level.id ? "level-card current" : "level-card";

      const title = document.createElement("span");
      title.className = "level-card-title";
      if (best !== null) {
        const check = document.createElement("span");
        check.className = "level-card-check";
        check.textContent = "✓";
        check.setAttribute("aria-hidden", "true");
        title.appendChild(check);
      }
      title.appendChild(document.createTextNode(level.title));

      const desc = document.createElement("span");
      desc.className = "level-card-desc";
      desc.textContent = level.description;

      const meta = document.createElement("span");
      meta.className = "level-card-meta";
      meta.innerHTML = `<span>Best: <strong>${best !== null ? best : "—"}</strong></span><span>Min: <strong>${level.minCycles}</strong></span>`;

      card.append(title, desc, meta);
      card.addEventListener("click", () => {
        this.closeLevelSelect();
        this.loadLevel(level);
      });
      this.levelList.appendChild(card);
    }
  }

  private loadLevel(level: Level): void {
    this.level = level;
    el<HTMLElement>("level-title").textContent = level.title;
    el<HTMLElement>("level-description").textContent = level.description;
    this.editor.value = level.starterCode;
    this.reset();
  }

  private ensureSession(): boolean {
    if (this.session) {
      return true;
    }
    const result = assemble(this.editor.value);
    if (!result.ok) {
      this.renderErrors(result.errors);
      this.renderAll();
      return false;
    }
    this.program = result.program;
    this.session = new LevelSession(this.program, this.level);
    this.editor.setAttribute("readonly", "true");
    this.renderer.setState("running");
    this.hideWinOverlay();
    this.renderErrors([]);
    this.renderAll();
    return true;
  }

  private stepOnce(): void {
    if (!this.session && !this.ensureSession()) {
      return;
    }
    if (!this.session || this.session.isDone) {
      return;
    }
    const prev = this.session.snapshot();
    this.session.step();
    const next = this.session.snapshot();
    playTick();
    this.applyEvents(prev, next);
    this.renderAll();
  }

  private applyEvents(prev: SessionSnapshot, next: SessionSnapshot): void {
    if (next.status === "pass") {
      this.renderer.setState("pass");
    } else if (next.status === "fail") {
      this.renderer.setState("fail");
    }
    for (const event of diffSessionSnapshots(prev, next)) {
      switch (event.kind) {
        case "read-in":
          this.renderer.hopInToChip(true);
          playRoute();
          break;
        case "write-out":
          this.renderer.hopChipToOut(event.matchedExpected);
          if (event.matchedExpected) {
            this.renderer.pulseGoal();
            playSuccess();
          }
          break;
        case "fault":
          this.renderer.pulseFault();
          playError();
          break;
        case "pass":
          this.renderer.pulseWin();
          playWin();
          this.showWinOverlay(next);
          break;
      }
    }
    if (this.session?.isDone) {
      this.stopRun();
    }
  }

  private run(): void {
    if (!this.ensureSession()) {
      return;
    }
    if (this.session?.isDone) {
      return;
    }
    if (this.runHandle !== null) {
      return;
    }
    const tick = () => {
      this.stepOnce();
      if (this.session && !this.session.isDone) {
        this.runHandle = setTimeout(tick, RUN_TICK_MS);
      } else {
        this.runHandle = null;
      }
    };
    tick();
  }

  private stopRun(): void {
    if (this.runHandle !== null) {
      clearTimeout(this.runHandle);
      this.runHandle = null;
    }
  }

  private reset(): void {
    this.stopRun();
    this.session = null;
    this.program = null;
    this.editor.removeAttribute("readonly");
    this.renderer.setState("idle");
    this.hideWinOverlay();
    this.renderErrors([]);
    this.renderAll();
  }

  private onWinNext(): void {
    if (this.nextLevelForWin) {
      this.loadLevel(this.nextLevelForWin);
    } else {
      this.reset();
    }
  }

  private onToggleMute(): void {
    toggleMute();
    this.syncMuteButton();
  }

  private syncMuteButton(): void {
    const muted = isMuted();
    this.muteBtn.textContent = muted ? "Sound: Off" : "Sound: On";
    this.muteBtn.setAttribute("aria-pressed", String(muted));
  }

  private renderErrors(errors: AssemblerError[]): void {
    this.errorList.innerHTML = "";
    this.errorList.hidden = errors.length === 0;
    for (const error of errors) {
      const li = document.createElement("li");
      li.textContent = `line ${error.line}: ${error.message.replace(/^line \d+: /, "")}`;
      this.errorList.appendChild(li);
    }
  }

  private renderAll(): void {
    const snap = this.session?.snapshot() ?? null;
    this.renderRegisters(snap);
    this.renderListing(snap);
    this.renderStatus(snap);
  }

  private renderRegisters(snap: SessionSnapshot | null): void {
    this.regAcc.textContent = snap ? String(snap.acc) : "—";
    this.regPc.textContent = snap ? String(snap.pc) : "—";
    this.regCycle.textContent = snap ? String(snap.cycle) : "—";
    this.regIn.textContent = snap ? String(snap.inRemaining) : String(this.level.input.length);
    this.regOut.textContent = snap && snap.outQueue.length > 0 ? snap.outQueue.join(", ") : "—";
    this.regExpected.textContent = this.level.expectedOutput.join(", ");

    if (snap?.status === "fail") {
      this.failReasonEl.hidden = false;
      this.failReasonEl.textContent =
        snap.mismatchIndex !== null
          ? `expected ${this.level.expectedOutput[snap.mismatchIndex]} at position ${snap.mismatchIndex}, got ${snap.outQueue[snap.mismatchIndex]}`
          : (snap.failReason ?? "run failed");
    } else {
      this.failReasonEl.hidden = true;
    }
  }

  private renderListing(snap: SessionSnapshot | null): void {
    const currentLine =
      snap && this.program && this.program.instructions.length > 0
        ? this.program.instructions[snap.pc]?.line ?? null
        : null;

    this.listing.innerHTML = "";
    const lines = this.editor.value.split("\n");
    lines.forEach((text, i) => {
      const lineNumber = i + 1;
      const li = document.createElement("li");
      li.className = lineNumber === currentLine ? "listing-line current" : "listing-line";
      const num = document.createElement("span");
      num.className = "listing-num";
      num.textContent = String(lineNumber);
      const code = document.createElement("span");
      code.className = "listing-code";
      code.textContent = text.length > 0 ? text : " ";
      li.append(num, code);
      this.listing.appendChild(li);
    });
  }

  private renderStatus(snap: SessionSnapshot | null): void {
    const status = snap?.status ?? "idle";
    this.statusBadge.textContent = status.toUpperCase();
    this.statusBadge.className = `status-badge status-${status}`;
    const done = snap?.status === "pass" || snap?.status === "fail";
    this.stepBtn.disabled = done;
    this.runBtn.disabled = done;
  }

  private showWinOverlay(snap: SessionSnapshot): void {
    const best = recordScore(this.level.id, snap.cycle);
    el<HTMLElement>("win-cycles").textContent = String(snap.cycle);
    el<HTMLElement>("win-instructions").textContent = String(this.program?.instructions.length ?? 0);
    el<HTMLElement>("win-best").textContent = String(getBestCycles(this.level.id) ?? best);

    const currentIndex = LEVELS.findIndex((l) => l.id === this.level.id);
    this.nextLevelForWin = currentIndex >= 0 ? (LEVELS[currentIndex + 1] ?? null) : null;
    this.winNextBtn.textContent = this.nextLevelForWin ? "Next Level" : "Replay";

    this.winOverlay.hidden = false;
  }

  private hideWinOverlay(): void {
    this.winOverlay.hidden = true;
  }
}
