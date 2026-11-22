import { expect } from "@playwright/test";
import { createServiceClient } from "./admin-session";

// 게시글 쓰기 E2E(수정·삭제)가 공유하는 시드·정리 도구. 대상은 항상 서비스 키로 만든 `[e2e]` 글이며,
// 운영 Supabase를 함께 쓰므로 시드 글(아래 SEED_SLUGS)은 절대 건드리지 않는다.

/** 테스트가 만든 글·태그 이름 접두어 */
export const E2E_PREFIX = "[e2e]";

/** 운영 DB에 원래 있는 시드 글 slug (삭제·수정 E2E 대상이 아니다) */
export const SEED_SLUGS = [
  "hello-world",
  "nextjs-app-router-notes",
  "supabase-rls-basics",
  "weekend-coffee-log",
  "typescript-small-tips",
  "tailwind-v4-first-impression",
  "markdown-rendering-sample",
];

/** 1x1 PNG */
export const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

/** 이 파일이 Storage에 올린 객체 경로(시드와 UI 업로드). 끝에서 서비스 키로 지운다 */
export const storagePaths: string[] = [];

/** 테스트마다 다른 짧은 접미어 */
export function suffix() {
  return `${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}

/** 남은 `[e2e]` 글·태그·객체를 서비스 키로 지운다(post_tags는 cascade) */
export async function cleanup() {
  const service = createServiceClient();
  if (storagePaths.length > 0) {
    await service.storage.from("thumbnails").remove(storagePaths);
  }
  storagePaths.length = 0;
  await service.from("posts").delete().like("title", `${E2E_PREFIX}%`);
  await service.from("tags").delete().like("name", `${E2E_PREFIX}%`);
}

/** `[e2e]` 태그를 만들고 id를 돌려준다 */
export async function seedTag(name: string): Promise<string> {
  const { data, error } = await createServiceClient()
    .from("tags")
    .insert({ name })
    .select("id")
    .single();
  if (error) throw new Error(`태그 시드 실패: ${error.message}`);
  return data.id;
}

/** 시드 글 입력 */
export type SeedPost = {
  slug: string;
  tagName?: string;
  thumbnailUrl?: string | null;
};

/** 서비스 키로 수정 대상 `[e2e]` 글(과 태그 연결)을 만든다. 글 id를 돌려준다 */
export async function seedPost({
  slug,
  tagName,
  thumbnailUrl = null,
}: SeedPost) {
  const service = createServiceClient();
  const { data, error } = await service
    .from("posts")
    .insert({
      slug,
      title: `${E2E_PREFIX} 원래 제목 ${slug}`,
      content: "원래 본문",
      thumbnail_url: thumbnailUrl,
      published: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(`글 시드 실패: ${error.message}`);
  if (tagName) {
    const tagId = await seedTag(tagName);
    await service.from("post_tags").insert({ post_id: data.id, tag_id: tagId });
  }
  return data.id;
}

/** 버킷에 이미지를 올리고 객체 경로와 공개 URL을 돌려준다 */
export async function seedImage(): Promise<{ path: string; url: string }> {
  const storage = createServiceClient().storage.from("thumbnails");
  const path = `posts/e2e-seed-${suffix()}.png`;
  const { error } = await storage.upload(path, PNG, {
    contentType: "image/png",
  });
  if (error) throw new Error(`이미지 시드 실패: ${error.message}`);
  storagePaths.push(path);
  return { path, url: storage.getPublicUrl(path).data.publicUrl };
}

/** 객체가 버킷에 있는지 서비스 키로 확인한다 */
export async function objectExists(path: string): Promise<boolean> {
  const [folder, name] = path.split("/");
  const { data, error } = await createServiceClient()
    .storage.from("thumbnails")
    .list(folder, { search: name });
  if (error) throw new Error(`객체 조회 실패: ${error.message}`);
  return data.some((item) => item.name === name);
}

/** 글의 현재 썸네일 주소를 서비스 키로 읽는다 */
export async function readThumbnail(slug: string): Promise<string | null> {
  const { data } = await createServiceClient()
    .from("posts")
    .select("thumbnail_url")
    .eq("slug", slug)
    .single();
  return data?.thumbnail_url ?? null;
}

/** 시드 글 7개가 모두 남아 있는지 확인한다. 하나라도 없으면 즉시 중단해 추가 피해를 막는다 */
export async function assertSeedPostsIntact(): Promise<void> {
  const { data, error } = await createServiceClient()
    .from("posts")
    .select("slug")
    .in("slug", SEED_SLUGS);
  if (error) throw new Error(`시드 글 확인 실패: ${error.message}`);
  const found = new Set(data.map((row) => row.slug));
  const missing = SEED_SLUGS.filter((slug) => !found.has(slug));
  expect(missing, "시드 글이 사라졌습니다").toEqual([]);
}

/** 글이 DB에 있는지(slug 기준) 서비스 키로 센다 */
export async function countPostsBySlug(slug: string): Promise<number> {
  const { count, error } = await createServiceClient()
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);
  if (error) throw new Error(`글 조회 실패: ${error.message}`);
  return count ?? 0;
}

/** 글에 연결된 태그 매핑 수를 글 id로 센다 */
export async function countPostTags(postId: string): Promise<number> {
  const { count, error } = await createServiceClient()
    .from("post_tags")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (error) throw new Error(`태그 매핑 조회 실패: ${error.message}`);
  return count ?? 0;
}
