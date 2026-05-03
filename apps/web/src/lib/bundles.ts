export type ItemRow = {
  id: string;
  created_at: string;
};

export type Bundle = {
  slotKey: string;
  slotStart: Date;
  slotEnd: Date;
  items: ItemRow[];
};

const MAX_BUNDLE_SIZE = 15;

function seoulParts(utc: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(utc);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
  };
}

function slotFor(createdAt: string): { key: string; start: Date; end: Date } {
  const utc = new Date(createdAt);
  const { year, month, day, hour } = seoulParts(utc);
  const block = Math.floor(parseInt(hour, 10) / 3) * 3;
  const blockStr = String(block).padStart(2, "0");
  const start = new Date(`${year}-${month}-${day}T${blockStr}:00:00+09:00`);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  return { key: `${year}-${month}-${day} ${blockStr}`, start, end };
}

export function groupIntoBundles(items: ItemRow[]): Bundle[] {
  const bundles: Bundle[] = [];
  let current: Bundle | null = null;

  for (const item of items) {
    const { key, start, end } = slotFor(item.created_at);
    if (
      current &&
      current.slotKey === key &&
      current.items.length < MAX_BUNDLE_SIZE
    ) {
      current.items.push(item);
    } else {
      current = { slotKey: key, slotStart: start, slotEnd: end, items: [item] };
      bundles.push(current);
    }
  }
  return bundles;
}
