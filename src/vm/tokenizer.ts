const COMMENT_CHAR = ";";

/** Strips a trailing `; comment` from a source line, if present. */
export function stripComment(line: string): string {
  const idx = line.indexOf(COMMENT_CHAR);
  return idx === -1 ? line : line.slice(0, idx);
}

/** Splits one source line into whitespace-separated tokens, comments and blanks removed. */
export function tokenizeLine(line: string): string[] {
  return stripComment(line)
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}
