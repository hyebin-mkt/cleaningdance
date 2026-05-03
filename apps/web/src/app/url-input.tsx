"use client";

import { submitUrl } from "./actions";

export function UrlInput() {
  return (
    <form action={submitUrl} className="flex gap-2">
      <input
        type="url"
        name="url"
        required
        placeholder="https://..."
        className="flex-1 border rounded px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-black text-white rounded text-sm whitespace-nowrap"
      >
        링크 저장
      </button>
    </form>
  );
}
