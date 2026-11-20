/**
 * 데이터 접근 계층의 단일 진입점.
 * 페이지·컴포넌트는 읽기 함수와 타입을 여기서만 import한다.
 * 쓰기 서버 액션은 'use server' 규칙상 re-export할 수 없어 "@/lib/data/actions"에서 직접 import한다.
 * dummy/ 폴더는 이 계층 안에서만 쓰고 바깥에서 직접 import하지 않는다.
 */
export { PAGE_SIZE, POST_PAGE_SIZE, getProfile, getViewer } from "./reads";
export { getDevLog, getDevLogs } from "./reads-dev-logs";
export { getPost, getPosts, getTagCounts, getTags } from "./reads-posts";
export type * from "./types";
