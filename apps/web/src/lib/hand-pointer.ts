import { getHands } from "./hand-store";

const INDEX_TIP = 8;

export type Pointer = { x: number; y: number } | null;

export function getPointer(): Pointer {
  const hands = getHands();
  if (hands.length === 0) return null;
  const tip = hands[0].landmarks[INDEX_TIP];
  return {
    x: (1 - tip.x) * window.innerWidth,
    y: tip.y * window.innerHeight,
  };
}
