-- M4 — gestures 테이블 + RLS
-- 사용자별 4슬롯 제스처 어휘. 5번째 "다음에"는 시스템 고정이라 별도 저장 X.
-- Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run

-- ─────────────────────────────────────────
-- 1. gestures 테이블
-- ─────────────────────────────────────────
create table if not exists public.gestures (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  slot        smallint not null check (slot between 1 and 4),
  template    jsonb not null,                  -- 정규화된 21 랜드마크 평균 (x,y,z) × 21
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, slot)
);

-- ─────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────
alter table public.gestures enable row level security;

drop policy if exists "gestures_select_own" on public.gestures;
drop policy if exists "gestures_insert_own" on public.gestures;
drop policy if exists "gestures_update_own" on public.gestures;
drop policy if exists "gestures_delete_own" on public.gestures;

create policy "gestures_select_own"
  on public.gestures for select
  to authenticated
  using (auth.uid() = user_id);

create policy "gestures_insert_own"
  on public.gestures for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "gestures_update_own"
  on public.gestures for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "gestures_delete_own"
  on public.gestures for delete
  to authenticated
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 3. updated_at 자동 갱신 트리거
-- ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists gestures_set_updated_at on public.gestures;
create trigger gestures_set_updated_at
  before update on public.gestures
  for each row execute function public.set_updated_at();
