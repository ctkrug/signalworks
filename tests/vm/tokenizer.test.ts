import { describe, expect, it } from "vitest";
import { stripComment, tokenizeLine } from "../../src/vm/tokenizer";

describe("stripComment", () => {
  it("removes everything from the first semicolon onward", () => {
    expect(stripComment("MOV IN OUT ; route it")).toBe("MOV IN OUT ");
  });

  it("returns the line unchanged when there is no comment", () => {
    expect(stripComment("MOV IN OUT")).toBe("MOV IN OUT");
  });

  it("treats a comment-only line as empty", () => {
    expect(stripComment("; just a note")).toBe("");
  });
});

describe("tokenizeLine", () => {
  it("splits on whitespace and drops comments", () => {
    expect(tokenizeLine("  MOV   IN OUT  ; route it")).toEqual(["MOV", "IN", "OUT"]);
  });

  it("returns an empty array for a blank line", () => {
    expect(tokenizeLine("   ")).toEqual([]);
  });

  it("returns an empty array for a comment-only line", () => {
    expect(tokenizeLine("; nothing here")).toEqual([]);
  });

  it("handles tabs between tokens", () => {
    expect(tokenizeLine("MOV\t5\tACC")).toEqual(["MOV", "5", "ACC"]);
  });
});
