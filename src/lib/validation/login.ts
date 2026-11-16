import { z } from "zod";

/** 로그인 폼 스키마. 아이디는 이메일 형식이고, 비밀번호는 비어 있지만 않으면 된다 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "아이디(이메일)를 입력해 주세요")
    .pipe(z.email("올바른 이메일 형식으로 입력해 주세요")),
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
});

/** 검증을 통과한 로그인 입력값 */
export type LoginFormValues = z.output<typeof loginFormSchema>;
