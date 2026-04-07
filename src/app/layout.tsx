import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "찐최저 — 나만의 실질 최저가",
  description: "카드 할인, 멤버십까지 반영한 진짜 최저가를 찾아드려요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
