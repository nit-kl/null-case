import { test, expect } from "@playwright/test";

test("briefing contains keyboard focus and restores it; navigation reaches investigation sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "人物との会話" }).getByRole("heading", { level: 1 })).toBeFocused();
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await page.getByRole("button", { name: "事件概要", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "次の会話" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement?.closest("dialog"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "事件概要", exact: true })).toBeFocused();

  const navigation = page.getByRole("navigation", { name: "捜査画面の移動" });
  for (const [name, id] of [["登録証拠", "evidence"], ["通信ログ", "communications"], ["ケースボード", "case-board"], ["事件モデル", "case-theory"], ["データ検索", "investigation"]]) {
    const link = navigation.getByRole("link", { name, exact: true });
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
  const reopen = page.getByRole("button", { name: "事件概要", exact: true });
  await reopen.focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("button", { name: "次の会話" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(reopen).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");

  await page.getByLabel("SQL query").focus();
  await page.keyboard.press("Control+Enter");
  await expect(page.locator(".srOnly[role=status]")).toHaveText("HOTEL DB：検索結果 0 件。");
  await page.getByLabel("SQL query").fill("SELECT * FROM room_notes WHERE room_number = 404;");
  await page.keyboard.press("Control+Enter");
  await expect(page.locator(".srOnly[role=status]")).toHaveText("HOTEL DB：検索結果 1 件。");
  const pin = page.getByRole("button", { name: "＋ 証拠化", exact: true });
  await pin.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".evidenceCard")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("briefing fits short screens and respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 320 });
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await page.getByRole("button", { name: "事件概要", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
  const box = await dialog.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(320);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
