import "./styles.css";

const canvas = document.querySelector<HTMLCanvasElement>("#board");
const statusEl = document.querySelector<HTMLElement>("#boot-status");

if (!canvas) {
  throw new Error("Signalworks: #board canvas not found");
}

const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Signalworks: 2D canvas context unavailable");
}

let width = 0;
let height = 0;

function resize(): void {
  const rect = canvas!.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  width = rect.width;
  height = rect.height;
  canvas!.width = Math.max(1, Math.round(width * dpr));
  canvas!.height = Math.max(1, Math.round(height * dpr));
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);
resize();

const TRACE_Y_RATIO = 0.5;
const PULSE_PERIOD_MS = 2600;

function frame(timestampMs: number): void {
  ctx!.clearRect(0, 0, width, height);

  const marginX = Math.min(64, width * 0.08);
  const traceY = height * TRACE_Y_RATIO;

  ctx!.strokeStyle = "rgba(143, 176, 209, 0.35)";
  ctx!.lineWidth = 2;
  ctx!.beginPath();
  ctx!.moveTo(marginX, traceY);
  ctx!.lineTo(width - marginX, traceY);
  ctx!.stroke();

  const t = (timestampMs % PULSE_PERIOD_MS) / PULSE_PERIOD_MS;
  const pulseX = marginX + t * (width - marginX * 2);

  const gradient = ctx!.createRadialGradient(pulseX, traceY, 0, pulseX, traceY, 14);
  gradient.addColorStop(0, "rgba(79, 209, 255, 0.9)");
  gradient.addColorStop(1, "rgba(79, 209, 255, 0)");
  ctx!.fillStyle = gradient;
  ctx!.beginPath();
  ctx!.arc(pulseX, traceY, 14, 0, Math.PI * 2);
  ctx!.fill();

  ctx!.fillStyle = "#4fd1ff";
  ctx!.beginPath();
  ctx!.arc(pulseX, traceY, 4, 0, Math.PI * 2);
  ctx!.fill();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

if (statusEl) {
  statusEl.textContent = "board online — VM and assembler land next run";
}
