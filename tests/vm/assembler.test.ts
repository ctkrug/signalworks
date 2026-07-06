import { describe, expect, it } from "vitest";
import { assemble } from "../../src/vm/assembler";

describe("assemble", () => {
  it("parses a single MOV of an immediate into ACC", () => {
    const result = assemble("MOV 5 ACC");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.instructions).toEqual([
      {
        opcode: "MOV",
        operands: [
          { kind: "immediate", value: 5 },
          { kind: "register", name: "ACC" },
        ],
        line: 1,
      },
    ]);
  });

  it("parses a negative immediate", () => {
    const result = assemble("MOV -5 ACC");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.instructions[0].operands[0]).toEqual({
      kind: "immediate",
      value: -5,
    });
  });

  it("parses IN routed straight to OUT", () => {
    const result = assemble("MOV IN OUT");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.instructions[0].operands).toEqual([
      { kind: "port", name: "IN" },
      { kind: "port", name: "OUT" },
    ]);
  });

  it("ignores blank lines and comments", () => {
    const result = assemble("\n  ; a note\nMOV 1 ACC\n\n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.instructions).toHaveLength(1);
    expect(result.program.instructions[0].line).toBe(3);
  });

  it("resolves a label defined before its use", () => {
    const result = assemble("loop:\nADD 1\nJMP loop\n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.labels.loop).toBe(0);
    expect(result.program.instructions[1]).toEqual({
      opcode: "JMP",
      operands: [{ kind: "label", name: "loop" }],
      line: 3,
    });
  });

  it("resolves a label defined after its use (forward reference)", () => {
    const result = assemble("JMP skip\nADD 1\nskip: NOP\n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.labels.skip).toBe(2);
  });

  it("supports a label and instruction sharing one line", () => {
    const result = assemble("top: MOV IN OUT\nJMP top\n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.labels.top).toBe(0);
    expect(result.program.instructions).toHaveLength(2);
  });

  it("rejects an unrecognized mnemonic with a line-numbered error", () => {
    const result = assemble("MOV 1 ACC\nHALT\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[0].message).toContain("HALT");
  });

  it("rejects a reference to an undefined label", () => {
    const result = assemble("JMP nowhere\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].message).toContain("nowhere");
    expect(result.errors[0].line).toBe(1);
  });

  it("rejects wrong operand count instead of silently accepting it", () => {
    const result = assemble("MOV IN\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].message).toMatch(/expects 2 operands, got 1/);
  });

  it("rejects an invalid destination operand", () => {
    const result = assemble("MOV 1 IN\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].message).toContain("invalid destination operand");
  });

  it("rejects a duplicate label definition", () => {
    const result = assemble("a: NOP\na: NOP\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].message).toContain("already defined");
  });

  it("rejects a label whose name is not a valid identifier", () => {
    const result = assemble("1bad: NOP\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].message).toContain('invalid label name "1bad"');
    expect(result.errors[0].line).toBe(1);
  });

  it("collects multiple independent errors in one pass", () => {
    const result = assemble("HALT\nSTOP\n");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].line).toBe(1);
    expect(result.errors[1].line).toBe(2);
  });

  it("treats an empty program as valid with no instructions", () => {
    const result = assemble("");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.program.instructions).toEqual([]);
    expect(result.program.labels).toEqual({});
  });
});
