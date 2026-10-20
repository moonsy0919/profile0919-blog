import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  minContrastWithScrim,
  parseRgb,
  scrimBottomAlpha,
  scrimGradient,
  skyColorAt,
  withScrimAt,
} from "./contrast";
import { TIME_KEYS, WEATHER_KEYS, getSkyColors } from "./theme";

const WHITE = [255, 255, 255] as const;

describe("contrast 헬퍼", () => {
  it("흰색과 검은색의 대비는 21:1이다", () => {
    expect(contrastRatio(WHITE, [0, 0, 0])).toBeCloseTo(21, 5);
  });

  it("rgb 문자열을 파싱하고 그라디언트 정지점의 색을 돌려준다", () => {
    const sky = [
      "rgb(0, 0, 0)",
      "rgb(100, 100, 100)",
      "rgb(200, 200, 200)",
    ] as const;
    expect(parseRgb(sky[1])).toEqual([100, 100, 100]);
    expect(skyColorAt(sky, 0)).toEqual([0, 0, 0]);
    expect(skyColorAt(sky, 0.55)).toEqual([100, 100, 100]);
    expect(skyColorAt(sky, 1)).toEqual([200, 200, 200]);
  });

  it("어둠 막은 위가 0이고 아래가 지정한 불투명도다", () => {
    expect(withScrimAt([200, 100, 50], 0, 0.4)).toEqual([200, 100, 50]);
    expect(withScrimAt([200, 100, 50], 1, 0.4)[0]).toBeCloseTo(120, 5);
    expect(scrimGradient(0.4)).toContain("rgba(0, 0, 0, 0.40) 100%");
  });

  it("이미 어두운 하늘에는 어둠 막이 필요 없다", () => {
    const dark = [
      "rgb(10, 10, 40)",
      "rgb(20, 20, 60)",
      "rgb(30, 30, 70)",
    ] as const;
    expect(scrimBottomAlpha(dark)).toBe(0);
  });
});

describe("하늘 위 흰 글자 대비 (시간대 6 x 날씨 11)", () => {
  const combos = WEATHER_KEYS.flatMap((w) =>
    TIME_KEYS.map((t) => [w, t] as const),
  );

  it.each(combos)("%s / %s: 작은 글자 4.5:1, 큰 시계 3:1 이상", (w, t) => {
    const sky = getSkyColors(t, w);
    const alpha = scrimBottomAlpha(sky);
    expect(alpha).toBeLessThan(0.5);
    expect(minContrastWithScrim(sky, alpha)).toBeGreaterThanOrEqual(4.5);
    let large = Infinity;
    for (let y = 0.3; y <= 0.6; y += 0.02) {
      const color = withScrimAt(skyColorAt(sky, y), y, alpha);
      large = Math.min(large, contrastRatio(WHITE, color));
    }
    expect(large).toBeGreaterThanOrEqual(3);
  });
});
