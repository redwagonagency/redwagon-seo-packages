import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RunReportButton from "@/components/dashboard/RunReportButton";
import { parseLocal } from "@/lib/reports/types";

export default async function LocalSeoPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: {
      tenant: {
        include: {
          projects: {
            include: {
              reportSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });

  const projects = member?.tenant?.projects ?? [];
  const project = projects[0] ?? null;
  const snapshot = project?.reportSnapshots?.[0] ?? null;
  const local = parseLocal(snapshot?.localJson ?? null);

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Local SEO</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Track your local pack presence and Google Business Profile data</p>
          <div style={{ marginTop: 10 }}>
            <Link href="/dashboard/local-seo/product-keywords" style={{ textDecoration: "none", border: "1px solid #fed7aa", background: "#fff7ed", color: "#c2410c", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700 }}>
              Open Product Keywords
            </Link>
          </div>
        </div>
        {project && (
          <RunReportButton
            projectId={project.id}
            projectName={project.name}
            lastRunAt={snapshot?.createdAt?.toString() ?? null}
          />
        )}
      </div>

      {projects.length === 0 ? (
        <div style={{ background: "#ffffff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>No projects yet</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Create a project first to track local SEO.</p>
          <Link href="/dashboard/projects" style={{ background: "#d97706", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Create Project
          </Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28 }}>
            {[
              { label: "Local Pack Position", value: local?.position !== null && local?.position !== undefined ? `#${local.position}` : "—", color: "#d97706" },
              { label: "Google Rating", value: local?.rating !== null && local?.rating !== undefined ? `${local.rating}★` : "—", color: "#f59e0b" },
              { label: "Reviews", value: local?.reviews !== null && local?.reviews !== undefined ? local.reviews.toLocaleString() : "—", color: "#1a56db" },
              { label: "Found in Pack", value: local ? (local.found ? "Yes" : "No") : "—", color: local?.found ? "#10b981" : "#ef4444" },
            ].map(s => (
              <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 22px" }}>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{String(s.value)}</p>
              </div>
            ))}
          </div>

          {/* Details card */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Business Details from Google</h3>
              {!local || !local.found ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    {snapshot ? "Business not found in local pack" : "Run a report to check local presence"}
                  </p>
                  <p style={{ fontSize: 12, color: "#94a3b8" }}>
                    {snapshot
                      ? `We searched for "${project?.name}" in ${project?.location} but didn't find a match in the local pack. Verify your business name matches Google exactly.`
                      : "Click \"Run Report\" above."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "Business Name", value: project?.name },
                    { label: "Address", value: local.address ?? "Not available" },
                    { label: "Phone", value: local.phone ?? "Not available" },
                    { label: "Local Pack Position", value: local.position !== null ? `#${local.position} of 3` : "Not in pack" },
                    { label: "Star Rating", value: local.rating !== null ? `${local.rating} / 5.0` : "—" },
                    { label: "Review Count", value: local.reviews !== null ? local.reviews.toLocaleString() : "—" },
                    { label: "Target Location", value: project?.location ?? "United States" },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid #f8fafc" }}>
                      <span style={{ fontSize: 13, color: "#64748b" }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{String(row.value ?? "—")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* How it works */}
              <div style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)", borderRadius: 14, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>📍 How Local SEO is Checked</h3>
                <ul style={{ fontSize: 13, color: "#64748b", lineHeight: 2, paddingLeft: 18 }}>
                  <li>Searches Google for &quot;Business Name + Location&quot;</li>
                  <li>Extracts local pack position (1, 2, or 3)</li>
                  <li>Retrieves star rating and review count</li>
                  <li>Records address and phone from the listing</li>
                </ul>
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
                  Data powered by SerpAPI live Google results. Run a report to refresh.
                </p>
              </div>

              {/* Report history */}
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Report History</h3>
                {!snapshot ? (
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>No reports yet</p>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{new Date(snapshot.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                    <span style={{ fontSize: 12, color: snapshot.status === "COMPLETE" ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{snapshot.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
