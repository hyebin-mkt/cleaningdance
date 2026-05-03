-- M2 — items 테이블 Realtime 활성화 (RLS 그대로 적용됨)
-- Supabase Dashboard → SQL Editor → New query → 붙여넣기 → Run

-- 멱등 실행: 이미 publication에 들어 있으면 실패하지 않게 do-block으로 감쌈
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
end$$;
