import { z } from "zod";
import {
  contentSchema,
  slugSchema,
  tagIdsSchema,
  thumbnailUrlSchema,
  titleSchema,
} from "@/lib/validation/fields";

/** 게시글 작성·수정 폼 스키마. 클라이언트 폼과 서버 액션(createPost·updatePost)이 공용으로 쓴다 */
export const postFormSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  content: contentSchema,
  thumbnailUrl: thumbnailUrlSchema,
  tagIds: tagIdsSchema,
});

/** 검증을 통과한 게시글 입력값 (PostInput과 같은 모양) */
export type PostFormValues = z.output<typeof postFormSchema>;
