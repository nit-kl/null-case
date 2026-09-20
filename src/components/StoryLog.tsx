import { storyEvents, type StoryState } from "@/game/story/storyEngine";

export function StoryLog({ story, onRead }: { story: StoryState; onRead: (id: string) => void }) {
  const unread = story.deliveredIds.filter((id) => !story.readIds.includes(id)).length;
  return <section className="storyLog panel" aria-label="通信ログ">
    <div className="panelTitle"><span>COMMUNICATION LOG</span><span role="status">未読 {unread} 件</span></div>
    <div className="storyEntries">{story.deliveredIds.map((id, index) => {
      const event = storyEvents.find((event) => event.id === id)!;
      const read = story.readIds.includes(id);
      return <article className="storyEntry" key={id}>
        <small>受信 {index + 1} · {event.sender} · {read ? "既読" : "未読"}</small>
        <h3>{event.title}</h3><p>{event.body}</p>
        <button disabled={read} onClick={() => onRead(id)}>{read ? "既読" : "既読にする"}</button>
      </article>;
    })}</div>
  </section>;
}
