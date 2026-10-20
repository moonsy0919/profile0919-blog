"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ON_SKY_BUTTON } from "@/components/on-sky";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * 라이트/다크 테마를 전환하는 버튼.
 * 시스템 설정을 따르는 경우에도 현재 화면 기준(resolvedTheme)으로 반대 테마로 전환한다.
 * @param onSky 하늘(확장형 헤더) 위에 얹는 스타일로 그릴지
 */
export function ThemeToggle({ onSky = false }: { onSky?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("relative", onSky && ON_SKY_BUTTON)}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="테마 전환"
    >
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
