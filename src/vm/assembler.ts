import { AssemblerError } from "./errors";
import { isOpcode } from "./opcodes";
import { tokenizeLine } from "./tokenizer";
import type { AssembledProgram, Instruction, Opcode, Operand } from "./types";

export type AssembleResult =
  | { ok: true; program: AssembledProgram }
  | { ok: false; errors: AssemblerError[] };

const LABEL_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Operand count each opcode requires — arity is fixed, so a mismatch is always an error. */
const OPERAND_COUNT: Record<Opcode, number> = {
  MOV: 2,
  ADD: 1,
  SUB: 1,
  JMP: 1,
  JEZ: 1,
  JNZ: 1,
  NOP: 0,
};

function parseSourceOperand(token: string, line: number): Operand {
  if (token === "ACC") {
    return { kind: "register", name: "ACC" };
  }
  if (token === "IN") {
    return { kind: "port", name: "IN" };
  }
  if (/^-?\d+$/.test(token)) {
    return { kind: "immediate", value: Number(token) };
  }
  throw new AssemblerError(
    `invalid source operand "${token}" (expected ACC, IN, or an integer literal)`,
    line,
  );
}

function parseDestOperand(token: string, line: number): Operand {
  if (token === "ACC") {
    return { kind: "register", name: "ACC" };
  }
  if (token === "OUT") {
    return { kind: "port", name: "OUT" };
  }
  throw new AssemblerError(`invalid destination operand "${token}" (expected ACC or OUT)`, line);
}

function parseJumpOperand(token: string, line: number): Operand {
  if (!LABEL_NAME.test(token)) {
    throw new AssemblerError(`invalid jump target "${token}" (expected a label name)`, line);
  }
  return { kind: "label", name: token };
}

function parseOperands(opcode: Opcode, tokens: string[], line: number): Operand[] {
  const expected = OPERAND_COUNT[opcode];
  if (tokens.length !== expected) {
    throw new AssemblerError(
      `${opcode} expects ${expected} operand${expected === 1 ? "" : "s"}, got ${tokens.length}`,
      line,
    );
  }
  switch (opcode) {
    case "MOV":
      return [parseSourceOperand(tokens[0], line), parseDestOperand(tokens[1], line)];
    case "ADD":
    case "SUB":
      return [parseSourceOperand(tokens[0], line)];
    case "JMP":
    case "JEZ":
    case "JNZ":
      return [parseJumpOperand(tokens[0], line)];
    case "NOP":
      return [];
  }
}

/**
 * Tokenizes and parses assembly source into an executable program.
 * Collects every diagnostic it finds rather than stopping at the first one,
 * so the editor can surface all of them at once.
 */
export function assemble(source: string): AssembleResult {
  const errors: AssemblerError[] = [];
  const instructions: Instruction[] = [];
  const labels: Record<string, number> = {};

  const lines = source.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const tokens = tokenizeLine(lines[i]);
    if (tokens.length === 0) {
      continue;
    }

    let rest = tokens;
    if (rest[0].endsWith(":")) {
      const name = rest[0].slice(0, -1);
      if (!LABEL_NAME.test(name)) {
        errors.push(new AssemblerError(`invalid label name "${name}"`, lineNumber));
      } else if (Object.prototype.hasOwnProperty.call(labels, name)) {
        errors.push(new AssemblerError(`label "${name}" is already defined`, lineNumber));
      } else {
        labels[name] = instructions.length;
      }
      rest = rest.slice(1);
      if (rest.length === 0) {
        continue;
      }
    }

    const mnemonic = rest[0];
    if (!isOpcode(mnemonic)) {
      errors.push(new AssemblerError(`unrecognized instruction "${mnemonic}"`, lineNumber));
      continue;
    }

    try {
      const operands = parseOperands(mnemonic, rest.slice(1), lineNumber);
      instructions.push({ opcode: mnemonic, operands, line: lineNumber });
    } catch (err) {
      if (err instanceof AssemblerError) {
        errors.push(err);
      } else {
        throw err;
      }
    }
  }

  for (const instruction of instructions) {
    for (const operand of instruction.operands) {
      if (operand.kind === "label" && !Object.prototype.hasOwnProperty.call(labels, operand.name)) {
        errors.push(new AssemblerError(`undefined label "${operand.name}"`, instruction.line));
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, program: { instructions, labels } };
}
