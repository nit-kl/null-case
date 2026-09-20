import type { useTerminalAudio } from "@/game/audio/useTerminalAudio";

export function AudioControls({ audio }: { audio: ReturnType<typeof useTerminalAudio> }) {
  return <details className="audioControls">
    <summary>音響設定</summary>
    <div role="group" aria-label="音響設定">
      <button type="button" aria-pressed={audio.enabled} disabled={audio.pending} onClick={() => void audio.toggle()}>{audio.enabled ? "効果音をオフ" : "効果音をオン"}</button>
      <label>効果音の音量<input type="range" min="0" max="100" step="5" value={audio.volume} aria-valuetext={`${audio.volume}%`} onChange={(event) => audio.changeVolume(Number(event.target.value))} /><span>{audio.volume}%</span></label>
      <button type="button" disabled={!audio.enabled} onClick={() => audio.play("message")}>試聴</button>
      <p role="status">{audio.status}</p>
    </div>
  </details>;
}
