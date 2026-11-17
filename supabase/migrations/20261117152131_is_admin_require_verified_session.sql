-- Task 016B-5: is_admin()을 "허용 목록 AND 승인된 세션"으로 교체한다.
-- 비밀번호가 맞아도 이메일 코드 승인(또는 신뢰 IP 로그인)을 거쳐 admin_verified_sessions에 기록된 세션만 관리자로 인정한다.
-- RLS 정책·Storage 정책·getViewer가 모두 이 함수를 쓰므로, 공개 키로 Supabase에 직접 로그인해도 승인 없이는 권한이 없다.
-- 적용 즉시 기존 로그인 세션은 승인 기록이 없어 관리자로 인정되지 않는다(다시 로그인해야 한다).
--
-- 되돌림 SQL (적용 전 기록, 필요 시 실행 — 이전 정의로 복원):
--   create or replace function public.is_admin()
--   returns boolean
--   language sql
--   stable
--   security definer
--   set search_path = ''
--   as $fn$
--     select exists (
--       select 1
--       from public.admin_allowlist
--       where user_id = (select auth.uid())
--     );
--   $fn$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_allowlist a
    join public.admin_verified_sessions s on s.user_id = a.user_id
    where a.user_id = (select auth.uid())
      and s.session_id = (((select auth.jwt()) ->> 'session_id'))::uuid
      and s.expires_at > now()
  );
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
