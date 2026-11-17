-- Task 016B-1②: 이메일 인증 코드(challenge). 새 IP에서 로그인할 때 발급하고 코드는 해시로만 저장한다.
--
-- 되돌림 SQL (적용 전 기록, 필요 시 실행):
--   drop table if exists public.admin_login_challenges;

-- session_id: 코드를 요청한 시점의 로그인 세션(아직 승인 전). ip: 요청한 IP(검증 시 같은 IP여야 한다)
-- 만료·소진된 행은 앱이 로그인 시 기회가 될 때 지운다.
create table public.admin_login_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null,
  ip text not null,
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index admin_login_challenges_user_id_created_at_idx
  on public.admin_login_challenges (user_id, created_at desc);
alter table public.admin_login_challenges enable row level security;
-- 정책을 만들지 않는다: anon/authenticated는 직접 접근 불가
revoke all on public.admin_login_challenges from anon, authenticated;
