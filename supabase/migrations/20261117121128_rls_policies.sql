-- Task 014-6: RLS 정책 (PRD 2.6)
-- tags·post_tags·dev_logs·dev_log_tags의 RLS 활성화는 생성 마이그레이션(③·④)에서 이미 했으므로 정책만 추가한다.
-- posts는 기존 정책 2개를 같은 마이그레이션(한 트랜잭션) 안에서 교체해 정책 공백이 없게 한다.
--
-- 되돌림 SQL (적용 전 기록. 정책을 지우면 해당 테이블은 전면 거부 상태가 되고, posts는 아래 원문으로 복원):
--   -- 신규 정책 삭제
--   drop policy if exists "posts_select" on public.posts;
--   drop policy if exists "posts_insert_admin" on public.posts;
--   drop policy if exists "posts_update_admin" on public.posts;
--   drop policy if exists "posts_delete_admin" on public.posts;
--   drop policy if exists "tags_select_public" on public.tags;
--   drop policy if exists "tags_insert_admin" on public.tags;
--   drop policy if exists "tags_update_admin" on public.tags;
--   drop policy if exists "tags_delete_admin" on public.tags;
--   drop policy if exists "post_tags_select" on public.post_tags;
--   drop policy if exists "post_tags_insert_admin" on public.post_tags;
--   drop policy if exists "post_tags_delete_admin" on public.post_tags;
--   drop policy if exists "dev_logs_select_public" on public.dev_logs;
--   drop policy if exists "dev_logs_insert_admin" on public.dev_logs;
--   drop policy if exists "dev_logs_update_admin" on public.dev_logs;
--   drop policy if exists "dev_logs_delete_admin" on public.dev_logs;
--   drop policy if exists "dev_log_tags_select_public" on public.dev_log_tags;
--   drop policy if exists "dev_log_tags_insert_admin" on public.dev_log_tags;
--   drop policy if exists "dev_log_tags_delete_admin" on public.dev_log_tags;
--   -- posts 기존 정책 원문 복원 (create_posts_table 마이그레이션 기준)
--   create policy "published_posts_are_public" on public.posts
--     for select using (published = true);
--   create policy "authenticated_users_manage_posts" on public.posts
--     for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── posts ──────────────────────────────────────────
drop policy if exists "authenticated_users_manage_posts" on public.posts;
drop policy if exists "published_posts_are_public" on public.posts;

-- 공개 글(published = true)은 누구나, 비공개 행은 관리자만 조회.
-- 앱은 저장 시 항상 published = true로 기록하므로 방문자에게 모든 글이 보인다.
create policy "posts_select" on public.posts
  for select using (published = true or (select public.is_admin()));
create policy "posts_insert_admin" on public.posts
  for insert with check ((select public.is_admin()));
create policy "posts_update_admin" on public.posts
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "posts_delete_admin" on public.posts
  for delete using ((select public.is_admin()));

-- ── tags ───────────────────────────────────────────
create policy "tags_select_public" on public.tags for select using (true);
create policy "tags_insert_admin" on public.tags
  for insert with check ((select public.is_admin()));
create policy "tags_update_admin" on public.tags
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "tags_delete_admin" on public.tags
  for delete using ((select public.is_admin()));

-- ── post_tags ──────────────────────────────────────
-- 공개된 글의 태그 매핑만 공개 (비공개 처리된 글의 태그 노출 방지)
create policy "post_tags_select" on public.post_tags
  for select using (
    (select public.is_admin())
    or exists (select 1 from public.posts p where p.id = post_id and p.published)
  );
create policy "post_tags_insert_admin" on public.post_tags
  for insert with check ((select public.is_admin()));
create policy "post_tags_delete_admin" on public.post_tags
  for delete using ((select public.is_admin()));

-- ── dev_logs ───────────────────────────────────────
create policy "dev_logs_select_public" on public.dev_logs for select using (true);
create policy "dev_logs_insert_admin" on public.dev_logs
  for insert with check ((select public.is_admin()));
create policy "dev_logs_update_admin" on public.dev_logs
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "dev_logs_delete_admin" on public.dev_logs
  for delete using ((select public.is_admin()));

-- ── dev_log_tags ───────────────────────────────────
-- 개발 일기는 전부 공개이므로 매핑도 전체 공개
create policy "dev_log_tags_select_public" on public.dev_log_tags for select using (true);
create policy "dev_log_tags_insert_admin" on public.dev_log_tags
  for insert with check ((select public.is_admin()));
create policy "dev_log_tags_delete_admin" on public.dev_log_tags
  for delete using ((select public.is_admin()));
