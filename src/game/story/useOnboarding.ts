"use client";
import { useEffect, useState } from "react";
import { checkedRoomSearch, decodeTutorial, emptyTutorial, TUTORIAL_KEY } from "./onboarding";
import type { SourceResult } from "../data-sources/DataSourceAdapter";

export function useOnboarding() {
  const [state, setState] = useState(emptyTutorial);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try { const raw = localStorage.getItem(TUTORIAL_KEY); if (raw !== null) setState(decodeTutorial(raw)); }
    catch { setBlocked(true); setNotice("操作案内の保存を読み込めません。この画面内で案内を続けます。"); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || blocked) return;
    try { localStorage.setItem(TUTORIAL_KEY, JSON.stringify(state)); }
    catch { setNotice("操作案内の進捗を保存できません。この画面内では継続できます。"); }
  }, [state, ready, blocked]);
  return { state, ready, notice, dismiss: (dismissed: boolean) => setState((current) => ({ ...current, dismissed })),
    record: (result: SourceResult, query: string) => { if (checkedRoomSearch(result, query)) setState((current) => ({ ...current, roomsChecked: true })); } };
}
