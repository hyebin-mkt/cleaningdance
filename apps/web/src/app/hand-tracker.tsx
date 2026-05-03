"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { getHandLandmarker } from "@/lib/hand-tracking";
import { setHands, type HandResult } from "@/lib/hand-store";

export function HandTracker({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const rafRef = useRef<number>(0);
  const lastTsRef = useRef<number>(-1);

  useEffect(() => {
    let cancelled = false;
    let landmarker: HandLandmarker | null = null;

    async function start() {
      try {
        landmarker = await getHandLandmarker();
      } catch (e) {
        console.error("[hand-tracker] init failed", e);
        return;
      }
      if (cancelled) return;

      const tick = (ts: number) => {
        if (cancelled) return;
        const video = videoRef.current;
        if (
          video &&
          video.readyState >= 2 &&
          landmarker &&
          ts !== lastTsRef.current
        ) {
          lastTsRef.current = ts;
          const result = landmarker.detectForVideo(video, ts);
          const hands: HandResult[] = (result.landmarks ?? []).map(
            (lms, i) => ({
              landmarks: lms,
              handedness:
                (result.handedness?.[i]?.[0]?.categoryName as
                  | "Left"
                  | "Right") ?? "Right",
              score: result.handedness?.[i]?.[0]?.score ?? 0,
            }),
          );
          setHands(hands);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      setHands([]);
    };
  }, [videoRef]);

  return null;
}
