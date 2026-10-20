import Image from "next/image";
import { ON_SKY_TEXT } from "@/components/on-sky";
import type { HeaderProfile } from "@/lib/header-profile";
import { cn } from "@/lib/utils";

/**
 * 헤더 중앙에 표시하는 프로필(이미지와 이름). 확장형(메인) 헤더에서만 쓴다.
 * 이미지는 업로드 원본 주소가 그대로 올 수 있어 최적화 없이 표시한다.
 * @param profile 표시할 프로필
 * @param onSky 하늘 위에 얹는 흰 글자 스타일로 그릴지
 */
export function ProfileBadge({
  profile,
  onSky = false,
}: {
  profile: HeaderProfile;
  onSky?: boolean;
}) {
  return (
    <div className="flex items-center gap-2" data-testid="header-profile">
      <Image
        src={profile.avatarUrl}
        alt=""
        width={36}
        height={36}
        unoptimized
        className={cn(
          "size-9 shrink-0 rounded-full border border-border object-cover",
          onSky && "border-white/60",
        )}
      />
      <span
        className={cn(
          "hidden max-w-40 truncate text-sm font-medium sm:inline",
          onSky && ON_SKY_TEXT,
        )}
      >
        {profile.displayName}
      </span>
    </div>
  );
}
