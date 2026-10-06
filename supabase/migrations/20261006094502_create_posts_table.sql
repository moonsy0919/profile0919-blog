-- 블로그 글(posts) 테이블 생성
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

-- Row Level Security
alter table public.posts enable row level security;

-- 누구나 공개(published)된 글을 조회할 수 있다.
create policy "published_posts_are_public"
  on public.posts
  for select
  using (published = true);

-- 인증된 사용자(본인)는 모든 글을 조회/작성/수정/삭제할 수 있다.
create policy "authenticated_users_manage_posts"
  on public.posts
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
