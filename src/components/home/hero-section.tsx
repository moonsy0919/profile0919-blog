import { Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TECH_BADGES = [
  { label: "Next.js", variant: "default" },
  { label: "TailwindCSS v4", variant: "secondary" },
  { label: "shadcn/ui", variant: "outline" },
  { label: "TypeScript", variant: "outline" },
  { label: "lucide-react", variant: "secondary" },
] as const;

/** 홈페이지 상단 소개 영역 (제목, 기술 스택 배지) */
export function HeroSection() {
  return (
    <section className="mb-12 text-center">
      <div className="mb-4 flex items-center justify-center gap-2">
        <Rocket className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">
          Claude Next.js Starter Kit
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Next.js · TypeScript · TailwindCSS v4 · shadcn/ui · lucide-react
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {TECH_BADGES.map(({ label, variant }) => (
          <Badge key={label} variant={variant}>
            {label}
          </Badge>
        ))}
      </div>
    </section>
  );
}
