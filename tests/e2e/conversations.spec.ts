import { expect, test } from "@playwright/test";
import { emptySave, SAVE_KEY } from "../../src/game/save/investigationSave";
import { evidenceCatalog } from "../../src/game/evidence/catalog";

test("story and terminal are distinct; character question and page resume across reload", async ({ page }) => {
  await page.goto("/");
  const scene = page.getByRole("region", { name: "人物との会話" });
  await expect(scene.getByRole("img", { name: "神代誠司の立ち絵" })).toBeVisible();
  await expect.poll(() => scene.locator("img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByLabel("SQL query")).not.toBeVisible();
  await expect(page.getByRole("region", { name: "聞き取り一覧" })).not.toContainText("署名のある指示");
  await page.screenshot({ path: test.info().outputPath("story-stage.png"), fullPage: true });
  for (let i = 0; i < 4; i++) await scene.getByRole("button", { name: "次の会話" }).click();
  await expect(scene.getByRole("button", { name: "次の会話" })).toBeDisabled();
  await scene.getByRole("button", { name: "「客室ではない場所もある、と？」" }).click();
  await expect(scene.locator(".spokenLine")).toContainText("呼び方を決めるのは避けたい");
  await page.reload();
  await expect(scene.locator(".spokenLine")).toContainText("呼び方を決めるのは避けたい");
  await scene.getByRole("button", { name: "質問を選び直す" }).click();
  await scene.getByRole("button", { name: "「一覧と現場、どちらが間違っている？」" }).click();
  await expect(scene.locator(".spokenLine")).toContainText("通報があったことまで否定");
  for (let i = 0; i < 3; i++) await scene.getByRole("button", { name: "次の会話" }).click();
  await scene.getByRole("button", { name: "会話を終えて調査へ" }).click();
  await expect(scene).toHaveCount(0);
  await expect(page.getByLabel("SQL query")).toBeVisible();
  await page.getByLabel("SQL query").fill("SELECT * FROM room_notes WHERE room_number = 404;");
  await page.getByRole("button", { name: /RUN QUERY/ }).click();
  await page.getByRole("button", { name: "＋ 証拠化", exact: true }).click();
  await expect(page.locator(".conversationNotice")).toContainText("新しい聞き取り");
  await page.getByRole("button", { name: /^人物との会話へ/ }).click();
  await expect(scene.getByRole("heading", { level: 1 })).toHaveText("清掃責任者のためらい");
  await expect(scene.getByRole("img", { name: "佐伯美咲の立ち絵" })).toBeVisible();
  await expect(page.getByRole("button", { name: /RUN QUERY/ })).not.toBeVisible();
  await page.getByRole("button", { name: /^捜査パート/ }).click();
  await expect(page.getByLabel("SQL query")).toHaveValue("SELECT * FROM room_notes WHERE room_number = 404;");
  await expect(page.getByRole("button", { name: "登録済み", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("all four generated portraits load and only eligible conversations are listed", async ({ page }) => {
  const ids = [...evidenceCatalog.keys()];
  const save = { ...emptySave(), discoveredIds: ids, evidenceIds: ids };
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: SAVE_KEY, value: save });
  await page.goto("/");
  const library = page.getByRole("region", { name: "聞き取り一覧" });
  await expect(library.getByRole("button")).toHaveCount(8);
  await expect(library).not.toContainText("提出のあとで");
  for (const [title, name] of [["清掃責任者のためらい", "佐伯美咲"], ["電力計は誰を見たのか", "雨宮蓮"], ["405号室の宿泊客", "加賀美透"], ["署名のある指示", "神代誠司"]]) {
    await library.getByRole("button", { name: new RegExp(title) }).click();
    const portrait = page.getByRole("img", { name: `${name}の立ち絵` });
    await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByRole("region", { name: "人物との会話" }).getByRole("heading", { level: 1 })).toBeFocused();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("corrupt conversation saves are preserved and never expose locked scenes", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("null-case:case-001:conversations:v1", '{"version":99,"active":"audit"}'));
  await page.goto("/");
  await expect(page.getByRole("region", { name: "会話パート", exact: true }).getByRole("status")).toContainText("上書きせず");
  await expect(page.getByRole("region", { name: "聞き取り一覧" }).getByRole("button")).toHaveCount(1);
  await page.getByRole("button", { name: "次の会話" }).click();
  expect(await page.evaluate(() => localStorage.getItem("null-case:case-001:conversations:v1"))).toBe('{"version":99,"active":"audit"}');
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await page.getByRole("button", { name: /RUN QUERY/ }).click();
  await expect(page.locator(".zero")).toBeVisible();
});
