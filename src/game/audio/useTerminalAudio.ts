"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AUDIO_VOLUME_KEY, parseVolume, TerminalAudio, type SoundCue } from "./terminalAudio";

export function useTerminalAudio() {
  const audio = useRef<TerminalAudio | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(30);
  const [status, setStatus] = useState("効果音はオフです。音量のみ次回に引き継ぎます。");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const player = new TerminalAudio();
    audio.current = player;
    try { setVolume(parseVolume(localStorage.getItem(AUDIO_VOLUME_KEY))); }
    catch { setStatus("音量を読み込めません。この画面内では変更できます。"); }
    const hide = () => { if (document.hidden) player.stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => { document.removeEventListener("visibilitychange", hide); player.dispose(); audio.current = null; };
  }, []);
  const play = useCallback((cue: SoundCue) => { if (!document.hidden) audio.current?.play(cue); }, []);
  const changeVolume = (value: number) => {
    setVolume(value); audio.current?.setVolume(value);
    try { localStorage.setItem(AUDIO_VOLUME_KEY, String(value)); }
    catch { setStatus("音量を保存できません。この画面内では変更できます。"); }
  };
  const toggle = async () => {
    if (enabled) { audio.current?.mute(); setEnabled(false); setStatus("効果音はオフです。"); return; }
    setPending(true);
    const ok = await audio.current?.enable(volume);
    setEnabled(!!ok); setPending(false);
    setStatus(ok ? "効果音はオンです。音量0%では無音になります。" : "効果音を開始できませんでした。捜査はそのまま続けられます。再度お試しください。");
    if (ok) play("search");
  };
  return { enabled, volume, status, pending, play, changeVolume, toggle };
}
