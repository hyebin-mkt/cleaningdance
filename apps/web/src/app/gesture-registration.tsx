"use client";

import { useState } from "react";
import { getHands } from "@/lib/hand-store";
import {
  normalize,
  averageTemplates,
  type Template,
} from "@/lib/gesture-matching";
import { saveGestures } from "./actions";

const SAMPLE_COUNT = 5;
const SAMPLE_INTERVAL_MS = 200;

type Step = 1 | 2 | 3 | 4;

const SLOT_HINTS: Record<Step, string> = {
  1: "1번 손동작을 보여줘. 어떤 자세든 좋아 — 본인이 알아볼 수만 있으면 돼.",
  2: "2번 손동작. 1번이랑 확실히 다르게.",
  3: "3번. 또 다른 자세로.",
  4: "마지막 4번. 4개 모두 서로 구분되는 자세여야 해.",
};

export function GestureRegistration() {
  const [step, setStep] = useState<Step>(1);
  const [phase, setPhase] = useState<"idle" | "capturing" | "saving" | "done">(
    "idle",
  );
  const [captured, setCaptured] = useState<Record<number, Template>>({});
  const [error, setError] = useState<string | null>(null);

  async function captureCurrent() {
    setError(null);
    setPhase("capturing");
    const samples: Template[] = [];

    for (let i = 0; i < SAMPLE_COUNT; i++) {
      await new Promise((r) => setTimeout(r, SAMPLE_INTERVAL_MS));
      const hands = getHands();
      if (hands.length === 0) {
        setError("손이 안 잡혀. 카메라 안에 손이 보이게.");
        setPhase("idle");
        return;
      }
      samples.push(normalize(hands[0].landmarks));
    }

    const template = averageTemplates(samples);
    const next = { ...captured, [step]: template };
    setCaptured(next);

    if (step < 4) {
      setStep((step + 1) as Step);
      setPhase("idle");
      return;
    }

    setPhase("saving");
    const rows = [1, 2, 3, 4].map((s) => ({ slot: s, template: next[s] }));
    const result = await saveGestures(rows);
    if (result.ok) {
      setPhase("done");
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      setError(result.error);
      setPhase("idle");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
        <div>
          <p className="text-xs text-neutral-500">Scene 00 · 어휘 등록</p>
          <h2 className="text-lg font-medium mt-1">
            {phase === "done"
              ? "어휘 4개 모두 저장했어 ✨"
              : `손동작 ${step} / 4`}
          </h2>
        </div>

        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                captured[s]
                  ? "bg-neutral-900"
                  : s === step
                    ? "bg-neutral-400"
                    : "bg-neutral-200"
              }`}
            />
          ))}
        </div>

        {phase !== "done" && (
          <p className="text-sm text-neutral-700 leading-relaxed min-h-[3rem]">
            {SLOT_HINTS[step]}
          </p>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded p-2">{error}</p>
        )}

        {phase === "done" ? (
          <p className="text-sm text-neutral-500">
            잠깐만 — 페이지 다시 불러올게.
          </p>
        ) : (
          <button
            type="button"
            onClick={captureCurrent}
            disabled={phase !== "idle"}
            className="w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-700 disabled:bg-neutral-400 transition-colors"
          >
            {phase === "capturing"
              ? "잡는 중… 1초 그대로"
              : phase === "saving"
                ? "저장 중…"
                : "이 자세 잡기"}
          </button>
        )}

        <p className="text-[11px] text-neutral-400 text-center">
          이 4개 동작은 본인 어휘로 영구 저장돼. 베타엔 재등록 메뉴 없으니 신중히.
        </p>
      </div>
    </div>
  );
}
