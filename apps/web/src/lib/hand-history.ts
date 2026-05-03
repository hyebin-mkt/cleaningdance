import type { HandResult } from "./hand-store";

export type Snapshot = { t: number; hands: HandResult[] };

const MAX_FRAMES = 60;

let frames: Snapshot[] = [];

export function pushSnapshot(hands: HandResult[]) {
  frames.push({ t: performance.now(), hands });
  if (frames.length > MAX_FRAMES) frames.shift();
}

export function recent(windowMs: number): Snapshot[] {
  const cutoff = performance.now() - windowMs;
  return frames.filter((f) => f.t >= cutoff);
}

export function clearHistory() {
  frames = [];
}
