import { expect, test } from "@playwright/test";

test("sound is opt-in, keyboard volume persists and mute remains available", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await page.getByText("音響設定", { exact: true }).click();
  const group = page.getByRole("group", { name: "音響設定" });
  await expect(group.getByRole("button", { name: "試聴" })).toBeDisabled();
  await group.getByRole("button", { name: "効果音をオン" }).click();
  await expect(group.getByRole("button", { name: "効果音をオフ" })).toHaveAttribute("aria-pressed", "true");
  const volume = group.getByRole("slider", { name: "効果音の音量" });
  await volume.focus(); await page.keyboard.press("Home");
  await expect(volume).toHaveValue("0");
  await page.keyboard.press("ArrowRight"); await expect(volume).toHaveValue("5");
  await group.getByRole("button", { name: "試聴" }).click();
  await page.getByRole("button", { name: /RUN QUERY/ }).click();
  await expect(page.locator(".zero")).toBeVisible();
  await group.getByRole("button", { name: "効果音をオフ" }).click();
  await expect(group.getByRole("button", { name: "試聴" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await page.getByText("音響設定", { exact: true }).click();
  await expect(volume).toHaveValue("5");
  await expect(group.getByRole("button", { name: "効果音をオン" })).toHaveAttribute("aria-pressed", "false");
});

test("audio failure does not interrupt investigation", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "AudioContext", { value: class { constructor() { throw new Error("unavailable"); } } }); });
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await page.getByText("音響設定", { exact: true }).click();
  const group = page.getByRole("group", { name: "音響設定" });
  await group.getByRole("button", { name: "効果音をオン" }).click();
  await expect(group.getByRole("status")).toContainText("開始できませんでした");
  await page.getByLabel("SQL query").fill("SELECT * FROM room_notes WHERE room_number = 404;");
  await page.getByRole("button", { name: /RUN QUERY/ }).click();
  await page.getByRole("button", { name: "＋ 証拠化", exact: true }).click();
  await expect(page.locator(".evidenceCard")).toHaveCount(1);
});
