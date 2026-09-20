import { test, expect } from "@playwright/test";

test("six sources retain M01 and share evidence on desktop and mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  const run = () => page.getByRole("button", { name: /RUN QUERY/ }).click();
  const source = (name: string) => page.getByRole("button", { name: new RegExp(`${name} DB.*CONNECTED`) }).click();
  const pin = () => page.getByRole("button", { name: "＋ 証拠化", exact: true }).first().click();
  const fits = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await run();
  await expect(page.locator(".zero")).toBeVisible();
  await page.getByRole("button", { name: /^Q3:/ }).click();
  await run(); await pin(); await fits();
  await source("ACCESS"); await run(); await pin();
  await page.getByLabel("ACCESS検索式").fill("room:404 OR room:405");
  await run(); await expect(page.locator(".error")).toBeVisible();

  await source("CAMERA"); await run();
  await expect(page.locator(".error")).toHaveCount(0);
  await expect(page.locator(".cameraTimeline li")).toHaveCount(4);
  await page.getByLabel("人物タグ", { exact: true }).selectOption("dark_coat");
  await run(); await expect(page.locator(".cameraTimeline li")).toHaveCount(2);
  await pin(); await fits();
  await page.getByLabel("開始時刻", { exact: true }).fill("23:00");
  await page.getByLabel("終了時刻", { exact: true }).fill("22:00");
  await run(); await expect(page.locator(".error")).toBeVisible();

  await source("PAYMENT");
  await page.getByLabel("最小金額（円）").fill("2400");
  await page.getByLabel("最大金額（円）").fill("2400");
  await page.getByLabel("決済手段").selectOption("room_charge");
  await run(); await expect(page.locator("tbody tr")).toHaveCount(1);
  await pin(); await fits();
  await page.getByLabel("最大金額（円）").fill("100");
  await run(); await expect(page.locator(".error")).toBeVisible();

  await source("FACILITY"); await run();
  await expect(page.locator(".powerChart circle")).toHaveCount(7);
  await pin(); await fits();
  await page.getByLabel("開始時刻", { exact: true }).fill("22:20");
  await page.getByLabel("終了時刻", { exact: true }).fill("22:20");
  await run(); await expect(page.locator(".powerChart circle")).toHaveCount(1);
  await page.getByLabel("部屋番号").fill("999");
  await run(); await expect(page.locator(".zero")).toBeVisible();
  await expect(page.locator(".powerChart")).toHaveCount(0);

  await source("STAFF");
  await page.getByLabel("人物・部署・権限", { exact: true }).selectOption("S-02");
  await run(); await pin();
  await page.locator(".staffGraph").getByRole("button", { name: "サービス区画への入室", exact: true }).click();
  await expect(page.locator(".staffEdge")).toHaveCount(2);
  await page.locator(".staffGraph").getByRole("button", { name: "雨宮蓮", exact: true }).click();
  await expect(page.locator(".staffEdge")).toHaveCount(3);
  await fits();
  await expect(page.locator(".evidenceCard")).toHaveCount(6);

  await source("HOTEL");
  await page.getByRole("button", { name: /^Q3:/ }).click();
  await run(); await expect(page.getByRole("button", { name: "登録済み", exact: true })).toBeDisabled();
  await expect(page.locator(".evidenceCard")).toHaveCount(6);
  expect(errors).toEqual([]);
});
