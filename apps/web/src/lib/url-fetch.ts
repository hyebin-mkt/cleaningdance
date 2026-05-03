import { lookup } from "node:dns/promises";
import { parse } from "node-html-parser";

const FETCH_TIMEOUT_MS = 5000;
const MAX_BODY_BYTES = 500_000;
const MAX_REDIRECTS = 3;
const USER_AGENT =
  "cleaning-dance/0.1 (+https://github.com/hyebin-mkt/cleaningdance)";

export type LinkPreview = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
};

export class UnsupportedUrlError extends Error {
  constructor() {
    super("이 형식은 저장이 어렵습니다");
  }
}

// IPv4·IPv6 사설/예약 대역인지 판정
function isPrivateOrReserved(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // private
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  if (/^f[cd]/.test(lower)) return true; // unique local
  if (lower.startsWith("ff")) return true; // multicast
  if (lower.startsWith("::ffff:")) {
    return isPrivateOrReserved(lower.slice(7));
  }
  return false;
}

function looksLikeIpLiteral(host: string): boolean {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (host.includes(":")) return true; // IPv6 (URL hostname strips brackets)
  return false;
}

async function validateUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsupportedUrlError();
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UnsupportedUrlError();
  }

  // IP 리터럴 호스트 일괄 거부 — 정상 콘텐츠는 보통 도메인 사용
  if (looksLikeIpLiteral(parsed.hostname)) {
    throw new UnsupportedUrlError();
  }

  try {
    const { address } = await lookup(parsed.hostname);
    if (isPrivateOrReserved(address)) {
      throw new UnsupportedUrlError();
    }
  } catch (e) {
    if (e instanceof UnsupportedUrlError) throw e;
    throw new UnsupportedUrlError();
  }

  return parsed;
}

async function fetchHtml(
  inputUrl: string,
): Promise<{ html: string; finalUrl: string }> {
  let currentUrl = inputUrl;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await validateUrl(currentUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual", // 매 hop을 직접 검증
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } catch {
      clearTimeout(timer);
      throw new UnsupportedUrlError();
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new UnsupportedUrlError();
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!res.ok) throw new UnsupportedUrlError();

    const contentType = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      throw new UnsupportedUrlError();
    }

    const reader = res.body?.getReader();
    if (!reader) throw new UnsupportedUrlError();

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }

    const buf = Buffer.concat(chunks);
    return { html: buf.toString("utf-8"), finalUrl: currentUrl };
  }

  throw new UnsupportedUrlError();
}

function extractMeta(
  html: string,
): Pick<LinkPreview, "title" | "description" | "image"> {
  const root = parse(html);

  const meta = (selector: string): string | undefined => {
    const el = root.querySelector(selector);
    const content = el?.getAttribute("content");
    return content?.trim() || undefined;
  };

  const title =
    meta('meta[property="og:title"]') ??
    meta('meta[name="twitter:title"]') ??
    root.querySelector("title")?.text?.trim() ??
    undefined;

  const description =
    meta('meta[property="og:description"]') ??
    meta('meta[name="twitter:description"]') ??
    meta('meta[name="description"]');

  const image =
    meta('meta[property="og:image"]') ?? meta('meta[name="twitter:image"]');

  return {
    title: title ? title.slice(0, 500) : undefined,
    description: description ? description.slice(0, 1000) : undefined,
    image,
  };
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const { html, finalUrl } = await fetchHtml(url);
  const meta = extractMeta(html);

  // og:image의 상대경로를 절대 URL로 + 스킴 검증
  let image: string | undefined;
  if (meta.image) {
    try {
      const abs = new URL(meta.image, finalUrl);
      if (abs.protocol === "http:" || abs.protocol === "https:") {
        image = abs.toString();
      }
    } catch {
      image = undefined;
    }
  }

  return {
    url: finalUrl,
    title: meta.title,
    description: meta.description,
    image,
  };
}
