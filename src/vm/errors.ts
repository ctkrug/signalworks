/** A single assembler diagnostic, always tied to the 1-based source line it came from. */
export class AssemblerError extends Error {
  constructor(
    message: string,
    public readonly line: number,
  ) {
    super(`line ${line}: ${message}`);
    this.name = "AssemblerError";
  }
}
