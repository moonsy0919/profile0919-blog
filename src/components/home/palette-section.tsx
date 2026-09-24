import { Code2, GitBranch, Palette, Rocket, Sparkles, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLORS = [
  { label: "primary", className: "bg-primary" },
  { label: "secondary", className: "bg-secondary border border-border" },
  { label: "muted", className: "bg-muted border border-border" },
  { label: "accent", className: "bg-accent border border-border" },
  { label: "destructive", className: "bg-destructive" },
];

const ICONS = [Rocket, Sparkles, Code2, Palette, GitBranch, Zap];

/** CSS 변수 색상 팔레트와 아이콘 예시 */
export function PaletteSection() {
  return (
    <section className="mb-12">
      <Card>
        <CardHeader>
          <CardTitle>TailwindCSS v4 스타일링 예시</CardTitle>
          <CardDescription>
            CSS 변수와 @theme 블록 기반 동적 스타일 — tailwind.config 파일 없음
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-semibold text-card-foreground">
                CSS 변수 색상 팔레트
              </h3>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(({ label, className }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className={`h-8 w-8 rounded ${className}`} />
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-semibold text-card-foreground">
                lucide-react 아이콘
              </h3>
              <div className="flex items-center gap-4 text-muted-foreground">
                {ICONS.map((Icon, index) => (
                  <Icon key={index} className="h-6 w-6" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
