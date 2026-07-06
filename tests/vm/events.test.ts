import { describe, expect, it } from "vitest";
import { diffSessionSnapshots } from "../../src/vm/events";
import type { SessionSnapshot } from "../../src/vm/session";

function snap(overrides: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    status: "running",
    acc: 0,
    pc: 0,
    cycle: 0,
    outQueue: [],
    inRemaining: 1,
    expectedOutput: [7],
    mismatchIndex: null,
    failReason: null,
    ...overrides,
  };
}

describe("diffSessionSnapshots", () => {
  it("emits read-in when the IN queue shrinks", () => {
    const events = diffSessionSnapshots(snap({ inRemaining: 1 }), snap({ inRemaining: 0 }));
    expect(events).toContainEqual({ kind: "read-in" });
  });

  it("emits a matching write-out when OUT gains the expected value", () => {
    const events = diffSessionSnapshots(
      snap({ outQueue: [] }),
      snap({ outQueue: [7], inRemaining: 0 }),
    );
    expect(events).toContainEqual({ kind: "write-out", value: 7, matchedExpected: true });
  });

  it("emits a non-matching write-out when OUT diverges from expected", () => {
    const events = diffSessionSnapshots(
      snap({ outQueue: [] }),
      snap({ outQueue: [9], inRemaining: 0, status: "fail", mismatchIndex: 0, failReason: "output mismatch" }),
    );
    expect(events).toContainEqual({ kind: "write-out", value: 9, matchedExpected: false });
  });

  it("emits fault only on the transition into fail", () => {
    const prev = snap({ status: "fail", failReason: "IN port starved" });
    const next = snap({ status: "fail", failReason: "IN port starved" });
    expect(diffSessionSnapshots(prev, next)).toEqual([]);
  });

  it("emits fault when transitioning from running to fail", () => {
    const events = diffSessionSnapshots(
      snap({ status: "running" }),
      snap({ status: "fail", failReason: "IN port starved: no input remaining" }),
    );
    expect(events).toContainEqual({ kind: "fault", message: "IN port starved: no input remaining" });
  });

  it("falls back to a generic message when a fail carries no reason", () => {
    const events = diffSessionSnapshots(
      snap({ status: "running" }),
      snap({ status: "fail", failReason: null }),
    );
    expect(events).toContainEqual({ kind: "fault", message: "run failed" });
  });

  it("emits pass exactly on the transition into pass", () => {
    const events = diffSessionSnapshots(
      snap({ status: "running", outQueue: [] }),
      snap({ status: "pass", outQueue: [7], inRemaining: 0 }),
    );
    expect(events).toContainEqual({ kind: "pass" });
    expect(diffSessionSnapshots(snap({ status: "pass" }), snap({ status: "pass" }))).toEqual([]);
  });

  it("emits nothing for two identical running snapshots", () => {
    const s = snap({});
    expect(diffSessionSnapshots(s, s)).toEqual([]);
  });
});
