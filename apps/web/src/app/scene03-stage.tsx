"use client";

import { useEffect, useState } from "react";
import type { Bundle } from "@/lib/bundles";
import { getHands } from "@/lib/hand-store";
import { pushSnapshot, clearHistory } from "@/lib/hand-history";
import { detectTear, detectTwoHandCircle } from "@/lib/dismantle-detect";
import { play, unmute } from "@/lib/music-controller";
import { FolderStack } from "./folder-stack";
import { YouTubePlayer } from "./youtube-player";

const FIRST_SONG_ID = "9RoZN7Dnoo4";
const FALLBACK_PROMPT_AFTER_MS = 8000;

type Phase = "watching" | "fallback-prompt" | "dismantling" | "queue-ready";

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function Scene03Stage({ bundle }: { bundle: Bundle }) {
  const [phase, setPhase] = useState<Phase>("watching");
  const [queue, setQueue] = useState<Bundle["items"]>([]);

  useEffect(() => {
    if (phase === "dismantling" || phase === "queue-ready") return;
    clearHistory();
    let raf = 0;
    let cancelled = false;
    const start = performance.now();

    function tick() {
      if (cancelled) return;
      const hands = getHands();
      pushSnapshot(hands);

      const tear = detectTear();
      const circle =
        phase === "fallback-prompt" && detectTwoHandCircle(hands);

      if (tear || circle) {
        setPhase("dismantling");
        return;
      }

      if (
        phase === "watching" &&
        performance.now() - start > FALLBACK_PROMPT_AFTER_MS
      ) {
        setPhase("fallback-prompt");
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "dismantling") return;
    play();
    unmute();
    const t = setTimeout(() => {
      setQueue(shuffle(bundle.items));
      setPhase("queue-ready");
    }, 900);
    return () => clearTimeout(t);
  }, [phase, bundle.items]);

  return (
    <>
      <div className="fixed inset-0 z-20 bg-black/35 backdrop-blur-sm pointer-events-none" />

      <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
        <div
          className={
            phase === "dismantling"
              ? "scale-[2.6] opacity-0 transition-all duration-700 ease-out"
              : phase === "queue-ready"
                ? "scale-[0.4] opacity-0 transition-all duration-500"
                : "scale-[2] origin-center transition-transform duration-500"
          }
        >
          <FolderStack bundle={bundle} />
        </div>
      </div>

      {phase === "watching" && (
        <p className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 text-xs text-white/90 px-3 py-1.5 rounded bg-black/40 backdrop-blur-sm">
          폴더를 양손으로 찢어줘
        </p>
      )}

      {phase === "fallback-prompt" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5">
          <p className="text-xs text-white/95 px-3 py-1.5 rounded bg-black/50 backdrop-blur-sm">
            폴더를 열까요? 양손으로 동그라미 만들어줘
          </p>
        </div>
      )}

      {phase === "queue-ready" && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-3 pointer-events-none">
          <p className="text-sm text-white/95 px-4 py-2 rounded bg-black/50 backdrop-blur-sm">
            {queue.length}장 풀렸어 — Scene 04에서 1장씩 분류 (M7)
          </p>
        </div>
      )}

      <YouTubePlayer videoId={FIRST_SONG_ID} />
    </>
  );
}
