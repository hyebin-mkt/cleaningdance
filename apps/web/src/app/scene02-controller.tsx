"use client";

import { useEffect, useRef, useState } from "react";
import type { Bundle } from "@/lib/bundles";
import { getPointer } from "@/lib/hand-pointer";
import { FolderStack } from "./folder-stack";
import { Scene03Stage } from "./scene03-stage";

const HOVER_THRESHOLD_MS = 1000;

type Hover = { id: string; startedAt: number };

export function Scene02Controller({ bundles }: { bundles: Bundle[] }) {
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hoverRef = useRef<Hover | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverProgress, setHoverProgress] = useState(0);
  const [selected, setSelected] = useState<Bundle | null>(null);

  useEffect(() => {
    if (selected) return;
    let raf = 0;
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      const pointer = getPointer();

      let foundId: string | null = null;
      if (pointer) {
        for (const [id, el] of itemRefs.current) {
          const rect = el.getBoundingClientRect();
          if (
            pointer.x >= rect.left &&
            pointer.x <= rect.right &&
            pointer.y >= rect.top &&
            pointer.y <= rect.bottom
          ) {
            foundId = id;
            break;
          }
        }
      }

      const now = performance.now();
      const prev = hoverRef.current;

      if (foundId === null) {
        if (prev !== null) {
          hoverRef.current = null;
          setHoverId(null);
          setHoverProgress(0);
        }
      } else if (!prev || prev.id !== foundId) {
        hoverRef.current = { id: foundId, startedAt: now };
        setHoverId(foundId);
        setHoverProgress(0);
      } else {
        const elapsed = now - prev.startedAt;
        const progress = Math.min(1, elapsed / HOVER_THRESHOLD_MS);
        setHoverProgress(progress);
        if (elapsed >= HOVER_THRESHOLD_MS) {
          const found = bundles.find((b) => b.items[0].id === foundId);
          if (found) {
            setSelected(found);
            return;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [bundles, selected]);

  if (bundles.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs text-white px-3 py-1.5 rounded bg-black/30 backdrop-blur-sm">
          아직 묶을 게 없어요. 위에서 올려보세요.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 content-start">
        {bundles.map((b) => {
          const id = b.items[0].id;
          const isHover = hoverId === id;
          const isSelected = selected?.items[0].id === id;
          return (
            <div
              key={id}
              ref={(el) => {
                if (el) itemRefs.current.set(id, el);
                else itemRefs.current.delete(id);
              }}
              className={`relative transition-all duration-300 ${
                isSelected ? "opacity-0 scale-90" : "opacity-100"
              }`}
            >
              <FolderStack bundle={b} />
              {isHover && !selected && (
                <div
                  className="absolute -inset-1 pointer-events-none rounded-lg"
                  style={{
                    boxShadow: `0 0 0 ${2 + hoverProgress * 6}px rgba(255,255,255,${0.25 + hoverProgress * 0.55}), 0 0 ${12 + hoverProgress * 24}px rgba(255,255,255,${hoverProgress * 0.6})`,
                    transition: "box-shadow 60ms linear",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {selected && <Scene03Stage bundle={selected} />}
    </>
  );
}
