import { describe, expect, it } from "vitest";
import { assemble } from "../../src/vm/assembler";
import { Cpu } from "../../src/vm/cpu";
import type { AssembledProgram } from "../../src/vm/types";

function assembleOrThrow(source: string): AssembledProgram {
  const result = assemble(source);
  if (!result.ok) {
    throw new Error(result.errors.map((e) => e.message).join("; "));
  }
  return result.program;
}

describe("Cpu", () => {
  it("leaves ACC equal to an immediate after one MOV step", () => {
    const cpu = new Cpu(assembleOrThrow("MOV 5 ACC"), []);
    cpu.step();
    expect(cpu.snapshot().acc).toBe(5);
    expect(cpu.snapshot().cycle).toBe(1);
  });

  it("routes a value from IN to OUT", () => {
    const cpu = new Cpu(assembleOrThrow("MOV IN OUT"), [7]);
    cpu.step();
    const snap = cpu.snapshot();
    expect(snap.outQueue).toEqual([7]);
    expect(snap.inRemaining).toBe(0);
  });

  it("adds and subtracts into ACC", () => {
    const cpu = new Cpu(assembleOrThrow("MOV 10 ACC\nSUB 3\nADD 1\n"), []);
    cpu.step();
    cpu.step();
    cpu.step();
    expect(cpu.snapshot().acc).toBe(8);
  });

  it("wraps the program counter to 0 past the last instruction", () => {
    const cpu = new Cpu(assembleOrThrow("MOV 1 ACC"), []);
    cpu.step();
    expect(cpu.snapshot().pc).toBe(0);
  });

  it("branches on JEZ when ACC is zero", () => {
    const cpu = new Cpu(assembleOrThrow("JEZ target\nMOV 1 ACC\ntarget: MOV 2 ACC\n"), []);
    cpu.step();
    expect(cpu.snapshot().pc).toBe(2);
    cpu.step();
    expect(cpu.snapshot().acc).toBe(2);
  });

  it("does not take JNZ when ACC is zero", () => {
    const cpu = new Cpu(assembleOrThrow("JNZ target\nMOV 1 ACC\ntarget: MOV 2 ACC\n"), []);
    cpu.step();
    expect(cpu.snapshot().pc).toBe(1);
  });

  it("runs a MOV/JMP loop indefinitely until the step limit halts it", () => {
    const cpu = new Cpu(assembleOrThrow("loop:\nADD 1\nJMP loop\n"), [], { maxCycles: 50 });
    for (let i = 0; i < 100; i++) {
      cpu.step();
    }
    const snap = cpu.snapshot();
    expect(snap.halted).toBe(true);
    expect(snap.cycle).toBe(50);
    expect(snap.fault).toContain("step limit");
    expect(snap.acc).toBe(25);
  });

  it("faults when reading IN with nothing left in the queue", () => {
    const cpu = new Cpu(assembleOrThrow("MOV IN OUT\nMOV IN OUT\n"), [1]);
    cpu.step();
    cpu.step();
    const snap = cpu.snapshot();
    expect(snap.halted).toBe(true);
    expect(snap.fault).toContain("IN port starved");
    expect(snap.outQueue).toEqual([1]);
  });

  it("produces identical output and cycle counts across repeated runs (determinism)", () => {
    const run = () => {
      const cpu = new Cpu(assembleOrThrow("MOV IN OUT\nMOV IN OUT\n"), [3, 9]);
      cpu.step();
      cpu.step();
      return cpu.snapshot();
    };
    const first = run();
    const second = run();
    expect(second.outQueue).toEqual(first.outQueue);
    expect(second.cycle).toEqual(first.cycle);
  });

  it("treats an empty program as immediately halted", () => {
    const cpu = new Cpu(assembleOrThrow(""), []);
    const snap = cpu.snapshot();
    expect(snap.halted).toBe(true);
    expect(snap.fault).toContain("empty program");
  });

  it("does not advance further once halted", () => {
    const cpu = new Cpu(assembleOrThrow("MOV IN OUT"), []);
    cpu.step();
    const halted = cpu.snapshot();
    cpu.step();
    expect(cpu.snapshot()).toEqual(halted);
  });

  // The assembler rejects these, but a hand-built or corrupted program must
  // still fault cleanly rather than throw or loop — the CPU is the last guard.
  describe("defensive faults on a hand-built program", () => {
    it("faults on a jump to an undefined label", () => {
      const program: AssembledProgram = {
        instructions: [{ opcode: "JMP", operands: [{ kind: "label", name: "nowhere" }], line: 1 }],
        labels: {},
      };
      const cpu = new Cpu(program, []);
      cpu.step();
      const snap = cpu.snapshot();
      expect(snap.halted).toBe(true);
      expect(snap.fault).toContain('undefined label "nowhere"');
    });

    it("faults when a jump target is not a label operand", () => {
      const program: AssembledProgram = {
        instructions: [{ opcode: "JMP", operands: [{ kind: "immediate", value: 3 }], line: 1 }],
        labels: {},
      };
      const cpu = new Cpu(program, []);
      cpu.step();
      const snap = cpu.snapshot();
      expect(snap.halted).toBe(true);
      expect(snap.fault).toContain("jump target is not a label");
    });

    it("faults when reading from the OUT port as a source", () => {
      const program: AssembledProgram = {
        instructions: [
          { opcode: "MOV", operands: [{ kind: "port", name: "OUT" }, { kind: "register", name: "ACC" }], line: 1 },
        ],
        labels: {},
      };
      const cpu = new Cpu(program, []);
      cpu.step();
      expect(cpu.snapshot().fault).toContain("cannot read from the OUT port");
    });

    it("faults when a label operand is used as a value", () => {
      const program: AssembledProgram = {
        instructions: [
          { opcode: "ADD", operands: [{ kind: "label", name: "loop" }], line: 1 },
        ],
        labels: { loop: 0 },
      };
      const cpu = new Cpu(program, []);
      cpu.step();
      expect(cpu.snapshot().fault).toContain("a label cannot be used as a value");
    });

    it("faults on an invalid write destination", () => {
      const program: AssembledProgram = {
        instructions: [
          { opcode: "MOV", operands: [{ kind: "immediate", value: 1 }, { kind: "port", name: "IN" }], line: 1 },
        ],
        labels: {},
      };
      const cpu = new Cpu(program, []);
      cpu.step();
      expect(cpu.snapshot().fault).toContain("invalid write destination");
    });
  });
});
