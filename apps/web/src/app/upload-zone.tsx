"use client";

import { useRef, type DragEvent } from "react";
import { uploadFiles } from "./actions";

export function UploadZone() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const input = inputRef.current;
    const form = formRef.current;
    if (!input || !form) return;

    const dt = new DataTransfer();
    Array.from(e.dataTransfer.files).forEach((f) => dt.items.add(f));
    input.files = dt.files;
    form.requestSubmit();
  }

  return (
    <form ref={formRef} action={uploadFiles}>
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="block border-2 border-dashed border-neutral-300 rounded-lg p-10 text-center cursor-pointer hover:bg-neutral-50 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          name="files"
          multiple
          accept="image/*"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
        <p className="text-sm text-neutral-600">
          여기에 이미지 떨어뜨리거나 클릭해서 골라주세요
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          jpg · png · webp · gif · 한 장 최대 20MB
        </p>
      </label>
    </form>
  );
}
