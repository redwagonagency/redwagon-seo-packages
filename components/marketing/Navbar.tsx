"use client";

import Link from "next/link";
import { Fragment } from "react";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function MarketingNav() {
  return (
    <header style={{ background: "#0d1b2a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#1a56db,#06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 18, letterSpacing: -0.3 }}>SearchAudit<span style={{ color: "#06b6d4" }}>Pro</span></span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
            >{l.label}</Link>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/login" style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Login</Link>
          <Link href="/register" style={{ background: "#1a56db", color: "#fff", padding: "9px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Start Free Trial</Link>
        </div>
      </div>
    </header>
  );
}
