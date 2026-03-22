"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  projectId: string;
  projectName: string;
  lastRunAt?: string | null;
}

export default function RunReportButton({ projectId, projectName, lastRunAt }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    setStatus("Starting report…");

    try {
      const res = await fetch("/api/reports/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Report failed");
        return;
      }

      setStatus(data.status === "COMPLETE" ? "Complete!" : data.status === "PARTIAL" ? "Partial results saved" : "Done");
      // Refresh page to show new snapshot data
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const lastRunLabel = lastRunAt
    ? `Last run: ${new Date(lastRunAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
    : "No reports run yet";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {error && (
          <span style={{ color: "#ef4444", fontSize: 13 }}>{error}</span>
        )}
        {status && !error && !loading && (
          <span style={{ color: "#10b981", fontSize: 13 }}>✓ {status}</span>
        )}
        <button
          onClick={handleRun}
          disabled={loading}
          style={{
            background: loading ? "#374151" : "#1a56db",
            color: "#ffffff",
            border: "none",
            padding: "12px 22px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            cursor: loading ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "background 0.2s",
          }}
        >
          {loading ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Running Report…
            </>
          ) : (
            <>▶ Run Report for {projectName}</>
          )}
        </button>
      </div>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>{lastRunLabel}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
