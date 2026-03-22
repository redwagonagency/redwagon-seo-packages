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
  const business = local?.business ?? null;
  const localKeywords = local?.keywords ?? [];
  const businessDetails = local?.businessDetails ?? null;
  const questionsAndAnswers = local?.questionsAnswers ?? [];
  const enhancedRankings = local?.localRankings ?? [];

  const rankingRows = enhancedRankings.length > 0
    ? enhancedRankings.map((row) => ({
        keyword: row.keyword,
        area: row.location || project?.location || "Target Area",
        position: row.position,
        rating: businessDetails?.rating ?? business?.rating ?? null,
        reviews: businessDetails?.reviewCount ?? business?.reviews ?? null,
        found: row.position !== null,
        title: row.title,
        url: row.url,
      }))
    : localKeywords.map((row) => ({
        keyword: row.keyword,
        area: project?.location || "Target Area",
        position: row.position,
        rating: row.rating,
        reviews: row.reviews,
        found: row.found,
        title: null,
        url: null,
      }));

  const gridCells = Array.from({ length: 25 }, (_, index) => {
    const rowIndex = Math.floor(index / 5);
    const colIndex = index % 5;
    const rankData = rankingRows[index] ?? null;
    const areaCode = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
    return { areaCode, rankData };
  });

  const getBubbleTone = (position: number | null) => {
    if (position === null) return { bg: "#e2e8f0", fg: "#475569" };
    if (position <= 3) return { bg: "#dcfce7", fg: "#166534" };
    if (position <= 10) return { bg: "#fef3c7", fg: "#92400e" };
    return { bg: "#fee2e2", fg: "#991b1b" };
  };

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Local SEO</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Track your local pack presence and Google Business Profile data</p>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18, marginBottom: 28 }}>
            {[
              { label: "Business Position", value: business?.position !== null && business?.position !== undefined ? `#${business.position}` : "—", color: "#d97706" },
              { label: "Google Rating", value: businessDetails?.rating !== null && businessDetails?.rating !== undefined ? `${businessDetails.rating}★` : business?.rating !== null && business?.rating !== undefined ? `${business.rating}★` : "—", color: "#f59e0b" },
              { label: "Keywords Found", value: local?.summary ? `${local.summary.foundCount}/${local.summary.trackedCount}` : "—", color: "#1a56db" },
              { label: "Avg Keyword Position", value: local?.summary?.avgPosition !== null && local?.summary?.avgPosition !== undefined ? `#${local.summary.avgPosition}` : "—", color: "#10b981" },
            ].map(s => (
              <div key={s.label} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 22px" }}>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{String(s.value)}</p>
              </div>
            ))}
          </div>

          {/* Details card */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Business Details from Google</h3>
              {!business || !business.found ? (
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
                    { label: "Business Name", value: businessDetails?.businessName ?? project?.name },
                    { label: "Address", value: businessDetails?.address ?? business.address ?? "Not available" },
                    { label: "Phone", value: businessDetails?.phone ?? business.phone ?? "Not available" },
                    { label: "Local Pack Position", value: business.position !== null ? `#${business.position}` : "Not in pack" },
                    { label: "Star Rating", value: businessDetails?.rating !== null && businessDetails?.rating !== undefined ? `${businessDetails.rating} / 5.0` : business.rating !== null ? `${business.rating} / 5.0` : "—" },
                    { label: "Review Count", value: businessDetails?.reviewCount !== null && businessDetails?.reviewCount !== undefined ? businessDetails.reviewCount.toLocaleString() : business.reviews !== null ? business.reviews.toLocaleString() : "—" },
                    { label: "Verified Profile", value: businessDetails?.verified ? "Yes" : "No" },
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

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Google Q&A</h3>
                {questionsAndAnswers.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>No Q&A data found yet for this profile.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 300, overflowY: "auto" }}>
                    {questionsAndAnswers.slice(0, 8).map((item, index) => (
                      <div key={`${item.question}-${index}`} style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>{item.question || "Untitled question"}</p>
                        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{item.answerCount} answers</p>
                        {item.topAnswer && (
                          <p style={{ fontSize: 12, color: "#334155" }}>
                            Top answer: {item.topAnswer}
                            {item.topAnswerAuthor ? ` (${item.topAnswerAuthor})` : ""}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Local Falcon-Style Grid</h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>5x5 area map</span>
              </div>
              {rankingRows.length === 0 ? (
                <div style={{ padding: "28px 22px", color: "#94a3b8", fontSize: 13 }}>
                  Run a report to generate local ranking bubbles for each area.
                </div>
              ) : (
                <div style={{ padding: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
                    {gridCells.map((cell) => {
                      const tone = getBubbleTone(cell.rankData?.position ?? null);
                      return (
                        <div key={cell.areaCode} style={{ border: "1px solid #e2e8f0", borderRadius: 10, minHeight: 74, padding: 8, background: "#f8fafc", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{cell.areaCode}</div>
                          <div style={{ alignSelf: "center", minWidth: 32, height: 32, borderRadius: 999, background: tone.bg, color: tone.fg, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {cell.rankData?.position !== null && cell.rankData ? `#${cell.rankData.position}` : "-"}
                          </div>
                          <div style={{ fontSize: 10, color: "#475569", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {cell.rankData?.keyword ?? "No keyword"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: "#475569" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 999, background: "#dcfce7", display: "inline-block" }} /> Top 3</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 999, background: "#fef3c7", display: "inline-block" }} /> Top 10</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 999, background: "#fee2e2", display: "inline-block" }} /> 11+</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Local Rankings Table</h3>
              <span style={{ fontSize: 12, color: "#64748b" }}>{rankingRows.length} tracked keywords</span>
            </div>
            {rankingRows.length === 0 ? (
              <div style={{ padding: "28px 22px", color: "#94a3b8", fontSize: 13 }}>
                Add local keywords in Rank Tracking or Project settings, then run a report to populate map rankings.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Keyword", "Area", "Map Position", "Rating", "Reviews", "Found"].map((col) => (
                        <th key={col} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rankingRows.map((row, index) => (
                      <tr key={`${row.keyword}-${index}`} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "11px 16px", fontSize: 14, color: "#0f172a", fontWeight: 600 }}>{row.keyword}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>{row.area}</td>
                        <td style={{ padding: "11px 16px", fontSize: 14, color: row.position !== null ? "#d97706" : "#94a3b8", fontWeight: 700 }}>
                          {row.position !== null ? `#${row.position}` : "Not found"}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>{row.rating !== null ? `${row.rating}★` : "—"}</td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>{row.reviews !== null ? row.reviews.toLocaleString() : "—"}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: row.found ? "#166534" : "#991b1b", background: row.found ? "#dcfce7" : "#fee2e2", padding: "3px 8px", borderRadius: 99 }}>
                            {row.found ? "Found" : "Missing"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
