-- Task 014-5: 인덱스·check 제약·태그 개수 조회 함수 (PRD 2.5, 2.6.2)
-- 적용 전 posts·dev_logs가 0행임을 확인했다(기존 데이터와 충돌하지 않음).
--
-- 되돌림 SQL (적용 전 기록, 필요 시 실행):
--   drop function if exists public.get_post_tag_counts();
--   alter table public.dev_logs
--     drop constraint if exists dev_logs_title_length,
--     drop constraint if exists dev_logs_content_not_blank;
--   alter table public.posts
--     drop constraint if exists posts_title_length,
--     drop constraint if exists posts_slug_format,
--     drop constraint if exists posts_content_not_blank;
--   drop index if exists public.dev_logs_created_at_idx;
--   drop index if exists public.posts_published_created_at_idx;

-- 게시글·개발 일기 최신순 조회용 인덱스
create index posts_published_created_at_idx
  on public.posts (published, created_at desc);
create index dev_logs_created_at_idx on public.dev_logs (created_at desc);

-- 입력 제약 보강: 앱(Zod) 검증에만 의존하지 않고 DB 직접 호출·검증 누락에도 안전하도록 이중 방어한다.
-- 제목은 앞뒤 공백 제거 후 1~100자, 본문은 공백만으로 이루어지면 안 된다.
-- slug는 소문자·숫자·하이픈 조합이며 new는 예약어라 금지한다.
alter table public.posts
  add constraint posts_title_length check (char_length(btrim(title)) between 1 and 100),
  add constraint posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug <> 'new'),
  add constraint posts_content_not_blank check (char_length(btrim(content)) > 0);
alter table public.dev_logs
  add constraint dev_logs_title_length check (char_length(btrim(title)) between 1 and 100),
  add constraint dev_logs_content_not_blank check (char_length(btrim(content)) > 0);

-- 사이드바 태그별 글 개수: 공개 글(published)에 연결된 태그만 집계한다.
-- dev_log_tags는 집계하지 않으며, "전체 보기" 개수는 공개 글 수를 앱이 별도로 조회한다.
-- security invoker라 호출자의 RLS가 적용된다. 정렬은 태그명(대소문자 무시) 기준.
create function public.get_post_tag_counts()
returns table (tag_id uuid, tag_name text, post_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.id, t.name, count(*)
  from public.tags t
  join public.post_tags pt on pt.tag_id = t.id
  join public.posts p on p.id = pt.post_id
  where p.published
  group by t.id, t.name
  order by lower(t.name), t.id;
$$;
revoke execute on function public.get_post_tag_counts() from public;
grant execute on function public.get_post_tag_counts() to anon, authenticated;
