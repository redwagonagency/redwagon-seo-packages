import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UnBoundKeyword — Keyword List Builder",
  description: "Discover, organize and build keyword lists with AI-powered insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
