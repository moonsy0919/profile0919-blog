import { expect, type Page } from "@playwright/test";

/**
 * 개발 일기 목록의 첫 카드가 가리키는 상세 경로(쿼리 제외)를 돌려준다.
 * 시드 id(uuid)를 하드코딩하지 않고 실데이터에서 찾는다. 1페이지 첫 카드는 최신 글이다.
 * @param page Playwright 페이지
 * @param listPath 카드를 찾을 목록 주소(기본은 1페이지)
 */
export async function firstDevLogPath(
  page: Page,
  listPath = "/dev-logs",
): Promise<string> {
  await page.goto(listPath);
  const href = await page
    .locator("article a[href^='/dev-logs/']")
    .first()
    .getAttribute("href");
  expect(href).toMatch(/^\/dev-logs\/[0-9a-f-]{36}/);
  return href!.split("?")[0];
}
