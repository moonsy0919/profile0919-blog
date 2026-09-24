import { ButtonDemoSection } from "@/components/home/button-demo-section";
import { CtaSection } from "@/components/home/cta-section";
import { FeatureSection } from "@/components/home/feature-section";
import { HeroSection } from "@/components/home/hero-section";
import { PaletteSection } from "@/components/home/palette-section";

/** 홈페이지. 각 섹션은 components/home/에서 관리한다. */
export default function Home() {
  return (
    <div className="bg-background py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <HeroSection />
        <FeatureSection />
        <ButtonDemoSection />
        <PaletteSection />
        <CtaSection />
      </div>
    </div>
  );
}
