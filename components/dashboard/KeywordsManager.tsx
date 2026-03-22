"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Keyword {
  id: string;
  keyword: string;
  device: string;
  location: string;
}

interface Props {
  projectId: string;
  keywords: Keyword[];
  keywordLimit: number;
  plan: string;
}

type Tab = "add" | "gsc";

export default function KeywordsManager({ projectId, keywords, keywordLimit, plan }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("add");
  const [bulkText, setBulkText] = useState("");
  const [gscKeywords, setGscKeywords] = useState<string[]>([]);
  const [gscSelected, setGscSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [gscLoading, setGscLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const count = keywords.length;
  const isUnlimited = keywordLimit >= 9999;
  const pct = isUnlimited ? 0 : Math.round((count / keywordLimit) * 100);

  async function handleAdd() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const kws = bulkText
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (kws.length === 0) { setError("Enter at least one keyword"); setLoading(false); return; }

    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, keywords: kws }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to add keywords"); setLoading(false); return; }
    setSuccess(`Added ${data.added} keyword${data.added !== 1 ? "s" : ""}${data.skipped > 0 ? ` (${data.skipped} skipped — limit reached)` : ""}`);
    setBulkText("");
    setLoading(false);
    router.refresh();
  }

  async function handleGscLoad() {
    setGscLoading(true);
    setError(null);
    const res = await fetch(`/api/gsc/import?projectId=${projectId}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to load GSC data"); setGscLoading(false); return; }
    const existing = new Set(keywords.map((k) => k.keyword.toLowerCase()));
    const fresh = (data.keywords as string[]).filter((k) => !existing.has(k.toLowerCase()));
    setGscKeywords(fresh);
    setGscSelected(new Set(fresh.slice(0, Math.min(50, keywordLimit - count))));
    setGscLoading(false);
  }

  async function handleGscImport() {
    const kws = Array.from(gscSelected);
    if (kws.length === 0) { setError("Select at least one keyword"); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, keywords: kws }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to add keywords"); setLoading(false); return; }
    setSuccess(`Imported ${data.added} keyword${data.added !== 1 ? "s" : ""} from GSC`);
    setGscKeywords([]);
    setGscSelected(new Set());
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(trackerId: string) {
    setDeletingId(trackerId);
    await fetch("/api/keywords", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackerId }),
    });
    setDeletingId(null);
    router.refresh();
  }

  const toggleGsc = (kw: string) =>
    setGscSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });

  return (
    <>
      {/* Compact header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
              {count}
            </span>
            <span style={{ fontSize: 14, color: "#64748b" }}>
              / {isUnlimited ? "unlimited" : keywordLimit} keywords
              <span style={{ marginLeft: 8, fontSize: 12, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>
                {plan}
              </span>
            </span>
          </div>
          {!isUnlimited && (
            <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, width: 200 }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 3,
                  width: `${Math.min(pct, 100)}%`,
                  background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#10b981",
                  transition: "width 0.3s",
                }}
              />
            </div>
          )}
        </div>
        <button
          onClick={() => { setOpen(true); setError(null); setSuccess(null); }}
          style={{
            background: "#1a56db", color: "#fff", border: "none",
            padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          + Manage Keywords
        </button>
      </div>

      {/* Inline keyword list with delete */}
      {keywords.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Tracked Keywords</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{keywords.length} keyword{keywords.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {keywords.map((kw) => (
              <div key={kw.id} style={{ display: "flex", alignItems: "center", padding: "8px 20px", borderBottom: "1px solid #f8fafc", gap: 12 }}>
                <span style={{ flex: 1, fontSize: 13, color: "#0f172a" }}>{kw.keyword}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{kw.device}</span>
                <button
                  onClick={() => handleDelete(kw.id)}
                  disabled={deletingId === kw.id}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: deletingId === kw.id ? "#cbd5e1" : "#ef4444",
                    fontSize: 14, padding: "2px 6px",
                  }}
                  title="Remove keyword"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            {/* Header */}
            <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Manage Keywords</h2>
                <p style={{ fontSize: 13, color: "#64748b" }}>
                  {count} / {isUnlimited ? "unlimited" : keywordLimit} used on {plan} plan
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b" }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, margin: "20px 28px 0", borderBottom: "2px solid #f1f5f9" }}>
              {(["add", "gsc"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                  style={{
                    padding: "10px 16px", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
                    background: "none",
                    color: tab === t ? "#1a56db" : "#64748b",
                    borderBottom: tab === t ? "2px solid #1a56db" : "2px solid transparent",
                    marginBottom: -2,
                  }}
                >
                  {t === "add" ? "Add Keywords" : "Import from GSC"}
                </button>
              ))}
            </div>

            <div style={{ padding: "24px 28px 28px" }}>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#166534" }}>
                  ✓ {success}
                </div>
              )}

              {tab === "add" && (
                <>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Keywords (one per line or comma-separated)
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"seo agency london\nlocal seo services\nbest seo company uk"}
                    rows={8}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                  />
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>
                    Up to {isUnlimited ? "unlimited" : keywordLimit - count} more keyword{keywordLimit - count !== 1 ? "s" : ""} available
                  </p>
                  <button
                    onClick={handleAdd}
                    disabled={loading}
                    style={{
                      background: loading ? "#93c5fd" : "#1a56db", color: "#fff",
                      border: "none", padding: "11px 24px", borderRadius: 8,
                      fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Adding…" : "Add Keywords"}
                  </button>
                </>
              )}

              {tab === "gsc" && (
                <>
                  {gscKeywords.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Import from Google Search Console</p>
                      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                        Fetches your top 500 search queries from the last 90 days. Requires Google sign-in.
                      </p>
                      <button
                        onClick={handleGscLoad}
                        disabled={gscLoading}
                        style={{
                          background: "#fff", color: "#374151",
                          border: "1px solid #d1d5db", padding: "10px 20px",
                          borderRadius: 8, fontSize: 14, fontWeight: 600,
                          cursor: gscLoading ? "not-allowed" : "pointer",
                          display: "inline-flex", alignItems: "center", gap: 8,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        {gscLoading ? "Loading…" : "Load GSC Keywords"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <p style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                          {gscKeywords.length} new queries found — {gscSelected.size} selected
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setGscSelected(new Set(gscKeywords))} style={{ fontSize: 12, color: "#1a56db", background: "none", border: "none", cursor: "pointer" }}>
                            Select all
                          </button>
                          <button onClick={() => setGscSelected(new Set())} style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
                            Clear
                          </button>
                        </div>
                      </div>
                      <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 16 }}>
                        {gscKeywords.map((kw) => (
                          <label key={kw} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}>
                            <input
                              type="checkbox"
                              checked={gscSelected.has(kw)}
                              onChange={() => toggleGsc(kw)}
                              style={{ accentColor: "#1a56db" }}
                            />
                            <span style={{ fontSize: 13, color: "#0f172a" }}>{kw}</span>
                          </label>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={handleGscImport}
                          disabled={loading || gscSelected.size === 0}
                          style={{
                            background: loading ? "#93c5fd" : "#1a56db", color: "#fff",
                            border: "none", padding: "11px 24px", borderRadius: 8,
                            fontSize: 14, fontWeight: 600, cursor: loading || gscSelected.size === 0 ? "not-allowed" : "pointer",
                          }}
                        >
                          {loading ? "Importing…" : `Import ${gscSelected.size} Keyword${gscSelected.size !== 1 ? "s" : ""}`}
                        </button>
                        <button
                          onClick={() => { setGscKeywords([]); setGscSelected(new Set()); }}
                          style={{ background: "#f1f5f9", color: "#374151", border: "none", padding: "11px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}
                        >
                          Back
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
