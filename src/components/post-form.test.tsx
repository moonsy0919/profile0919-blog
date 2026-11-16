import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Post, Tag } from "@/lib/data";
import { PostForm } from "./post-form";

const { push, toast, createPost, updatePost } = vi.hoisted(() => ({
  push: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
  createPost: vi.fn(),
  updatePost: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast }));
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

beforeEach(() => {
  vi.clearAllMocks();
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
