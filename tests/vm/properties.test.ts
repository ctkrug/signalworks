import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { assemble } from "../../src/vm/assembler";
import { Cpu } from "../../src/vm/cpu";
import { tokenizeLine } from "../../src/vm/tokenizer";
import { LevelSession } from "../../src/vm/session";
import type { AssembledProgram, Level } from "../../src/vm/types";

function assembleOrThrow(source: string): AssembledProgram {
  const result = assemble(source);
  if (!result.ok) {
    throw new Error(result.errors.map((e) => e.message).join("; "));
  }
  return result.program;
}

// Integers safely representable as plain `-?\d+` immediate literals.
const safeInt = fc.integer({ min: -1_000_000, max: 1_000_000 });

describe("property: tokenizer", () => {
  it("never emits an empty or whitespace-bearing token", () => {
    fc.assert(
      fc.property(fc.string(), (line) => {
        for (const token of tokenizeLine(line)) {
          expect(token.length).toBeGreaterThan(0);
          expect(token).not.toMatch(/\s/);
        }
      }),
    );
  });

  it("drops everything from the first comment character onward", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (code, comment) => {
        // A comment cannot reintroduce tokens the code half didn't already have.
        const withComment = tokenizeLine(`${code} ;${comment}`);
        expect(withComment).toEqual(tokenizeLine(code));
      }),
    );
  });
});

describe("property: assembler", () => {
  it("round-trips an immediate literal through parse", () => {
    fc.assert(
      fc.property(safeInt, (n) => {
        const program = assembleOrThrow(`MOV ${n} ACC`);
        const [source] = program.instructions[0].operands;
        expect(source).toEqual({ kind: "immediate", value: n });
      }),
    );
  });

  it("assembles any sequence of NOPs to exactly that many instructions", () => {
    fc.assert(
      fc.property(fc.nat({ max: 200 }), (count) => {
        const program = assembleOrThrow(Array(count).fill("NOP").join("\n"));
        expect(program.instructions).toHaveLength(count);
      }),
    );
  });

  it("is insensitive to surrounding and interleaved blank lines", () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom("MOV IN OUT", "NOP", "ADD 1"), { maxLength: 20 }), (lines) => {
        const dense = lines.join("\n");
        const sparse = lines.map((l) => `\n   \n${l}`).join("\n");
        const a = assemble(dense);
        const b = assemble(sparse);
        expect(a.ok).toBe(true);
        expect(b.ok).toBe(true);
        if (a.ok && b.ok) {
          expect(b.program.instructions.map((i) => i.opcode)).toEqual(
            a.program.instructions.map((i) => i.opcode),
          );
        }
      }),
    );
  });
});

describe("property: cpu / session", () => {
  it("passthrough echoes any input stream in order, one cycle per value", () => {
    fc.assert(
      fc.property(fc.array(safeInt, { minLength: 1, maxLength: 30 }), (input) => {
        const level: Level = {
          id: "prop-passthrough",
          title: "prop",
          description: "",
          input,
          expectedOutput: input,
          minCycles: input.length,
          starterCode: "",
        };
        const session = new LevelSession(assembleOrThrow("MOV IN OUT"), level);
        for (let i = 0; i < input.length; i++) {
          session.step();
        }
        const snap = session.snapshot();
        expect(snap.status).toBe("pass");
        expect(snap.outQueue).toEqual(input);
        expect(snap.cycle).toBe(input.length);
      }),
    );
  });

  it("a running-sum loop reproduces the cumulative totals of any input", () => {
    fc.assert(
      fc.property(fc.array(safeInt, { minLength: 1, maxLength: 20 }), (input) => {
        const expected: number[] = [];
        let acc = 0;
        for (const v of input) {
          acc += v;
          expected.push(acc);
        }
        const level: Level = {
          id: "prop-running-total",
          title: "prop",
          description: "",
          input,
          expectedOutput: expected,
          minCycles: 1,
          starterCode: "",
        };
        const program = assembleOrThrow("loop:\nADD IN\nMOV ACC OUT\nJMP loop\n");
        const session = new LevelSession(program, level);
        for (let i = 0; i < input.length * 4 + 4; i++) {
          session.step();
        }
        const snap = session.snapshot();
        expect(snap.status).toBe("pass");
        expect(snap.outQueue).toEqual(expected);
      }),
    );
  });

  it("never throws and always terminates for arbitrary assembled source", () => {
    const token = fc.constantFrom(
      "MOV",
      "IN",
      "OUT",
      "ACC",
      "ADD",
      "SUB",
      "NOP",
      "JMP",
      "loop:",
      "loop",
      "1",
      "-2",
      "",
    );
    fc.assert(
      fc.property(fc.array(fc.array(token, { maxLength: 3 }), { maxLength: 12 }), (rows) => {
        const source = rows.map((r) => r.join(" ")).join("\n");
        const result = assemble(source);
        if (!result.ok) {
          return; // syntactically rejected — nothing to run
        }
        const cpu = new Cpu(result.program, [1, 2, 3], { maxCycles: 500 });
        expect(() => {
          for (let i = 0; i < 1000; i++) {
            cpu.step();
          }
        }).not.toThrow();
        expect(cpu.snapshot().halted).toBe(true);
      }),
    );
  });
});
