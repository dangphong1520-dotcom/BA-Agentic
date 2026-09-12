import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BA Agent — Không gian làm việc",
  description: "Quản lý bối cảnh, workspace và dự án phân tích nghiệp vụ.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
