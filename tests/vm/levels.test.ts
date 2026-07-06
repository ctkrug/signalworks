import { describe, expect, it } from "vitest";
import { assemble } from "../../src/vm/assembler";
import { LEVELS, getLevel } from "../../src/vm/levels";

describe("LEVELS", () => {
  it("is non-empty and every level has a unique id", () => {
    expect(LEVELS.length).toBeGreaterThan(0);
    const ids = LEVELS.map((level) => level.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ships starter code that assembles cleanly for every level", () => {
    for (const level of LEVELS) {
      const result = assemble(level.starterCode);
      expect(result.ok).toBe(true);
    }
  });

  it("documents a positive minimum cycle count for every level", () => {
    for (const level of LEVELS) {
      expect(level.minCycles).toBeGreaterThan(0);
    }
  });
});

describe("getLevel", () => {
  it("finds a level by id", () => {
    expect(getLevel("signal-passthrough")?.title).toBe("Signal Passthrough");
  });

  it("returns undefined for an unknown id", () => {
    expect(getLevel("does-not-exist")).toBeUndefined();
  });
});
