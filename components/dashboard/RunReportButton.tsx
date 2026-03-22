"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  projectId: string;
  projectName: string;
  lastRunAt?: string | null;
}

export default function RunReportButton({ projectId, projectName, lastRunAt }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!tracking) {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/reports/progress?projectId=${encodeURIComponent(projectId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data) return;

        const percent = typeof data.percent === "number" ? data.percent : null;
        const crawledPages = typeof data.crawledPages === "number" ? data.crawledPages : null;
        const targetPages = typeof data.targetPages === "number" && data.targetPages > 0 ? data.targetPages : null;
        const pagesText = crawledPages !== null
          ? targetPages !== null
            ? ` - ${crawledPages}/${targetPages} pages`
            : ` - ${crawledPages} pages`
          : "";

        if (data.status === "RUNNING") {
          const phase = typeof data.phase === "string" ? data.phase : "Running";
          setStatus(`${phase}${percent !== null ? ` (${percent}%)` : ""}${pagesText}`);
          return;
        }

        if (data.status === "COMPLETE") {
          setStatus(`Complete${pagesText}`);
        } else if (data.status === "PARTIAL") {
          setStatus(`Partial results saved${pagesText}`);
        } else {
          setError(data.errorMessage ?? "Report failed");
        }

        setTracking(false);
        router.refresh();
      } catch {
        // Keep polling; transient network failures should not clear state.
      }
    };

    void poll();
    pollRef.current = window.setInterval(() => {
      void poll();
    }, 4000);

    return () => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [projectId, router, tracking]);

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

      setStatus("Report started in background (0%)");
      setTracking(true);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  const lastRunLabel = lastRunAt
    ? `Last run: ${new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }).format(new Date(lastRunAt))} UTC`
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
          disabled={loading || tracking}
          style={{
            background: loading || tracking ? "#374151" : "#1a56db",
            color: "#ffffff",
            border: "none",
            padding: "12px 22px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            cursor: loading || tracking ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "background 0.2s",
          }}
        >
          {loading || tracking ? (
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
