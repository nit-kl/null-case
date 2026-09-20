import { describe, expect, it } from "vitest";
import { addNode, connectNodes, disconnectNodes, emptyBoard, moveNode, removeNode, validateBoard } from "../src/game/board/caseBoard";
import { emptySave, migrateSave, decodeSave } from "../src/game/save/investigationSave";
import { evidenceCatalog } from "../src/game/evidence/catalog";

const ids = [...evidenceCatalog.keys()].slice(0, 3);
const populated = () => ids.reduce((board, id) => addNode(board, id, ids), emptyBoard());

describe("case board", () => {
  it("only places registered evidence and avoids duplicates", () => {
    expect(() => addNode(emptyBoard(), ids[0], [])).toThrow();
    const board = populated();
    expect(addNode(board, ids[0], ids)).toBe(board);
    expect(board.nodes.map((node) => [node.x, node.y])).toEqual([[0, 0], [1, 0], [2, 0]]);
  });
  it("moves immutably, swaps occupied positions and respects bounds", () => {
    const board = populated();
    const swapped = moveNode(board, ids[0], 1, 0);
    expect(swapped.nodes[0].x).toBe(1);
    expect(swapped.nodes[1].x).toBe(0);
    expect(board.nodes[0].x).toBe(0);
    expect(moveNode(board, ids[0], -1, 0)).toBe(board);
    expect(moveNode(board, ids[0], 0, 20)).toBe(board);
    expect(moveNode(board, ids[0], 0, 1).nodes[0].y).toBe(1);
    expect(moveNode(board, "missing", 1, 0)).toBe(board);
  });
  it("updates an undirected link and removes links with their nodes", () => {
    let board = connectNodes(populated(), { from: ids[0], to: ids[1], kind: "relation", note: "関連" });
    board = connectNodes(board, { from: ids[1], to: ids[0], kind: "contradiction", note: "  記録が異なる  " });
    expect(board.links).toHaveLength(1);
    expect(board.links[0]).toMatchObject({ kind: "contradiction", note: "記録が異なる" });
    expect(disconnectNodes(board, ids[0], ids[1]).links).toEqual([]);
    const removed = removeNode(board, ids[0]);
    expect(removed.nodes).toHaveLength(2);
    expect(removed.links).toEqual([]);
    expect(board.nodes).toHaveLength(3);
  });
  it.each([
    { from: ids[0], to: ids[0], kind: "relation", note: "" },
    { from: ids[0], to: "missing", kind: "relation", note: "" },
    { from: ids[0], to: ids[1], kind: "truth", note: "" },
    { from: ids[0], to: ids[1], kind: "relation", note: "x".repeat(201) },
  ])("rejects invalid link %j", (link) => {
    expect(() => validateBoard({ ...populated(), links: [link] }, ids)).toThrow();
  });
  it.each([null, {}, { nodes: [{ evidenceId: "missing", x: 0, y: 0 }], links: [] },
    { nodes: [{ evidenceId: ids[0], x: -1, y: 0 }], links: [] },
    { nodes: [{ evidenceId: ids[0], x: 0, y: 0.5 }], links: [] },
    { nodes: [{ evidenceId: ids[0], x: 0, y: 0 }, { evidenceId: ids[1], x: 0, y: 0 }], links: [] },
    { nodes: [{ evidenceId: ids[0], x: 0, y: 0 }, { evidenceId: ids[0], x: 1, y: 0 }], links: [] },
  ])("rejects malformed boards %j", (board) => expect(() => validateBoard(board, ids)).toThrow());
});

describe("save migration for M04", () => {
  it("preserves v1 evidence and history while adding an empty board", () => {
    const old = { schemaVersion: 1, caseId: "case-001", caseSchemaVersion: 1, discoveredIds: ids, evidenceIds: ids, history: [{ sourceId: "hotel", query: "SELECT * FROM rooms" }] };
    const migrated = migrateSave(old);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.evidenceIds).toEqual(ids);
    expect(migrated.history).toEqual(old.history);
    expect(migrated.board).toEqual(emptyBoard());
    expect(old).not.toHaveProperty("board");
  });
  it("round trips v2 positions, link kinds and player notes", () => {
    const board = connectNodes(moveNode(populated(), ids[0], 0, 1), { from: ids[0], to: ids[1], kind: "contradiction", note: "<script> is plain text" });
    const save = { ...emptySave(), discoveredIds: ids, evidenceIds: ids, board };
    expect(decodeSave(JSON.stringify(save))).toEqual(save);
    expect(() => migrateSave({ ...save, evidenceIds: [] })).toThrow();
    expect(() => migrateSave({ ...save, board: undefined })).toThrow();
  });
});
