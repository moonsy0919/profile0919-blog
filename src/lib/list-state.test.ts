import { describe, expect, it } from "vitest";
import {
  buildBackHref,
  buildDetailHref,
  buildListQuery,
  parseListState,
} from "@/lib/list-state";

describe("parseListState", () => {
  it("쿼리가 없으면 전체·1페이지다", () => {
    expect(parseListState({})).toEqual({ page: 1 });
  });

  it("유효한 tag와 page를 읽는다", () => {
    expect(parseListState({ tag: "Next.js", page: "3" })).toEqual({
      tag: "Next.js",
      page: 3,
    });
  });

  it("page가 0, 음수, 소수, 지수, 문자이면 1로 본다", () => {
    for (const page of ["0", "-2", "1.5", "1e3", "abc", "", " 2", "NaN"]) {
      expect(parseListState({ page }).page).toBe(1);
    }
  });

  it("너무 큰 page 숫자는 무시한다", () => {
    expect(parseListState({ page: "9999999999999" }).page).toBe(1);
  });

  it("같은 키가 여러 번이면 첫 값만 쓴다", () => {
    expect(parseListState({ tag: ["a", "b"], page: ["2", "3"] })).toEqual({
      tag: "a",
      page: 2,
    });
  });

  it("빈 배열과 undefined는 기본값이다", () => {
    expect(parseListState({ tag: [], page: undefined })).toEqual({ page: 1 });
  });

  it("tag의 앞뒤 공백을 지우고 비었으면 무시한다", () => {
    expect(parseListState({ tag: "  react  " }).tag).toBe("react");
    expect(parseListState({ tag: "   " }).tag).toBeUndefined();
    expect(parseListState({ tag: "" }).tag).toBeUndefined();
  });

  it("태그 이름 한도(20자)를 넘는 tag는 무시한다", () => {
    expect(parseListState({ tag: "가".repeat(20) }).tag).toBe("가".repeat(20));
    expect(parseListState({ tag: "가".repeat(21) }).tag).toBeUndefined();
  });
});

describe("buildListQuery", () => {
  it("모두 기본값이면 빈 문자열이다", () => {
    expect(buildListQuery({})).toBe("");
    expect(buildListQuery({ tag: undefined, page: 1 })).toBe("");
    expect(buildListQuery({ tag: null, page: null })).toBe("");
  });

  it("값이 있는 것만 쿼리에 넣는다", () => {
    expect(buildListQuery({ tag: "react" })).toBe("?tag=react");
    expect(buildListQuery({ page: 2 })).toBe("?page=2");
    expect(buildListQuery({ tag: "react", page: 2 })).toBe("?tag=react&page=2");
  });

  it("잘못된 page는 생략한다", () => {
    expect(buildListQuery({ page: 0 })).toBe("");
    expect(buildListQuery({ page: -1 })).toBe("");
    expect(buildListQuery({ page: 1.5 })).toBe("");
    expect(buildListQuery({ page: Number.NaN })).toBe("");
  });

  it("공백과 한글 tag를 인코딩한다", () => {
    expect(buildListQuery({ tag: "나의 일기" })).toBe(
      "?tag=%EB%82%98%EC%9D%98+%EC%9D%BC%EA%B8%B0",
    );
  });

  it("빈 tag는 생략한다", () => {
    expect(buildListQuery({ tag: "  " })).toBe("");
  });
});

describe("buildDetailHref", () => {
  it("현재 목록 상태를 상세 경로 쿼리로 붙인다", () => {
    expect(buildDetailHref("/posts/hello", { tag: "react", page: 2 })).toBe(
      "/posts/hello?tag=react&page=2",
    );
  });

  it("기본 상태이면 쿼리 없이 경로만 돌려준다", () => {
    expect(buildDetailHref("/posts/hello", {})).toBe("/posts/hello");
  });

  it("개발 일기는 page만 넘긴다", () => {
    expect(buildDetailHref("/dev-logs/dl-1", { page: 2 })).toBe(
      "/dev-logs/dl-1?page=2",
    );
  });
});

describe("buildBackHref", () => {
  it("전달된 tag와 page를 복원한다", () => {
    expect(buildBackHref("/", { tag: "react", page: "2" })).toBe(
      "/?tag=react&page=2",
    );
  });

  it("직접 접근이면 기본 목록이다", () => {
    expect(buildBackHref("/", {})).toBe("/");
  });

  it("잘못된 값은 무시하고 기본 목록으로 간다", () => {
    expect(buildBackHref("/", { tag: " ", page: "-1" })).toBe("/");
    expect(buildBackHref("/", { page: "abc" })).toBe("/");
  });

  it("edit 같은 다른 쿼리는 복원하지 않는다", () => {
    expect(buildBackHref("/", { edit: "1", page: "2" })).toBe("/?page=2");
  });

  it("includeTag가 false이면 page만 복원한다", () => {
    expect(
      buildBackHref(
        "/dev-logs",
        { tag: "react", page: "3" },
        { includeTag: false },
      ),
    ).toBe("/dev-logs?page=3");
  });
});

describe("왕복", () => {
  it("만든 쿼리를 다시 파싱하면 같은 상태가 복원된다", () => {
    const states = [
      { page: 1 },
      { page: 4 },
      { tag: "react", page: 1 },
      { tag: "나의 일기 & 메모", page: 3 },
    ];
    for (const state of states) {
      const query = buildListQuery(state);
      const parsed = parseListState(
        Object.fromEntries(new URLSearchParams(query)),
      );
      expect(parsed).toEqual(state);
    }
  });
});
