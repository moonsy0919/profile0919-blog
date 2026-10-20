import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { DevViewerToggle } from "@/components/dev-viewer-toggle";
import { HeaderActions } from "@/components/header-actions";
import { ON_SKY_TEXT } from "@/components/on-sky";
import { ProfileBadge } from "@/components/profile-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/config/site";
import type { HeaderProfile } from "@/lib/header-profile";
import { cn } from "@/lib/utils";

/** 헤더 종류: 메인(/)은 확장형, 그 외 모든 화면은 압축형 */
export type HeaderVariant = "expanded" | "compact";

/** 확장형에서 상단 바 아래 정보 영역 슬롯의 최소 높이. 상단 바(h-16)와 합쳐 최소 200px이 되게 맞춘다. */
const EXPANDED_SLOT_CLASS = "min-h-[136px]";

/** 하늘 래퍼 컴포넌트가 받는 props */
type SkyProps = { children: ReactNode };

export type HeaderViewProps = {
  variant: HeaderVariant;
  isAdmin: boolean;
  /** 확장형에서만 전달한다. 압축형은 프로필을 표시하지 않는다 */
  profile: HeaderProfile | null;
  /** 개발 전용 요소(미리보기 토글, 방문자 [로그인])를 보일지. 프로덕션은 false */
  devMode: boolean;
  /**
   * 확장형에서 상단 바와 슬롯을 감싸 하늘을 깔아 주는 컴포넌트(날씨 하늘).
   * 날씨 코드가 압축형·오류 화면 번들에 섞이지 않도록 이 파일이 직접 가져오지 않고 바깥(Header)이 넘긴다.
   */
  Sky?: ComponentType<SkyProps>;
  /** 확장형 슬롯에 넣을 정보 영역(시계·날씨) */
  skySlot?: ReactNode;
};

/** Sky가 없는 확장형(미리보기·테스트)의 기본 배경 */
function PlainSky({ children }: SkyProps) {
  return <div className="bg-slate-600 text-white">{children}</div>;
}

type TopBarProps = Pick<HeaderViewProps, "isAdmin" | "profile" | "devMode"> & {
  /** 하늘 위에 얹는 흰 글자 스타일로 그릴지 */
  onSky: boolean;
};

/** 상단 바: 좌 사이트명·테마 토글, 중앙 프로필(확장형만), 우 로그인 또는 관리 버튼 */
function HeaderTopBar({ isAdmin, profile, devMode, onSky }: TopBarProps) {
  return (
    <div
      className={cn(
        "mx-auto grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3",
        // 확장형은 아래 정보 영역(WeatherInfo)과 좌우 끝을 맞춘다.
        onSky
          ? "max-w-[1200px] px-[clamp(20px,4vw,48px)]"
          : "container max-w-5xl px-4",
      )}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className={cn(
            "font-semibold",
            onSky ? ON_SKY_TEXT : "text-foreground",
          )}
        >
          {siteConfig.name}
        </Link>
        <ThemeToggle onSky={onSky} />
      </div>
      <div>{profile && <ProfileBadge profile={profile} onSky={onSky} />}</div>
      <div className="flex items-center justify-end gap-2">
        {devMode && <DevViewerToggle isAdmin={isAdmin} onSky={onSky} />}
        <HeaderActions isAdmin={isAdmin} showLogin={devMode} onSky={onSky} />
      </div>
    </div>
  );
}

/**
 * 헤더 표시 전용 컴포넌트(데이터 조회 없음). 메뉴 네비게이션은 두지 않는다(PRD 4.2).
 * 클라이언트 컴포넌트(error.tsx)에서도 쓸 수 있도록 동기 컴포넌트로 둔다.
 * 확장형은 header 하나 안에서 하늘(Sky) 위에 상단 바를 흰 글자로 얹고, 그 아래 슬롯에 정보 영역을 둔다.
 */
export function HeaderView({
  variant,
  isAdmin,
  profile,
  devMode,
  Sky = PlainSky,
  skySlot,
}: HeaderViewProps) {
  if (variant !== "expanded") {
    return (
      <header
        data-header-variant={variant}
        className="border-b border-border bg-background"
      >
        <HeaderTopBar
          isAdmin={isAdmin}
          profile={profile}
          devMode={devMode}
          onSky={false}
        />
      </header>
    );
  }

  return (
    <header data-header-variant={variant}>
      <Sky>
        <HeaderTopBar
          isAdmin={isAdmin}
          profile={profile}
          devMode={devMode}
          onSky
        />
        <div data-header-slot className={EXPANDED_SLOT_CLASS}>
          {skySlot}
        </div>
      </Sky>
    </header>
  );
}
