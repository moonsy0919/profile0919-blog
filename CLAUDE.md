# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 주요 명령어

```bash
npm run dev         # 개발 서버 (http://localhost:3000)
npm run build       # 프로덕션 빌드
npm run lint        # ESLint 검사 (lint:fix로 자동 수정)
npm run typecheck   # 라우트 타입 생성 + tsc --noEmit
npm run format      # Prettier 적용 (format:check로 검사)
npm run test        # Vitest 단위 테스트 1회 실행 (test:watch는 감시 모드)
npm run test:e2e    # Playwright E2E (포트 3100, 최초 1회 npx playwright install chromium)
npm run check       # lint + typecheck + test + build
```

- 단위 테스트는 `src/**/*.test.ts(x)`, E2E 테스트는 `e2e/`에 둔다. async Server Component는 Vitest가 지원하지 않으므로 E2E로 검증한다.
- `src/components/ui/`(shadcn 생성 코드)는 Prettier 대상에서 제외되어 있다.
- `AGENTS.md`는 `next dev`가 자동으로 갱신하는 블록이 있으므로 직접 편집하거나 포맷하지 않는다.

## 기술 스택 및 버전 주의사항

- **Next.js 16.3.6** — 학습 데이터 기준과 다른 breaking changes 포함. 반드시 `node_modules/next/dist/docs/` 문서를 먼저 읽을 것 (AGENTS.md 지시).
- **React 19.2.4** — `params`가 Promise로 변경됨: `const { id } = await params` 방식으로 사용.
- **TailwindCSS v4** — `tailwind.config.js` 없음. CSS 변수와 `@theme {}` 블록으로 `globals.css`에서 직접 관리.
- **shadcn/ui** — `npx shadcn@latest add <component>`로 컴포넌트 추가. 스타일은 `base-nova`(Radix UI가 아닌 `@base-ui/react` 기반), 아이콘은 lucide.

## 아키텍처

```
src/
├── app/                   # App Router 루트
│   ├── layout.tsx         # 루트 레이아웃: 폰트, ThemeProvider, skip link, Toaster (헤더·main은 그룹 레이아웃이 렌더링)
│   ├── (main)/            # 메인(/) — 확장형 헤더 (layout.tsx, page.tsx 임시 자리 표시자)
│   ├── (site)/            # 그 외 페이지 — 압축형 헤더. 빈 라우트: posts/[slug], posts/new, dev-logs, dev-logs/[id], dev-logs/new, login, profile/edit (모두 assertDevOnly 게이트)
│   ├── (dev)/             # 개발 전용 — layout에서 assertDevOnly(), weather-header 미리보기(날씨 11종 × 시간대 6종 = 66개 조합)
│   ├── api/weather/       # 공개 날씨 API (Route Handler). Open-Meteo 서울 고정, API 키 불필요, 30분 서버 캐시, 3초 타임아웃, 실패 시 502
│   ├── not-found.tsx      # 404 페이지 (PageShell 압축형 헤더 포함)
│   ├── error.tsx          # 세그먼트 오류 페이지 ("use client", retry prop 사용, 압축형 헤더 포함)
│   ├── global-error.tsx   # 루트 레이아웃 오류 페이지 (html/body 직접 렌더링)
│   ├── robots.ts          # /robots.txt
│   ├── sitemap.ts         # /sitemap.xml (SITEMAP_PATHS 기반, 열린 경로만)
│   ├── icon.svg           # 파비콘
│   └── globals.css        # TailwindCSS v4 진입점 + CSS 변수(라이트/다크 테마)
├── config/
│   ├── site.ts            # siteConfig(이름·설명·URL·버전·GitHub URL·weather)와 SITEMAP_PATHS의 단일 출처
│   ├── profile.ts         # profileConfig — 헤더 프로필 기본값(이름·public/default-avatar.svg). siteConfig.profile이 참조
│   └── weather.ts         # weatherConfig — 날씨 조회 지점(서울 도시명·좌표·타임존). 정적 값만 두어 클라이언트 컴포넌트도 가져다 쓴다(siteConfig는 환경 변수에 의존하므로 클라이언트에서 직접 import하지 않는다)
├── components/
│   ├── ui/                # shadcn/ui 컴포넌트 (직접 수정 가능, Prettier 제외)
│   ├── header.tsx         # async 서버 컴포넌트 — getViewer·getProfile(확장형만) 조회 후 HeaderView에 전달. 확장형에만 WeatherScene·WeatherInfo·WeatherCredit(날씨 코드)를 넘겨 압축형·error.tsx 번들에 섞이지 않게 한다
│   ├── header-view.tsx    # 표시 전용 헤더(동기, error.tsx 같은 클라이언트에서도 사용). 확장형은 header 1개 안에서 Sky(하늘) 위에 상단 바를 흰 글자(on-sky)로 얹고 아래 슬롯(data-header-slot, min-h-[136px])에 정보 영역을 둔다. 중앙 프로필은 확장형만
│   ├── header-actions.tsx # 우측 버튼: 방문자 [로그인](프로덕션에서는 숨김) / 관리자 [작성][프로필][로그아웃]. 방문자 HTML에는 관리 버튼이 생성되지 않음
│   ├── profile-badge.tsx  # 헤더 중앙 프로필(이미지+이름). 메인 확장형에서만 사용
│   ├── on-sky.ts          # 하늘 위에 얹는 버튼·글자 스타일 상수(ON_SKY_BUTTON·ON_SKY_TEXT)
│   ├── dev-viewer-toggle.tsx # 개발 전용 방문자/관리자 미리보기 토글(dev-viewer 쿠키). 프로덕션에서는 렌더링·쿠키 읽기 없음
│   ├── page-shell.tsx     # Header + <main id="main-content"> 형제 구성. 그룹 레이아웃과 404·오류 화면이 공유
│   ├── placeholder-page.tsx # 구현 전 라우트의 빈 화면
│   ├── post-card.tsx      # 게시글 카드(Task 009) — 표시 전용. 카드 전체가 `/posts/[slug]` 링크이고 buildDetailHref로 현재 tag/page를 쿼리에 전달. 아직 페이지에 연결되지 않음(Task 010에서 배치)
│   ├── dev-log-card.tsx   # 개발 일기 카드 — 제목 링크를 카드 전체로 확장(stretched link), GitHub 링크는 별도 앵커(z-10)로 중첩 방지, 태그 칩 3개 + "+n". 상세 링크는 page만 전달
│   ├── tag-sidebar.tsx    # 태그 사이드바 — "전체 보기 N" + 태그별 개수, aria-current. 모바일(sm 미만)은 가로 스크롤 칩, 그 이상은 세로 목록(CSS 반응형)
│   ├── pagination.tsx     # 번호·이전·다음. 첫·마지막 페이지의 이전/다음은 aria-disabled. 페이지가 1개 이하면 렌더하지 않음
│   ├── thumbnail-image.tsx # "use client" — 카드 썸네일(16:9). 없거나 불러오기 실패 시 public/default-thumbnail.svg로 대체. 두 카드가 공유
│   ├── weather-header/    # 날씨·시간 하늘(Task 004 이식, Task 008 통합). WeatherScene(장면 1회 계산·Context·루트 div) + SkyBackground(효과·글자 대비용 어둠 막) + WeatherInfo(시계·날씨) + WeatherCredit(Open-Meteo 출처), WeatherHeader(미리보기용 조합), 훅(use-now·use-weather·use-media-query·use-paused), contrast.ts(WCAG 대비·어둠 막 계산), Open-Meteo 응답 정규화·WMO 분류·장면/효과 계산, 단위 테스트 포함. 확장형 헤더에서만 쓰며 압축형·다른 페이지는 /api/weather를 호출하지 않는다
│   ├── theme-provider.tsx # "use client" — next-themes 래퍼
│   └── theme-toggle.tsx   # "use client" — 다크/라이트 전환 버튼
└── lib/
    ├── data/              # 데이터 접근 계층(Task 005) — 더미 → 실데이터 교체는 이 폴더 안에서만 한다. 타입(types.ts)·읽기 함수 8개(reads.ts)·더미 데이터(dummy/)는 `@/lib/data`로, 쓰기 서버 액션 8개(actions.ts, "use server")는 `@/lib/data/actions`로 import(서버 액션 파일은 async 함수만 export 가능해 re-export 불가). `dummy/`는 계층 밖에서 직접 import하지 않는다. 액션은 `{ok:true,data} | {ok:false,error:{code,message,fieldErrors?}}`를 반환하고 예외를 던지지 않는다
    ├── dev-viewer.ts      # 개발 전용 관리자 미리보기 쿠키 이름·활성 판정(isDevViewerEnabled). getViewer 더미(resolveDummyViewer)가 사용
    ├── header-profile.ts  # resolveHeaderProfile() — DB 프로필이 비면 siteConfig.profile로 폴백
    ├── dev-gate.ts        # assertDevOnly() — 더미 기반 경로를 프로덕션에서 notFound()로 닫는 게이트
    ├── pagination.ts      # PAGE_SIZE(4)와 clampPage() — 페이지 번호 보정. `@/lib/data`가 PAGE_SIZE를 re-export. getPageWindow() — Pagination이 쓰는 번호 목록(첫·마지막 + 현재 앞뒤, 빈 구간은 "ellipsis")
    ├── format-date.ts     # formatPostDate() — ISO 날짜를 서울 기준 ko-KR(예: 2026. 10. 20.)로 변환. 카드 2종이 공유
    ├── list-state.ts      # 목록 상태(tag/page) 파싱·보정 parseListState, 쿼리 생성 buildListQuery·buildDetailHref, 상세 [목록으로] 복원 buildBackHref
    ├── text/excerpt.ts    # extractExcerpt() — 마크다운 기호를 지운 카드용 본문 요약 발췌
    ├── validation/        # Zod 검증(Task 006) — constants.ts(길이·개수·예약어 상수), fields.ts(필드 스키마, normalizeTagName), post.ts·dev-log.ts·profile.ts(폼 스키마, 클라이언트 폼과 서버 액션 공용), errors.ts(zodErrorToFieldErrors: ZodError → ActionError.fieldErrors). 출력 타입은 data/types.ts의 PostInput·DevLogInput·ProfileInput과 같다. 서버 액션 연결은 Task 021·022에서 한다
    └── utils.ts           # cn() 유틸리티 (clsx + tailwind-merge)
e2e/                       # Playwright E2E 테스트
```

**더미 게이트와 HTTP 404**: 프로덕션에서 더미 경로를 닫을 때는 `assertDevOnly()`를 Suspense 경계보다 바깥(layout, 또는 `loading.tsx`가 없는 세그먼트의 page 최상단)에서 호출한다. `loading.tsx`나 `<Suspense>` 안에서 `notFound()`를 부르면 화면은 404여도 HTTP 상태 코드가 200이 된다. 그래서 루트 `loading.tsx`는 두지 않고, 로딩 UI는 데이터를 가져오는 세그먼트에만 둔다.

**컴포넌트 기본 원칙**: 레이아웃과 페이지는 기본적으로 Server Component. 상태/이벤트/브라우저 API가 필요할 때만 `"use client"` 추가.

## 스타일링 규칙

테마 색상은 `globals.css`의 `:root` / `.dark` 블록에서 CSS 변수로 정의. Tailwind 클래스(`bg-primary`, `text-muted-foreground` 등)는 이 변수를 참조함. `@theme inline {}` 블록에서 Tailwind ↔ CSS 변수 매핑.

새 shadcn 컴포넌트 추가:

```bash
npx shadcn@latest add <component-name>
```

**주의 (shadcn CLI 4.10 기준)**: 생성된 파일이 `import { cn } from "cn"`으로 출력되고 `cn` npm 패키지를 의존성에 추가한다. 이는 이 프로젝트의 `@/lib/utils`가 아닌 별개의 서드파티 패키지다. 컴포넌트를 추가한 뒤 반드시 다음을 수행할 것.

1. `src/components/ui/`의 `from "cn"`을 `from "@/lib/utils"`로 되돌린다.
2. `npm uninstall cn`으로 잘못 추가된 패키지를 제거한다.
3. 덮어쓰기를 묻는 기존 파일(`button.tsx` 등)은 `n`으로 답하고, 변경됐다면 `git checkout`으로 되돌린다.

## 빠른 내비게이션을 위한 주의사항

클라이언트 측 내비게이션을 즉시 반응하게 하려면 Suspense만으로는 부족 — 라우트 세그먼트에서 `export const instant = true`로 검증을 켜야 하며, `next.config.ts`에서 `cacheComponents`가 활성화되어 있어야 동작함(현재 미활성). 상세 내용은 `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`와 `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md` 참조.
