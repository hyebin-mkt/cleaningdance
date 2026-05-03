"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "prompting" | "granted" | "denied" | "unsupported";

export function CameraStage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  async function requestStream() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setStatus("prompting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus("granted");
    } catch {
      setStatus("denied");
    }
  }

  useEffect(() => {
    requestStream();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-neutral-100 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            status === "granted" ? "opacity-100" : "opacity-0"
          }`}
          style={{ transform: "scaleX(-1)" }}
        />
      </div>
      {status === "denied" && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-md border border-neutral-300 rounded-full shadow-lg text-xs">
          <span className="text-neutral-600">카메라 권한이 꺼져 있어요</span>
          <button
            onClick={requestStream}
            className="px-2.5 py-1 rounded-full bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
          >
            다시 요청
          </button>
        </div>
      )}
      {status === "unsupported" && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-3 py-2 bg-white/95 backdrop-blur-md border border-neutral-300 rounded-full shadow-lg text-xs text-neutral-500">
          이 브라우저는 카메라를 지원하지 않아요
        </div>
      )}
    </>
  );
}
