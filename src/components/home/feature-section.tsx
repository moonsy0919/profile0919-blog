import type { ReactNode } from "react";
import { Code2, Palette, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Feature {
  icon: LucideIcon;
  title: string;
  summary: string;
  body: ReactNode;
  badge: string;
}

/** 본문 안에서 코드 조각을 표시하는 인라인 코드 스타일 */
function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
      {children}
    </code>
  );
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "TailwindCSS v4",
    summary: "CSS 기반 설정, tailwind.config 없음",
    body: (
      <>
        <InlineCode>@import &quot;tailwindcss&quot;</InlineCode> 와{" "}
        <InlineCode>@theme {"{}"}</InlineCode> 블록으로 CSS 변수를 직접
        관리합니다.
      </>
    ),
    badge: "v4",
  },
  {
    icon: Code2,
    title: "shadcn/ui",
    summary: "복사 가능한 컴포넌트 시스템",
    body: "Button, Card, Badge 등 접근성을 갖춘 Base UI 기반 컴포넌트를 CSS 변수와 함께 사용합니다.",
    badge: "Base UI",
  },
  {
    icon: Palette,
    title: "lucide-react",
    summary: "SVG 아이콘 라이브러리",
    body: "1,500개 이상의 픽셀 퍼펙트 아이콘을 React 컴포넌트로 제공합니다. Tree-shaking으로 최적화됩니다.",
    badge: "SVG",
  },
];

/** 기능 소개 카드 한 장 */
function FeatureCard({ icon: Icon, title, summary, body, badge }: Feature) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
      <CardFooter>
        <Badge variant="secondary" className="gap-1">
          <Zap className="h-3 w-3" />
          {badge}
        </Badge>
      </CardFooter>
    </Card>
  );
}

/** 홈페이지 기능 카드 그리드 */
export function FeatureSection() {
  return (
    <section className="mb-12 grid gap-6 md:grid-cols-3">
      {FEATURES.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </section>
  );
}
