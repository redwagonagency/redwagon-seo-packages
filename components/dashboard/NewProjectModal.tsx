"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  onClose: () => void;
}

export default function NewProjectModal({ onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("United States");
  const [keywords, setKeywords] = useState("");
  const [competitors, setCompetitors] = useState(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompetitorChange = (index: number, value: string) => {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const keywordList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const competitorList = competitors.map((c) => c.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          domain: domain.trim(),
          location: location.trim(),
          keywords: keywordList,
          competitors: competitorList,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create project");
        setLoading(false);
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600,
          maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Create New Project</h2>
            <p style={{ fontSize: 13, color: "#64748b" }}>Set up your domain, keywords, and competitors for tracking</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px 28px 28px" }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          {/* Project Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Project Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Business SEO"
              required
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Domain */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Your Domain <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourdomain.com"
              required
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Enter without https:// or www</p>
          </div>

          {/* Location */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Target Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="United States"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Keywords */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Target Keywords
            </label>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="seo agency, local seo services, best seo company..."
              rows={3}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Comma-separated. Used for rank tracking reports.</p>
          </div>

          {/* Competitor Domains */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Competitor Domains <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>(up to 5)</span>
            </label>
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.5 }}>
              Add your top competitors. We&apos;ll analyze their on-page health, domain authority, and compare them against yours every time you run a report.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {competitors.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", background: "#f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#64748b", flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    value={c}
                    onChange={(e) => handleCompetitorChange(i, e.target.value)}
                    placeholder={`competitor${i + 1}.com`}
                    style={{ flex: 1, padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: "11px 24px", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "11px 28px", border: "none", borderRadius: 8,
                background: loading ? "#93c5fd" : "#1a56db",
                color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Creating…
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
