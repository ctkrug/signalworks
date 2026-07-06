import { getLevel } from "./levels";

const LEVEL_PARAM = "level";
const SCORE_PARAM = "score";

export interface SharedScore {
  levelId: string;
  cycles: number;
}

/** Builds a `?level=...&score=...` query string for the given level and cycle count. */
export function encodeShareQuery(levelId: string, cycles: number): string {
  const params = new URLSearchParams();
  params.set(LEVEL_PARAM, levelId);
  params.set(SCORE_PARAM, String(cycles));
  return `?${params.toString()}`;
}

/**
 * Parses a `location.search`-style query string into a shared score.
 * Returns null for anything malformed or referencing an unknown level —
 * callers fall back to a normal level start rather than trusting it.
 */
export function parseShareQuery(search: string): SharedScore | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }

  const levelId = params.get(LEVEL_PARAM);
  const scoreRaw = params.get(SCORE_PARAM);
  if (!levelId || !scoreRaw) {
    return null;
  }
  if (!getLevel(levelId)) {
    return null;
  }
  if (!/^\d+$/.test(scoreRaw)) {
    return null;
  }
  const cycles = Number(scoreRaw);
  if (!Number.isFinite(cycles) || cycles <= 0) {
    return null;
  }
  return { levelId, cycles };
}
