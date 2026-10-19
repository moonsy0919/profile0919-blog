import { describe, expect, it } from "vitest";
import {
  contentSchema,
  displayNameSchema,
  githubUrlSchema,
  normalizeTagName,
  slugSchema,
  tagIdsSchema,
  tagNameSchema,
  thumbnailUrlSchema,
  titleSchema,
} from "@/lib/validation/fields";

/** 스키마가 통과시킨 값을 돌려준다. 실패하면 undefined */
function parsed<T>(
  schema: {
    safeParse: (v: unknown) => { success: boolean; data?: T };
  },
  value: unknown,
): T | undefined {
  const result = schema.safeParse(value);
  return result.success ? result.data : undefined;
}

/** 스키마가 거부했을 때 첫 오류 메시지를 돌려준다. 통과하면 undefined */
function firstError(
  schema: {
    safeParse: (v: unknown) => {
      success: boolean;
      error?: { issues: { message: string }[] };
    };
  },
  value: unknown,
): string | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error?.issues[0]?.message;
}

describe("titleSchema", () => {
  it("앞뒤 공백을 지운 값을 돌려준다", () => {
    expect(parsed(titleSchema, "  제목  ")).toBe("제목");
  });

  it("100자는 통과하고 101자는 거부한다", () => {
    expect(titleSchema.safeParse("가".repeat(100)).success).toBe(true);
    expect(titleSchema.safeParse("가".repeat(101)).success).toBe(false);
  });

  it("공백뿐이거나 빈 제목은 거부한다", () => {
    expect(firstError(titleSchema, "")).toBe("제목을 입력해 주세요");
    expect(firstError(titleSchema, "   ")).toBe("제목을 입력해 주세요");
  });

  it("공백을 지운 뒤 길이로 판단한다", () => {
    expect(titleSchema.safeParse(` ${"가".repeat(100)} `).success).toBe(true);
  });
});

describe("contentSchema", () => {
  it("내용이 있으면 값을 그대로 돌려준다", () => {
    expect(parsed(contentSchema, "# 제목\n\n본문\n")).toBe("# 제목\n\n본문\n");
  });

  it("빈 문자열과 공백·줄바꿈뿐인 본문은 거부한다", () => {
    expect(firstError(contentSchema, "")).toBe("본문을 입력해 주세요");
    expect(firstError(contentSchema, " \n\t ")).toBe("본문을 입력해 주세요");
  });
});

describe("slugSchema", () => {
  it("올바른 slug를 통과시킨다", () => {
    for (const slug of ["hello", "hello-blog", "a1-b2-c3", "2026"]) {
      expect(slugSchema.safeParse(slug).success).toBe(true);
    }
  });

  it("앞뒤 공백은 지운다", () => {
    expect(parsed(slugSchema, " hello ")).toBe("hello");
  });

  it("예약어 new는 거부한다", () => {
    expect(firstError(slugSchema, "new")).toBe("사용할 수 없는 slug입니다");
  });

  it("new가 들어간 다른 slug는 허용한다", () => {
    expect(slugSchema.safeParse("new-post").success).toBe(true);
    expect(slugSchema.safeParse("renew").success).toBe(true);
  });

  it("대문자, 밑줄, 공백, 한글은 거부한다", () => {
    for (const slug of ["Hello", "a_b", "a b", "한글"]) {
      expect(slugSchema.safeParse(slug).success).toBe(false);
    }
  });

  it("연속 하이픈과 앞뒤 하이픈은 거부한다", () => {
    for (const slug of ["a--b", "-a", "a-", "-"]) {
      expect(slugSchema.safeParse(slug).success).toBe(false);
    }
  });

  it("빈 값은 거부한다", () => {
    expect(firstError(slugSchema, "")).toBe("slug를 입력해 주세요");
  });

  it("100자는 통과하고 101자는 거부한다", () => {
    expect(slugSchema.safeParse("a".repeat(100)).success).toBe(true);
    expect(slugSchema.safeParse("a".repeat(101)).success).toBe(false);
  });
});

describe("normalizeTagName", () => {
  it("공백과 선행 #을 정리한다", () => {
    expect(normalizeTagName("  #Next.js  ")).toBe("Next.js");
    expect(normalizeTagName("나의   일기")).toBe("나의 일기");
    expect(normalizeTagName("## 두 개")).toBe("두 개");
  });

  it("중간의 #은 남긴다", () => {
    expect(normalizeTagName("c#")).toBe("c#");
  });
});

describe("tagNameSchema", () => {
  it("정규화한 값을 돌려준다", () => {
    expect(parsed(tagNameSchema, "  #React   Hooks ")).toBe("React Hooks");
  });

  it("20자는 통과하고 21자는 거부한다", () => {
    expect(tagNameSchema.safeParse("가".repeat(20)).success).toBe(true);
    expect(tagNameSchema.safeParse("가".repeat(21)).success).toBe(false);
  });

  it("정규화 뒤 길이로 판단한다", () => {
    expect(tagNameSchema.safeParse(`#${"가".repeat(20)}`).success).toBe(true);
  });

  it("비었거나 #뿐인 입력은 거부한다", () => {
    expect(firstError(tagNameSchema, "")).toBe("태그 이름을 입력해 주세요");
    expect(firstError(tagNameSchema, " # ")).toBe("태그 이름을 입력해 주세요");
  });
});

describe("tagIdsSchema", () => {
  const ids = (count: number) =>
    Array.from({ length: count }, (_, i) => `tag-${i}`);

  it("빈 배열을 허용한다", () => {
    expect(parsed(tagIdsSchema, [])).toEqual([]);
  });

  it("10개는 통과하고 11개는 거부한다", () => {
    expect(tagIdsSchema.safeParse(ids(10)).success).toBe(true);
    expect(firstError(tagIdsSchema, ids(11))).toBe(
      "태그는 최대 10개까지 선택할 수 있습니다",
    );
  });

  it("중복 id를 지우고 순서는 유지한다", () => {
    expect(parsed(tagIdsSchema, ["b", "a", "b", "a"])).toEqual(["b", "a"]);
  });

  it("중복을 지운 뒤 개수로 판단한다", () => {
    expect(tagIdsSchema.safeParse([...ids(10), ...ids(10)]).success).toBe(true);
  });

  it("빈 id는 거부한다", () => {
    expect(tagIdsSchema.safeParse([""]).success).toBe(false);
  });
});

describe("displayNameSchema", () => {
  it("앞뒤 공백을 지운 값을 돌려준다", () => {
    expect(parsed(displayNameSchema, " 문시현 ")).toBe("문시현");
  });

  it("30자는 통과하고 31자는 거부한다", () => {
    expect(displayNameSchema.safeParse("가".repeat(30)).success).toBe(true);
    expect(displayNameSchema.safeParse("가".repeat(31)).success).toBe(false);
  });

  it("빈 값과 공백뿐인 값은 거부한다", () => {
    expect(firstError(displayNameSchema, "  ")).toBe(
      "표시 이름을 입력해 주세요",
    );
  });
});

describe("githubUrlSchema", () => {
  it("빈 값, 공백, undefined, null은 null이 된다", () => {
    for (const value of ["", "   ", undefined, null]) {
      expect(parsed(githubUrlSchema, value)).toBeNull();
    }
  });

  it("https://github.com/ 주소를 통과시킨다", () => {
    const url = "https://github.com/moonsy0919/profile0919-blog";
    expect(parsed(githubUrlSchema, url)).toBe(url);
    expect(parsed(githubUrlSchema, ` ${url} `)).toBe(url);
  });

  it("호스트 대소문자는 구분하지 않는다", () => {
    expect(githubUrlSchema.safeParse("https://GitHub.com/a/b").success).toBe(
      true,
    );
  });

  it("http 주소는 거부한다", () => {
    expect(githubUrlSchema.safeParse("http://github.com/a/b").success).toBe(
      false,
    );
  });

  it("다른 호스트와 비슷한 호스트는 거부한다", () => {
    for (const url of [
      "https://gitlab.com/a/b",
      "https://github.com.evil.com/a",
      "https://evil.com/https://github.com/a",
      "https://user@github.com/a",
      "https://www.github.com/a",
    ]) {
      expect(githubUrlSchema.safeParse(url).success).toBe(false);
    }
  });

  it("경로 없이 호스트만 있는 주소는 거부한다", () => {
    expect(githubUrlSchema.safeParse("https://github.com").success).toBe(false);
  });

  it("URL이 아닌 문자열은 거부한다", () => {
    expect(githubUrlSchema.safeParse("github.com/a/b").success).toBe(false);
    expect(firstError(githubUrlSchema, "abc")).toBe(
      "https://github.com/ 로 시작하는 주소를 입력해 주세요",
    );
  });

  it("너무 긴 주소는 거부한다", () => {
    const url = `https://github.com/${"a".repeat(2048)}`;
    expect(githubUrlSchema.safeParse(url).success).toBe(false);
  });
});

describe("thumbnailUrlSchema", () => {
  it("빈 값은 null이 된다", () => {
    for (const value of ["", "  ", undefined, null]) {
      expect(parsed(thumbnailUrlSchema, value)).toBeNull();
    }
  });

  it("http(s) 주소를 통과시킨다", () => {
    const url = "https://example.supabase.co/storage/v1/object/public/a.png";
    expect(parsed(thumbnailUrlSchema, url)).toBe(url);
  });

  it("http가 아닌 스킴과 URL이 아닌 값은 거부한다", () => {
    for (const value of ["javascript:alert(1)", "ftp://a.com/x", "not a url"]) {
      expect(thumbnailUrlSchema.safeParse(value).success).toBe(false);
    }
  });
});
