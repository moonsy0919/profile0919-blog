import Link from "next/link";
import { DevViewerToggle } from "@/components/dev-viewer-toggle";
import { HeaderActions } from "@/components/header-actions";
import { ProfileBadge } from "@/components/profile-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/config/site";
import type { HeaderProfile } from "@/lib/header-profile";

/** 헤더 종류: 메인(/)은 확장형, 그 외 모든 화면은 압축형 */
export type HeaderVariant = "expanded" | "compact";

/**
 * 확장형 헤더에서 상단 바 아래에 확보하는 자리의 높이.
 * Task 008에서 날씨 하늘이 이 자리에 들어오며, 상단 바(h-16)와 합쳐 200px(WeatherHeader의 min-h)가 되게 맞춘다.
 */
const EXPANDED_SLOT_CLASS = "h-[136px]";

export type HeaderViewProps = {
  variant: HeaderVariant;
  isAdmin: boolean;
  /** 확장형에서만 전달한다. 압축형은 프로필을 표시하지 않는다 */
  profile: HeaderProfile | null;
  /** 개발 전용 요소(미리보기 토글, 방문자 [로그인])를 보일지. 프로덕션은 false */
  devMode: boolean;
};

/**
 * 헤더 표시 전용 컴포넌트(데이터 조회 없음): 좌 사이트명·테마 토글, 중앙 프로필(확장형만), 우 로그인 또는 관리 버튼.
 * 클라이언트 컴포넌트(error.tsx)에서도 쓸 수 있도록 동기 컴포넌트로 둔다. 메뉴 네비게이션은 두지 않는다(PRD 4.2).
 */
export function HeaderView({
  variant,
  isAdmin,
  profile,
  devMode,
}: HeaderViewProps) {
  return (
    <header
      data-header-variant={variant}
      className="border-b border-border bg-background"
    >
      <div className="container mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-foreground">
            {siteConfig.name}
          </Link>
          <ThemeToggle />
        </div>
        <div>{profile && <ProfileBadge profile={profile} />}</div>
        <div className="flex items-center justify-end gap-2">
          {devMode && <DevViewerToggle isAdmin={isAdmin} />}
          <HeaderActions isAdmin={isAdmin} showLogin={devMode} />
        </div>
      </div>
      {variant === "expanded" && (
        <div data-header-slot aria-hidden className={EXPANDED_SLOT_CLASS} />
      )}
    </header>
  );
}
