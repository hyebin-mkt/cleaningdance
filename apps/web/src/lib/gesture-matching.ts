import type { Landmark } from "./hand-store";

export type Template = { x: number; y: number; z: number }[];

const WRIST = 0;
const MIDDLE_MCP = 9;

export function normalize(landmarks: Landmark[]): Template {
  const wrist = landmarks[WRIST];
  const middleMcp = landmarks[MIDDLE_MCP];
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const dz = middleMcp.z - wrist.z;
  const scale = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

  return landmarks.map((p) => ({
    x: (p.x - wrist.x) / scale,
    y: (p.y - wrist.y) / scale,
    z: (p.z - wrist.z) / scale,
  }));
}

export function averageTemplates(samples: Template[]): Template {
  const n = samples.length;
  if (n === 0) throw new Error("averageTemplates: empty samples");
  const out: Template = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  for (const s of samples) {
    for (let i = 0; i < 21; i++) {
      out[i].x += s[i].x;
      out[i].y += s[i].y;
      out[i].z += s[i].z;
    }
  }
  for (let i = 0; i < 21; i++) {
    out[i].x /= n;
    out[i].y /= n;
    out[i].z /= n;
  }
  return out;
}

export function distance(a: Template, b: Template): number {
  let sum = 0;
  for (let i = 0; i < 21; i++) {
    const dx = a[i].x - b[i].x;
    const dy = a[i].y - b[i].y;
    const dz = a[i].z - b[i].z;
    sum += dx * dx + dy * dy + dz * dz;
  }
  return Math.sqrt(sum);
}

export const MATCH_THRESHOLD = 1.5;

export function classify(
  current: Template,
  templates: { slot: number; template: Template }[],
): { slot: number; distance: number } | null {
  let best: { slot: number; distance: number } | null = null;
  for (const t of templates) {
    const d = distance(current, t.template);
    if (!best || d < best.distance) {
      best = { slot: t.slot, distance: d };
    }
  }
  if (!best || best.distance > MATCH_THRESHOLD) return null;
  return best;
}
