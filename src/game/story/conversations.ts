import data from "../../data/cases/case-001/conversations.json";
import type { SourceId } from "../data-sources/DataSourceAdapter";

export interface ConversationBeat { speaker: string; text: string; ending?: boolean; choices?: { id: string; label: string; reply: string }[]; }
export interface ConversationScene {
  id: string; chapter: string; title: string; location: string; character: keyof typeof data.characters;
  destination: SourceId; gate: { type: "start" | "allEvidence" | "anyEvidence" | "submitted" | "solved"; ids?: string[] };
  beats: ConversationBeat[];
}
export const characters = data.characters;
export const conversationScenes = data.scenes as ConversationScene[];
export interface ConversationProgress { index: number; answers: Record<string, string>; completed: boolean; }
export interface ConversationSave { version: 1; active: string; progress: Record<string, ConversationProgress>; }
export const CONVERSATION_KEY = "null-case:case-001:conversations:v1";
export const emptyConversations = (): ConversationSave => ({ version: 1, active: "arrival", progress: {} });
export const initialProgress = (): ConversationProgress => ({ index: 0, answers: {}, completed: false });
export function availableScenes(evidenceIds: readonly string[], submissions: number, solved = false): ConversationScene[] {
  return conversationScenes.filter(({ gate }) => gate.type === "start" || (gate.type === "submitted" && submissions > 0) || (gate.type === "solved" && solved) ||
    (gate.type === "allEvidence" && gate.ids!.every((id) => evidenceIds.includes(id))) ||
    (gate.type === "anyEvidence" && gate.ids!.some((id) => evidenceIds.includes(id))));
}
export function advanceConversation(scene: ConversationScene, progress: ConversationProgress): ConversationProgress {
  const beat = scene.beats[progress.index];
  if (beat.choices && !beat.choices.some((choice) => choice.id === progress.answers[String(progress.index)])) return progress;
  return progress.index === scene.beats.length - 1 ? { ...progress, completed: true } : { ...progress, index: progress.index + 1 };
}
export function answerConversation(scene: ConversationScene, progress: ConversationProgress, answer: string): ConversationProgress {
  if (!scene.beats[progress.index].choices?.some((choice) => choice.id === answer)) return progress;
  return { ...progress, answers: { ...progress.answers, [progress.index]: answer } };
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export function decodeConversations(raw: string): ConversationSave {
  if (raw.length > 50000) throw new Error("会話の保存が大きすぎます。");
  const value: unknown = JSON.parse(raw);
  if (!object(value) || value.version !== 1 || !conversationScenes.some((scene) => scene.id === value.active) || !object(value.progress)) throw new Error("会話の保存形式が不正です。");
  const progress: ConversationSave["progress"] = {};
  for (const [id, entry] of Object.entries(value.progress)) {
    const scene = conversationScenes.find((scene) => scene.id === id);
    if (!scene || !object(entry) || !Number.isInteger(entry.index) || Number(entry.index) < 0 || Number(entry.index) >= scene.beats.length || typeof entry.completed !== "boolean" || !object(entry.answers)) throw new Error("会話の進行が不正です。");
    const answers: Record<string, string> = {};
    for (const [index, answer] of Object.entries(entry.answers)) {
      if (!/^\d+$/.test(index) || String(Number(index)) !== index || !scene.beats[Number(index)]?.choices?.some((choice) => choice.id === answer)) throw new Error("会話の選択が不正です。");
      answers[index] = answer as string;
    }
    if (scene.beats.some((beat, index) => beat.choices && (index < Number(entry.index) || entry.completed) && !answers[index])) throw new Error("未選択の質問があります。");
    progress[id] = { index: Number(entry.index), completed: entry.completed, answers };
  }
  return { version: 1, active: value.active as string, progress };
}
