import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SearchAudit Pro – Enterprise SEO Platform",
  description: "All-in-one SEO platform: site audits, backlink analysis, rank tracking, LLM visibility, and local SEO.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
