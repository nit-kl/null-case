import { describe, expect, it } from "vitest";
import { executeQuery } from "../src/game/query-engine/queryEngine";
import type { DataTable } from "../src/types/game";

const tables: DataTable[] = [{ name: "rooms", label: "rooms", rows: [{ room_number: 401 }, { room_number: 405 }] }];

describe("executeQuery", () => {
  it("returns zero rows for the missing room", () => {
    const result = executeQuery("SELECT * FROM rooms WHERE room_number = 404;", tables);
    expect(result.rows).toEqual([]);
  });

  it("projects selected columns", () => {
    const result = executeQuery("SELECT room_number FROM rooms;", tables);
    expect(result.columns).toEqual(["room_number"]);
    expect(result.rows).toHaveLength(2);
  });
});
