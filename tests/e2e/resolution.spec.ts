import { test, expect } from "@playwright/test";
import solution from "../../src/server/evaluation/case-001.solution.json";

test("search to resolution with network retry and persisted ending", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "捜査を開始する" }).click();
  const run = () => page.getByRole("button", { name: /RUN QUERY/ }).click();
  const source = (name: string) => page.getByRole("button", { name: new RegExp(`${name} DB.*CONNECTED`) }).click();
  const pin = () => page.getByRole("button", { name: "＋ 証拠化", exact: true }).first().click();
  await page.getByLabel("SQL query").fill("SELECT * FROM case_documents"); await run();
  for (let i = 0; i < 4; i++) await pin();
  await source("ACCESS");
  for (const table of ["controller_logs", "admin_audit"]) {
    await page.getByLabel("ACCESS検索式").fill(`table:${table} AND room:404`); await run(); await pin();
  }
  await source("CAMERA"); await page.getByLabel("人物タグ", { exact: true }).selectOption("S-01"); await run(); await pin();
  await source("STAFF"); await page.getByLabel("人物・部署・権限", { exact: true }).selectOption("K-MANAGER-01"); await run(); await pin();
  const theory = page.getByRole("region", { name: "事件モデル", exact: true });
  for (const [field, label] of Object.entries({ culprit: "犯人", motive: "動機", method: "方法", time: "死亡時刻" })) {
    const rule = solution.rules[field as keyof typeof solution.rules];
    await theory.getByLabel(`${label}の推理`, { exact: true }).fill(`${label}の記録を照合した仮説`);
    await theory.getByLabel(`${label}の根拠説明`, { exact: true }).fill("割り当てた独立した記録を照合した");
    await theory.getByLabel(`${label}の評価用結論`, { exact: true }).selectOption(rule.correctChoices[0]);
    for (const id of rule.evidenceGroups.flat()) {
      const recordId = id.split("-").slice(-2).join("-");
      await theory.getByRole("group", { name: `${label}の証拠`, exact: true }).getByRole("checkbox", { name: new RegExp(recordId) }).check();
    }
  }
  await theory.getByRole("button", { name: "提出内容を確認", exact: true }).click();
  await theory.getByRole("button", { name: "提出を確定", exact: true }).click();
  await theory.locator(".theoryHistory summary").click();
  await page.route("**/api/cases/case-001/evaluate", (route) => route.abort(), { times: 1 });
  await theory.getByRole("button", { name: "判定を依頼", exact: true }).click();
  await expect(theory.getByRole("alert")).toBeVisible();
  await expect(theory.locator(".theoryHistory details")).toHaveCount(1);
  await theory.getByRole("button", { name: "判定を依頼", exact: true }).click();
  await expect(theory.locator(".evaluationResult")).toContainText("CASE 001 解決");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload(); await page.getByRole("button", { name: "捜査を開始する" }).click();
  await theory.locator(".theoryHistory summary").click();
  await expect(theory.locator(".evaluationResult")).toContainText("CASE 001 解決");
  await page.getByRole("button", { name: /^人物との会話へ/ }).click();
  const scene = page.getByRole("region", { name: "人物との会話" });
  await expect(scene.getByRole("heading", { level: 1 })).toHaveText("夜の記録");
  await scene.getByRole("button", { name: "次の会話" }).click();
  await expect(scene.locator(".spokenLine")).toContainText(solution.ending.body);
});

test("evaluation API validates inputs and separates wrong answers from insufficient evidence", async ({ request }) => {
  const ids = [...new Set(Object.values(solution.rules).flatMap((rule) => rule.evidenceGroups.flat()))];
  const draft = Object.fromEntries(Object.entries(solution.rules).map(([field, rule]) => [field, { statement: "仮説", reasoning: "根拠説明", choiceId: rule.correctChoices[0], evidenceIds: rule.evidenceGroups.flat() }]));
  const url = "/api/cases/case-001/evaluate";
  const correct = await request.post(url, { data: { draft, registeredEvidence: ids } });
  expect(correct.status()).toBe(200); expect(correct.headers()["cache-control"]).toBe("no-store");
  expect((await correct.json()).outcome).toBe("supported");
  draft.culprit.choiceId = "c01";
  const wrong = await (await request.post(url, { data: { draft, registeredEvidence: ids } })).json();
  expect(wrong.outcome).toBe("revise"); expect(wrong.ending).toBeUndefined();
  draft.culprit.choiceId = "c02"; draft.culprit.evidenceIds = [ids[0]];
  const insufficient = await (await request.post(url, { data: { draft, registeredEvidence: ids } })).json();
  expect(insufficient.outcome).toBe("incomplete"); expect(insufficient.ending).toBeUndefined();
  expect(JSON.stringify(insufficient)).not.toMatch(/correctChoices|evidenceGroups|H-M704/);
  expect((await request.post(url, { data: { draft, registeredEvidence: [] } })).status()).toBe(400);
  expect((await request.post(url, { data: "{", headers: { "Content-Type": "application/json" } })).status()).toBe(400);
  expect((await request.post(url, { data: "x".repeat(65537), headers: { "Content-Type": "application/json" } })).status()).toBe(413);
  expect((await request.post(url, { data: "text", headers: { "Content-Type": "text/plain" } })).status()).toBe(415);
});
