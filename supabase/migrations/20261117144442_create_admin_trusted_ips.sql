-- Task 016B-1①: 관리자 신뢰 IP (이메일 인증을 통과한 IP는 이후 비밀번호만으로 로그인)
--
-- 되돌림 SQL (적용 전 기록, 필요 시 실행):
--   drop table if exists public.admin_trusted_ips;

-- 서비스 키(서버)만 읽고 쓴다. 해제는 Supabase 대시보드에서 행을 삭제한다.
-- ip는 IPv4 원문 또는 IPv6 /64 접두사 문자열(앱이 정규화해서 저장)
create table public.admin_trusted_ips (
  user_id uuid not null references auth.users (id) on delete cascade,
  ip text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  primary key (user_id, ip)
);
alter table public.admin_trusted_ips enable row level security;
-- 정책을 만들지 않는다: anon/authenticated는 직접 접근 불가
revoke all on public.admin_trusted_ips from anon, authenticated;
