import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "./actions";
import { UploadZone } from "./upload-zone";
import { UrlInput } from "./url-input";
import { CameraStage } from "./camera-stage";
import { FolderStack } from "./folder-stack";
import { RealtimeRefresh } from "./realtime-refresh";
import { groupIntoBundles, type ItemRow } from "@/lib/bundles";

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
    .select("id, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const items = (itemsData ?? []) as ItemRow[];
  const bundles = groupIntoBundles(items);

  return (
    <>
      <CameraStage />
      <RealtimeRefresh userId={user.id} />

      <main className="relative z-10 min-h-screen p-6 max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="bg-white/85 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
            <p className="text-xs text-neutral-500">{user.email}</p>
            <h1 className="text-xl font-medium">cleaning dance</h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-neutral-700 bg-white/85 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm hover:text-neutral-900"
            >
              로그아웃
            </button>
          </form>
        </header>

        <div className="bg-white/85 backdrop-blur-md rounded-lg p-4 space-y-4 shadow-sm">
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
        </div>

        {bundles.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-white px-3 py-1.5 rounded bg-black/30 backdrop-blur-sm">
              아직 묶을 게 없어요. 위에서 올려보세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 content-start">
            {bundles.map((b) => (
              <FolderStack key={b.items[0].id} bundle={b} />
            ))}
          </div>
        )}

        <p className="text-xs text-white/90 inline-block bg-black/25 backdrop-blur-sm rounded px-2 py-1">
          M2 — Scene 01 자동 렌더 · 묶음 {bundles.length}
        </p>
      </main>
    </>
  );
}
