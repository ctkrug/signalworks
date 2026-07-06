import type { Opcode } from "./types";

export const OPCODES: readonly Opcode[] = [
  "MOV",
  "ADD",
  "SUB",
  "JMP",
  "JEZ",
  "JNZ",
  "NOP",
];

export function isOpcode(token: string): token is Opcode {
  return (OPCODES as readonly string[]).includes(token);
}
