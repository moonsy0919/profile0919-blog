import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getViewer,
  rpc,
  maybeSingle,
  deleteSelect,
  removeBucketImage,
  createClient,
  revalidatePath,
} = vi.hoisted(() => {
  const rpc = vi.fn();
  const maybeSingle = vi.fn();
  const deleteSelect = vi.fn();
  // 수정·삭제 전 글을 읽는 from().select().eq().maybeSingle() 체인과 from().delete().eq().select() 체인
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle }) }),
    delete: () => ({ eq: () => ({ select: deleteSelect }) }),
  }));
  return {
    getViewer: vi.fn(),
    rpc,
    maybeSingle,
    deleteSelect,
    removeBucketImage: vi.fn(),
    createClient: vi.fn(async () => ({ rpc, from })),
    revalidatePath: vi.fn(),
  };
});
vi.mock("./reads", () => ({ getViewer }));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/storage/remove-server", () => ({ removeBucketImage }));

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
import type { PostInput } from "./types";

const postInput: PostInput = {
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

describe("createPost", () => {
  const savedRow = { id: "p-1", slug: "new-post" };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getViewer.mockReset().mockResolvedValue({ isAdmin: true });
    rpc.mockReset().mockResolvedValue({ data: savedRow, error: null });
    createClient.mockClear();
    revalidatePath.mockClear();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** 실패 결과의 오류만 꺼낸다 */
  async function failure(input = postInput) {
    const result = await createPost(input);
    if (result.ok) throw new Error("실패를 기대했습니다");
    return result.error;
  }

  it("관리자가 아니면 DB를 부르지 않고 forbidden이다", async () => {
    getViewer.mockResolvedValue({ isAdmin: false });
    expect((await failure()).code).toBe("forbidden");
    expect(createClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("검증에 실패하면 필드 오류를 주고 DB를 부르지 않는다", async () => {
    const error = await failure({ ...postInput, title: "  ", slug: "New" });
    expect(error.code).toBe("validation");
    expect(error.fieldErrors?.title).toBeTruthy();
    expect(error.fieldErrors?.slug).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("이 버킷의 posts/ 경로가 아닌 썸네일 주소는 거부한다", async () => {
    const bucket =
      "https://example.supabase.co/storage/v1/object/public/thumbnails";
    for (const url of [
      "https://evil.example.com/a.png",
      `${bucket}/dev-logs/a.png`,
    ]) {
      const error = await failure({ ...postInput, thumbnailUrl: url });
      expect(error.code).toBe("validation");
      expect(error.fieldErrors?.thumbnailUrl).toBeTruthy();
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("성공하면 save_post를 id 없이 호출하고 목록·상세를 재검증한다", async () => {
    const thumbnailUrl =
      "https://example.supabase.co/storage/v1/object/public/thumbnails/posts/a.png";
    const result = await createPost({ ...postInput, thumbnailUrl });
    expect(result).toEqual({ ok: true, data: { id: "p-1", slug: "new-post" } });
    expect(rpc).toHaveBeenCalledWith("save_post", {
      p_id: null,
      p_slug: "new-post",
      p_title: "새 글",
      p_content: "본문",
      p_thumbnail_url: thumbnailUrl,
      p_tag_ids: ["tag-react"],
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/posts/new-post");
  });

  it("slug 중복(23505)은 slug 필드 conflict다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "23505" } });
    const error = await failure();
    expect(error.code).toBe("conflict");
    expect(error.fieldErrors?.slug).toBeTruthy();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("그 외 DB 오류·빈 행·예외는 unknown이다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "23503" } });
    expect((await failure()).code).toBe("unknown");
    rpc.mockResolvedValue({ data: null, error: null });
    expect((await failure()).code).toBe("unknown");
    rpc.mockRejectedValue(new Error("네트워크"));
    expect((await failure()).code).toBe("unknown");
  });
});

describe("updatePost", () => {
  const ID = "0b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d";
  const BUCKET =
    "https://example.supabase.co/storage/v1/object/public/thumbnails";
  const input = { ...postInput, id: ID, slug: "next-slug" };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getViewer.mockReset().mockResolvedValue({ isAdmin: true });
    maybeSingle.mockReset().mockResolvedValue({
      data: { slug: "old-slug", thumbnail_url: null },
      error: null,
    });
    rpc
      .mockReset()
      .mockResolvedValue({ data: { id: ID, slug: "next-slug" }, error: null });
    createClient.mockClear();
    revalidatePath.mockClear();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** 실패 결과의 오류만 꺼낸다 */
  async function failure(value = input) {
    const result = await updatePost(value);
    if (result.ok) throw new Error("실패를 기대했습니다");
    return result.error;
  }

  it("관리자가 아니면 DB를 부르지 않고 forbidden이다", async () => {
    getViewer.mockResolvedValue({ isAdmin: false });
    expect((await failure()).code).toBe("forbidden");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("uuid가 아닌 id는 DB를 부르지 않고 notFound다", async () => {
    expect((await failure({ ...input, id: "없는-id" })).code).toBe("notFound");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("수정 전 글이 없으면 notFound이고 저장하지 않는다", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await failure()).code).toBe("notFound");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("검증에 실패하면 필드 오류를 주고 저장하지 않는다", async () => {
    const error = await failure({ ...input, title: " ", slug: "New" });
    expect(error.code).toBe("validation");
    expect(error.fieldErrors?.title).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("성공하면 기존 id로 save_post를 호출하고 새·이전 slug를 재검증한다", async () => {
    const result = await updatePost(input);
    expect(result).toEqual({ ok: true, data: { id: ID, slug: "next-slug" } });
    expect(rpc).toHaveBeenCalledWith(
      "save_post",
      expect.objectContaining({ p_id: ID, p_slug: "next-slug" }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/posts/next-slug");
    expect(revalidatePath).toHaveBeenCalledWith("/posts/old-slug");
  });

  it("slug가 그대로면 같은 경로를 두 번 재검증하지 않는다", async () => {
    maybeSingle.mockResolvedValue({
      data: { slug: "next-slug", thumbnail_url: null },
      error: null,
    });
    await updatePost(input);
    const paths = revalidatePath.mock.calls.map(([path]) => path);
    expect(paths.filter((path) => path === "/posts/next-slug")).toHaveLength(1);
  });

  it("버킷의 posts/ 경로 썸네일은 허용하고 다른 폴더·외부 주소는 거부한다", async () => {
    const ok = await updatePost({
      ...input,
      thumbnailUrl: `${BUCKET}/posts/a.png`,
    });
    expect(ok.ok).toBe(true);
    for (const url of [`${BUCKET}/dev-logs/a.png`, "https://evil.test/a.png"]) {
      const error = await failure({ ...input, thumbnailUrl: url });
      expect(error.fieldErrors?.thumbnailUrl).toBeTruthy();
    }
  });

  it("수정 전과 같은 버킷 밖 썸네일은 그대로 저장할 수 있다", async () => {
    maybeSingle.mockResolvedValue({
      data: { slug: "old-slug", thumbnail_url: "/legacy/a.png" },
      error: null,
    });
    const result = await updatePost({
      ...input,
      thumbnailUrl: "/legacy/a.png",
    });
    expect(result.ok).toBe(true);
  });

  it("slug 중복(23505)은 slug 필드 conflict이고 재검증하지 않는다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "23505" } });
    const error = await failure();
    expect(error.code).toBe("conflict");
    expect(error.fieldErrors?.slug).toBeTruthy();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("저장 중 대상이 사라지면(P0002) notFound다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0002" } });
    expect((await failure()).code).toBe("notFound");
  });

  it("그 외 DB 오류·조회 오류·예외는 unknown이다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "23503" } });
    expect((await failure()).code).toBe("unknown");
    rpc.mockRejectedValue(new Error("네트워크"));
    expect((await failure()).code).toBe("unknown");
    maybeSingle.mockResolvedValue({ data: null, error: { code: "XX000" } });
    expect((await failure()).code).toBe("unknown");
  });
});

describe("deletePost", () => {
  const ID = "0b1c2d3e-4f50-4a6b-8c7d-9e0f1a2b3c4d";
  const BUCKET =
    "https://example.supabase.co/storage/v1/object/public/thumbnails";

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getViewer.mockReset().mockResolvedValue({ isAdmin: true });
    maybeSingle.mockReset().mockResolvedValue({
      data: { slug: "old-slug", thumbnail_url: `${BUCKET}/posts/a.png` },
      error: null,
    });
    deleteSelect
      .mockReset()
      .mockResolvedValue({ data: [{ id: ID }], error: null });
    removeBucketImage.mockReset().mockResolvedValue(undefined);
    createClient.mockClear();
    revalidatePath.mockClear();
  });

  /** 실패 결과의 오류만 꺼낸다 */
  async function failure(id = ID) {
    const result = await deletePost(id);
    if (result.ok) throw new Error("실패를 기대했습니다");
    return result.error;
  }

  it("관리자가 아니면 DB를 부르지 않고 forbidden이다", async () => {
    getViewer.mockResolvedValue({ isAdmin: false });
    expect((await failure()).code).toBe("forbidden");
    expect(createClient).not.toHaveBeenCalled();
    expect(removeBucketImage).not.toHaveBeenCalled();
  });

  it("uuid가 아닌 id는 DB를 부르지 않고 이미 삭제된 글(notFound)이다", async () => {
    const error = await failure("없는-id");
    expect(error.code).toBe("notFound");
    expect(error.message).toBe("이미 삭제된 글입니다.");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("삭제 전 글이 없으면 notFound이고 삭제·정리하지 않는다", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await failure()).code).toBe("notFound");
    expect(deleteSelect).not.toHaveBeenCalled();
    expect(removeBucketImage).not.toHaveBeenCalled();
  });

  it("조회와 삭제 사이에 지워져 0행이면 notFound이고 정리하지 않는다", async () => {
    deleteSelect.mockResolvedValue({ data: [], error: null });
    expect((await failure()).code).toBe("notFound");
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(removeBucketImage).not.toHaveBeenCalled();
  });

  it("성공하면 목록·상세를 재검증하고 이 글의 썸네일을 posts 폴더 기준으로 정리한다", async () => {
    expect(await deletePost(ID)).toEqual({ ok: true, data: null });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/posts/old-slug");
    expect(removeBucketImage).toHaveBeenCalledWith(
      `${BUCKET}/posts/a.png`,
      "posts",
    );
  });

  it("썸네일이 없어도 삭제는 성공한다(정리 헬퍼가 null을 걸러낸다)", async () => {
    maybeSingle.mockResolvedValue({
      data: { slug: "old-slug", thumbnail_url: null },
      error: null,
    });
    expect((await deletePost(ID)).ok).toBe(true);
    expect(removeBucketImage).toHaveBeenCalledWith(null, "posts");
  });

  it("삭제 오류·조회 오류·예외는 unknown이고 재검증하지 않는다", async () => {
    deleteSelect.mockResolvedValue({ data: null, error: { code: "XX000" } });
    expect((await failure()).code).toBe("unknown");
    deleteSelect.mockRejectedValue(new Error("네트워크"));
    expect((await failure()).code).toBe("unknown");
    maybeSingle.mockResolvedValue({ data: null, error: { code: "XX000" } });
    expect((await failure()).code).toBe("unknown");
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(removeBucketImage).not.toHaveBeenCalled();
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

describe("createTag", () => {
  const row = { id: "t-1", name: "React", created_at: "2026-11-22T00:00:00Z" };

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getViewer.mockReset().mockResolvedValue({ isAdmin: true });
    rpc.mockReset().mockResolvedValue({ data: row, error: null });
    createClient.mockClear();
  });

  it("관리자가 아니면 DB를 부르지 않고 forbidden이다", async () => {
    getViewer.mockResolvedValue({ isAdmin: false });
    const result = await createTag("React");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("forbidden");
    expect(createClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("빈 이름은 validation 오류이고 DB를 부르지 않는다", async () => {
    const result = await createTag("   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation");
      expect(result.error.fieldErrors?.name).toBe("태그 이름을 입력해 주세요");
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("20자를 넘으면 validation 오류이고 DB를 부르지 않는다", async () => {
    const result = await createTag("a".repeat(21));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("validation");
      expect(result.error.fieldErrors?.name).toContain("20자");
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it("정규화한 이름으로 add_tag를 호출하고 태그를 돌려준다", async () => {
    rpc.mockResolvedValue({
      data: { id: "t-2", name: "Vitest", created_at: "x" },
      error: null,
    });
    const result = await createTag(" #  Vitest  ");
    expect(rpc).toHaveBeenCalledWith("add_tag", { tag_name: "Vitest" });
    expect(result).toEqual({ ok: true, data: { id: "t-2", name: "Vitest" } });
  });

  it("대소문자만 다른 이름은 add_tag가 돌려준 기존 태그(최초 표기)를 그대로 돌려준다", async () => {
    const result = await createTag("react");
    expect(rpc).toHaveBeenCalledWith("add_tag", { tag_name: "react" });
    expect(result).toEqual({ ok: true, data: { id: "t-1", name: "React" } });
  });

  it("DB 오류는 unknown으로 바꾸고 예외를 던지지 않는다", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const result = await createTag("React");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("unknown");
  });

  it("정책으로 등록이 막혀 빈 행이 오면 unknown이다", async () => {
    rpc.mockResolvedValue({
      data: { id: null, name: null, created_at: null },
      error: null,
    });
    const result = await createTag("React");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("unknown");
  });

  it("클라이언트 생성·호출 중 예외도 unknown으로 바꾼다", async () => {
    rpc.mockRejectedValue(new Error("network"));
    await expect(createTag("React")).resolves.toMatchObject({
      ok: false,
      error: { code: "unknown" },
    });
    createClient.mockRejectedValueOnce(new Error("cookies"));
    await expect(createTag("React")).resolves.toMatchObject({
      ok: false,
      error: { code: "unknown" },
    });
  });
});

describe("프로필 액션", () => {
  it("프로필 수정은 입력값을 반영해 돌려준다", async () => {
    const result = await updateProfile({
      displayName: "새 이름",
      avatarUrl: null,
    });
    expect(result.ok && result.data.displayName).toBe("새 이름");
  });
});
