-- Task 016B-1④: 승인된 관리자 세션. 신뢰 IP 로그인 또는 이메일 코드 승인을 통과한 세션만 기록한다.
-- (이후 마이그레이션에서 is_admin()이 이 테이블을 확인해 승인되지 않은 세션의 쓰기를 DB에서 막는다)
--
-- 되돌림 SQL (적용 전 기록, 필요 시 실행):
--   drop table if exists public.admin_verified_sessions;

-- session_id: 액세스 토큰의 session_id 클레임(auth.sessions의 PK). 세션이 사라지면 함께 삭제된다.
-- expires_at: 승인 유효 기간. 지나면 다시 승인(재로그인)해야 한다.
create table public.admin_verified_sessions (
  session_id uuid primary key references auth.sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  verified_via text not null check (verified_via in ('trusted_ip', 'email_code')),
  ip text not null,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index admin_verified_sessions_user_id_idx on public.admin_verified_sessions (user_id);
alter table public.admin_verified_sessions enable row level security;
-- 정책을 만들지 않는다: anon/authenticated는 직접 접근 불가 (is_admin()은 security definer로 읽는다)
revoke all on public.admin_verified_sessions from anon, authenticated;
