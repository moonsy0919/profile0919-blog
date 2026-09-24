import { ArrowRight, GitBranch, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** shadcn/ui Button의 variant·size 예시 */
export function ButtonDemoSection() {
  return (
    <section className="mb-12">
      <Card>
        <CardHeader>
          <CardTitle>Button 컴포넌트 데모</CardTitle>
          <CardDescription>shadcn/ui Button의 다양한 variant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>
              <Rocket data-icon="inline-start" />
              Default
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">
              <GitBranch data-icon="inline-start" />
              Outline
            </Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">
              Link
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
