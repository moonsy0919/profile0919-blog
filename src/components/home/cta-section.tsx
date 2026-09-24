import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** 홈페이지 하단 행동 유도 영역. GitHub 버튼은 siteConfig.githubUrl이 있을 때만 표시한다. */
export function CtaSection() {
  return (
    <section className="text-center">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl text-primary-foreground">
            시작할 준비가 되셨나요?
          </CardTitle>
          <CardDescription className="text-primary-foreground/70">
            이 스타터킷을 기반으로 프로젝트를 시작하세요
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center gap-4 border-t-0 bg-transparent">
          {siteConfig.githubUrl && (
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              <GitBranch data-icon="inline-start" />
              GitHub
            </a>
          )}
          <Link
            href="/docs"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10",
            )}
          >
            문서 보기
            <ArrowRight data-icon="inline-end" />
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}
