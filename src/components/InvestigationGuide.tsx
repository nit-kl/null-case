import { tutorialData, tutorialStep, type TutorialState } from "@/game/story/onboarding";

export function InvestigationGuide({ state, discovered, registered, notice, onPrepare, onResults, onDismiss, onAccess }: {
  state: TutorialState; discovered: string[]; registered: string[]; notice: string;
  onPrepare: (query: string) => void; onResults: () => void; onDismiss: () => void; onAccess: () => void;
}) {
  const step = tutorialStep(state, discovered, registered);
  const content = tutorialData.steps[step];
  return <section className="investigationGuide" aria-label="はじめての捜査ガイド">
    <small>AID / 捜査支援</small>
    <div aria-live="polite" aria-atomic="true"><h2>{content.title}</h2><p>{content.text}</p></div>
    <div className="guideActions">
      {step === "rooms" && <button onClick={() => onPrepare(tutorialData.roomQuery)}>部屋の検索を準備</button>}
      {step === "notes" && <button onClick={() => onPrepare(tutorialData.noteQuery)}>運用メモの検索を準備</button>}
      {step === "register" && <><button onClick={onResults}>検索結果へ移動</button><button onClick={() => onPrepare(tutorialData.noteQuery)}>運用メモを再検索する準備</button></>}
      {step === "complete" && <button onClick={onAccess}>ACCESS DBへ進む</button>}
      <button onClick={onDismiss}>{step === "complete" ? "案内を終了する" : "案内をスキップして自由に調べる"}</button>
    </div>
    <small>入力例の準備だけでは検索されません。自分で実行し、結果を確認してください。案内は上部の「遊び方」から再表示できます。</small>
    {notice && <p role="status">{notice}</p>}
  </section>;
}
