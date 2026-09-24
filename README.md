# Next.js Starter Kit

Next.js 16, TypeScript, TailwindCSS v4, shadcn/ui 기반의 스타터킷입니다.

## 기술 스택

| 구분        | 사용 기술                                                   |
| ----------- | ----------------------------------------------------------- |
| 프레임워크  | Next.js 16 (App Router, Turbopack)                          |
| 언어        | TypeScript 5                                                |
| 스타일링    | TailwindCSS v4 (`globals.css`의 CSS 변수와 `@theme`로 관리) |
| UI 컴포넌트 | shadcn/ui (`base-nova` 스타일, `@base-ui/react` 기반)       |
| 아이콘      | lucide-react                                                |
| 테마        | next-themes (라이트/다크/시스템)                            |
| 린트        | ESLint 9 + eslint-config-next                               |

## 시작하기

Node.js 20.9 이상이 필요합니다.

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 스크립트

| 명령어                            | 설명                                         |
| --------------------------------- | -------------------------------------------- |
| `npm run dev`                     | 개발 서버 실행                               |
| `npm run build`                   | 프로덕션 빌드                                |
| `npm run start`                   | 빌드 결과물 실행                             |
| `npm run lint` / `lint:fix`       | ESLint 검사 / 자동 수정                      |
| `npm run typecheck`               | 라우트 타입 생성 후 TypeScript 검사          |
| `npm run format` / `format:check` | Prettier 포맷 적용 / 검사                    |
| `npm run test` / `test:watch`     | Vitest 단위 테스트 (1회 실행 / 감시 모드)    |
| `npm run test:e2e`                | Playwright E2E 테스트 (포트 3100 사용)       |
| `npm run check`                   | lint, typecheck, test, build를 순서대로 실행 |

E2E 테스트를 처음 실행하기 전에 `npx playwright install chromium`으로 브라우저를 설치합니다.

## 폴더 구조

```
src/
├── app/            # App Router (layout, page, 오류·404·로딩, robots, sitemap, globals.css)
├── components/     # 공통 컴포넌트 (header, nav-link, footer, theme-*)
│   ├── home/       # 홈페이지 섹션
│   └── ui/         # shadcn/ui 컴포넌트 (button, card, dialog, input, sonner 등)
├── config/         # 사이트 설정 (site.ts: 이름, 버전, 네비게이션)
└── lib/            # 유틸리티 (cn 등)
e2e/                # Playwright E2E 테스트
```

단위 테스트는 대상 파일 옆에 `*.test.ts(x)`로 둡니다.

## 자주 하는 작업

**페이지 추가**: `src/app/<경로>/page.tsx`를 만들고, 헤더에 노출하려면 `src/config/site.ts`의 `NAV_LINKS`에 항목을 추가합니다.

**사이트 정보 변경**: `src/config/site.ts`의 `siteConfig`를 수정합니다. `githubUrl`을 채우면 푸터에 GitHub 링크가 표시됩니다.

**shadcn/ui 컴포넌트 추가**:

```bash
npx shadcn@latest add <컴포넌트 이름>
```

현재 shadcn CLI는 생성 파일의 `cn` 임포트를 `"cn"`(별개의 npm 패키지)으로 출력합니다. 추가 후 `from "cn"`을 `from "@/lib/utils"`로 바꾸고 `npm uninstall cn`을 실행하세요. 자세한 절차는 `CLAUDE.md`를 참고하세요.

**테마 색상 변경**: `src/app/globals.css`의 `:root`(라이트)와 `.dark`(다크) 블록에서 CSS 변수를 수정합니다.

## 환경 변수

`.env.example`을 복사해 `.env.local`을 만들어 사용합니다. `.env*` 파일은 `.env.example`을 제외하고 Git에 커밋되지 않습니다.

## 의존성 관리

- `next`, `react`, `react-dom`, `eslint-config-next`는 정확한 버전으로 고정하고, 나머지는 `^` 범위를 사용합니다.
- Dependabot이 매주 minor·patch 업데이트를 묶어서 PR로 올립니다.
- CI(`.github/workflows/ci.yml`)는 lint, 포맷, typecheck, 단위 테스트, 빌드, E2E를 검사합니다.

## 참고

- 이 프로젝트의 Next.js는 기존 지식과 다른 변경점이 있습니다. 코드를 작성하기 전에 `node_modules/next/dist/docs/`의 해당 문서를 확인하세요.
- Claude Code용 프로젝트 지침은 `CLAUDE.md`와 `AGENTS.md`에 있습니다.
