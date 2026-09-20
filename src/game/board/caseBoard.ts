export interface BoardNode { evidenceId: string; x: number; y: number; }
export interface BoardLink { from: string; to: string; kind: "relation" | "contradiction"; note: string; }
export interface CaseBoard { nodes: BoardNode[]; links: BoardLink[]; }
export const emptyBoard = (): CaseBoard => ({ nodes: [], links: [] });
export const pairKey = (from: string, to: string) => JSON.stringify([from, to].sort());
const coordinate = (value: unknown, max: number): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

export function validateBoard(value: unknown, evidenceIds: readonly string[]): CaseBoard {
  if (!object(value) || !Array.isArray(value.nodes) || !Array.isArray(value.links) || value.nodes.length > evidenceIds.length || value.links.length > 100) throw new Error("ボードの保存形式が不正です。");
  const ids = new Set<string>();
  const positions = new Set<string>();
  const nodes = value.nodes.map((node): BoardNode => {
    if (!object(node) || typeof node.evidenceId !== "string" || !evidenceIds.includes(node.evidenceId) || ids.has(node.evidenceId) || !coordinate(node.x, 2) || !coordinate(node.y, 19)) throw new Error("ボードの証拠または座標が不正です。");
    const position = `${node.x},${node.y}`;
    if (positions.has(position)) throw new Error("ボードの配置が重複しています。");
    ids.add(node.evidenceId); positions.add(position);
    return { evidenceId: node.evidenceId, x: node.x, y: node.y };
  });
  const pairs = new Set<string>();
  const links = value.links.map((link): BoardLink => {
    if (!object(link) || typeof link.from !== "string" || typeof link.to !== "string" || link.from === link.to || !ids.has(link.from) || !ids.has(link.to) || !["relation", "contradiction"].includes(String(link.kind)) || typeof link.note !== "string" || link.note.length > 200) throw new Error("ボードの接続が不正です。");
    const key = pairKey(link.from, link.to);
    if (pairs.has(key)) throw new Error("ボードの接続が重複しています。");
    pairs.add(key);
    return { from: link.from, to: link.to, kind: link.kind as BoardLink["kind"], note: link.note };
  });
  return { nodes, links };
}

export function addNode(board: CaseBoard, id: string, evidenceIds: readonly string[]): CaseBoard {
  if (!evidenceIds.includes(id)) throw new Error("登録済みの証拠だけ配置できます。");
  if (board.nodes.some((node) => node.evidenceId === id)) return board;
  for (let y = 0; y < 20; y++) for (let x = 0; x < 3; x++) {
    if (!board.nodes.some((node) => node.x === x && node.y === y)) return { ...board, nodes: [...board.nodes, { evidenceId: id, x, y }] };
  }
  throw new Error("ボードに空きがありません。");
}
export function moveNode(board: CaseBoard, id: string, dx: number, dy: number): CaseBoard {
  const current = board.nodes.find((node) => node.evidenceId === id);
  if (!current) return board;
  const x = current.x + dx, y = current.y + dy;
  if (!coordinate(x, 2) || !coordinate(y, 19)) return board;
  return { ...board, nodes: board.nodes.map((node) => node.evidenceId === id ? { ...node, x, y } : node.x === x && node.y === y ? { ...node, x: current.x, y: current.y } : node) };
}
export function removeNode(board: CaseBoard, id: string): CaseBoard {
  return { nodes: board.nodes.filter((node) => node.evidenceId !== id), links: board.links.filter((link) => link.from !== id && link.to !== id) };
}
export function connectNodes(board: CaseBoard, link: BoardLink): CaseBoard {
  const key = pairKey(link.from, link.to);
  const next = { ...board, links: [...board.links.filter((item) => pairKey(item.from, item.to) !== key), { ...link, note: link.note.trim() }] };
  return validateBoard(next, board.nodes.map((node) => node.evidenceId));
}
export function disconnectNodes(board: CaseBoard, from: string, to: string): CaseBoard {
  return { ...board, links: board.links.filter((link) => pairKey(link.from, link.to) !== pairKey(from, to)) };
}
