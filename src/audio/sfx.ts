const MUTE_STORAGE_KEY = "signalworks:muted";

let audioContext: AudioContext | null = null;
let muted = readStoredMute();

function readStoredMute(): boolean {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredMute(value: boolean): void {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, value ? "1" : "0");
  } catch {
    // localStorage unavailable (private browsing, disabled storage) — mute
    // state just won't persist across reloads.
  }
}

/** Lazily creates the shared AudioContext on first use, honoring the autoplay policy. */
function getContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
    return null;
  }
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  writeStoredMute(value);
}

export function toggleMute(): boolean {
  setMuted(!muted);
  return muted;
}

interface ToneOptions {
  frequency: number;
  durationMs: number;
  type?: OscillatorType;
  gain?: number;
  glideToFrequency?: number;
}

function playTone({ frequency, durationMs, type = "sine", gain = 0.15, glideToFrequency }: ToneOptions): void {
  if (muted) {
    return;
  }
  const ctx = getContext();
  if (!ctx) {
    return;
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (glideToFrequency) {
    oscillator.frequency.linearRampToValueAtTime(glideToFrequency, ctx.currentTime + durationMs / 1000);
  }

  const durationSec = durationMs / 1000;
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

  oscillator.connect(gainNode).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + durationSec);
}

/** A very short, quiet blip on every CPU cycle step. */
export function playTick(): void {
  playTone({ frequency: 880, durationMs: 20, type: "square", gain: 0.03 });
}

/** A soft rising blip when a signal moves between chips. */
export function playRoute(): void {
  playTone({ frequency: 440, glideToFrequency: 660, durationMs: 90, type: "sine", gain: 0.12 });
}

/** A gentle pop when an output value matches what a level expects. */
export function playSuccess(): void {
  playTone({ frequency: 660, glideToFrequency: 990, durationMs: 140, type: "triangle", gain: 0.14 });
}

/** A short low buzz on a runtime fault. */
export function playError(): void {
  playTone({ frequency: 180, glideToFrequency: 90, durationMs: 220, type: "sawtooth", gain: 0.16 });
}

/** A brighter little fanfare when a level is fully solved. */
export function playWin(): void {
  const ctx = getContext();
  if (!ctx || muted) {
    return;
  }
  [523.25, 659.25, 783.99].forEach((frequency, i) => {
    setTimeout(() => playTone({ frequency, durationMs: 160, type: "triangle", gain: 0.16 }), i * 90);
  });
}
