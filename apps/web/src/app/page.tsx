import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl">환영합니다</h1>
        <p className="text-sm text-neutral-500">{user.email}</p>
        <p className="text-xs text-neutral-400">
          M0 스캐폴드 ✓ — 다음: M1 업로드
        </p>
      </div>
    </main>
  );
}
