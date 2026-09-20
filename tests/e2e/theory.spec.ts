import { test, expect } from "@playwright/test";

test("drafts, evidence assignment, review and submission snapshots persist", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  const theory = page.getByRole("region", { name: "事件モデル", exact: true });
  await theory.getByRole("button", { name: "提出内容を確認", exact: true }).click();
  await expect(theory.getByRole("alert")).toContainText("根拠の証拠");
  await page.getByRole("button", { name: /^Q3:/ }).click();
  await page.getByRole("button", { name: /RUN QUERY/ }).click();
  await page.getByRole("button", { name: "＋ 証拠化", exact: true }).click();
  for (const label of ["犯人", "動機", "方法", "死亡時刻"]) {
    await theory.getByLabel(`${label}の推理`, { exact: true }).fill(`${label}についての仮説`);
    await theory.getByLabel(`${label}の根拠説明`, { exact: true }).fill("運用記録を根拠に推理した");
    await theory.getByRole("group", { name: `${label}の証拠`, exact: true }).getByRole("checkbox").check();
  }
  await page.reload();
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await expect(theory.getByLabel("犯人の推理", { exact: true })).toHaveValue("犯人についての仮説");
  await expect(theory.getByRole("group", { name: "犯人の証拠", exact: true }).getByRole("checkbox")).toBeChecked();
  await theory.getByRole("button", { name: "提出内容を確認", exact: true }).click();
  await expect(theory.locator(".theoryReview")).toContainText("運用記録を根拠に推理した");
  await theory.getByRole("button", { name: "編集に戻る", exact: true }).click();
  await theory.getByRole("button", { name: "提出内容を確認", exact: true }).click();
  await theory.getByRole("button", { name: "提出を確定", exact: true }).click();
  await expect(theory.getByRole("status")).toContainText("提出 #1");
  await theory.getByLabel("犯人の推理", { exact: true }).fill("改訂した仮説");
  await theory.locator(".theoryHistory summary").click();
  await expect(theory.locator(".theoryHistory")).toContainText("犯人についての仮説");
  await expect(theory.locator(".theoryHistory")).not.toContainText("改訂した仮説");
  await page.reload();
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  await expect(theory.getByLabel("犯人の推理", { exact: true })).toHaveValue("改訂した仮説");
  await expect(theory.locator(".theoryHistory details")).toHaveCount(1);
  await theory.getByRole("button", { name: "提出内容を確認", exact: true }).click();
  await theory.getByRole("button", { name: "提出を確定", exact: true }).click();
  await expect(theory.locator(".theoryHistory details")).toHaveCount(2);
  await theory.getByRole("button", { name: "提出内容を確認", exact: true }).click();
  await theory.getByRole("button", { name: "提出を確定", exact: true }).click();
  await expect(theory.getByRole("alert")).toContainText("提出済み");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
