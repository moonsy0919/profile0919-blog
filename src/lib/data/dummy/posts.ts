import type { Post } from "../types";
import { pickTags } from "./tags";

type PostSeed = {
  no: number;
  slug: string;
  title: string;
  content: string;
  hasThumbnail: boolean;
  tagIds: string[];
};

const seeds: PostSeed[] = [
  {
    no: 1,
    slug: "hello-blog",
    title: "블로그를 시작합니다",
    content: "# 시작\n\n개인 블로그를 만들며 **기록**을 시작합니다.",
    hasThumbnail: true,
    tagIds: ["tag-retro"],
  },
  {
    no: 2,
    slug: "nextjs-app-router",
    title: "Next.js App Router 구조 정리",
    content: "## 라우트 그룹\n\n`(main)`과 `(site)`로 헤더 변형을 나눈다.",
    hasThumbnail: true,
    tagIds: ["tag-nextjs", "tag-react"],
  },
  {
    no: 3,
    slug: "typescript-narrowing",
    title: "TypeScript 타입 좁히기 노트",
    content: "판별 유니온으로 성공과 실패를 구분한다.",
    hasThumbnail: false,
    tagIds: ["tag-typescript"],
  },
  {
    no: 4,
    slug: "tailwind-v4-theme",
    title: "TailwindCSS v4 테마 변수",
    content: "`@theme` 블록에서 CSS 변수를 직접 관리한다.",
    hasThumbnail: true,
    tagIds: ["tag-css"],
  },
  {
    no: 5,
    slug: "supabase-rls-basics",
    title: "Supabase RLS 기초",
    content: "읽기는 공개, 쓰기는 관리자만 허용하는 정책을 만든다.",
    hasThumbnail: false,
    tagIds: ["tag-supabase"],
  },
  {
    no: 6,
    slug: "react-server-components",
    title: "서버 컴포넌트와 클라이언트 경계",
    content: "상태와 이벤트가 필요할 때만 `use client`를 붙인다.",
    hasThumbnail: true,
    tagIds: ["tag-react", "tag-nextjs"],
  },
  {
    no: 7,
    slug: "weather-header-notes",
    title: "날씨 헤더 만들기",
    content: "Open-Meteo 응답을 WMO 코드로 분류해 장면을 정한다.",
    hasThumbnail: true,
    tagIds: ["tag-css", "tag-typescript"],
  },
  {
    no: 8,
    slug: "form-validation",
    title: "폼 검증을 서버와 공유하기",
    content: "클라이언트 폼과 서버 액션이 같은 스키마를 쓴다.",
    hasThumbnail: false,
    tagIds: ["tag-typescript", "tag-react"],
  },
  {
    no: 9,
    slug: "image-upload-flow",
    title: "이미지 직접 업로드 흐름",
    content: "브라우저에서 Storage로 바로 올리고 URL만 서버에 넘긴다.",
    hasThumbnail: true,
    tagIds: ["tag-supabase", "tag-nextjs"],
  },
  {
    no: 10,
    slug: "pagination-state",
    title: "목록 상태를 URL에 두기",
    content: "`tag`와 `page`를 쿼리로 유지해 상세에서 복원한다.",
    hasThumbnail: false,
    tagIds: ["tag-nextjs"],
  },
  {
    no: 11,
    slug: "monthly-retro",
    title: "10월 회고",
    content: "배운 점과 다음 달 계획을 적어 둔다.",
    hasThumbnail: false,
    tagIds: ["tag-retro", "tag-react"],
  },
];

/**
 * 시드 한 건을 Post로 바꾼다. 생성일은 번호가 클수록 최신이다.
 * @param seed 더미 글 시드
 */
function toPost(seed: PostSeed): Post {
  const day = String(seed.no).padStart(2, "0");
  const timestamp = `2026-10-${day}T09:00:00.000Z`;
  return {
    id: `post-${day}`,
    slug: seed.slug,
    title: seed.title,
    content: seed.content,
    thumbnailUrl: seed.hasThumbnail ? `/dummy/post-${day}.png` : null,
    tags: pickTags(seed.tagIds),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** 더미 게시글 11개 (4개/페이지 기준 3페이지, 마지막 페이지는 3개) */
export const dummyPosts: Post[] = seeds.map(toPost);
