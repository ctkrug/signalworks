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
  {
    id: "double-take",
    title: "Double Take",
    description: "Two values are waiting on IN. Route both to OUT, in order.",
    input: [3, 9],
    expectedOutput: [3, 9],
    minCycles: 2,
    starterCode: "MOV IN OUT\n",
  },
  {
    id: "sum-two",
    title: "Sum Two",
    description: "Add the two values on IN together and write their sum to OUT.",
    input: [4, 5],
    expectedOutput: [9],
    minCycles: 3,
    starterCode: "; ACC starts at 0 — read both IN values into it, then write OUT\n",
  },
  {
    id: "difference",
    title: "Difference",
    description: "Subtract the second value on IN from the first, and write the result to OUT.",
    input: [10, 4],
    expectedOutput: [6],
    minCycles: 3,
    starterCode: "; SUB subtracts its operand from ACC\n",
  },
  {
    id: "running-total",
    title: "Running Total",
    description: "For each value on IN, write the running (cumulative) sum to OUT so far.",
    input: [2, 3, 4],
    expectedOutput: [2, 5, 9],
    minCycles: 8,
    starterCode: "; loop: read one value, add it to ACC, write ACC to OUT, repeat\n",
  },
  {
    id: "signal-doubler",
    title: "Signal Doubler",
    description: "Double every value that arrives on IN before writing it to OUT.",
    input: [3, 5, 2],
    expectedOutput: [6, 10, 4],
    minCycles: 11,
    starterCode: "; ADD ACC to itself to double it\n",
  },
  {
    id: "skip-zeros",
    title: "Skip Zeros",
    description: "Some values on IN are 0 — drop them and route only the non-zero values to OUT.",
    input: [0, 5, 0, 3],
    expectedOutput: [5, 3],
    minCycles: 11,
    starterCode: "; JEZ jumps only when ACC is exactly 0\n",
  },
  {
    id: "echo-until-zero",
    title: "Echo Until Zero",
    description: "Route every value on IN to OUT until a 0 terminator arrives, then stop.",
    input: [4, 7, 2, 0],
    expectedOutput: [4, 7, 2],
    minCycles: 11,
    starterCode: "; JNZ jumps only when ACC is not 0\n",
  },
];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((level) => level.id === id);
}
