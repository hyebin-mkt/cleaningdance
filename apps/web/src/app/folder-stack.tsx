import type { Bundle } from "@/lib/bundles";

function formatSlot(b: Bundle): string {
  const dateFmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  });
  const hourFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hour12: false,
  });
  const date = dateFmt.format(b.slotStart);
  const startH = hourFmt.format(b.slotStart);
  const endH = hourFmt.format(b.slotEnd);
  return `${date} · ${startH}–${endH}`;
}

export function FolderStack({ bundle }: { bundle: Bundle }) {
  return (
    <div className="relative w-32 h-24 shrink-0">
      <div className="absolute inset-0 translate-x-[6px] translate-y-[6px] rounded bg-white/50 border border-neutral-300/70 shadow-sm" />
      <div className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded bg-white/75 border border-neutral-300/80 shadow-sm" />
      <div className="absolute inset-0 rounded bg-white border border-neutral-400 shadow p-2 flex flex-col justify-between">
        <p className="text-[10px] text-neutral-500 leading-tight">
          {formatSlot(bundle)}
        </p>
        <p className="text-2xl font-light text-neutral-700 leading-none">
          {bundle.items.length}
        </p>
      </div>
    </div>
  );
}
