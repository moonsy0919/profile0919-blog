import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_LINKS, siteConfig } from "@/config/site";

/** 헤더 종류: 메인(/)은 확장형, 그 외 모든 화면은 압축형 */
export type HeaderVariant = "expanded" | "compact";

/**
 * 사이트 공통 상단 헤더 (로고, 네비게이션, 버전, 테마 토글).
 * 확장형(날씨·프로필 연출)은 Task 006·007에서 구현하며, 그 전까지는 압축형과 같은 모양이다.
 * @param variant 헤더 종류 (기본 compact)
 */
export function Header({ variant = "compact" }: { variant?: HeaderVariant }) {
  return (
    <header
      data-header-variant={variant}
      className="border-b border-border bg-background"
    >
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="font-semibold text-foreground">
            {siteConfig.name}
          </Link>
          <nav aria-label="주요 메뉴" className="flex items-center gap-4">
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {siteConfig.version}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
