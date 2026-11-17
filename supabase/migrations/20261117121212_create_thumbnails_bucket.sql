-- Task 014-7: thumbnails 버킷과 Storage 정책 (PRD 2.8)
-- 적용 전 버킷·객체·storage 정책이 비어 있음을 확인했다.
--
-- 되돌림 SQL (적용 전 기록, 필요 시 실행. 버킷 삭제는 객체가 없을 때만 가능):
--   drop policy if exists "thumbnails_select_admin" on storage.objects;
--   drop policy if exists "thumbnails_insert_admin" on storage.objects;
--   drop policy if exists "thumbnails_update_admin" on storage.objects;
--   drop policy if exists "thumbnails_delete_admin" on storage.objects;
--   delete from storage.buckets where id = 'thumbnails';

-- 공개 읽기 버킷, 5MB 제한, 이미지 MIME만 허용
-- 글 썸네일(posts/, dev-logs/)과 프로필 이미지(profile/)를 함께 저장한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails', 'thumbnails', true, 5242880,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
);

-- 공개 버킷은 URL로 바로 제공되므로 방문자용 SELECT 정책을 만들지 않는다(만들면 누구나 파일 목록을 조회할 수 있다).
-- 관리자의 목록 조회·삭제·교체 동작을 위해 관리자 전용 SELECT만 둔다.
create policy "thumbnails_select_admin" on storage.objects
  for select using (bucket_id = 'thumbnails' and (select public.is_admin()));
create policy "thumbnails_insert_admin" on storage.objects
  for insert with check (bucket_id = 'thumbnails' and (select public.is_admin()));
create policy "thumbnails_update_admin" on storage.objects
  for update using (bucket_id = 'thumbnails' and (select public.is_admin()))
  with check (bucket_id = 'thumbnails' and (select public.is_admin()));
create policy "thumbnails_delete_admin" on storage.objects
  for delete using (bucket_id = 'thumbnails' and (select public.is_admin()));
