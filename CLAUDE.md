# cleaning dance — 프로젝트 컨텍스트

> **"정리는 의식이다."**
> 영감 이미지·링크 정리를 Y2K 무드의 카메라 제스처 의식으로 만드는 웹앱.

이 파일은 Claude Code가 새 세션을 시작할 때 자동으로 읽는다. 작업 전에 끝까지 한 번 훑을 것.

---

## 0. 새 세션을 시작했다면 — 가장 먼저 할 일

```bash
git log --oneline -10
ls supabase/migrations/
cat .env.local 2>/dev/null && echo "(env 있음)" || echo "(env 없음 — 세팅 필요)"
```

이 세 줄로 *어디까지 왔는지*가 거의 다 보인다.

권장 첫 사용자 프롬프트:
> *"CLAUDE.md 읽고 git log -10 확인한 다음 현재 상태 요약 + 다음 마일스톤 들어가자."*

---

## 1. 디자인 철학 — "기특함의 원칙"

> 오늘 대청소를 하지 않더라도 쓰레기라도 비우는 게 얼마나 기특해

- 결정을 **강요하지 않음** — '다음에' 제스처가 1급 시민
- AI는 **무대장치**이지 분류 주체가 아님
- **평가 X, 칭찬만**
- Pinterest형 무한 스크롤 절대 금지 (의도적 OUT)

이 철학과 충돌하는 기능은 만들지 말 것. 충돌 의심되면 사용자에게 확인.

---

## 2. 보안 자세 (반드시 유지)

사용자는 *사이버보안 전문가 시선*으로 모든 코드·배포·로컬 작업을 검토하길 원한다.

**배포되는 모든 환경에서**
- 새 의존성 추가 = 짧은 공급망 점검
- 시크릿은 git/로그/채팅 절대 X
- DB 새 테이블 = RLS ON + 정책 명시 (`auth.uid() = user_id`)
- OAuth = 최소 scope만 (email, profile, openid)
- CORS·Redirect URL = 화이트리스트만 (와일드카드 금지)
- 외부 URL fetch = SSRF 방어 (스킴·DNS·redirect 매 hop 검증)

**로컬 작업에서**
- 최소권한 — 워킹디렉토리 외부 쓰기는 *의도적·필요할 때만*
- 위험 액션은 **사전 경고 + 명시적 허가**: `rm -rf`, `git reset --hard`, `git push --force`, `brew install`, `sudo`, 글로벌 npm 설치, `~/.zshrc` 등 시스템 영역 수정
- **우회 경로**도 함께 제시 (예: 글로벌 설치 → `pnpm dlx` 1회 실행)
- **글로벌 git config 수정 절대 X** — 본인이 직접

**Bash sandbox**
- 읽기 명령 (`git status`, `ls`, `cat`, `tsc --noEmit`) → sandbox 그대로
- 쓰기 명령 (`git add/commit/push`, `mkdir`, `pnpm install`, 파일 생성) → 워킹디렉토리 외부 쓰기 시 `dangerouslyDisableSandbox: true` 필요

---

## 3. 진척 현황 (베타 v1)

| M | 내용 | Scene | 상태 |
|---|---|---|---|
| **M0** | 모노레포 + Supabase auth (매직링크 + Google OAuth) | — | ✅ |
| **M1.0** | DB 스키마 + RLS + 스토리지 버킷 | — | ✅ |
| **M1.1** | 이미지 업로드 (50MB, WebP, EXIF strip) + 로그아웃 | -1 | ✅ |
| **M1.2** | URL 인입 + OG 메타 + SSRF 방어 | -1 | ✅ |
| **M1.3** | 검증 그리드 (signed URL 1h TTL) | — | ✅ |
| **M2** | **3시간 단위 묶음 표시** | 01 | 🔜 다음 |
| M3 | MediaPipe 손/제스처 디텍션 | — | |
| M4 | 4 제스처 등록 워밍업 | 00 | |
| M5 | 폴더 hover + YouTube 음악 | 02 | |
| M6 | 폴더 해체 제스처 (3종) | 03 | |
| M7 | 1장씩 분류 + 자라는 콜라주 | 04 | |
| M8 | "다음에" sweep + 휴지통 | 05 | |
| M9 | Chrome+Safari 익스텐션 | -2 | |
| M10 | Vercel 직접-업로드 리팩터 + 폴리싱 + 배포 | — | |

**v2 이후 보류**: Scene 06 명명 / 07 종료 / 08 CD 굽기 / 재만남 / DJ 회전 / Y2K 미감 일관 적용

---

## 4. 스토리보드 (단일 진실 원천)

Notion IDEAFLOW DB에 Scene별 카드:
- URL: https://www.notion.so/marketing-chacha/33d535ba621e8099850ff0b4490f2880
- 필터: 탭 = `분석`
- Scene -2 / -1 / 0X(PWA 보류) / 00–05 카드 존재

**M2 들어가기 전 Scene 01 카드 다시 한 번 읽을 것.** 사용자가 직접 수정한 결정사항이 우선.

---

## 5. 외부 시스템 정보

### Supabase
- Project: `ljmynnetuukzitvbtrhu`
- URL: `https://ljmynnetuukzitvbtrhu.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/ljmynnetuukzitvbtrhu
- Anon key: `apps/web/.env.local` (gitignored)
- ⚠️ **Service role key는 절대 사용 X**
- Auth providers: Email magic link + Google OAuth (둘 다 동작)
- Site URL: `http://localhost:3000` (베타)

### GitHub
- Repo: https://github.com/hyebin-mkt/cleaningdance (private)
- Owner: `hyebin-mkt`
- 로컬: `~/Developer/cleaning-dance`
- 브랜치: `main` (베타라 직접 푸시)

---

## 6. 스택

- **Next.js 16** + React 19 + TypeScript + Tailwind 4
- **Supabase** (Auth + Postgres + Storage)
- **sharp** (서버 이미지 처리, WebP 변환, EXIF strip)
- **node-html-parser** (OG 메타 추출)
- **MediaPipe Tasks** (M3+에서 추가)
- **YouTube IFrame Player API** (M5+)
- **Vercel** 배포
- **pnpm 워크스페이스**

---

## 7. 디렉토리 구조

```
cleaning-dance/
├── apps/
│   └── web/                Next.js 앱
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx              홈 (헤더 + 업로드 + URL + 그리드)
│       │   │   ├── actions.ts            uploadFiles, submitUrl, signOut
│       │   │   ├── upload-zone.tsx       드래그-드롭 클라이언트 컴포넌트
│       │   │   ├── url-input.tsx         URL 폼 클라이언트 컴포넌트
│       │   │   ├── login/                로그인 (매직링크 + Google)
│       │   │   └── auth/callback/        OAuth/매직링크 콜백
│       │   ├── lib/
│       │   │   ├── supabase/             브라우저/서버/middleware 클라이언트
│       │   │   └── url-fetch.ts          SSRF-aware fetcher + OG 추출
│       │   └── middleware.ts             Supabase 세션 갱신
│       ├── next.config.ts                serverActions.bodySizeLimit: "250mb"
│       └── .env.local                    Supabase URL + anon key
├── supabase/
│   └── migrations/
│       └── 001_items_schema.sql         items 테이블 + RLS + 스토리지 RLS
├── package.json                          pnpm workspace 루트
├── pnpm-workspace.yaml
└── CLAUDE.md                             ← 이 파일
```

---

## 8. 개발 명령

```bash
cd ~/Developer/cleaning-dance
pnpm install
pnpm dev                  # http://localhost:3000

# 타입 체크
cd apps/web && npx tsc --noEmit

# 새 SQL migration 추가 시
# Supabase Dashboard → SQL Editor에서 직접 실행 (모든 정책에 drop policy if exists 먼저)
```

---

## 9. 알려진 이슈 / 결정거리

1. **Vercel 배포 시 4.5MB body cap** → M10에서 클라이언트 직접-업로드 패턴 리팩터 예정
2. **DNS 리바인딩 작은 창** (URL fetch 검증→실 fetch 사이) → 베타 acknowledged
3. **배포 시 Site URL 좁히기** — 프로덕션 도메인만 화이트리스트
4. **git committer 자동 추출** (`chacha@MacBook-Pro-4.local`) — 본인이 직접 `git config --global user.email <github_email>` 정정 필요
5. **Y2K 미감 모음 시점** — M2 진입 전 anchor 5장 정도. Pinterest로 모으기 + Figma로 락
6. **베타 첫 곡** — https://youtu.be/9RoZN7Dnoo4 (M5에서 사용)

---

## 10. M2 시작 시 핵심 결정

Scene 01 사양 (Notion 우선):
- 묶음 기준 = **3시간 단위** (이전 일자별 → 변경됨)
- 한 화면 최대 15개, 초과 시 새 묶음 카드로 분기
- 최신 순 정렬
- 인입 즉시 묶음 생성

구현 측면 결정 필요:
- 3시간 윈도우는 calendar-aligned (0–3, 3–6, ...) vs 첫 항목 기준 rolling? **calendar-aligned 권장** (예측 가능)
- 묶음 카드 안에 표시될 항목 미리보기 개수 (3–5장?)
- 미감 — Y2K anchor 도착 전이면 placeholder 톤(neutral white/gray)으로 시작

---

## 11. 사용자 협업 스타일

- 한국어 / 짧은 결정형 답변 선호
- 위험 액션은 *반드시* 사전 경고 + 허가
- 코드 변경 후 **자동 커밋·푸시 안 함** — 사용자 승인 후
- 의사결정거리는 **선택지 표 + 권장**으로 제시
- 길게 늘어놓지 말고 *결정·이유·근거* 순으로
