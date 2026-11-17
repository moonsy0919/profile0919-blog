-- Task 014-3: posts 변경과 태그 (PRD 2.5)
--
-- 되돌림 SQL (적용 전 기록, 필요 시 아래 순서로 실행. 단 thumbnail_url 컬럼 삭제는 데이터 손실이므로 값이 없을 때만):
--   drop table if exists public.post_tags;
--   drop function if exists public.add_tag(text);
--   drop table if exists public.tags;
--   alter table public.posts alter column published set default false;
--   alter table public.posts drop column if exists thumbnail_url;

-- posts 변경: 썸네일 경로(Storage 공개 URL 또는 객체 경로)
alter table public.posts add column thumbnail_url text;
-- 저장하면 즉시 공개되므로 기본값을 true로 맞춘다(앱도 저장 시 항상 true를 명시)
alter table public.posts alter column published set default true;

-- 블로그와 개발 일기가 공유하는 태그
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 20 and name = btrim(name)),
  created_at timestamptz not null default now()
);
-- 생성과 같은 마이그레이션에서 RLS를 켠다(정책은 RLS 마이그레이션에서 추가, 그 전까지 전면 거부)
alter table public.tags enable row level security;
-- 대소문자만 다른 중복을 막는다(표기는 최초 등록값 유지)
create unique index tags_name_lower_key on public.tags (lower(name));

-- 태그 등록: 대소문자 무시 중복이면 기존 태그를 그대로 반환한다.
-- supabase-js의 upsert(onConflict)는 표현식 인덱스(lower(name))를 지정할 수 없어 함수로 처리한다.
-- security invoker이므로 RLS가 적용되어 관리자만 실제로 등록할 수 있다.
create function public.add_tag(tag_name text)
returns public.tags
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.tags;
begin
  insert into public.tags (name) values (btrim(tag_name))
  on conflict ((lower(name))) do nothing;

  select * into result from public.tags where lower(name) = lower(btrim(tag_name));
  return result;
end;
$$;
revoke execute on function public.add_tag(text) from public, anon;
grant execute on function public.add_tag(text) to authenticated;

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);
alter table public.post_tags enable row level security;
create index post_tags_tag_id_idx on public.post_tags (tag_id);
