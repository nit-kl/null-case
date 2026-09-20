"use client";

import { useEffect, useRef } from "react";
import { briefing } from "@/game/story/storyEngine";

export function BriefingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current!;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous !== document.body && previous.isConnected) previous.focus();
      else document.getElementById("investigation")?.focus();
    };
  }, [open]);

  return <dialog ref={dialog} className="briefing" aria-labelledby="briefing-title" aria-describedby="briefing-body" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <small>INVESTIGATION BRIEF / 001</small>
    <h1 id="briefing-title">{briefing.title}</h1>
    <p id="briefing-body">{briefing.body}</p><p className="quote">{briefing.quote}</p>
    <button autoFocus onClick={onClose}>捜査を開始する</button>
  </dialog>;
}
