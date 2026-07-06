import type { AssembledProgram, Operand } from "./types";

/** Cycles a program may run before it's considered non-terminating. */
export const DEFAULT_MAX_CYCLES = 10_000;

export interface CpuOptions {
  maxCycles?: number;
}

export interface CpuSnapshot {
  acc: number;
  pc: number;
  cycle: number;
  outQueue: readonly number[];
  inRemaining: number;
  halted: boolean;
  fault: string | null;
}

/**
 * A minimal single-accumulator CPU: one instruction executes per `step()`,
 * the program counter wraps to 0 past the last instruction (so a tight
 * MOV/JMP loop runs forever rather than falling off the end), and reading
 * an empty IN port is a runtime fault rather than a silent stall.
 */
export class Cpu {
  private acc = 0;
  private pc = 0;
  private cycle = 0;
  private halted = false;
  private fault: string | null = null;
  private readonly inQueue: number[];
  private readonly outQueue: number[] = [];
  private readonly maxCycles: number;

  constructor(
    private readonly program: AssembledProgram,
    input: readonly number[],
    options: CpuOptions = {},
  ) {
    this.inQueue = [...input];
    this.maxCycles = options.maxCycles ?? DEFAULT_MAX_CYCLES;
    if (program.instructions.length === 0) {
      this.halted = true;
      this.fault = "empty program";
    }
  }

  snapshot(): CpuSnapshot {
    return {
      acc: this.acc,
      pc: this.pc,
      cycle: this.cycle,
      outQueue: [...this.outQueue],
      inRemaining: this.inQueue.length,
      halted: this.halted,
      fault: this.fault,
    };
  }

  /** Executes exactly one instruction, advancing `cycle` by one, unless already halted. */
  step(): void {
    if (this.halted) {
      return;
    }
    if (this.cycle >= this.maxCycles) {
      this.halted = true;
      this.fault = `step limit of ${this.maxCycles} cycles exceeded`;
      return;
    }

    const instruction = this.program.instructions[this.pc];
    let nextPc = this.pc + 1;

    switch (instruction.opcode) {
      case "MOV": {
        const value = this.readOperand(instruction.operands[0]);
        if (this.fault) {
          this.halted = true;
          return;
        }
        this.writeOperand(instruction.operands[1], value);
        break;
      }
      case "ADD": {
        const value = this.readOperand(instruction.operands[0]);
        if (this.fault) {
          this.halted = true;
          return;
        }
        this.acc += value;
        break;
      }
      case "SUB": {
        const value = this.readOperand(instruction.operands[0]);
        if (this.fault) {
          this.halted = true;
          return;
        }
        this.acc -= value;
        break;
      }
      case "JMP":
        nextPc = this.resolveLabel(instruction.operands[0]);
        break;
      case "JEZ":
        if (this.acc === 0) {
          nextPc = this.resolveLabel(instruction.operands[0]);
        }
        break;
      case "JNZ":
        if (this.acc !== 0) {
          nextPc = this.resolveLabel(instruction.operands[0]);
        }
        break;
      case "NOP":
        break;
    }

    if (this.fault) {
      this.halted = true;
      return;
    }

    this.pc = nextPc >= this.program.instructions.length ? 0 : nextPc;
    this.cycle += 1;
  }

  private readOperand(operand: Operand): number {
    switch (operand.kind) {
      case "immediate":
        return operand.value;
      case "register":
        return this.acc;
      case "port":
        if (operand.name === "IN") {
          if (this.inQueue.length === 0) {
            this.fault = "IN port starved: no input remaining";
            return 0;
          }
          return this.inQueue.shift() as number;
        }
        this.fault = "cannot read from the OUT port";
        return 0;
      case "label":
        this.fault = "a label cannot be used as a value";
        return 0;
    }
  }

  private writeOperand(operand: Operand, value: number): void {
    if (operand.kind === "register") {
      this.acc = value;
      return;
    }
    if (operand.kind === "port" && operand.name === "OUT") {
      this.outQueue.push(value);
      return;
    }
    this.fault = "invalid write destination";
  }

  private resolveLabel(operand: Operand): number {
    if (operand.kind !== "label") {
      this.fault = "jump target is not a label";
      return this.pc;
    }
    const target = this.program.labels[operand.name];
    if (target === undefined) {
      this.fault = `undefined label "${operand.name}"`;
      return this.pc;
    }
    return target;
  }
}
