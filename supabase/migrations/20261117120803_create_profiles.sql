-- Task 014-2: 관리자 표시용 프로필 (PRD 2.4)
--
-- 되돌림 SQL (적용 전 기록, 필요 시 실행):
--   drop table if exists public.profiles;  -- 정책은 테이블과 함께 삭제됨

-- 관리자 표시용 프로필 (권한 근거 아님). 헤더 중앙 프로필의 출처
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- 표시 이름. 로그인 성공 직후 행이 없을 때만 생성하며 기본값은 이메일 로컬 파트(30자 초과 시 잘라서 저장), 이후 프로필 수정 페이지에서만 변경
  display_name text not null check (char_length(btrim(display_name)) between 1 and 30),
  -- 프로필 이미지 공개 URL. 기본 null(설정값/기본 이미지 폴백), 업로드 시 thumbnails 버킷의 profile/ 경로 URL, 제거하면 null
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 방문자도 헤더에서 조회해야 하므로 SELECT 공개
create policy "profiles_select_public" on public.profiles
  for select using (true);

-- 로그인한 관리자 본인 행만 작성/수정 가능 (service role 키 미사용)
create policy "profiles_insert_self_admin" on public.profiles
  for insert with check (id = (select auth.uid()) and (select public.is_admin()));
create policy "profiles_update_self_admin" on public.profiles
  for update using (id = (select auth.uid()) and (select public.is_admin()))
  with check (id = (select auth.uid()) and (select public.is_admin()));
