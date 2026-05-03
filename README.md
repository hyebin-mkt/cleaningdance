# cleaning dance

영감 이미지·링크 정리를 음악·제스처가 동반된 짧은 신체적 의식으로 만드는 웹앱.

> "정리는 의식이다."

## 개발

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## 구조

```
apps/
  web/            Next.js 16 + React 19 + TypeScript + Tailwind 4
  (extension/)    Chrome MV3 — M9에서 추가 예정
```

## 스택

- **프론트엔드** Next.js 16, React 19, TypeScript, Tailwind 4
- **카메라/제스처** MediaPipe Tasks (Hand Landmarker)
- **백엔드** Supabase (Auth + Postgres + Storage)
- **음악** YouTube IFrame Player API
- **호스팅** Vercel
