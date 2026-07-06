import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBestCycles, recordScore } from "../../src/vm/scores";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("scores (with a localStorage available)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has no best score before anything is recorded", () => {
    expect(getBestCycles("signal-passthrough")).toBeNull();
  });

  it("records the first score as the best", () => {
    expect(recordScore("signal-passthrough", 12)).toBe(12);
    expect(getBestCycles("signal-passthrough")).toBe(12);
  });

  it("keeps the lower of two recorded scores", () => {
    recordScore("signal-passthrough", 12);
    expect(recordScore("signal-passthrough", 5)).toBe(5);
    expect(recordScore("signal-passthrough", 9)).toBe(5);
    expect(getBestCycles("signal-passthrough")).toBe(5);
  });

  it("persists across a fresh read (simulated page reload)", () => {
    recordScore("signal-passthrough", 8);
    expect(getBestCycles("signal-passthrough")).toBe(8);
  });

  it("keeps separate best scores per level", () => {
    recordScore("signal-passthrough", 4);
    recordScore("another-level", 20);
    expect(getBestCycles("signal-passthrough")).toBe(4);
    expect(getBestCycles("another-level")).toBe(20);
  });
});

describe("scores (no localStorage available)", () => {
  it("degrades to a no-op instead of throwing", () => {
    expect(() => recordScore("signal-passthrough", 5)).not.toThrow();
    expect(getBestCycles("signal-passthrough")).toBeNull();
  });
});
