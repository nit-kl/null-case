"use client";
import { useEffect, useState } from "react";
import { decodeSave, emptySave, SAVE_KEY } from "./investigationSave";

export function useInvestigationSave() {
  const [save, setSave] = useState(emptySave);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [status, setStatus] = useState("保存データを確認中…");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw !== null) setSave(decodeSave(raw));
      setStatus(raw === null ? "自動保存を開始します。" : "捜査記録を復元しました。");
    } catch (error) {
      setBlocked(true);
      setStatus(`${error instanceof Error ? error.message : "保存データを読み取れませんでした。"} 既存の保存は上書きせず、この画面内で捜査を続けます。`);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || blocked) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); setStatus("捜査記録をこのブラウザに保存済み"); }
    catch { setStatus("保存できませんでした。ブラウザの保存容量・設定を確認してください。この画面内の記録は保持しています。"); }
  }, [save, ready, blocked]);
  return { save, setSave, ready, status };
}
