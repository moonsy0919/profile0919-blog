-- Task 014-1: 관리자 판별 기반 (PRD 2.4, 2.5 첫 줄)
--
-- 되돌림 SQL (적용 전 기록, 필요 시 아래 순서로 실행):
--   drop function if exists public.is_admin();
--   drop table if exists public.admin_allowlist;
--   alter function public.set_updated_at() reset search_path;

-- 기존 set_updated_at 함수의 search_path 고정 (보안 어드바이저 경고 해소, dev_logs 트리거도 이 함수를 사용)
alter function public.set_updated_at() set search_path = '';

-- 허용 계정 목록 (Supabase Auth 사용자 id 기준, 계정 삭제 시 함께 삭제)
create table public.admin_allowlist (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_allowlist enable row level security;
-- 정책을 만들지 않는다: anon/authenticated는 직접 조회 불가
revoke all on public.admin_allowlist from anon, authenticated;

-- 현재 로그인 사용자가 허용 목록에 있는지 판별.
-- user_metadata는 사용자가 수정할 수 있으므로 쓰지 않고, 서버만 쓸 수 있는 admin_allowlist의 user_id로 대조한다.
-- 가입 허용 설정이 실수로 켜져 계정이 생겨도 허용 목록에 없으면 false이므로 RLS가 쓰기를 막는다(이중 안전장치).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_allowlist
    where user_id = (select auth.uid())
  );
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
