export type Landmark = { x: number; y: number; z: number; visibility?: number };

export type HandResult = {
  landmarks: Landmark[];
  handedness: "Left" | "Right";
  score: number;
};

let state: HandResult[] = [];
const listeners = new Set<() => void>();

export function setHands(next: HandResult[]) {
  state = next;
  listeners.forEach((l) => l());
}

export function getHands(): HandResult[] {
  return state;
}

export function subscribeHands(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
