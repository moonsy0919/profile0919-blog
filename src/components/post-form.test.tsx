import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post, Tag } from "@/lib/data";
import { PostForm } from "./post-form";

const { push, toast, createPost, updatePost, uploadImage, deleteImages } =
  vi.hoisted(() => ({
    push: vi.fn(),
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
    createPost: vi.fn(),
    updatePost: vi.fn(),
    uploadImage: vi.fn(),
    deleteImages: vi.fn(),
  }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/storage/upload", () => ({
  uploadImage,
  deleteImages,
  UPLOAD_FAILED_MESSAGE: "이미지를 올리지 못했습니다. 다시 시도해 주세요",
}));
vi.mock("@/lib/data/actions", () => ({
  createPost,
  updatePost,
  createTag: vi.fn(),
}));

const tags: Tag[] = [{ id: "t1", name: "React" }];
const post: Post = {
  id: "p1",
  slug: "hello-post",
  title: "안녕",
  content: "본문",
  thumbnailUrl: null,
  tags,
  createdAt: "2026-10-20T00:00:00Z",
  updatedAt: "2026-10-20T00:00:00Z",
};

/** 라벨로 입력을 찾아 값을 바꾼다 */
function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** [저장] 버튼을 돌려준다 */
function saveButton() {
  return screen.getByRole("button", { name: "저장" }) as HTMLButtonElement;
}

const BASE = "https://abc.supabase.co";
const NEW_URL = `${BASE}/storage/v1/object/public/thumbnails/posts/new.png`;
const OLD_URL = `${BASE}/storage/v1/object/public/thumbnails/posts/old.png`;

/** 썸네일 입력에 이미지 파일을 고른다 */
function pickThumbnail() {
  const file = new File(["x"], "a.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("썸네일"), {
    target: { files: [file] },
  });
  return file;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", BASE);
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  uploadImage.mockResolvedValue({
    ok: true,
    url: NEW_URL,
    path: "posts/new.png",
  });
  deleteImages.mockResolvedValue(undefined);
  createPost.mockResolvedValue({
    ok: true,
    data: { id: "x", slug: "new-one" },
  });
  updatePost.mockResolvedValue({
    ok: true,
    data: { id: "p1", slug: "hello-post" },
  });
});

describe("PostForm 작성", () => {
  it("제목·본문이 비어 있으면 [저장]이 비활성이다", () => {
    render(<PostForm tags={tags} />);
    expect(saveButton().disabled).toBe(true);
    type("제목", "Hello");
    expect(saveButton().disabled).toBe(true);
    type("본문", "내용");
    expect(saveButton().disabled).toBe(false);
  });

  it("제목을 쓰면 slug를 자동 제안하고, 직접 고치면 멈춘다", () => {
    render(<PostForm tags={tags} />);
    type("제목", "Hello World");
    expect((screen.getByLabelText("slug") as HTMLInputElement).value).toBe(
      "hello-world",
    );
    type("slug", "custom");
    type("제목", "Another");
    expect((screen.getByLabelText("slug") as HTMLInputElement).value).toBe(
      "custom",
    );
  });

  it("형식 오류(slug)는 제출 시 필드 오류로 보이고 저장하지 않는다", () => {
    render(<PostForm tags={tags} />);
    type("제목", "회고");
    type("본문", "내용");
    fireEvent.click(saveButton());
    expect(screen.getByText("slug를 입력해 주세요")).toBeTruthy();
    expect(createPost).not.toHaveBeenCalled();
  });

  it("저장 성공 시 토스트 후 상세로 이동한다", async () => {
    render(<PostForm tags={tags} />);
    type("제목", "New One");
    type("본문", "내용");
    fireEvent.click(saveButton());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/posts/new-one"));
    expect(toast.success).toHaveBeenCalledWith("글이 저장되었습니다");
  });

  it("slug 중복(conflict)은 slug 필드 오류로 보인다", async () => {
    createPost.mockResolvedValue({
      ok: false,
      error: {
        code: "conflict",
        message: "dup",
        fieldErrors: { slug: "이미 사용 중인 slug입니다." },
      },
    });
    render(<PostForm tags={tags} />);
    type("제목", "New One");
    type("본문", "내용");
    fireEvent.click(saveButton());
    expect(await screen.findByText("이미 사용 중인 slug입니다.")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it("[취소]는 변경이 없으면 메인으로, 있으면 확인 후 이동한다", () => {
    render(<PostForm tags={tags} />);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(push).toHaveBeenCalledWith("/");
    push.mockClear();
    type("제목", "바꿈");
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByText("저장하지 않고 나갈까요?")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "나가기" }));
    expect(push).toHaveBeenCalledWith("/");
  });
});

describe("PostForm 수정", () => {
  const props = {
    tags,
    post,
    cancelHref: "/posts/hello-post?page=2",
    readQuery: "?page=2",
  };

  it("상세가 불러온 값으로 채워지고 slug 자동 제안으로 덮이지 않는다", () => {
    render(<PostForm {...props} />);
    expect((screen.getByLabelText("제목") as HTMLInputElement).value).toBe(
      "안녕",
    );
    type("제목", "Brand New Title");
    expect((screen.getByLabelText("slug") as HTMLInputElement).value).toBe(
      "hello-post",
    );
    expect(screen.getByLabelText("React 태그 제거")).toBeTruthy();
  });

  it("썸네일이 사이트 내부 경로인 글도 변경 없이 저장된다", async () => {
    const withThumb = { ...post, thumbnailUrl: "/dummy/post-01.png" };
    render(<PostForm {...props} post={withThumb} />);
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(updatePost).toHaveBeenCalledWith(
        expect.objectContaining({ thumbnailUrl: "/dummy/post-01.png" }),
      ),
    );
  });

  it("slug를 바꾸면 기존 URL 무효 경고를 보인다", () => {
    render(<PostForm {...props} />);
    expect(screen.queryByRole("status")).toBeNull();
    type("slug", "renamed");
    expect(screen.getByRole("status").textContent).toContain(
      "/posts/hello-post",
    );
  });

  it("[취소]는 읽기 모드 주소로 돌아간다", () => {
    render(<PostForm {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(push).toHaveBeenCalledWith("/posts/hello-post?page=2");
  });

  it("저장 성공 시 새 slug의 읽기 모드로 tag/page를 유지해 이동한다", async () => {
    render(<PostForm {...props} />);
    type("slug", "renamed");
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/posts/renamed?page=2"),
    );
    expect(toast.success).toHaveBeenCalledWith("글이 수정되었습니다");
  });

  it("대상이 이미 삭제됐으면 토스트 후 메인으로 이동한다", async () => {
    updatePost.mockResolvedValue({
      ok: false,
      error: { code: "notFound", message: "x" },
    });
    render(<PostForm {...props} />);
    type("제목", "바꿈");
    fireEvent.click(saveButton());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(toast.error).toHaveBeenCalledWith("글을 찾을 수 없습니다");
  });
});

describe("PostForm 썸네일 업로드", () => {
  /** 제목·본문을 채운다 */
  function fillRequired() {
    type("제목", "New One");
    type("본문", "내용");
  }

  it("새 파일은 올린 뒤 저장 액션에 주소 문자열만 넘긴다", async () => {
    render(<PostForm tags={tags} />);
    fillRequired();
    const file = pickThumbnail();
    fireEvent.click(saveButton());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/posts/new-one"));

    expect(uploadImage).toHaveBeenCalledWith(file, "posts");
    const input = createPost.mock.calls[0][0];
    expect(input.thumbnailUrl).toBe(NEW_URL);
    const hasBinary = Object.values(input).some(
      (value) => value instanceof Blob,
    );
    expect(hasBinary).toBe(false);
    expect(deleteImages).not.toHaveBeenCalled();
  });

  it("파일을 고르지 않으면 업로드하지 않는다", async () => {
    render(<PostForm tags={tags} />);
    fillRequired();
    fireEvent.click(saveButton());
    await waitFor(() => expect(createPost).toHaveBeenCalled());
    expect(uploadImage).not.toHaveBeenCalled();
    expect(createPost.mock.calls[0][0].thumbnailUrl).toBeNull();
  });

  it("업로드가 실패하면 저장하지 않고 안내하며 입력값을 유지한다", async () => {
    uploadImage.mockResolvedValue({ ok: false, message: "올리지 못했습니다" });
    render(<PostForm tags={tags} />);
    fillRequired();
    pickThumbnail();
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("올리지 못했습니다"),
    );
    expect(createPost).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "올리지 못했습니다",
    );
    expect((screen.getByLabelText("제목") as HTMLInputElement).value).toBe(
      "New One",
    );
    expect(saveButton().disabled).toBe(false);
  });

  it("업로드 중에는 [저장]이 비활성이고 안내가 보인다", async () => {
    let finish: (value: unknown) => void = () => {};
    uploadImage.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<PostForm tags={tags} />);
    fillRequired();
    pickThumbnail();
    fireEvent.click(saveButton());

    expect(await screen.findByText(/올리는 중/)).toBeTruthy();
    // 제출 중에는 버튼 문구가 "저장 중…"으로 바뀐다
    const pending = screen.getByRole("button", { name: "저장 중…" });
    expect((pending as HTMLButtonElement).disabled).toBe(true);
    finish({ ok: true, url: NEW_URL, path: "posts/new.png" });
    await waitFor(() => expect(push).toHaveBeenCalled());
  });

  it("작성 중 저장이 실패하면 방금 올린 객체를 지운다", async () => {
    createPost.mockResolvedValue({
      ok: false,
      error: { code: "unknown", message: "x" },
    });
    render(<PostForm tags={tags} />);
    fillRequired();
    pickThumbnail();
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(deleteImages).toHaveBeenCalledWith(["posts/new.png"]),
    );
  });

  it("수정 중 저장이 성공하면 이전 객체를 지운다", async () => {
    const withThumb = { ...post, thumbnailUrl: OLD_URL };
    render(<PostForm tags={tags} post={withThumb} />);
    pickThumbnail();
    fireEvent.click(saveButton());
    await waitFor(() => expect(updatePost).toHaveBeenCalled());

    expect(updatePost.mock.calls[0][0].thumbnailUrl).toBe(NEW_URL);
    await waitFor(() =>
      expect(deleteImages).toHaveBeenCalledWith(["posts/old.png"]),
    );
    expect(deleteImages).toHaveBeenCalledTimes(1);
  });

  it("수정 중 저장이 실패하면 새 객체만 지우고 이전 객체는 둔다", async () => {
    updatePost.mockResolvedValue({
      ok: false,
      error: { code: "unknown", message: "x" },
    });
    const withThumb = { ...post, thumbnailUrl: OLD_URL };
    render(<PostForm tags={tags} post={withThumb} />);
    pickThumbnail();
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(deleteImages).toHaveBeenCalledWith(["posts/new.png"]),
    );
    expect(deleteImages).toHaveBeenCalledTimes(1);
  });
});
