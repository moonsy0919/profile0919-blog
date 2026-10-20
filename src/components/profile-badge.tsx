import Image from "next/image";
import type { HeaderProfile } from "@/lib/header-profile";

/**
 * 헤더 중앙에 표시하는 프로필(이미지와 이름). 확장형(메인) 헤더에서만 쓴다.
 * 이미지는 업로드 원본 주소가 그대로 올 수 있어 최적화 없이 표시한다.
 * @param profile 표시할 프로필
 */
export function ProfileBadge({ profile }: { profile: HeaderProfile }) {
  return (
    <div className="flex items-center gap-2" data-testid="header-profile">
      <Image
        src={profile.avatarUrl}
        alt=""
        width={36}
        height={36}
        unoptimized
        className="size-9 rounded-full border border-border object-cover"
      />
      <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">
        {profile.displayName}
      </span>
    </div>
  );
}
