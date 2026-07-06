export type ChipState = "idle" | "running" | "pass" | "fail";

interface Hop {
  from: { x: number; y: number };
  to: { x: number; y: number };
  startMs: number;
  durationMs: number;
  ok: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  startMs: number;
  color: string;
}

const CYAN = "79, 209, 255";
const AMBER = "255, 180, 84";
const GREEN = "110, 231, 160";
const RED = "255, 107, 107";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Draws the Signalworks board: an IN pad, a CPU chip, an OUT pad, and the
 * wires between them. Signal movement, chip faults, and goal/win feedback
 * are all driven by explicit event calls from the session loop rather than
 * inferred from state, so the animation always matches what the CPU did.
 */
export class BoardRenderer {
  private width = 0;
  private height = 0;
  private state: ChipState = "idle";
  private hops: Hop[] = [];
  private sparks: Spark[] = [];
  private faultFlashStartMs: number | null = null;
  private goalPulseStartMs: number | null = null;
  private rafHandle: number | null = null;
  private readonly reducedMotion: boolean;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Signalworks: 2D canvas context unavailable");
    }
    this.ctx = ctx;
    this.reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.max(1, Math.round(this.width * dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setState(state: ChipState): void {
    this.state = state;
  }

  hopInToChip(ok = true): void {
    this.hops.push({ from: this.inPos(), to: this.chipLeftPos(), startMs: performance.now(), durationMs: 110, ok });
  }

  hopChipToOut(ok = true): void {
    this.hops.push({ from: this.chipRightPos(), to: this.outPos(), startMs: performance.now(), durationMs: 110, ok });
  }

  pulseFault(): void {
    this.faultFlashStartMs = performance.now();
  }

  pulseGoal(): void {
    this.goalPulseStartMs = performance.now();
    if (!this.reducedMotion) {
      this.spawnSparks(this.outPos(), GREEN);
    }
  }

  pulseWin(): void {
    if (!this.reducedMotion) {
      this.spawnSparks(this.chipCenter(), CYAN, 18);
    }
  }

  private spawnSparks(origin: { x: number; y: number }, color: string, count = 8): void {
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 40 + Math.random() * 60;
      this.sparks.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        startMs: now,
        color,
      });
    }
  }

  private inPos() {
    return { x: Math.min(56, this.width * 0.12), y: this.height / 2 };
  }

  private outPos() {
    return { x: this.width - Math.min(56, this.width * 0.12), y: this.height / 2 };
  }

  private chipBounds() {
    const w = Math.min(220, this.width * 0.32);
    const h = Math.min(140, this.height * 0.55);
    return { x: this.width / 2 - w / 2, y: this.height / 2 - h / 2, w, h };
  }

  private chipLeftPos() {
    const b = this.chipBounds();
    return { x: b.x, y: this.height / 2 };
  }

  private chipRightPos() {
    const b = this.chipBounds();
    return { x: b.x + b.w, y: this.height / 2 };
  }

  private chipCenter() {
    return { x: this.width / 2, y: this.height / 2 };
  }

  start(): void {
    if (this.rafHandle !== null) {
      return;
    }
    const loop = (now: number) => {
      this.render(now);
      this.rafHandle = requestAnimationFrame(loop);
    };
    this.rafHandle = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
  }

  private render(nowMs: number): void {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);
    if (width === 0 || height === 0) {
      return;
    }

    this.drawWires();
    this.drawPad(this.inPos(), "IN");
    this.drawPad(this.outPos(), "OUT", this.goalGlowStrength(nowMs));
    this.drawChip(nowMs);
    this.drawHops(nowMs);
    this.drawSparks(nowMs);
  }

  private drawWires(): void {
    const { ctx } = this;
    const b = this.chipBounds();
    ctx.strokeStyle = `rgba(${CYAN}, 0.28)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.inPos().x, this.height / 2);
    ctx.lineTo(b.x, this.height / 2);
    ctx.moveTo(b.x + b.w, this.height / 2);
    ctx.lineTo(this.outPos().x, this.height / 2);
    ctx.stroke();
  }

  private drawPad(pos: { x: number; y: number }, label: string, glow = 0): void {
    const { ctx } = this;
    const radius = 10;
    if (glow > 0) {
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 3);
      gradient.addColorStop(0, `rgba(${GREEN}, ${0.5 * glow})`);
      gradient.addColorStop(1, `rgba(${GREEN}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#123a63";
    ctx.strokeStyle = `rgba(${CYAN}, 0.6)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#8fb0d1";
    ctx.font = "600 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, pos.x, pos.y + radius + 16);
  }

  private goalGlowStrength(nowMs: number): number {
    if (this.goalPulseStartMs === null) {
      return 0;
    }
    const t = (nowMs - this.goalPulseStartMs) / 400;
    if (t >= 1) {
      this.goalPulseStartMs = null;
      return 0;
    }
    return 1 - t;
  }

  private drawChip(nowMs: number): void {
    const { ctx } = this;
    const b = this.chipBounds();
    let offsetX = 0;
    let flashStrength = 0;

    if (this.faultFlashStartMs !== null) {
      const t = (nowMs - this.faultFlashStartMs) / 150;
      if (t >= 1) {
        this.faultFlashStartMs = null;
      } else {
        flashStrength = 1 - t;
        if (!this.reducedMotion) {
          offsetX = Math.sin(t * Math.PI * 6) * 3 * flashStrength;
        }
      }
    }

    const stateColor = this.state === "pass" ? GREEN : this.state === "fail" ? RED : CYAN;

    ctx.save();
    ctx.translate(offsetX, 0);
    ctx.fillStyle = flashStrength > 0 ? `rgba(${AMBER}, ${0.25 + 0.35 * flashStrength})` : "#1b4b7a";
    ctx.strokeStyle = `rgba(${stateColor}, ${this.state === "running" ? 0.9 : 0.5})`;
    ctx.lineWidth = 2;
    if (this.state === "running") {
      ctx.shadowColor = `rgba(${stateColor}, 0.6)`;
      ctx.shadowBlur = 16;
    }
    const radius = 4;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, radius);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#eaf2fb";
    ctx.font = "600 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CHIP0", b.x + b.w / 2, b.y + b.h / 2 + 5);
    ctx.restore();
  }

  private drawHops(nowMs: number): void {
    const { ctx } = this;
    this.hops = this.hops.filter((hop) => {
      const t = (nowMs - hop.startMs) / hop.durationMs;
      if (t >= 1) {
        return false;
      }
      const eased = easeOutCubic(Math.max(0, t));
      const x = hop.from.x + (hop.to.x - hop.from.x) * eased;
      const y = hop.from.y + (hop.to.y - hop.from.y) * eased;
      const color = hop.ok ? CYAN : AMBER;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 14);
      gradient.addColorStop(0, `rgba(${color}, 0.9)`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgb(${color})`;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
  }

  private drawSparks(nowMs: number): void {
    const { ctx } = this;
    const lifeMs = 500;
    this.sparks = this.sparks.filter((spark) => {
      const t = (nowMs - spark.startMs) / lifeMs;
      if (t >= 1) {
        return false;
      }
      const x = spark.x + spark.vx * t;
      const y = spark.y + spark.vy * t;
      ctx.fillStyle = `rgba(${spark.color}, ${1 - t})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
  }
}
