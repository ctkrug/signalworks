import type { Level } from "./types";

/**
 * The level roster. Adding a level here is the whole job — no assembler,
 * CPU, or renderer change is required.
 */
export const LEVELS: readonly Level[] = [
  {
    id: "signal-passthrough",
    title: "Signal Passthrough",
    description: "Route the single value waiting on IN straight through to OUT.",
    input: [7],
    expectedOutput: [7],
    minCycles: 1,
    starterCode: "MOV IN OUT\n",
  },
];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((level) => level.id === id);
}
