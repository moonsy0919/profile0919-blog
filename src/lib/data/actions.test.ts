import { describe, expect, it } from "vitest";
import {
  createDevLog,
  createPost,
  createTag,
  deleteDevLog,
  deletePost,
  updateDevLog,
  updatePost,
  updateProfile,
} from "./actions";

const postInput = {
  title: "새 글",
  slug: "new-post",
  content: "본문",
  thumbnailUrl: null,
  tagIds: ["tag-react"],
};

const devLogInput = {
  title: "새 일기",
  content: "본문",
  thumbnailUrl: null,
  githubUrl: null,
  tagIds: [],
};

describe("게시글 액션", () => {
  it("작성하면 이동할 id와 slug를 돌려준다", async () => {
    expect(await createPost(postInput)).toEqual({
      ok: true,
      data: { id: "post-new", slug: "new-post" },
    });
  });

  it("이미 있는 slug로 작성하면 slug 필드 오류(conflict)다", async () => {
    const result = await createPost({ ...postInput, slug: "hello-blog" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("conflict");
      expect(result.error.fieldErrors?.slug).toBeTruthy();
    }
  });

  it("수정은 자기 slug를 그대로 쓸 수 있고 없는 글은 notFound다", async () => {
    const same = await updatePost({
      ...postInput,
      id: "post-01",
      slug: "hello-blog",
    });
    expect(same.ok).toBe(true);
    const missing = await updatePost({ ...postInput, id: "없는-id" });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe("notFound");
  });

  it("다른 글의 slug로 수정하면 conflict다", async () => {
    const result = await updatePost({
      ...postInput,
      id: "post-02",
      slug: "hello-blog",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("conflict");
  });

  it("삭제는 있는 글이면 성공, 없으면 notFound다", async () => {
    expect(await deletePost("post-01")).toEqual({ ok: true, data: null });
    const missing = await deletePost("없는-id");
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe("notFound");
  });
});

describe("개발 일기 액션", () => {
  it("게시하면 이동할 id를 돌려준다", async () => {
    expect(await createDevLog(devLogInput)).toEqual({
      ok: true,
      data: { id: "devlog-new" },
    });
  });

  it("수정은 있는 일기면 성공, 없으면 notFound다", async () => {
    const found = await updateDevLog({ ...devLogInput, id: "devlog-01" });
    expect(found).toEqual({ ok: true, data: { id: "devlog-01" } });
    const missing = await updateDevLog({ ...devLogInput, id: "없는-id" });
    expect(missing.ok).toBe(false);
  });

  it("삭제는 있는 일기면 성공, 없으면 notFound다", async () => {
    expect((await deleteDevLog("devlog-01")).ok).toBe(true);
    const missing = await deleteDevLog("없는-id");
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe("notFound");
  });
});

describe("태그·프로필 액션", () => {
  it("대소문자만 다른 태그는 기존 태그를 돌려준다", async () => {
    const result = await createTag(" react ");
    expect(result).toEqual({
      ok: true,
      data: { id: "tag-react", name: "React" },
    });
  });

  it("새 태그 이름은 다듬어서 돌려준다", async () => {
    const result = await createTag(" Vitest ");
    expect(result.ok && result.data.name).toBe("Vitest");
  });

  it("프로필 수정은 입력값을 반영해 돌려준다", async () => {
    const result = await updateProfile({
      displayName: "새 이름",
      avatarUrl: null,
    });
    expect(result.ok && result.data.displayName).toBe("새 이름");
  });
});
