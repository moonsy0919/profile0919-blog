-- Task 014-4: 개발 일기 (PRD 2.5)
--
-- 되돌림 SQL (적용 전 기록, 필요 시 아래 순서로 실행):
--   drop table if exists public.dev_log_tags;
--   drop table if exists public.dev_logs;  -- 트리거는 테이블과 함께 삭제됨

create table public.dev_logs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  thumbnail_url text,
  -- 선택 입력. 입력 시 GitHub 저장소 주소만 허용(앱에서도 동일 검증)
  github_url text check (github_url is null or github_url ~* '^https://github\.com/'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- 생성과 같은 마이그레이션에서 RLS를 켠다(정책은 RLS 마이그레이션에서 추가, 그 전까지 전면 거부)
alter table public.dev_logs enable row level security;

-- 개발 일기 ↔ 태그 (tags는 post_tags와 공유)
create table public.dev_log_tags (
  dev_log_id uuid not null references public.dev_logs (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (dev_log_id, tag_id)
);
alter table public.dev_log_tags enable row level security;
create index dev_log_tags_tag_id_idx on public.dev_log_tags (tag_id);

-- updated_at 자동 갱신 (014-1에서 search_path를 고정한 set_updated_at 재사용)
create trigger dev_logs_set_updated_at
  before update on public.dev_logs
  for each row execute function public.set_updated_at();
