import { useState } from "react";
import { storyEvents, type StoryState } from "@/game/story/storyEngine";
import { VisualNovel } from "./VisualNovel";

export function StoryLog({ story, onRead }: { story: StoryState; onRead: (id: string) => void }) {
  const [reading, setReading] = useState<string | null>(null);
  const selected = storyEvents.find((event) => event.id === reading && story.deliveredIds.includes(event.id));
  const unread = story.deliveredIds.filter((id) => !story.readIds.includes(id)).length;
  return <section className="storyLog panel" id="communications" tabIndex={-1} aria-label="通信ログ">
    <div className="panelTitle"><span>COMMUNICATION LOG</span><span role="status">未読 {unread} 件</span></div>
    <div className="storyEntries">{story.deliveredIds.map((id, index) => {
      const event = storyEvents.find((event) => event.id === id)!;
      const read = story.readIds.includes(id);
      return <article className="storyEntry" key={id}>
        <small>受信 {index + 1} · {event.sender} · {read ? "既読" : "未読"}</small>
        <h3>{event.title}</h3><p>{event.body}</p>
        <button disabled={read} onClick={() => onRead(id)}>{read ? "既読" : "既読にする"}</button>
        <button onClick={() => setReading(id)}>会話で読む</button>
      </article>;
    })}</div>
    {selected && <VisualNovel key={selected.id} title={selected.title} pages={selected.body.split(/(?<=。)/).filter(Boolean).map((text) => ({ speaker: selected.sender, text, scene: "terminal" }))} closeLabel="通信を閉じる" onClose={(finished) => { if (finished) onRead(selected.id); setReading(null); }} />}
  </section>;
}
