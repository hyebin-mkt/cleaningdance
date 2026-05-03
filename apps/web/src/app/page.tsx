import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "./actions";
import { UploadZone } from "./upload-zone";
import { UrlInput } from "./url-input";

type Item = {
  id: string;
  type: "image" | "link";
  image_url: string | null;
  source_url: string | null;
  title: string | null;
  created_at: string;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    uploaded?: string;
    linked?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: itemsData } = await supabase
    .from("items")
    .select("id, type, image_url, source_url, title, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (itemsData ?? []) as Item[];

  // private 버킷이라 image 타입은 일괄 signed URL 생성 (1시간 TTL)
  const imagePaths = items
    .filter((i) => i.type === "image" && i.image_url)
    .map((i) => i.image_url as string);

  const signedMap = new Map<string, string>();
  if (imagePaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("items")
      .createSignedUrls(imagePaths, 3600);
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
    });
  }

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500">{user.email}</p>
          <h1 className="text-xl font-medium">cleaning dance</h1>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            로그아웃
          </button>
        </form>
      </header>

      <UploadZone />
      <UrlInput />

      {params.uploaded && (
        <p className="text-sm text-green-700">
          {params.uploaded}장 올라왔어요. 기특해 ✨
        </p>
      )}
      {params.linked && (
        <p className="text-sm text-green-700">링크 저장됐어요. 기특해 ✨</p>
      )}
      {params.error && (
        <p className="text-sm text-red-700">{params.error}</p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-500">
          최근 항목 {items.length > 0 && `(${items.length})`}
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-neutral-400">
            아직 아무것도 없어요. 위에서 올려보세요.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => {
              const imgSrc =
                item.type === "image" && item.image_url
                  ? signedMap.get(item.image_url)
                  : (item.image_url ?? undefined);

              return (
                <div
                  key={item.id}
                  className="border rounded overflow-hidden bg-white"
                >
                  {imgSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgSrc}
                      alt={item.title ?? ""}
                      className="w-full aspect-square object-cover"
                    />
                  )}
                  {item.type === "link" && (
                    <div className="p-2 space-y-1">
                      <p className="text-xs font-medium line-clamp-2">
                        {item.title ?? item.source_url}
                      </p>
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-500 hover:underline truncate block"
                        >
                          {item.source_url}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-xs text-neutral-400">
        M1.3 — 검증 리스트 ✓ · 다음: M2 3시간 묶음
      </p>
    </main>
  );
}
