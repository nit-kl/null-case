"use client";
import { useEffect, useId, useRef, useState } from "react";

export interface DialoguePage { speaker: string; text: string; scene: string; }
export function VisualNovel({ title, pages, closeLabel, onClose }: { title: string; pages: DialoguePage[]; closeLabel: string; onClose: (finished: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const titleId = useId();
  const current = pages[index];
  const last = index === pages.length - 1;
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = "hidden";
    return () => {
      element.close(); document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous !== document.body && previous.isConnected) previous.focus();
      else document.getElementById("investigation")?.focus();
    };
  }, []);
  return <dialog ref={dialog} className="briefing visualNovel" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(false); }}>
    <div className={`novelScene ${current.scene}`} aria-hidden="true">
      <div className="sceneCaption">{current.scene === "hotel" ? "HOTEL ARGOS" : "AID / SECURE CHANNEL"}</div>
      <div className="hotelFacade">{Array.from({ length: 15 }, (_, i) => <span key={i} />)}</div>
      <span className="sceneCase">CASE 001</span>
    </div>
    <div className="novelContent">
      <h1 id={titleId}>{title}</h1>
      <div className="dialogueText" aria-live="polite" aria-atomic="true"><strong>{current.speaker}</strong><p>{current.text}</p></div>
      <p className="dialogueProgress">{index + 1} / {pages.length} · 自動送りはありません</p>
      <div className="dialogueActions">
        <button disabled={index === 0} onClick={() => setIndex(index - 1)}>前の会話</button>
        <button autoFocus className="dialogueNext" onClick={() => { if (last) onClose(true); else { setIndex(index + 1); setFurthest(Math.max(furthest, index + 1)); } }}>{last ? closeLabel : "次の会話"}</button>
        {!last && <button onClick={() => onClose(false)}>{closeLabel}</button>}
      </div>
      {!last && <small>「{closeLabel}」またはEscで会話をスキップできます。</small>}
      <details className="dialogueBacklog"><summary>会話バックログ</summary><ol>{pages.slice(0, furthest + 1).map((page, i) => <li key={i}><strong>{page.speaker}</strong><p>{page.text}</p></li>)}</ol></details>
    </div>
  </dialog>;
}
