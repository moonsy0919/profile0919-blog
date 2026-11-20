import { describe, expect, it, vi } from "vitest";
import { getProfile, getViewer } from "@/lib/data";

const getClaims = vi.fn();
const rpc = vi.fn();
const maybeSingle = vi.fn();
const from = vi.fn(() => ({
  select: () => ({
    order: () => ({ limit: () => ({ maybeSingle }) }),
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims }, rpc, from }),
}));

describe("getProfile / getViewer", () => {
  it("profiles 행을 도메인 프로필로 바꿔 돌려준다", async () => {
    maybeSingle.mockResolvedValue({
      data: { id: "u1", display_name: "홍길동", avatar_url: "/a.png" },
      error: null,
    });
    expect(await getProfile()).toEqual({
      id: "u1",
      displayName: "홍길동",
      avatarUrl: "/a.png",
    });
    expect(from).toHaveBeenCalledWith("profiles");
  });

  it("아바타가 없으면 avatarUrl은 null이다", async () => {
    maybeSingle.mockResolvedValue({
      data: { id: "u1", display_name: "홍길동", avatar_url: null },
      error: null,
    });
    expect((await getProfile())?.avatarUrl).toBeNull();
  });

  it("행이 없으면 null이다", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getProfile()).toBeNull();
  });

  it("조회 오류나 예외는 던지지 않고 null이다", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await getProfile()).toBeNull();
    maybeSingle.mockRejectedValue(new Error("network"));
    expect(await getProfile()).toBeNull();
  });

  it("로그인하지 않았으면 방문자이고 DB를 부르지 않는다", async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    expect(await getViewer()).toEqual({ isAdmin: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("토큰 검증에 실패하면 방문자이고 DB를 부르지 않는다", async () => {
    getClaims.mockResolvedValue({ data: null, error: { message: "bad jwt" } });
    expect(await getViewer()).toEqual({ isAdmin: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("로그인했어도 승인된 관리자가 아니면 방문자다", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "u1" } },
      error: null,
    });
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await getViewer()).toEqual({ isAdmin: false });
  });

  it("승인된 관리자면 관리자다(DB 호출은 is_admin 한 번뿐)", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: "u1" } },
      error: null,
    });
    rpc.mockResolvedValue({ data: true, error: null });
    expect(await getViewer()).toEqual({ isAdmin: true });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("조회 중 오류가 나면 방문자로 폴백한다", async () => {
    getClaims.mockRejectedValue(new Error("network"));
    expect(await getViewer()).toEqual({ isAdmin: false });
  });
});
