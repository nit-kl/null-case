"use client";
import data from "@/data/cases/case-001/onboarding.json";
import { VisualNovel } from "./VisualNovel";

export function BriefingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <VisualNovel title={data.title} pages={data.intro} closeLabel="捜査を開始する" onClose={onClose} /> : null;
}
