import { describe, expect, expectTypeOf, it } from "vitest";
import type { DevLogInput, PostInput, ProfileInput } from "@/lib/data/types";
import { devLogFormSchema } from "@/lib/validation/dev-log";
import { zodErrorToFieldErrors } from "@/lib/validation/errors";
import { postFormSchema } from "@/lib/validation/post";
import { profileFormSchema } from "@/lib/validation/profile";

const validPost = {
  title: "  제목  ",
  slug: "hello-blog",
  content: "# 본문",
  thumbnailUrl: "",
  tagIds: ["a", "b", "a"],
};

describe("postFormSchema", () => {
  it("값을 정리해 PostInput 모양으로 돌려준다", () => {
    const result = postFormSchema.parse(validPost);
    expect(result).toEqual({
      title: "제목",
      slug: "hello-blog",
      content: "# 본문",
      thumbnailUrl: null,
      tagIds: ["a", "b"],
    });
  });

  it("썸네일을 생략해도 통과한다", () => {
    const result = postFormSchema.safeParse({
      ...validPost,
      thumbnailUrl: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("예약어 slug와 빈 본문을 필드별로 거부한다", () => {
    const result = postFormSchema.safeParse({
      ...validPost,
      slug: "new",
      content: "  ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(zodErrorToFieldErrors(result.error)).sort()).toEqual([
        "content",
        "slug",
      ]);
    }
  });

  it("출력 타입이 PostInput과 같다", () => {
    expectTypeOf<
      ReturnType<typeof postFormSchema.parse>
    >().toEqualTypeOf<PostInput>();
  });
});

describe("devLogFormSchema", () => {
  const valid = {
    title: "일기",
    content: "본문",
    thumbnailUrl: null,
    githubUrl: "https://github.com/a/b",
    tagIds: [],
  };

  it("GitHub URL을 통과시키고 slug는 받지 않는다", () => {
    const result = devLogFormSchema.parse({ ...valid, slug: "ignored" });
    expect(result).toEqual(valid);
    expect(result).not.toHaveProperty("slug");
  });

  it("GitHub URL을 비우면 null이 된다", () => {
    expect(devLogFormSchema.parse({ ...valid, githubUrl: "" }).githubUrl).toBe(
      null,
    );
  });

  it("잘못된 GitHub URL은 githubUrl 필드 오류가 된다", () => {
    const result = devLogFormSchema.safeParse({
      ...valid,
      githubUrl: "http://github.com/a",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodErrorToFieldErrors(result.error)).toEqual({
        githubUrl: "https://github.com/ 로 시작하는 주소를 입력해 주세요",
      });
    }
  });

  it("출력 타입이 DevLogInput과 같다", () => {
    expectTypeOf<
      ReturnType<typeof devLogFormSchema.parse>
    >().toEqualTypeOf<DevLogInput>();
  });
});

describe("profileFormSchema", () => {
  it("이미지를 제거하면 avatarUrl이 null이다", () => {
    expect(
      profileFormSchema.parse({ displayName: " 문시현 ", avatarUrl: null }),
    ).toEqual({ displayName: "문시현", avatarUrl: null });
  });

  it("표시 이름 31자는 거부한다", () => {
    const result = profileFormSchema.safeParse({
      displayName: "가".repeat(31),
      avatarUrl: null,
    });
    expect(result.success).toBe(false);
  });

  it("출력 타입이 ProfileInput과 같다", () => {
    expectTypeOf<
      ReturnType<typeof profileFormSchema.parse>
    >().toEqualTypeOf<ProfileInput>();
  });
});

describe("zodErrorToFieldErrors", () => {
  it("필드마다 첫 메시지만 담는다", () => {
    const result = postFormSchema.safeParse({
      ...validPost,
      title: "",
      slug: "A--b",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = zodErrorToFieldErrors(result.error);
      expect(errors.title).toBe("제목을 입력해 주세요");
      expect(typeof errors.slug).toBe("string");
      expect(Object.keys(errors).sort()).toEqual(["slug", "title"]);
    }
  });

  it("배열 항목 오류는 최상위 필드로 모은다", () => {
    const result = postFormSchema.safeParse({
      ...validPost,
      tagIds: ["a", ""],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(zodErrorToFieldErrors(result.error))).toEqual([
        "tagIds",
      ]);
    }
  });

  it("태그가 11개를 넘으면 tagIds 오류가 된다", () => {
    const tagIds = Array.from({ length: 11 }, (_, i) => `t${i}`);
    const result = postFormSchema.safeParse({ ...validPost, tagIds });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodErrorToFieldErrors(result.error).tagIds).toBe(
        "태그는 최대 10개까지 선택할 수 있습니다",
      );
    }
  });

  it("객체가 아닌 입력은 필드 없는 오류라 빈 객체가 된다", () => {
    const result = postFormSchema.safeParse(null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodErrorToFieldErrors(result.error)).toEqual({});
    }
  });

  it("필수 필드가 빠지면 해당 필드 오류가 된다", () => {
    const result = postFormSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(zodErrorToFieldErrors(result.error)).sort()).toEqual([
        "content",
        "slug",
        "tagIds",
        "title",
      ]);
    }
  });
});
