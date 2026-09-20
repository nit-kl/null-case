import { test, expect } from "@playwright/test";
const key = "null-case:case-001:investigation";

for (const raw of ["{broken", JSON.stringify({ schemaVersion: 999 })]) {
  test(`preserves unreadable saves: ${raw}`, async ({ page }) => {
    await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key, raw });
    await page.goto("/");
    await page.getByRole("button", { name: "捜査を開始する" }).click();
    await expect(page.locator(".saveStatus")).toContainText("上書きせず");
    await page.getByRole("button", { name: /^Q3:/ }).click();
    await page.getByRole("button", { name: /RUN QUERY/ }).click();
    await page.getByRole("button", { name: "＋ 証拠化", exact: true }).click();
    await expect(page.locator(".evidenceCard")).toHaveCount(1);
    expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(raw);
  });
}

test("storage write failure leaves evidence usable and explains the failure", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await expect(page.locator(".saveStatus")).toContainText("保存できませんでした");
  await page.getByRole("button", { name: /^Q3:/ }).click();
  await page.getByRole("button", { name: /RUN QUERY/ }).click();
  await page.getByRole("button", { name: "＋ 証拠化", exact: true }).click();
  await expect(page.locator(".evidenceCard")).toHaveCount(1);
  await page.getByText("証拠の詳細", { exact: true }).click();
  await expect(page.locator(".evidenceCard details")).toHaveAttribute("open", "");
});
