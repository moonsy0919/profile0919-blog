-- Task 021-C: save_post (게시글 저장 — 신규·수정 겸용, 글 + 태그 매핑을 한 트랜잭션으로 처리)
--
-- 되돌림 SQL (적용 전 기록. 함수만 지우므로 데이터 손실 없음):
--   drop function if exists public.save_post(uuid, text, text, text, text, uuid[]);
--
-- 동작(PRD 2.6.1):
--   1. 태그 id 중복 제거, 최대 10개 확인 (초과 시 22023)
--   2. p_id가 null이면 INSERT(published = true), 있으면 UPDATE. 수정 대상 행이 없으면 P0002(대상 없음)
--   3. 기존 태그 매핑 전체 삭제 → 4. 전달받은 태그로 재삽입
--   5. 저장된 posts 행 반환
-- security invoker라 RLS가 적용된다(관리자가 아니면 insert는 42501, update는 대상 없음으로 처리).
-- slug 중복은 23505, 존재하지 않는 태그 id는 23503으로 올라오며 전체가 롤백된다.

create function public.save_post(
  p_id uuid,
  p_slug text,
  p_title text,
  p_content text,
  p_thumbnail_url text,
  p_tag_ids uuid[]
)
returns public.posts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.posts;
  tag_ids uuid[];
begin
  select coalesce(array_agg(distinct t), '{}') into tag_ids
  from unnest(coalesce(p_tag_ids, '{}')) as t;

  if cardinality(tag_ids) > 10 then
    raise exception '태그는 최대 10개까지 선택할 수 있습니다' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.posts (slug, title, content, thumbnail_url, published)
    values (p_slug, p_title, p_content, p_thumbnail_url, true)
    returning * into result;
  else
    update public.posts
    set slug = p_slug,
        title = p_title,
        content = p_content,
        thumbnail_url = p_thumbnail_url,
        published = true
    where id = p_id
    returning * into result;

    if not found then
      raise exception '수정할 글을 찾을 수 없습니다' using errcode = 'P0002';
    end if;
  end if;

  delete from public.post_tags where post_id = result.id;
  insert into public.post_tags (post_id, tag_id)
  select result.id, t from unnest(tag_ids) as t;

  return result;
end;
$$;

revoke execute on function public.save_post(uuid, text, text, text, text, uuid[]) from public, anon;
grant execute on function public.save_post(uuid, text, text, text, text, uuid[]) to authenticated;
