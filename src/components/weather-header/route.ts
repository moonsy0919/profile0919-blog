import { buildWeatherPayload, type OpenMeteoResponse } from "./open-meteo";

const API_URL = "https://api.open-meteo.com/v1/forecast";
/** 조회 지점: 서울 (PRD의 siteConfig.weather로 옮길 때 이 상수를 교체한다) */
const COORDS = { latitude: 37.5665, longitude: 126.978 };
/** 서버 캐시 시간(초) */
const REVALIDATE_SEC = 1800;
/** 외부 API 응답 대기 한도(ms) */
const TIMEOUT_MS = 3000;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** 현재 날씨와 오늘 최고·최저·일출·일몰을 한 번에 요청하는 주소를 만든다. */
function buildUrl(): URL {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    latitude: String(COORDS.latitude),
    longitude: String(COORDS.longitude),
    current: "temperature_2m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,sunrise,sunset",
    timezone: "Asia/Seoul",
    timeformat: "unixtime",
    forecast_days: "1",
  }).toString();
  return url;
}

/** Open-Meteo를 호출한다. 실패하면 상태 코드만 담은 예외를 던진다. */
async function fetchOpenMeteo(): Promise<OpenMeteoResponse> {
  const res = await fetch(buildUrl(), {
    next: { revalidate: REVALIDATE_SEC },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return (await res.json()) as OpenMeteoResponse;
}

/** GET /api/weather — 서울의 현재 날씨와 오늘 최고/최저를 정규화해 돌려준다. */
export async function GET() {
  try {
    const data = await fetchOpenMeteo();
    const nowSec = Math.floor(Date.now() / 1000);
    return Response.json(buildWeatherPayload(data, nowSec));
  } catch (error) {
    console.error(
      "[api/weather]",
      error instanceof Error ? error.message : error,
    );
    return errorResponse("날씨 정보를 가져오지 못했어요", 502);
  }
}
