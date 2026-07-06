import type { SessionSnapshot } from "./session";

export type SessionEvent =
  | { kind: "read-in" }
  | { kind: "write-out"; value: number; matchedExpected: boolean }
  | { kind: "fault"; message: string }
  | { kind: "pass" };

/**
 * Diffs two consecutive session snapshots into the presentation events they
 * imply (a signal hopping IN->chip or chip->OUT, a fault, a pass) — pure and
 * DOM-free so the renderer/audio layer can stay untested glue while the
 * decision of *what happened this step* stays covered by tests.
 */
export function diffSessionSnapshots(prev: SessionSnapshot, next: SessionSnapshot): SessionEvent[] {
  const events: SessionEvent[] = [];

  if (next.inRemaining < prev.inRemaining) {
    events.push({ kind: "read-in" });
  }

  if (next.outQueue.length > prev.outQueue.length) {
    const index = next.outQueue.length - 1;
    const value = next.outQueue[index];
    events.push({
      kind: "write-out",
      value,
      matchedExpected: value === next.expectedOutput[index],
    });
  }

  if (prev.status === "running" && next.status === "fail") {
    events.push({ kind: "fault", message: next.failReason ?? "run failed" });
  }

  if (prev.status === "running" && next.status === "pass") {
    events.push({ kind: "pass" });
  }

  return events;
}
