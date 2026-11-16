import { describe, expect, it } from "vitest";
import { validateAvatarFile } from "@/lib/validation/avatar";
import { AVATAR_MAX_BYTES } from "@/lib/validation/constants";
import { zodErrorToFieldErrors } from "@/lib/validation/errors";
import { loginFormSchema } from "@/lib/validation/login";

describe("loginFormSchema", () => {
  it("아이디 앞뒤 공백을 지우고 통과시킨다", () => {
    const result = loginFormSchema.parse({
      email: "  admin@example.com ",
      password: "pw",
    });
    expect(result).toEqual({ email: "admin@example.com", password: "pw" });
  });

  it("빈 값은 필드별 필수 문구를 돌려준다", () => {
    const result = loginFormSchema.safeParse({ email: " ", password: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(zodErrorToFieldErrors(result.error)).toEqual({
      email: "아이디(이메일)를 입력해 주세요",
      password: "비밀번호를 입력해 주세요",
    });
  });

  it("이메일 형식이 아니면 형식 오류를 돌려준다", () => {
    const result = loginFormSchema.safeParse({
      email: "admin",
      password: "pw",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(zodErrorToFieldErrors(result.error).email).toBe(
      "올바른 이메일 형식으로 입력해 주세요",
    );
  });
});

describe("validateAvatarFile", () => {
  it("허용 형식 4종은 통과한다", () => {
    for (const type of ["image/png", "image/jpeg", "image/gif", "image/webp"]) {
      expect(validateAvatarFile({ type, size: 1024 })).toBeNull();
    }
  });

  it("허용하지 않는 형식은 거부한다", () => {
    expect(validateAvatarFile({ type: "image/svg+xml", size: 1024 })).toBe(
      "PNG, JPG, GIF, WEBP 형식의 이미지만 올릴 수 있습니다",
    );
  });

  it("5MB 정확히는 통과하고 1바이트 초과는 거부한다", () => {
    const type = "image/png";
    expect(validateAvatarFile({ type, size: AVATAR_MAX_BYTES })).toBeNull();
    expect(validateAvatarFile({ type, size: AVATAR_MAX_BYTES + 1 })).toBe(
      "이미지는 5MB 이하로 올려 주세요",
    );
  });
});
