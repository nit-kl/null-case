"use client";
import { useEffect, useState } from "react";
import { CONVERSATION_KEY, decodeConversations, emptyConversations } from "./conversations";

export function useConversations() {
  const [state, setState] = useState(emptyConversations);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try { const raw = localStorage.getItem(CONVERSATION_KEY); if (raw !== null) setState(decodeConversations(raw)); }
    catch { setBlocked(true); setNotice("会話の保存を読み込めません。既存データを上書きせず、この画面内で会話を続けます。"); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || blocked) return;
    try { localStorage.setItem(CONVERSATION_KEY, JSON.stringify(state)); }
    catch { setNotice("会話を保存できません。この画面内では続けられます。"); }
  }, [ready, blocked, state]);
  return { state, setState, ready, notice };
}
