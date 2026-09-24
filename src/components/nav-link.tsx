"use client";

import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * 현재 경로와 일치하면 강조되고 aria-current="page"가 붙는 네비게이션 링크.
 * "/"는 정확히 일치할 때만, 그 외는 하위 경로까지 활성으로 본다.
 */
export function NavLink({
  href,
  children,
}: {
  href: Route;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "text-sm transition-colors hover:text-foreground",
        isActive ? "font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </Link>
  );
}
