"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NewProjectModal from "@/components/dashboard/NewProjectModal";

interface ReportSnap {
  siteScore: number | null;
  avgPosition: number | null;
  top10Count: number | null;
  status: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  domain: string;
  location: string;
  createdAt: string;
  reportSnapshots: ReportSnap[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleModalClose = () => {
    setShowModal(false);
    fetchProjects();
  };

  if (loading) {
    return (
      <div style={{ padding: "32px 36px" }}>
        <div style={{ height: 32, width: 160, background: "#e2e8f0", borderRadius: 8, marginBottom: 36 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, height: 200 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 36px" }}>
      {showModal && <NewProjectModal onClose={handleModalClose} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Projects</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: "#1a56db", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div style={{ background: "#ffffff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "80px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Create your first project</h2>
          <p style={{ fontSize: 15, color: "#64748b", maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Projects let you track a website&apos;s SEO performance. Add your domain, target keywords, and up to 5 competitor domains.
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: "#1a56db", color: "#fff", border: "none", padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Create Project
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {projects.map((project) => {
            const snap = project.reportSnapshots?.[0];
            return (
              <div key={project.id} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#1a56db14,#06b6d414)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🌐</div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{project.name}</h3>
                    <p style={{ fontSize: 13, color: "#64748b" }}>{project.domain}</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "SEO Score", value: snap?.siteScore != null ? `${snap.siteScore}` : "—" },
                    { label: "Avg Position", value: snap?.avgPosition != null ? `#${snap.avgPosition}` : "—" },
                    { label: "Top 10 Keywords", value: snap?.top10Count != null ? `${snap.top10Count}` : "—" },
                    { label: "Reports Run", value: project.reportSnapshots?.length > 0 ? `${project.reportSnapshots.length}` : "0" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{s.label}</p>
                      <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                {snap && (
                  <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>
                    Last report: {new Date(snap.createdAt).toLocaleDateString()}
                    {snap.status !== "COMPLETE" && (
                      <span style={{ marginLeft: 8, background: snap.status === "RUNNING" ? "#fef3c7" : "#fef2f2", color: snap.status === "RUNNING" ? "#d97706" : "#dc2626", padding: "1px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                        {snap.status}
                      </span>
                    )}
                  </p>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <Link href={`/dashboard/site-audit?project=${project.id}`} style={{ flex: 1, background: "#1a56db14", color: "#1a56db", textAlign: "center", padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    Audit
                  </Link>
                  <Link href={`/dashboard/rank-tracking?project=${project.id}`} style={{ flex: 1, background: "#f1f5f9", color: "#374151", textAlign: "center", padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    Rankings
                  </Link>
                  <Link href={`/dashboard/backlinks?project=${project.id}`} style={{ flex: 1, background: "#f1f5f9", color: "#374151", textAlign: "center", padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    Links
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Add new project card */}
          <button
            onClick={() => setShowModal(true)}
            style={{ background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 14, padding: 24, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 200 }}
          >
            <div style={{ width: 44, height: 44, background: "#e2e8f0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>+</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}>Add New Project</span>
          </button>
        </div>
      )}
    </div>
  );
}
