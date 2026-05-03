"use client";

import { useEffect, useRef } from "react";
import { getHands } from "@/lib/hand-store";

const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export function HandDebugOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let cancelled = false;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.clientWidth * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (cancelled) return;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      const hands = getHands();
      const dpr = window.devicePixelRatio || 1;

      for (const hand of hands) {
        const pts = hand.landmarks.map((l) => ({
          x: (1 - l.x) * w,
          y: l.y * h,
        }));

        ctx!.lineWidth = 2 * dpr;
        ctx!.strokeStyle =
          hand.handedness === "Left"
            ? "rgba(180, 220, 255, 0.85)"
            : "rgba(255, 200, 180, 0.85)";
        for (const [a, b] of HAND_CONNECTIONS) {
          ctx!.beginPath();
          ctx!.moveTo(pts[a].x, pts[a].y);
          ctx!.lineTo(pts[b].x, pts[b].y);
          ctx!.stroke();
        }

        ctx!.fillStyle = "rgba(255, 255, 255, 0.95)";
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const r = (i === 8 ? 6 : 3.5) * dpr;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-40 pointer-events-none w-full h-full"
    />
  );
}
