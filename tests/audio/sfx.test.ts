import { beforeEach, describe, expect, it } from "vitest";
import {
  isMuted,
  playError,
  playRoute,
  playSuccess,
  playTick,
  playWin,
  setMuted,
  toggleMute,
} from "../../src/audio/sfx";

describe("mute state", () => {
  beforeEach(() => {
    setMuted(false);
  });

  it("defaults to unmuted", () => {
    expect(isMuted()).toBe(false);
  });

  it("toggleMute flips and returns the new state", () => {
    expect(toggleMute()).toBe(true);
    expect(isMuted()).toBe(true);
    expect(toggleMute()).toBe(false);
    expect(isMuted()).toBe(false);
  });

  it("setMuted sets an explicit state", () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
  });
});

describe("SFX playback without an AudioContext (headless/test environment)", () => {
  it("never throws when no AudioContext is available", () => {
    expect(() => playTick()).not.toThrow();
    expect(() => playRoute()).not.toThrow();
    expect(() => playSuccess()).not.toThrow();
    expect(() => playError()).not.toThrow();
    expect(() => playWin()).not.toThrow();
  });
});
