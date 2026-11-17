-- Task 016B-1③: IP별 연속 로그인 실패·차단. 5회 연속 실패하면 blocked_at을 기록하고, 해제는 대시보드에서 행을 삭제한다.
--
-- 되돌림 SQL (적용 전 기록, 필요 시 실행):
--   drop function if exists public.register_login_failure(text, integer);
--   drop table if exists public.admin_ip_attempts;

-- blocked_at이 null이 아니면 차단 중이다. 차단된 IP는 앱이 로그인 로직을 실행하지 않는다.
create table public.admin_ip_attempts (
  ip text primary key,
  consecutive_failures integer not null default 0,
  last_failed_at timestamptz,
  blocked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.admin_ip_attempts enable row level security;
-- 정책을 만들지 않는다: anon/authenticated는 직접 접근 불가
revoke all on public.admin_ip_attempts from anon, authenticated;

-- 실패 1회를 원자적으로 기록한다. 행을 잠근 채 증가·차단을 판정하므로 동시 요청으로 횟수가 새지 않는다.
-- blocked: 호출 후 차단 상태인지, newly_blocked: 이번 호출로 새로 차단됐는지(차단 알림 메일을 한 번만 보내기 위함)
create function public.register_login_failure(p_ip text, p_limit integer default 5)
returns table (blocked boolean, newly_blocked boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cur public.admin_ip_attempts;
  next_failures integer;
  new_blocked_at timestamptz;
begin
  insert into public.admin_ip_attempts (ip) values (p_ip) on conflict (ip) do nothing;
  select * into cur from public.admin_ip_attempts where ip = p_ip for update;

  if cur.blocked_at is not null then
    return query select true, false;
    return;
  end if;

  next_failures := cur.consecutive_failures + 1;
  new_blocked_at := case when next_failures >= p_limit then now() end;
  update public.admin_ip_attempts
    set consecutive_failures = next_failures,
        last_failed_at = now(),
        blocked_at = new_blocked_at
    where ip = p_ip;

  return query select new_blocked_at is not null, new_blocked_at is not null;
end;
$$;
-- 서버(service_role)만 호출한다
revoke execute on function public.register_login_failure(text, integer) from public, anon, authenticated;
grant execute on function public.register_login_failure(text, integer) to service_role;
