import { describe, expect, it } from "vitest";
import { buildEffects } from "./effects";

describe("buildEffects", () => {
  it("기본 배율에서는 날씨별 입자 개수를 그대로 쓴다", () => {
    expect(buildEffects("shower").drops).toHaveLength(140);
    expect(buildEffects("rain").drops).toHaveLength(90);
    expect(buildEffects("snow").flakes).toHaveLength(70);
  });

  it("배율 0.5면 빗방울·눈송이가 절반이 된다", () => {
    expect(buildEffects("shower", 0.5).drops).toHaveLength(70);
    expect(buildEffects("rain", 0.5).drops).toHaveLength(45);
    expect(buildEffects("snow", 0.5).flakes).toHaveLength(35);
  });

  it("배율은 별·구름·안개 개수에 영향을 주지 않는다", () => {
    const full = buildEffects("overcast");
    const half = buildEffects("overcast", 0.5);
    expect(half.stars).toHaveLength(full.stars.length);
    expect(half.clouds).toHaveLength(full.clouds.length);
    expect(half.fog).toHaveLength(full.fog.length);
  });

  it("입자가 없는 날씨는 배율과 관계없이 0개다", () => {
    expect(buildEffects("clear", 0.5).drops).toHaveLength(0);
    expect(buildEffects("clear", 0.5).flakes).toHaveLength(0);
  });

  it("같은 날씨·배율은 캐시된 같은 결과를, 다르면 다른 결과를 돌려준다", () => {
    expect(buildEffects("rain", 0.5)).toBe(buildEffects("rain", 0.5));
    expect(buildEffects("rain", 0.5)).not.toBe(buildEffects("rain"));
  });
});
