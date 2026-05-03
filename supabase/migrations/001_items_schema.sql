-- M1.0 — items 테이블 + 스토리지 버킷 + RLS
-- 한 번에 실행: Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run

-- ─────────────────────────────────────────
-- 1. items 테이블
-- ─────────────────────────────────────────
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null check (type in ('image', 'link')),
  image_url   text,           -- 'image' 타입: 스토리지 WebP 경로 / 'link' 타입: og:image
  source_url  text,           -- 'link' 타입: 원래 URL / 'image' 타입: 출처 페이지(있으면)
  title       text,           -- 'link' 타입: 페이지 제목 / 'image' 타입: 옵션
  description text,           -- 옵션
  created_at  timestamptz not null default now()
);

-- 사용자별 최신순 조회를 위한 인덱스
create index if not exists items_user_created_idx
  on public.items (user_id, created_at desc);

-- ─────────────────────────────────────────
-- 2. RLS 활성화 — 정책 없이는 모든 접근 차단됨
-- ─────────────────────────────────────────
alter table public.items enable row level security;

-- 멱등 실행을 위해 기존 정책 제거 후 재생성
drop policy if exists "items_select_own" on public.items;
drop policy if exists "items_insert_own" on public.items;
drop policy if exists "items_update_own" on public.items;
drop policy if exists "items_delete_own" on public.items;

-- 본인 행만 조회
create policy "items_select_own"
  on public.items for select
  to authenticated
  using (auth.uid() = user_id);

-- 본인 user_id로만 삽입 가능
create policy "items_insert_own"
  on public.items for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 본인 행만 수정
create policy "items_update_own"
  on public.items for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 본인 행만 삭제
create policy "items_delete_own"
  on public.items for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 3. 스토리지 버킷 — private (signed URL 또는 인증된 요청만)
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('items', 'items', false)
on conflict (id) do nothing;

-- ─────────────────────────────────────────
-- 4. 스토리지 RLS — 경로의 첫 폴더가 자기 user_id인 경우만 허용
--    예: items/{user_id}/{uuid}.webp
-- ─────────────────────────────────────────
drop policy if exists "items_storage_select_own" on storage.objects;
drop policy if exists "items_storage_insert_own" on storage.objects;
drop policy if exists "items_storage_update_own" on storage.objects;
drop policy if exists "items_storage_delete_own" on storage.objects;

create policy "items_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "items_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "items_storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "items_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
