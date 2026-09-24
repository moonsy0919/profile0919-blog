"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** next-themes의 ThemeProvider를 Client Component로 감싼 래퍼 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
