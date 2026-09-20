import data from "../../data/cases/case-001/story.json";

type Condition = { type: "start" } | { type: "discovered" | "registered"; ids: string[] } | { type: "boardLinks"; minimum: number };
export interface StoryEvent { id: string; sender: string; title: string; body: string; when: Condition; objective?: string; }
export interface StoryState { deliveredIds: string[]; readIds: string[]; }
export interface StoryContext { discoveredIds: readonly string[]; evidenceIds: readonly string[]; board: { links: readonly unknown[] }; }
export const storyEvents = data.events as StoryEvent[];
export const briefing = data.briefing;
export const emptyStory = (): StoryState => ({ deliveredIds: [], readIds: [] });

export function advanceStory(state: StoryState, context: StoryContext): StoryState {
  const deliveredIds = [...state.deliveredIds];
  for (const event of storyEvents) {
    const condition = event.when;
    const eligible = condition.type === "start" ||
      (condition.type === "boardLinks" && context.board.links.length >= condition.minimum) ||
      ((condition.type === "discovered" || condition.type === "registered") && condition.ids.every((id) => (condition.type === "discovered" ? context.discoveredIds : context.evidenceIds).includes(id)));
    if (eligible && !deliveredIds.includes(event.id)) deliveredIds.push(event.id);
  }
  return { deliveredIds, readIds: [...state.readIds] };
}
export function markStoryRead(state: StoryState, id: string): StoryState {
  if (!state.deliveredIds.includes(id) || state.readIds.includes(id)) return state;
  return { ...state, readIds: [...state.readIds, id] };
}
export function currentObjective(state: StoryState): string {
  // Authored progression order prevents late discovery of earlier clues from regressing objectives.
  return [...storyEvents].reverse().find((event) => state.deliveredIds.includes(event.id) && event.objective)?.objective ?? storyEvents[0].objective!;
}
export function validateStory(value: unknown): StoryState {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("通信ログの保存形式が不正です。");
  const state = value as Record<string, unknown>;
  const ids = new Set(storyEvents.map((event) => event.id));
  const readList = (value: unknown): string[] => {
    if (!Array.isArray(value) || value.length > ids.size || value.some((id) => typeof id !== "string" || !ids.has(id)) || new Set(value).size !== value.length) throw new Error("通信ログのIDが不正です。");
    return [...value];
  };
  const deliveredIds = readList(state.deliveredIds), readIds = readList(state.readIds);
  if (readIds.some((id) => !deliveredIds.includes(id))) throw new Error("未受信の通信が既読になっています。");
  return { deliveredIds, readIds };
}
