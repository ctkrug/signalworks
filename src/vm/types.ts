/**
 * Core instruction-set types for the Signalworks VM.
 *
 * The assembler and CPU both target this shape, so the instruction set is
 * defined once, as data, rather than scattered across parser and executor code.
 */

export type Opcode =
  | "MOV"
  | "ADD"
  | "SUB"
  | "JMP"
  | "JEZ"
  | "JNZ"
  | "NOP";

export type Operand =
  | { kind: "register"; name: "ACC" }
  | { kind: "port"; name: "IN" | "OUT" }
  | { kind: "immediate"; value: number }
  | { kind: "label"; name: string };

export interface Instruction {
  opcode: Opcode;
  operands: Operand[];
  /** 1-based source line, used for assembler errors and debugger highlighting. */
  line: number;
}

export interface AssembledProgram {
  instructions: Instruction[];
  labels: Record<string, number>;
}

/**
 * A puzzle definition: pure data (input stream, expected output, a documented
 * minimum cycle count) so adding a level never touches the assembler, CPU, or
 * renderer.
 */
export interface Level {
  id: string;
  title: string;
  description: string;
  input: readonly number[];
  expectedOutput: readonly number[];
  /** The best possible cycle count for this level, shown for score comparison. */
  minCycles: number;
  maxCycles?: number;
  starterCode: string;
}
