"use client";

import { useState } from "react";

type ProjectRequiredGateProps = {
  loading: boolean;
  hasProject: boolean;
  onProjectCreated?: () => void;
};

export default function ProjectRequiredGate({ loading, hasProject, onProjectCreated }: ProjectRequiredGateProps) {
  const [domain, setDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className="h-full p-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading your project context...
        </div>
      </div>
    );
  }

  if (hasProject) return null;

  async function createProject() {
    const clean = domain.trim();
    if (!clean) {
      setError("Enter a domain first");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: clean }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Unable to create project");
      setDomain("");
      onProjectCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full bg-[#f4f6f8] p-8 md:p-12">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 3h10l2 2v14l-2 2H7l-2-2V5l2-2z" />
            <path d="M9 9h6M9 13h6M9 17h4" />
          </svg>
        </div>

        <h1 className="text-center text-4xl font-black tracking-tight text-slate-900">
          Let&apos;s Grow Your Traffic
        </h1>
        <p className="mt-3 text-center text-sm text-slate-500">
          Create a project for your site to unlock keyword ideas, content ideas, traffic pages, and intent analysis.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-900">Target the right keywords</h2>
            <p className="text-xs leading-6 text-slate-500">
              Build focused keyword sets and discover high-intent terms tied to your domain.
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-900">Act on SEO opportunities</h2>
            <p className="text-xs leading-6 text-slate-500">
              Spot content gaps, ranking opportunities, and high-value keyword clusters quickly.
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-900">Monitor and track SEO health</h2>
            <p className="text-xs leading-6 text-slate-500">
              Keep traffic, keyword positions, and trend data in one project-centered workspace.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void createProject();
              }
            }}
            placeholder="Enter your domain (example.com)"
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#f15b27]"
          />
          <button
            type="button"
            onClick={() => void createProject()}
            disabled={submitting}
            className="rounded-lg bg-[#f15b27] px-6 py-3 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60"
          >
            {submitting ? "Creating..." : "CREATE PROJECT NOW"}
          </button>
        </div>

        {error ? <p className="mt-3 text-center text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
