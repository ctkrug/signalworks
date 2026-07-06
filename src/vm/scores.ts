const KEY_PREFIX = "signalworks:best:";

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** The best (lowest) cycle count recorded for a level, or null if none yet. */
export function getBestCycles(levelId: string): number | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(KEY_PREFIX + levelId);
  if (raw === null) {
    return null;
  }
  // A recorded best is always written as a plain positive-integer string, so
  // trust only that exact form; anything else is tampered/corrupted storage
  // and falls back to "no best" (the next PASS overwrites it cleanly).
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const value = Number(raw);
  return value > 0 ? value : null;
}

/** Records a PASS's cycle count, keeping the lower of the new and prior best. Returns the best. */
export function recordScore(levelId: string, cycles: number): number {
  const current = getBestCycles(levelId);
  const best = current === null ? cycles : Math.min(current, cycles);
  const storage = getStorage();
  if (storage) {
    storage.setItem(KEY_PREFIX + levelId, String(best));
  }
  return best;
}
