import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSitemapDevLogs, getSitemapPosts } from "./reads-sitemap";

const order = vi.fn();
const eq = vi.fn(() => ({ order }));
const createClient = vi.fn(() => ({
  from: () => ({ select: () => ({ eq }) }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClient(...(args as [])),
}));

describe("getSitemapPosts", () => {
  beforeEach(() => {
    order.mockReset();
    eq.mockClear();
  });

  it("공개 글의 slug와 수정일을 도메인 형태로 돌려준다", async () => {
    const chain = { order };
    order.mockReturnValueOnce(chain).mockResolvedValueOnce({
      data: [{ slug: "hello-world", updated_at: "2026-11-11T00:00:00Z" }],
      error: null,
    });

    expect(await getSitemapPosts()).toEqual([
      { slug: "hello-world", updatedAt: "2026-11-11T00:00:00Z" },
    ]);
    expect(eq).toHaveBeenCalledWith("published", true);
  });

  it("조회가 실패하면 예외를 던진다(호출하는 쪽이 폴백한다)", async () => {
    order
      .mockReturnValueOnce({ order })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    await expect(getSitemapPosts()).rejects.toThrow(
      "사이트맵용 게시글 조회에 실패했습니다",
    );
  });
});

describe("getSitemapDevLogs", () => {
  beforeEach(() => {
    order.mockReset();
    eq.mockClear();
  });

  it("개발 일기의 id와 수정일을 돌려주고 published 필터는 쓰지 않는다", async () => {
    // dev_logs는 select 바로 뒤에 order가 이어지므로 eq 없이 order 체인을 쓴다
    const devLogOrder = vi.fn();
    devLogOrder
      .mockReturnValueOnce({ order: devLogOrder })
      .mockResolvedValueOnce({
        data: [{ id: "id-1", updated_at: "2026-11-12T00:00:00Z" }],
        error: null,
      });
    createClient.mockReturnValueOnce({
      from: () => ({ select: () => ({ order: devLogOrder }) }),
    } as never);

    expect(await getSitemapDevLogs()).toEqual([
      { id: "id-1", updatedAt: "2026-11-12T00:00:00Z" },
    ]);
    expect(eq).not.toHaveBeenCalled();
  });

  it("조회가 실패하면 예외를 던진다", async () => {
    const devLogOrder = vi.fn();
    devLogOrder
      .mockReturnValueOnce({ order: devLogOrder })
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    createClient.mockReturnValueOnce({
      from: () => ({ select: () => ({ order: devLogOrder }) }),
    } as never);

    await expect(getSitemapDevLogs()).rejects.toThrow(
      "사이트맵용 개발 일기 조회에 실패했습니다",
    );
  });
});
