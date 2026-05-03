import { signInWithEmail, signInWithGoogle } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-medium">cleaning dance에 들어가기</h1>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full border rounded px-3 py-2 hover:bg-neutral-50"
          >
            Google로 계속하기
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <div className="flex-1 border-t" />
          <span>또는</span>
          <div className="flex-1 border-t" />
        </div>

        <form action={signInWithEmail} className="space-y-4">
          <input
            type="email"
            name="email"
            required
            placeholder="email@example.com"
            className="w-full border rounded px-3 py-2"
          />
          <button
            type="submit"
            className="w-full bg-black text-white rounded px-3 py-2"
          >
            메일로 링크 받기
          </button>
        </form>

        {params.sent && (
          <p className="text-sm text-green-700">
            메일함을 확인해주세요. 링크 누르면 들어옵니다.
          </p>
        )}
        {params.error && (
          <p className="text-sm text-red-700">{params.error}</p>
        )}
      </div>
    </main>
  );
}
