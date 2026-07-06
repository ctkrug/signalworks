import { describe, expect, it } from "vitest";
import { assemble } from "../../src/vm/assembler";
import { LevelSession } from "../../src/vm/session";
import type { Level } from "../../src/vm/types";

function assembleOrThrow(source: string) {
  const result = assemble(source);
  if (!result.ok) {
    throw new Error(result.errors.map((e) => e.message).join("; "));
  }
  return result.program;
}

const PASSTHROUGH_LEVEL: Level = {
  id: "test-passthrough",
  title: "Test Passthrough",
  description: "route IN to OUT",
  input: [7],
  expectedOutput: [7],
  minCycles: 1,
  starterCode: "MOV IN OUT\n",
};

describe("LevelSession", () => {
  it("reports pass the moment the output stream matches", () => {
    const session = new LevelSession(assembleOrThrow(PASSTHROUGH_LEVEL.starterCode), PASSTHROUGH_LEVEL);
    session.step();
    const snap = session.snapshot();
    expect(snap.status).toBe("pass");
    expect(snap.cycle).toBe(1);
  });

  it("reports fail with a mismatch index the moment output diverges", () => {
    const session = new LevelSession(assembleOrThrow("MOV 8 OUT"), PASSTHROUGH_LEVEL);
    session.step();
    const snap = session.snapshot();
    expect(snap.status).toBe("fail");
    expect(snap.mismatchIndex).toBe(0);
    expect(snap.outQueue).toEqual([8]);
  });

  it("reports fail with the runtime fault when the CPU halts before completing output", () => {
    const level: Level = { ...PASSTHROUGH_LEVEL, expectedOutput: [7, 7] };
    const session = new LevelSession(assembleOrThrow("MOV IN OUT\n"), level);
    session.step();
    expect(session.snapshot().status).toBe("running");
    session.step();
    const snap = session.snapshot();
    expect(snap.status).toBe("fail");
    expect(snap.mismatchIndex).toBeNull();
    expect(snap.failReason).toContain("IN port starved");
  });

  it("does not advance once the level has resolved", () => {
    const session = new LevelSession(assembleOrThrow(PASSTHROUGH_LEVEL.starterCode), PASSTHROUGH_LEVEL);
    session.step();
    const passed = session.snapshot();
    session.step();
    expect(session.snapshot()).toEqual(passed);
  });

  it("is deterministic across repeated runs of the same program and input", () => {
    const run = () => {
      const session = new LevelSession(assembleOrThrow(PASSTHROUGH_LEVEL.starterCode), PASSTHROUGH_LEVEL);
      session.step();
      return session.snapshot();
    };
    expect(run()).toEqual(run());
  });
});
