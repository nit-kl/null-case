export type SoundCue = "search" | "evidence" | "message";
const tones: Record<SoundCue, number[]> = { search: [440], evidence: [520, 660], message: [660, 520, 660] };
export const AUDIO_VOLUME_KEY = "null-case:audio-volume:v1";
export function parseVolume(raw: string | null): number {
  if (raw === null || !/^\d{1,3}$/.test(raw)) return 30;
  const value = Number(raw);
  return value <= 100 ? value : 30;
}

/** One short cue at a time; creating/resuming audio requires an explicit user action. */
export class TerminalAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private active = new Set<OscillatorNode>();
  private enabled = false;
  private generation = 0;
  constructor(private createContext: () => AudioContext = () => new AudioContext()) {}

  async enable(volume: number): Promise<boolean> {
    const generation = ++this.generation;
    try {
      if (!this.context) {
        this.context = this.createContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
      }
      this.setVolume(volume);
      await this.context.resume();
      if (generation !== this.generation) return false;
      this.enabled = this.context.state === "running";
      return this.enabled;
    } catch { this.enabled = false; return false; }
  }
  setVolume(volume: number) {
    if (this.master && this.context) this.master.gain.setValueAtTime(Math.max(0, Math.min(100, volume)) / 100 * 0.12, this.context.currentTime);
  }
  stop() {
    for (const oscillator of this.active) {
      try { oscillator.stop(); } catch { /* Already ended. */ }
      oscillator.disconnect();
    }
    this.active.clear();
  }
  mute() { this.generation++; this.enabled = false; this.stop(); }
  play(cue: SoundCue) {
    if (!this.enabled || !this.context || !this.master || this.context.state !== "running") return;
    this.stop();
    try {
      tones[cue].forEach((frequency, index) => {
        const oscillator = this.context!.createOscillator();
        const envelope = this.context!.createGain();
        const start = this.context!.currentTime + index * 0.1;
        oscillator.frequency.value = frequency;
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(1, start + 0.008);
        envelope.gain.linearRampToValueAtTime(0, start + 0.08);
        oscillator.connect(envelope); envelope.connect(this.master!);
        this.active.add(oscillator);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); this.active.delete(oscillator); };
        oscillator.start(start); oscillator.stop(start + 0.09);
      });
    } catch { this.mute(); }
  }
  dispose() {
    this.mute();
    void this.context?.close().catch(() => {});
    this.context = null; this.master = null;
  }
}
