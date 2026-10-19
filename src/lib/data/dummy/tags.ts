import type { Tag } from "../types";

/** 더미 태그 6개. 글·개발 일기 더미가 이 객체를 참조한다 */
export const dummyTags: Tag[] = [
  { id: "tag-nextjs", name: "Next.js" },
  { id: "tag-react", name: "React" },
  { id: "tag-typescript", name: "TypeScript" },
  { id: "tag-supabase", name: "Supabase" },
  { id: "tag-css", name: "CSS" },
  { id: "tag-retro", name: "회고" },
];

/**
 * 태그 id로 더미 태그를 찾아 배열로 돌려준다.
 * @param ids 태그 id 목록
 */
export function pickTags(ids: string[]): Tag[] {
  return dummyTags.filter((tag) => ids.includes(tag.id));
}
