-- Task 014-5 보정: 공백 문자만으로 된 제목·본문 거부 강화
-- 문제: btrim()은 공백(space)만 제거하므로 줄바꿈·탭만 있는 본문이 not_blank 제약을 통과했다.
-- 대응: 공백 아닌 문자가 하나 이상 있어야 한다는 조건(정규식 \S)을 추가한다. 길이 기준(제목 1~100자)은 그대로 둔다.
-- 적용 전 posts·dev_logs 0행 확인(기존 데이터와 충돌하지 않음).
--
-- 되돌림 SQL (적용 전 기록, 이전 제약으로 복원):
--   alter table public.posts
--     drop constraint posts_title_length,
--     drop constraint posts_content_not_blank,
--     add constraint posts_title_length check (char_length(btrim(title)) between 1 and 100),
--     add constraint posts_content_not_blank check (char_length(btrim(content)) > 0);
--   alter table public.dev_logs
--     drop constraint dev_logs_title_length,
--     drop constraint dev_logs_content_not_blank,
--     add constraint dev_logs_title_length check (char_length(btrim(title)) between 1 and 100),
--     add constraint dev_logs_content_not_blank check (char_length(btrim(content)) > 0);

alter table public.posts
  drop constraint posts_title_length,
  drop constraint posts_content_not_blank,
  add constraint posts_title_length
    check (char_length(btrim(title)) between 1 and 100 and title ~ '\S'),
  add constraint posts_content_not_blank check (content ~ '\S');

alter table public.dev_logs
  drop constraint dev_logs_title_length,
  drop constraint dev_logs_content_not_blank,
  add constraint dev_logs_title_length
    check (char_length(btrim(title)) between 1 and 100 and title ~ '\S'),
  add constraint dev_logs_content_not_blank check (content ~ '\S');
