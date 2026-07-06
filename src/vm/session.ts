import { Cpu } from "./cpu";
import type { AssembledProgram, Level } from "./types";

export type SessionStatus = "running" | "pass" | "fail";

export interface SessionSnapshot {
  status: SessionStatus;
  acc: number;
  pc: number;
  cycle: number;
  outQueue: readonly number[];
  inRemaining: number;
  expectedOutput: readonly number[];
  /** Index of the first output value that diverged from `expectedOutput`, if any. */
  mismatchIndex: number | null;
  failReason: string | null;
}

/** Index of the first position where `actual` diverges from `expected`, or -1. */
function findMismatch(actual: readonly number[], expected: readonly number[]): number {
  const len = Math.min(actual.length, expected.length);
  for (let i = 0; i < len; i++) {
    if (actual[i] !== expected[i]) {
      return i;
    }
  }
  return -1;
}

/**
 * Drives a single level attempt: wraps a Cpu, steps it one cycle at a time,
 * and evaluates PASS/FAIL against the level's expected output after every
 * step so a debugger UI and a "Run to completion" loop can share one path.
 */
export class LevelSession {
  private readonly cpu: Cpu;
  private status: SessionStatus = "running";
  private mismatchIndex: number | null = null;
  private failReason: string | null = null;

  constructor(program: AssembledProgram, private readonly level: Level) {
    this.cpu = new Cpu(program, level.input, { maxCycles: level.maxCycles });
    this.evaluate();
  }

  snapshot(): SessionSnapshot {
    const cpuSnap = this.cpu.snapshot();
    return {
      status: this.status,
      acc: cpuSnap.acc,
      pc: cpuSnap.pc,
      cycle: cpuSnap.cycle,
      outQueue: cpuSnap.outQueue,
      inRemaining: cpuSnap.inRemaining,
      expectedOutput: this.level.expectedOutput,
      mismatchIndex: this.mismatchIndex,
      failReason: this.failReason,
    };
  }

  get isDone(): boolean {
    return this.status !== "running";
  }

  /** Advances exactly one cycle, unless the level has already resolved. */
  step(): void {
    if (this.isDone) {
      return;
    }
    this.cpu.step();
    this.evaluate();
  }

  private evaluate(): void {
    const snap = this.cpu.snapshot();
    const mismatch = findMismatch(snap.outQueue, this.level.expectedOutput);
    if (mismatch !== -1) {
      this.status = "fail";
      this.mismatchIndex = mismatch;
      this.failReason = "output mismatch";
      return;
    }
    if (snap.outQueue.length === this.level.expectedOutput.length) {
      this.status = "pass";
      return;
    }
    if (snap.halted) {
      this.status = "fail";
      this.failReason = snap.fault ?? "program halted before producing the expected output";
    }
  }
}
