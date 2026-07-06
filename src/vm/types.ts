/**
 * Core instruction-set types for the Signalworks VM.
 *
 * The assembler and CPU (built out in the next phase) both target this
 * shape, so the instruction set is defined once, as data, rather than
 * scattered across parser and executor code.
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
