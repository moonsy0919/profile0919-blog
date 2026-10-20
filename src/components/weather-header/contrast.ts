/** WCAG 대비 계산용 RGB(0~255) */
type Rgb = readonly [number, number, number];

/** "rgb(r, g, b)" 문자열을 RGB로 바꾼다. */
export function parseRgb(color: string): Rgb {
  const match = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
  if (!match) throw new Error(`rgb 문자열이 아닙니다: ${color}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** WCAG 상대 휘도 */
export function relativeLuminance([r, g, b]: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** 두 색의 WCAG 대비 비율(1~21) */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

/** 두 RGB를 t(0~1) 비율로 섞는다. */
export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as unknown as Rgb;
}

/**
 * 하늘 그라디언트(0% 위, 55% 중간, 100% 아래)에서 세로 위치 t(0~1)의 색.
 * module.css의 `.sky` 그라디언트와 같은 정지점을 쓴다.
 */
export function skyColorAt(
  [top, mid, bottom]: readonly [string, string, string],
  t: number,
): Rgb {
  if (t <= 0.55) return mixRgb(parseRgb(top), parseRgb(mid), t / 0.55);
  return mixRgb(parseRgb(mid), parseRgb(bottom), (t - 0.55) / 0.45);
}

/** 작은 글자 기준 WCAG 대비(4.5:1)에 두는 여유를 더한 목표 */
const TARGET_RATIO = 4.6;

/** 어둠 막 맨 아래 불투명도의 상한. 실측 최대 필요값은 0.37(맑음·아침) */
const SCRIM_MAX_ALPHA = 0.5;

const WHITE: Rgb = [255, 255, 255];

/** 세로 위치 t(0~1)에서 맨 아래 불투명도 alpha의 어둠 막을 얹은 색 */
export function withScrimAt(color: Rgb, t: number, alpha: number): Rgb {
  const keep = 1 - t * alpha;
  return [color[0] * keep, color[1] * keep, color[2] * keep];
}

/** 어둠 막을 얹은 하늘 전체에서 흰 글자의 최소 대비 */
export function minContrastWithScrim(
  sky: readonly [string, string, string],
  alpha: number,
): number {
  let min = Infinity;
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const color = withScrimAt(skyColorAt(sky, t), t, alpha);
    min = Math.min(min, contrastRatio(WHITE, color));
  }
  return min;
}

/**
 * 글자 대비(작은 글자 4.5:1)를 지키는 데 필요한 어둠 막의 맨 아래 불투명도(위는 0).
 * 어두운 하늘은 0이라 막이 없고, 밝은 하늘만 필요한 만큼 어둡게 한다.
 */
export function scrimBottomAlpha(
  sky: readonly [string, string, string],
): number {
  for (let alpha = 0; alpha <= SCRIM_MAX_ALPHA; alpha += 0.01) {
    if (minContrastWithScrim(sky, alpha) >= TARGET_RATIO) return alpha;
  }
  return SCRIM_MAX_ALPHA;
}

/** 어둠 막 그라디언트(CSS). 위 0 → 아래 alpha */
export function scrimGradient(alpha: number): string {
  return `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, ${alpha.toFixed(2)}) 100%)`;
}
