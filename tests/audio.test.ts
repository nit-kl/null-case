import { describe, expect, it, vi } from "vitest";
import { parseVolume, TerminalAudio } from "../src/game/audio/terminalAudio";

function fixture() {
  const nodes: { stop: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
  const gain = { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
  const context = { state: "running", currentTime: 0, destination: {}, resume: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined), createGain: () => gain,
    createOscillator: () => { const node = { frequency: { value: 0 }, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null }; nodes.push(node); return node; } };
  const factory = vi.fn(() => context as unknown as AudioContext);
  return { player: new TerminalAudio(factory), factory, context, gain, nodes };
}

describe("terminal audio", () => {
  it("validates saved volume including zero", () => {
    expect(parseVolume("0")).toBe(0); expect(parseVolume("100")).toBe(100);
    for (const raw of [null, "", "-1", "101", "NaN", "{}", "0.5"]) expect(parseVolume(raw)).toBe(30);
  });
  it("does not create audio before explicit activation", () => {
    const { player, factory } = fixture(); player.play("message"); player.setVolume(70);
    expect(factory).not.toHaveBeenCalled();
  });
  it("plays cues and replaces active sounds instead of stacking them", async () => {
    const { player, nodes } = fixture(); await player.enable(30); player.play("evidence");
    expect(nodes).toHaveLength(2); player.play("message");
    expect(nodes).toHaveLength(5); expect(nodes[0].disconnect).toHaveBeenCalled();
    expect(nodes[0].stop).toHaveBeenCalledTimes(2);
  });
  it("mutes immediately and refuses subsequent sounds", async () => {
    const { player, nodes } = fixture(); await player.enable(30); player.play("search"); player.mute(); player.play("message");
    expect(nodes).toHaveLength(1); expect(nodes[0].disconnect).toHaveBeenCalled();
  });
  it("does not re-enable after a pending resume is cancelled", async () => {
    const { player, context, nodes } = fixture(); let finish!: () => void;
    context.resume.mockImplementation(() => new Promise<void>((resolve) => { finish = resolve; }));
    const enabling = player.enable(30); player.mute(); finish();
    expect(await enabling).toBe(false); player.play("search"); expect(nodes).toHaveLength(0);
  });
  it("handles unavailable or blocked audio without throwing", async () => {
    const broken = new TerminalAudio(() => { throw new Error("unsupported"); });
    expect(await broken.enable(30)).toBe(false); expect(() => broken.play("search")).not.toThrow();
    const { player, context } = fixture(); context.resume.mockRejectedValue(new Error("blocked"));
    expect(await player.enable(30)).toBe(false);
  });
  it("updates volume, skips suspended playback and releases resources", async () => {
    const { player, context, gain, nodes } = fixture(); await player.enable(30); player.setVolume(0);
    expect(gain.gain.setValueAtTime).toHaveBeenLastCalledWith(0, 0);
    context.state = "suspended"; player.play("message"); expect(nodes).toHaveLength(0);
    player.dispose(); expect(context.close).toHaveBeenCalledOnce();
  });
});
