import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NULL CASE — CASE 001",
  description: "複数のデータベースの矛盾から、存在しない事件を追うミステリーゲーム。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
