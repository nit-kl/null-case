import { evaluateCase001 } from "@/server/evaluation/case001";

export async function POST(request: Request): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return Response.json({ error: "JSONで送信してください。" }, { status: 415, headers });
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "入力がありません。" }, { status: 400, headers });
  const decoder = new TextDecoder();
  let text = "", bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 65536) { await reader.cancel(); return Response.json({ error: "入力が大きすぎます。" }, { status: 413, headers }); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return Response.json(evaluateCase001(JSON.parse(text)), { headers });
  } catch {
    return Response.json({ error: "提出内容を確認してください。結論・根拠・登録証拠が必要です。" }, { status: 400, headers });
  } finally { reader.releaseLock(); }
}
