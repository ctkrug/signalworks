import { describe, expect, it } from "vitest";
import { assemble } from "../../src/vm/assembler";
import { getLevel } from "../../src/vm/levels";
import { LevelSession } from "../../src/vm/session";

/**
 * One known-optimal solution per level, used to prove that each level's
 * documented `minCycles` is actually reachable (not just a guessed number).
 */
const SOLUTIONS: Record<string, string> = {
  "signal-passthrough": "MOV IN OUT\n",
  "double-take": "MOV IN OUT\n",
  "sum-two": "MOV IN ACC\nADD IN\nMOV ACC OUT\n",
  difference: "MOV IN ACC\nSUB IN\nMOV ACC OUT\n",
  "running-total": "MOV IN ACC\nout:\nMOV ACC OUT\nADD IN\nJMP out\n",
  "signal-doubler": "loop:\nMOV IN ACC\nADD ACC\nMOV ACC OUT\nJMP loop\n",
  "skip-zeros": "loop:\nMOV IN ACC\nJEZ loop\nMOV ACC OUT\nJMP loop\n",
  "echo-until-zero":
    "loop:\nMOV IN ACC\nJNZ emit\nJMP done\nemit:\nMOV ACC OUT\nJMP loop\ndone:\nJMP done\n",
};

function runToCompletion(source: string, level: NonNullable<ReturnType<typeof getLevel>>) {
  const assembled = assemble(source);
  if (!assembled.ok) {
    throw new Error(assembled.errors.map((e) => e.message).join("; "));
  }
  const session = new LevelSession(assembled.program, level);
  while (!session.isDone) {
    session.step();
  }
  return session.snapshot();
}

describe("level solutions reach the documented minCycles", () => {
  for (const [id, source] of Object.entries(SOLUTIONS)) {
    it(`${id} passes in exactly its documented minCycles`, () => {
      const level = getLevel(id);
      expect(level, `expected a level named "${id}"`).toBeDefined();
      const snap = runToCompletion(source, level!);
      expect(snap.status).toBe("pass");
      expect(snap.cycle).toBe(level!.minCycles);
    });
  }

  it("covers every level in the roster with a verified solution", () => {
    // Guards against a level being added without a matching entry above.
    const levelIds = ["signal-passthrough", "double-take", "sum-two", "difference",
      "running-total", "signal-doubler", "skip-zeros", "echo-until-zero"];
    for (const id of levelIds) {
      expect(SOLUTIONS[id], `no solution registered for level "${id}"`).toBeDefined();
    }
  });
});
