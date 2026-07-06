import { describe, expect, it } from "vitest";
import { OPCODES, isOpcode } from "../../src/vm/opcodes";

describe("isOpcode", () => {
  it("accepts every mnemonic in the opcode table", () => {
    for (const opcode of OPCODES) {
      expect(isOpcode(opcode)).toBe(true);
    }
  });

  it("rejects unknown tokens", () => {
    expect(isOpcode("HALT")).toBe(false);
    expect(isOpcode("mov")).toBe(false);
    expect(isOpcode("")).toBe(false);
  });
});
