import { z } from "zod";
import {
  contentSchema,
  githubUrlSchema,
  tagIdsSchema,
  thumbnailUrlSchema,
  titleSchema,
} from "@/lib/validation/fields";

/** 개발 일기 작성·수정 폼 스키마. 게시글과 달리 slug가 없고 GitHub URL(선택)이 있다 */
export const devLogFormSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  thumbnailUrl: thumbnailUrlSchema,
  githubUrl: githubUrlSchema,
  tagIds: tagIdsSchema,
});

/** 검증을 통과한 개발 일기 입력값 (DevLogInput과 같은 모양) */
export type DevLogFormValues = z.output<typeof devLogFormSchema>;
