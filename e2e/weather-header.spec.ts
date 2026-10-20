import { expect, test, type Page } from "@playwright/test";

/** 2026-10-20 서울 기준 일출 06:30, 일몰 18:00 (unix seconds) */
const SUNRISE = Date.UTC(2026, 9, 19, 21, 30) / 1000;
const SUNSET = Date.UTC(2026, 9, 20, 9, 0) / 1000;

/** 날씨 API를 고정 응답으로 바꾼다 */
async function mockWeather(
  page: Page,
  weather: string,
  temp: number,
): Promise<void> {
  await page.route("**/api/weather", (route) =>
    route.fulfill({
      json: {
        weather,
        weatherCode: 0,
        temp,
        high: temp + 4,
        low: temp - 6,
        city: "서울",
        sunrise: SUNRISE,
        sunset: SUNSET,
        fetchedAt: SUNRISE,
      },
    }),
  );
}

/** 브라우저 시계를 서울 기준 시각(UTC로 환산한 값)으로 고정한다 */
async function setSeoulTime(page: Page, utc: Date): Promise<void> {
  await page.clock.install({ time: utc });
}

test("맑은 낮이면 점심 시간대와 해 아이콘을 보여 준다", async ({ page }) => {
  await setSeoulTime(page, new Date("2026-10-20T03:00:00Z")); // 서울 12:00
  await mockWeather(page, "clear", 21);
  await page.goto("/");

  const scene = page.locator("[data-weather]");
  await expect(scene).toHaveAttribute("data-weather", "clear");
  await expect(scene).toHaveAttribute("data-time", "noon");
  await expect(scene.locator("[data-icon='sun']")).toBeVisible();
  await expect(scene.getByText("21°")).toBeVisible();
});

test("비 오는 밤이면 밤 시간대와 비 아이콘을 보여 준다", async ({ page }) => {
  await setSeoulTime(page, new Date("2026-10-20T13:00:00Z")); // 서울 22:00
  await mockWeather(page, "rain", 12);
  await page.goto("/");

  const scene = page.locator("[data-weather]");
  await expect(scene).toHaveAttribute("data-weather", "rain");
  await expect(scene).toHaveAttribute("data-time", "night");
  await expect(scene.locator("[data-icon='rain']")).toBeVisible();
});

test("일출 전에는 달, 일출 후에는 해 아이콘으로 바뀐다", async ({ page }) => {
  await setSeoulTime(page, new Date("2026-10-19T20:00:00Z")); // 서울 05:00(일출 전)
  await mockWeather(page, "clear", 9);
  await page.goto("/");
  const scene = page.locator("[data-weather]");
  await expect(scene.locator("[data-icon='moon']")).toBeVisible();

  await page.clock.fastForward("03:00:00"); // 서울 08:00(일출 후)
  await expect(scene.locator("[data-icon='sun']")).toBeVisible();
});

test("날씨 API가 502여도 헤더와 프로필은 시간대만 반영해 보여 준다", async ({
  page,
}) => {
  await setSeoulTime(page, new Date("2026-10-20T03:00:00Z"));
  await page.route("**/api/weather", (route) =>
    route.fulfill({ status: 502, json: { error: "upstream" } }),
  );
  await page.goto("/");

  const scene = page.locator("[data-time]");
  await expect(scene).toHaveAttribute("data-time", "noon");
  await expect(scene).not.toHaveAttribute("data-weather", /.+/);
  await expect(page.getByTestId("header-profile")).toBeVisible();
  await expect(page.getByText(/서울/)).toHaveCount(0);
  await expect(page.locator("header")).toHaveCount(1);
});
