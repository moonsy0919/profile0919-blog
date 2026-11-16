import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** 카드 폭: sm은 로그인처럼 짧은 폼, lg는 항목이 많은 폼 */
const WIDTH_CLASS = { sm: "max-w-sm", lg: "max-w-lg" } as const;

/**
 * 로그인·프로필 수정처럼 폼 하나만 있는 페이지의 공통 틀.
 * 카드를 본문 영역 가운데(가로·세로)에 놓고, 제목은 카드 안에서 가운데 정렬한 h1로 둔다.
 * @param title 페이지 제목(h1)
 * @param description 제목 아래 보조 설명 (선택)
 * @param width 카드 폭 (기본 sm)
 * @param children 카드 안에 넣을 폼
 */
export function FormCardPage({
  title,
  description,
  width = "sm",
  children,
}: {
  title: string;
  description?: string;
  width?: keyof typeof WIDTH_CLASS;
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto flex min-h-[calc(100dvh-65px)] items-center justify-center px-4 py-12">
      <Card className={cn("w-full", WIDTH_CLASS[width])}>
        <CardHeader className="text-center">
          <CardTitle>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          </CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
