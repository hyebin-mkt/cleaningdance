import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "./actions";
import { UploadZone } from "./upload-zone";
import { UrlInput } from "./url-input";

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

      <p className="text-xs text-neutral-400">
        M1.2 — URL 인입 ✓ · 다음: M1.3 검증 리스트
      </p>
    </main>
  );
}
