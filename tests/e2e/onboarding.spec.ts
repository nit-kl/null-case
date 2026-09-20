import { expect, test } from "@playwright/test";

test("intro dialogue leads through real searches to first evidence and free investigation", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("region", { name: "人物との会話" });
  await expect(dialog.locator(".spokenLine")).toContainText("緊急回線");
  await page.screenshot({ path: test.info().outputPath("intro.png") });
  await dialog.getByRole("button", { name: "次の会話" }).click();
  await expect(dialog.locator(".spokenLine")).toContainText("支配人の神代");
  await dialog.getByRole("button", { name: "前の会話" }).click();
  await expect(dialog.locator(".spokenLine")).toContainText("緊急回線");
  await dialog.getByText("会話バックログ", { exact: true }).click();
  await expect(dialog.locator(".characterBacklog li")).toHaveCount(1);
  await dialog.getByRole("button", { name: "捜査を開始する" }).click();
  const guide = page.getByRole("region", { name: "はじめての捜査ガイド" });
  await guide.getByRole("button", { name: "部屋の検索を準備" }).click();
  await expect(page.locator(".results")).toContainText("AWAITING QUERY");
  const run = () => page.getByRole("button", { name: /RUN QUERY/ }).click();
  await run();
  await expect(guide).toContainText("2 / 3");
  await page.screenshot({ path: test.info().outputPath("guide.png") });
  await page.reload();
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await expect(guide).toContainText("2 / 3");
  await guide.getByRole("button", { name: "運用メモの検索を準備", exact: true }).click();
  await run();
  await expect(guide).toContainText("3 / 3");
  await guide.getByRole("button", { name: "検索結果へ移動" }).click();
  await expect(page.getByLabel("検索結果パネル", { exact: true })).toBeFocused();
  await page.getByRole("button", { name: "＋ 証拠化", exact: true }).click();
  await expect(guide).toContainText("最初の証拠を登録しました");
  await guide.getByRole("button", { name: "ACCESS DBへ進む" }).click();
  await expect(guide).toHaveCount(0);
  await expect(page.getByLabel("ACCESS検索式")).toBeVisible();
  await page.getByRole("button", { name: "遊び方", exact: true }).click();
  await expect(guide).toContainText("最初の証拠を登録しました");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "事件概要", exact: true }).click();
  await expect(page.getByRole("dialog").locator(".dialogueText")).toContainText("データ分析官");
});

test("skipping and rereading received communications preserve read semantics", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await page.getByRole("button", { name: "案内をスキップして自由に調べる" }).click();
  await page.reload();
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await expect(page.getByRole("region", { name: "はじめての捜査ガイド" })).toHaveCount(0);
  const log = page.getByRole("region", { name: "通信ログ", exact: true });
  const read = log.getByRole("button", { name: "会話で読む" });
  await expect(read).toHaveCount(1);
  await read.click();
  await page.keyboard.press("Escape");
  await expect(read).toBeFocused();
  await expect(log.getByRole("status")).toHaveText("未読 1 件");
  await read.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "次の会話" }).click();
  await dialog.getByRole("button", { name: "次の会話" }).click();
  await dialog.getByRole("button", { name: "通信を閉じる" }).click();
  await expect(log.getByRole("status")).toHaveText("未読 0 件");
  await read.click();
  await expect(dialog.locator(".dialogueText")).toContainText("通報");
});

test("unrelated empty results and invalid queries do not advance; corrupt tutorial save stays intact", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("null-case:case-001:tutorial:v1", "{broken"));
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  const guide = page.getByRole("region", { name: "はじめての捜査ガイド" });
  await expect(guide).toContainText("保存を読み込めません");
  for (const query of ["SELECT * FROM rooms WHERE room_number = 999;", "invalid query"]) {
    await page.getByLabel("SQL query").fill(query);
    await page.getByRole("button", { name: /RUN QUERY/ }).click();
    await expect(guide).toContainText("1 / 3");
  }
  await guide.getByRole("button", { name: "部屋の検索を準備" }).click();
  await page.getByRole("button", { name: /RUN QUERY/ }).click();
  await expect(guide).toContainText("2 / 3");
  await expect(page.locator(".guideAnchor")).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("null-case:case-001:tutorial:v1"))).toBe("{broken");
});
