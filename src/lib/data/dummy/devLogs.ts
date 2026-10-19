import type { DevLog } from "../types";
import { pickTags } from "./tags";

type DevLogSeed = {
  no: number;
  title: string;
  content: string;
  githubUrl: string | null;
  tagIds: string[];
};

const seeds: DevLogSeed[] = [
  {
    no: 1,
    title: "프로젝트 세팅",
    content: "Next.js 16과 Tailwind v4로 뼈대를 만들었다.",
    githubUrl: "https://github.com/example/blog",
    tagIds: ["tag-nextjs"],
  },
  {
    no: 2,
    title: "라우트 그룹 구성",
    content: "메인은 확장형, 나머지는 압축형 헤더를 쓴다.",
    githubUrl: null,
    tagIds: ["tag-nextjs", "tag-react"],
  },
  {
    no: 3,
    title: "날씨 모듈 이식",
    content: "Open-Meteo 기반 날씨 헤더를 src로 옮겼다.",
    githubUrl: "https://github.com/example/blog/pull/3",
    tagIds: ["tag-css", "tag-typescript"],
  },
  {
    no: 4,
    title: "데이터 접근 계층 설계",
    content: "더미와 실데이터를 한 계층에서 교체한다.",
    githubUrl: null,
    tagIds: ["tag-typescript"],
  },
  {
    no: 5,
    title: "Supabase 마이그레이션 계획",
    content: "운영 DB라 마이그레이션은 하나씩 적용한다.",
    githubUrl: "https://github.com/example/blog/issues/1",
    tagIds: ["tag-supabase"],
  },
];

/**
 * 시드 한 건을 DevLog로 바꾼다. 생성일은 번호가 클수록 최신이다.
 * @param seed 더미 개발 일기 시드
 */
function toDevLog(seed: DevLogSeed): DevLog {
  const day = String(seed.no).padStart(2, "0");
  const timestamp = `2026-10-${day}T20:00:00.000Z`;
  return {
    id: `devlog-${day}`,
    title: seed.title,
    content: seed.content,
    thumbnailUrl: null,
    githubUrl: seed.githubUrl,
    tags: pickTags(seed.tagIds),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** 더미 개발 일기 5개 (GitHub 링크 있는 것 3개, 없는 것 2개) */
export const dummyDevLogs: DevLog[] = seeds.map(toDevLog);
