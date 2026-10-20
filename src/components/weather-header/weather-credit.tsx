/**
 * Open-Meteo 날씨 데이터 출처 표기(CC BY 4.0). 확장형 헤더에 날씨를 보여 줄 때 반드시 함께 둔다.
 * 정보 영역(WeatherInfo)과 같은 좌우 여백을 쓰고 오른쪽 아래에 작게 놓는다.
 */
export function WeatherCredit() {
  return (
    <div className="mx-auto max-w-[1200px] px-[clamp(20px,4vw,48px)] pb-2 text-right text-xs">
      <a
        href="https://open-meteo.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/85 underline-offset-2 hover:text-white hover:underline"
      >
        Weather data by Open-Meteo.com
      </a>
    </div>
  );
}
