"use server";

import { createClient } from "@/lib/supabase/server";
import {
  fetchLinkPreview,
  UnsupportedUrlError,
  type LinkPreview,
} from "@/lib/url-fetch";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_DIMENSION = 4096;

export async function uploadFiles(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const files = formData.getAll("files") as File[];
  const valid = files.filter((f) => f && f.size > 0);
  if (valid.length === 0) {
    redirect("/?error=no_files");
  }

  let uploaded = 0;
  const errors: string[] = [];

  for (const file of valid) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: 너무 큽니다(>50MB)`);
      continue;
    }

    try {
      const inputBuffer = Buffer.from(await file.arrayBuffer());

      // sharp 메타데이터로 실제 포맷 검증 — Content-Type 헤더는 신뢰하지 않음
      const metadata = await sharp(inputBuffer).metadata();
      if (!metadata.format) {
        errors.push(`${file.name}: 이미지가 아닙니다`);
        continue;
      }

      // EXIF 자동 회전 + 메타 제거(개인정보 보호) + 큰 이미지 축소 + WebP 변환
      const webpBuffer = await sharp(inputBuffer)
        .rotate()
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      const id = crypto.randomUUID();
      const path = `${user.id}/${id}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("items")
        .upload(path, webpBuffer, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) {
        errors.push(`${file.name}: 업로드 실패`);
        continue;
      }

      const { error: insertError } = await supabase.from("items").insert({
        user_id: user.id,
        type: "image",
        image_url: path,
      });

      if (insertError) {
        // 스토리지엔 올라갔는데 DB 삽입 실패 — 스토리지 정리
        await supabase.storage.from("items").remove([path]);
        errors.push(`${file.name}: 저장 실패`);
        continue;
      }

      uploaded++;
    } catch {
      errors.push(`${file.name}: 처리 실패`);
    }
  }

  revalidatePath("/");

  const params = new URLSearchParams();
  if (uploaded > 0) params.set("uploaded", String(uploaded));
  if (errors.length > 0) params.set("error", errors.join(", "));

  redirect(`/?${params.toString()}`);
}

export async function submitUrl(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const url = (formData.get("url") as string)?.trim();
  if (!url) {
    redirect("/?error=no_url");
  }

  let preview: LinkPreview;
  try {
    preview = await fetchLinkPreview(url);
  } catch (e) {
    const msg =
      e instanceof UnsupportedUrlError
        ? e.message
        : "처리 실패";
    redirect(`/?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await supabase.from("items").insert({
    user_id: user.id,
    type: "link",
    source_url: preview.url,
    title: preview.title,
    description: preview.description,
    image_url: preview.image,
  });

  if (error) {
    redirect(`/?error=${encodeURIComponent("저장 실패")}`);
  }

  revalidatePath("/");
  redirect("/?linked=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

type GestureRow = {
  slot: number;
  template: { x: number; y: number; z: number }[];
};

export async function saveGestures(
  rows: GestureRow[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "로그인이 필요해요" };

  if (rows.length !== 4) {
    return { ok: false, error: "4개 슬롯 모두 필요해요" };
  }
  for (const r of rows) {
    if (!Number.isInteger(r.slot) || r.slot < 1 || r.slot > 4) {
      return { ok: false, error: "잘못된 슬롯" };
    }
    if (!Array.isArray(r.template) || r.template.length !== 21) {
      return { ok: false, error: "잘못된 템플릿" };
    }
    for (const p of r.template) {
      if (
        typeof p.x !== "number" ||
        typeof p.y !== "number" ||
        typeof p.z !== "number" ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.y) ||
        !Number.isFinite(p.z)
      ) {
        return { ok: false, error: "템플릿 값 오류" };
      }
    }
  }

  const payload = rows.map((r) => ({
    user_id: user.id,
    slot: r.slot,
    template: r.template,
  }));

  const { error } = await supabase
    .from("gestures")
    .upsert(payload, { onConflict: "user_id,slot" });

  if (error) {
    return { ok: false, error: "저장 실패" };
  }

  revalidatePath("/");
  return { ok: true };
}
