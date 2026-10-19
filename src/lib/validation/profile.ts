import { z } from "zod";
import { displayNameSchema, thumbnailUrlSchema } from "@/lib/validation/fields";

/** 프로필 수정 폼 스키마. 이미지를 제거하면 avatarUrl이 null이다 */
export const profileFormSchema = z.object({
  displayName: displayNameSchema,
  avatarUrl: thumbnailUrlSchema,
});

/** 검증을 통과한 프로필 입력값 (ProfileInput과 같은 모양) */
export type ProfileFormValues = z.output<typeof profileFormSchema>;
