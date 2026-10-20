import { HeaderView, type HeaderVariant } from "@/components/header-view";
import { WeatherCredit } from "@/components/weather-header/weather-credit";
import { WeatherInfo } from "@/components/weather-header/weather-info";
import { WeatherScene } from "@/components/weather-header/weather-scene";
import { getProfile, getViewer } from "@/lib/data";
import { isDevViewerEnabled } from "@/lib/dev-viewer";
import { resolveHeaderProfile, type HeaderProfile } from "@/lib/header-profile";

export type { HeaderVariant };

/**
 * 헤더에 표시할 프로필을 조회한다. 프로필은 확장형에서만 쓰므로 압축형은 조회하지 않는다.
 * 프로덕션은 더미 프로필을 노출하지 않도록 DB를 쓰기 전까지 siteConfig 기본값만 쓴다.
 */
async function loadHeaderProfile(
  variant: HeaderVariant,
): Promise<HeaderProfile | null> {
  if (variant !== "expanded") return null;
  const profile = isDevViewerEnabled() ? await getProfile() : null;
  return resolveHeaderProfile(profile);
}

/**
 * 사이트 공통 상단 헤더(서버 컴포넌트): 뷰어와 프로필을 조회해 HeaderView에 넘긴다.
 * 날씨 하늘(WeatherScene)은 확장형에서만 넘기므로 압축형과 오류 화면은 날씨 코드를 가져오지 않는다.
 * @param variant 헤더 종류 (기본 compact)
 */
export async function Header({
  variant = "compact",
}: {
  variant?: HeaderVariant;
}) {
  const [viewer, profile] = await Promise.all([
    getViewer(),
    loadHeaderProfile(variant),
  ]);
  const expanded = variant === "expanded";

  return (
    <HeaderView
      variant={variant}
      isAdmin={viewer.isAdmin}
      profile={profile}
      devMode={isDevViewerEnabled()}
      Sky={expanded ? WeatherScene : undefined}
      skySlot={
        expanded ? (
          <>
            <WeatherInfo className="min-h-[136px] pt-4 pb-2" />
            <WeatherCredit />
          </>
        ) : null
      }
    />
  );
}
