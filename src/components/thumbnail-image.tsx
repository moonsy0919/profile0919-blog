"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** 썸네일이 없거나 불러오지 못할 때 쓰는 기본 이미지 */
export const DEFAULT_THUMBNAIL = "/default-thumbnail.svg";

/**
 * 카드용 썸네일(16:9). 주소가 없거나 불러오기에 실패하면 기본 이미지로 바꾼다.
 * 업로드 원본 주소가 그대로 올 수 있어 최적화 없이 표시하고, 제목이 이미 있으므로 alt는 비운다.
 * @param src 썸네일 주소 (없으면 null)
 * @param className 바깥 영역에 덧붙일 클래스
 */
export function ThumbnailImage({
  src,
  className,
}: {
  src: string | null;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const useDefault = !src || failedSrc === src;

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-muted",
        className,
      )}
    >
      <Image
        src={useDefault ? DEFAULT_THUMBNAIL : src}
        alt=""
        fill
        unoptimized
        sizes="(min-width: 640px) 50vw, 100vw"
        className="object-cover"
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
}
