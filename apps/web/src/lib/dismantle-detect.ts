import { recent } from "./hand-history";
import type { HandResult, Landmark } from "./hand-store";

const WRIST = 0;
const INDEX_TIP = 8;
const THUMB_TIP = 4;

const TEAR_WINDOW_MS = 500;
const TEAR_CLOSE = 0.20;
const TEAR_FAR = 0.45;

const CIRCLE_INDEX_GAP = 0.08;
const CIRCLE_THUMB_GAP = 0.08;

function dist(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function bothHandsWrists(hands: HandResult[]): [Landmark, Landmark] | null {
  if (hands.length < 2) return null;
  return [hands[0].landmarks[WRIST], hands[1].landmarks[WRIST]];
}

export function detectTear(): boolean {
  const window = recent(TEAR_WINDOW_MS);
  if (window.length < 6) return false;

  const start = bothHandsWrists(window[0].hands);
  const end = bothHandsWrists(window[window.length - 1].hands);
  if (!start || !end) return false;

  const startD = dist(start[0], start[1]);
  const endD = dist(end[0], end[1]);
  return startD < TEAR_CLOSE && endD > TEAR_FAR;
}

export function detectTwoHandCircle(hands: HandResult[]): boolean {
  if (hands.length < 2) return false;
  const a = hands[0].landmarks;
  const b = hands[1].landmarks;
  return (
    dist(a[INDEX_TIP], b[INDEX_TIP]) < CIRCLE_INDEX_GAP &&
    dist(a[THUMB_TIP], b[THUMB_TIP]) < CIRCLE_THUMB_GAP
  );
}
