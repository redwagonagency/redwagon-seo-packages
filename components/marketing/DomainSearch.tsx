"use client";

import { useState, useRef } from "react";
import Link from "next/link";

type IssueResult = {
  severity: "critical" | "warning" | "info";
  text: string;
};

type DomainResult = {
  domain: string;
  score: number;
  title: string | null;
  reachable: boolean;
  hasSsl: boolean;
  loadTimeMs: number;
  issuesFound: number;
  issues: IssueResult[];
  hiddenIssues: number;
};

const severityColor = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#06b6d4",
};
const severityBg = {
  critical: "rgba(239,68,68,0.1)",
  warning: "rgba(245,158,11,0.1)",
  info: "rgba(6,182,212,0.1)",
};
const severityLabel = { critical: "Critical", warning: "Warning", info: "Info" };

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="50" y="46" textAnchor="middle" fill={color} fontSize="20" fontWeight="800">{score}</text>
      <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">/ 100</text>
    </svg>
  );
}

export default function DomainSearch() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DomainResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = domain.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
    if (!trimmed) { setError("Please enter a domain"); return; }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/domain-check?domain=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setResult(data);
      setShowModal(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Search Bar */}
      <form suppressHydrationWarning onSubmit={handleSubmit} style={{ display: "flex", gap: 0, maxWidth: 600, width: "100%", boxShadow: "0 4px 32px rgba(0,0,0,0.3)", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none" }}>🌐</span>
          <input
            ref={inputRef}
            type="text"
            value={domain}
            onChange={e => { setDomain(e.target.value); setError(""); }}
            placeholder="Enter your domain (e.g. example.com)"
            style={{ width: "100%", padding: "18px 16px 18px 48px", fontSize: 16, background: "rgba(255,255,255,0.07)", border: "none", color: "#ffffff", outline: "none", boxSizing: "border-box" }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ background: loading ? "#374151" : "#1a56db", color: "#ffffff", border: "none", padding: "18px 28px", fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer", whiteSpace: "nowrap", transition: "background 0.2s", minWidth: 160 }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Analyzing…
            </span>
          ) : "Free SEO Audit →"}
        </button>
      </form>
      {error && <p style={{ color: "#f87171", fontSize: 14, marginTop: 8 }}>{error}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Results Modal */}
      {showModal && result && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: "#0d1b2a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, width: "100%", maxWidth: 560, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
            {/* Modal Header */}
            <div style={{ background: "linear-gradient(135deg,#0d1b2a,#1a2d47)", padding: "28px 32px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: result.reachable ? "#10b981" : "#ef4444", display: "inline-block" }} />
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>{result.reachable ? "Site reachable" : "Site unreachable"}</span>
                    {result.hasSsl && <span style={{ color: "#10b981", fontSize: 12, background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>🔒 HTTPS</span>}
                  </div>
                  <h3 style={{ color: "#ffffff", fontSize: 20, fontWeight: 800, margin: 0 }}>{result.domain}</h3>
                  {result.title && <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{result.title}</p>}
                </div>
                <ScoreRing score={result.score} />
              </div>
            </div>

            {/* Teaser Issues */}
            <div style={{ padding: "24px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h4 style={{ color: "#ffffff", fontWeight: 700, fontSize: 15, margin: 0 }}>Issues Found</h4>
                <span style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>{result.issuesFound + result.hiddenIssues} total</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: severityBg[issue.severity], border: `1px solid ${severityColor[issue.severity]}22`, borderRadius: 10, padding: "12px 14px" }}>
                    <span style={{ color: severityColor[issue.severity], fontSize: 11, fontWeight: 700, background: `${severityColor[issue.severity]}20`, padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap", marginTop: 1 }}>{severityLabel[issue.severity]}</span>
                    <span style={{ color: "#e2e8f0", fontSize: 14 }}>{issue.text}</span>
                  </div>
                ))}

                {/* Blurred "locked" issues */}
                {result.hiddenIssues > 0 && (
                  <div style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, filter: "blur(6px)", userSelect: "none", pointerEvents: "none" }}>
                      {[...Array(Math.min(3, result.hiddenIssues))].map((_, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: "12px 14px" }}>
                          <span style={{ color: "#f87171", fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.2)", padding: "2px 8px", borderRadius: 99 }}>Critical</span>
                          <span style={{ color: "#e2e8f0", fontSize: 14 }}>Hidden SEO issue requiring attention</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ background: "rgba(13,27,42,0.9)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
                        <span style={{ color: "#ffffff", fontSize: 14, fontWeight: 700 }}>🔒 +{result.hiddenIssues} more issues hidden</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Load time badge */}
              {result.loadTimeMs > 0 && (
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 16px", flex: 1, textAlign: "center" }}>
                    <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Page Speed</div>
                    <div style={{ color: result.loadTimeMs > 3000 ? "#f59e0b" : "#10b981", fontWeight: 700, fontSize: 16 }}>{(result.loadTimeMs / 1000).toFixed(1)}s</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 16px", flex: 1, textAlign: "center" }}>
                    <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>SEO Score</div>
                    <div style={{ color: result.score >= 70 ? "#10b981" : result.score >= 40 ? "#f59e0b" : "#ef4444", fontWeight: 700, fontSize: 16 }}>{result.score}/100</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 16px", flex: 1, textAlign: "center" }}>
                    <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Full Report</div>
                    <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 16 }}>Free →</div>
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div style={{ padding: "0 32px 28px" }}>
              <div style={{ background: "linear-gradient(135deg,rgba(26,86,219,0.2),rgba(124,58,237,0.2))", border: "1px solid rgba(26,86,219,0.3)", borderRadius: 14, padding: "20px 24px", marginBottom: 16, textAlign: "center" }}>
                <p style={{ color: "#ffffff", fontWeight: 700, fontSize: 16, margin: "0 0 4px" }}>See your full SEO report — free</p>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 16px" }}>Sign up to unlock all {result.issuesFound + result.hiddenIssues} issues, backlink data, keyword rankings, and a full 200-point audit.</p>
                <Link
                  href={`/register?domain=${encodeURIComponent(result.domain)}`}
                  style={{ display: "block", background: "#1a56db", color: "#ffffff", padding: "14px 24px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", textAlign: "center" }}
                >
                  Create Free Account & See Report →
                </Link>
              </div>
              <p style={{ textAlign: "center", margin: 0 }}>
                <span style={{ color: "#475569", fontSize: 13 }}>Already have an account? </span>
                <Link href="/login" style={{ color: "#06b6d4", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
