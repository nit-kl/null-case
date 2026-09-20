"use client";
import { useEffect, useRef } from "react";
import { advanceConversation, answerConversation, characters, initialProgress, type ConversationScene, type ConversationSave } from "@/game/story/conversations";
import type { SourceId } from "@/game/data-sources/DataSourceAdapter";

export function StoryRoom({ scenes, state, onChange, onInvestigate, notice, ending }: {
  scenes: ConversationScene[]; state: ConversationSave; onChange: (value: ConversationSave) => void;
  onInvestigate: (source?: SourceId) => void; notice: string; ending?: { title: string; body: string };
}) {
  const scene = scenes.find((scene) => scene.id === state.active) ?? scenes[0];
  const progress = state.progress[scene.id] ?? initialProgress();
  const beat = scene.beats[progress.index];
  const answer = beat.choices?.find((choice) => choice.id === progress.answers[progress.index]);
  const character = characters[scene.character];
  const heading = useRef<HTMLHeadingElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const last = progress.index === scene.beats.length - 1;
  const update = (value: typeof progress) => onChange({ ...state, active: scene.id, progress: { ...state.progress, [scene.id]: value } });
  useEffect(() => { heading.current?.focus(); }, [scene.id]);
  return <section className="storyRoom" aria-label="会話パート">
    <div className="storyChapter"><span>{scene.chapter}</span><span>{scene.location}</span></div>
    <section className="conversationStage" aria-label="人物との会話">
      <div className="characterStage">
        <img src={character.image} alt={`${character.name}の立ち絵`} width="1024" height="1536" fetchPriority="high" />
        <div className="characterIdentity"><small>{character.role}</small><strong>{character.name}</strong><span>REMOTE INTERVIEW</span></div>
      </div>
      <div className="conversationBody">
        <h1 ref={heading} tabIndex={-1}>{scene.title}</h1>
        <p className="conversationPosition">{progress.index + 1} / {scene.beats.length} · {progress.completed ? "読了・再読中" : "聞き取り中"}</p>
        <div className="spokenLine" aria-live="polite" aria-atomic="true"><strong>{answer ? answer.reply.split("：")[0] : beat.speaker}</strong><p>{beat.ending ? ending?.body : answer ? answer.reply.slice(answer.reply.indexOf("：") + 1) : beat.text}</p></div>
        {beat.choices && !answer && <div className="conversationChoices" role="group" aria-label="質問を選ぶ">{beat.choices.map((choice) => <button key={choice.id} onClick={() => { update(answerConversation(scene, progress, choice.id)); requestAnimationFrame(() => next.current?.focus()); }}>{choice.label}</button>)}</div>}
        <div className="conversationActions">
          <button disabled={progress.index === 0} onClick={() => update({ ...progress, index: progress.index - 1 })}>前の会話</button>
          <button ref={next} disabled={!!beat.choices && !answer} className="nextConversation" onClick={() => { update(advanceConversation(scene, progress)); if (last) onInvestigate(scene.destination); }}>{last ? "会話を終えて調査へ" : "次の会話"}</button>
          {answer && <button onClick={() => { const answers = { ...progress.answers }; delete answers[progress.index]; update({ ...progress, completed: false, answers }); }}>質問を選び直す</button>}
        </div>
        <button className="leaveConversation" onClick={() => onInvestigate()}>{scene.id === "arrival" ? "捜査を開始する" : "捜査端末へ"}</button>
        <p className="conversationHint">途中で端末へ移っても、会話は続きから再開できます。質問の選択は推理の採点に影響しません。</p>
        <details className="characterBacklog"><summary>会話バックログ</summary><ol>{scene.beats.slice(0, progress.index + 1).map((line, index) => {
          const reply = line.choices?.find((choice) => choice.id === progress.answers[index]);
          return <li key={index}><strong>{line.speaker}</strong><p>{line.ending ? ending?.body : line.text}</p>{reply && <><p>あなた：{reply.label}</p><p>{reply.reply}</p></>}</li>;
        })}</ol></details>
      </div>
    </section>
    <section className="conversationLibrary" aria-label="聞き取り一覧"><h2>人物と話す</h2><p>証拠を登録すると、新しい話題が届きます。未解放の話題の内容は表示しません。</p>
      <div className="conversationCards">{scenes.map((item) => <button key={item.id} aria-pressed={item.id === scene.id} onClick={() => { onChange({ ...state, active: item.id }); heading.current?.scrollIntoView({ block: "start" }); }}>
        <img src={characters[item.character].image} alt="" width="80" height="96" loading="lazy" />
        <span><small>{characters[item.character].name} · {state.progress[item.id]?.completed ? "読了" : "未読"}</small><strong>{item.title}</strong></span>
      </button>)}</div>
    </section>
    {notice && <p role="status" className="conversationNotice">{notice}</p>}
  </section>;
}
