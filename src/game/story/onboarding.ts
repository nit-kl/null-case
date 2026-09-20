import data from "../../data/cases/case-001/onboarding.json";
import type { SourceResult } from "../data-sources/DataSourceAdapter";

export const tutorialData = data;
export const TUTORIAL_KEY = "null-case:case-001:tutorial:v1";
export interface TutorialState { version: 1; roomsChecked: boolean; dismissed: boolean; }
export const emptyTutorial = (): TutorialState => ({ version: 1, roomsChecked: false, dismissed: false });
export function decodeTutorial(raw: string): TutorialState {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || typeof value.roomsChecked !== "boolean" || typeof value.dismissed !== "boolean") throw new Error("操作案内を読み込めません。");
  return { version: 1, roomsChecked: value.roomsChecked, dismissed: value.dismissed };
}
export function checkedRoomSearch(result: SourceResult, query: string): boolean {
  return result.sourceId === "hotel" && result.table === "rooms" && result.rows.length === 0 && /^\s*SELECT\s+\*\s+FROM\s+rooms\s+WHERE\s+room_number\s*=\s*404\s*;?\s*$/i.test(query);
}
export function tutorialStep(state: TutorialState, discovered: readonly string[], registered: readonly string[]): keyof typeof data.steps {
  if (registered.includes(data.noteEvidenceId)) return "complete";
  if (discovered.includes(data.noteEvidenceId)) return "register";
  return state.roomsChecked ? "notes" : "rooms";
}
