import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import RunReportButton from "@/components/dashboard/RunReportButton";
import { parseBacklinks, type BacklinkEntry } from "@/lib/reports/types";

export default async function BacklinksPage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;

  const member = await prisma.tenantMember.findFirst({
    where: { userId },
    include: {
      tenant: {
        include: {
          projects: {
            include: {
              reportSnapshots: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const projects = member?.tenant?.projects ?? [];
  const project = projects[0] ?? null;
  const snapshot = project?.reportSnapshots?.[0] ?? null;

  const allLinks: BacklinkEntry[] = parseBacklinks(snapshot?.backlinksJson ?? null);
  const toxicLinks: BacklinkEntry[] = parseBacklinks(snapshot?.toxicLinksJson ?? null);

  const domainRank = snapshot?.domainRank ?? null;
  const backlinksTotal = snapshot?.backlinksTotal ?? null;
  const referringDomains = snapshot?.referringDomains ?? null;
  const spamScore = snapshot?.backlinksSpamScore ?? null;

  // Spam score color
  const spamColor = spamScore === null ? "#94a3b8"
    : spamScore > 60 ? "#ef4444"
    : spamScore > 40 ? "#f59e0b"
    : "#10b981";

  const drColor = domainRank === null ? "#94a3b8"
    : domainRank >= 60 ? "#10b981"
    : domainRank >= 30 ? "#f59e0b"
    : "#ef4444";

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Backlink Analysis</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Monitor your backlink profile and identify toxic links</p>
        </div>
        {project && (
          <RunReportButton projectId={project.id} projectName={project.name} lastRunAt={snapshot?.createdAt?.toString() ?? null} />
        )}
      </div>

      {projects.length === 0 ? (
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 16, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>No projects yet</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Create a project to start analyzing backlinks.</p>
          <Link href="/dashboard/projects" style={{ background: "#7c3aed", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Create Project
          </Link>
        </div>
      ) : (
        <>
          {/* Domain Rank Explainer Banner */}
          <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", borderRadius: 14, padding: "20px 28px", marginBottom: 28, display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ flexShrink: 0, textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: domainRank !== null ? "#a5b4fc" : "#64748b" }}>
                {domainRank ?? "—"}
              </div>
              <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 700, marginTop: 2 }}>DOMAIN RANK</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>What is Domain Rank?</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, maxWidth: 700 }}>
                Domain Rank (DR) is DataForSEO&apos;s authority score on a <strong style={{ color: "#a5b4fc" }}>0–100 scale</strong>, similar to Moz Domain Authority or Ahrefs DR.
                It measures the overall strength of your backlink profile. A higher score means more authoritative links pointing to your domain.
                {" "}<strong style={{ color: "#a5b4fc" }}>0–29</strong> = Low authority &bull; <strong style={{ color: "#a5b4fc" }}>30–59</strong> = Growing &bull; <strong style={{ color: "#a5b4fc" }}>60–100</strong> = Strong.
              </p>
            </div>
          </div>

          {/* Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
            {[
              { label: "Domain Rank", value: domainRank?.toString() ?? "—", sub: "DataForSEO DR (0–100)", color: drColor, icon: "⭐" },
              { label: "Total Backlinks", value: backlinksTotal?.toLocaleString() ?? "—", sub: "dofollow links tracked", color: "#1a56db", icon: "🔗" },
              { label: "Referring Domains", value: referringDomains?.toLocaleString() ?? "—", sub: "unique linking domains", color: "#7c3aed", icon: "🌐" },
              { label: "Toxic Links", value: toxicLinks.length > 0 ? toxicLinks.length.toString() : (snapshot ? "0" : "—"), sub: "spam score > 60", color: "#ef4444", icon: "⚠️" },
            ].map((card) => (
              <div key={card.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>{card.label}</span>
                  <span style={{ fontSize: 20 }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: card.color }}>{card.value}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
            {/* Backlink Table */}
            <div>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Backlink Profile</h3>
                  {allLinks.length > 0 && (
                    <span style={{ fontSize: 12, color: "#64748b" }}>{allLinks.length} links</span>
                  )}
                </div>
                {allLinks.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                      {snapshot ? "No backlinks found yet" : "Run a report to see your backlinks"}
                    </p>
                    <p style={{ fontSize: 13, color: "#94a3b8" }}>DataForSEO will analyse your full backlink profile</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["Source Domain", "Anchor Text", "DR", "Spam Score", "Type", "First Seen"].map((col) => (
                            <th key={col} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" as const }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allLinks.slice(0, 50).map((link, i) => (
                          <tr key={i} style={{ background: link.toxic ? "rgba(239,68,68,0.03)" : "transparent", borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {link.toxic && <span style={{ fontSize: 10, background: "#fef2f2", color: "#ef4444", padding: "2px 6px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>TOXIC</span>}
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#1a56db", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: 200, display: "block" }}>
                                  {link.domain}
                                </a>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                              {link.anchor || "—"}
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: link.domainRank >= 60 ? "#10b981" : link.domainRank >= 30 ? "#f59e0b" : "#ef4444" }}>
                              {link.domainRank}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, minWidth: 60 }}>
                                  <div style={{ height: "100%", borderRadius: 3, background: link.spamScore > 60 ? "#ef4444" : link.spamScore > 40 ? "#f59e0b" : "#10b981", width: `${link.spamScore}%` }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: link.spamScore > 60 ? "#ef4444" : link.spamScore > 40 ? "#f59e0b" : "#10b981" }}>
                                  {link.spamScore}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ fontSize: 11, background: link.dofollow ? "#f0fdf4" : "#f8fafc", color: link.dofollow ? "#16a34a" : "#64748b", padding: "3px 8px", borderRadius: 4, fontWeight: 600 }}>
                                {link.dofollow ? "dofollow" : "nofollow"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>
                              {link.firstSeen ? new Date(link.firstSeen).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {allLinks.length > 50 && (
                      <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
                        Showing 50 of {allLinks.length} links
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Toxic Links + Disavow */}
            <div>
              {/* Spam Score Explainer */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>🔬 Spam Score Explained</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 12 }}>
                  DataForSEO assigns every backlink a <strong>spam score (0–100)</strong> based on the linking domain&apos;s quality signals.
                </p>
                {[
                  { range: "0–40", label: "Safe", color: "#10b981", desc: "High-quality sites, good for SEO" },
                  { range: "41–60", label: "Review", color: "#f59e0b", desc: "Low-quality but not harmful" },
                  { range: "61–100", label: "Toxic", color: "#ef4444", desc: "Spam farms, link networks, harmful" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 40, flexShrink: 0, fontSize: 11, fontWeight: 700, color: row.color, background: `${row.color}14`, padding: "3px 6px", borderRadius: 4, textAlign: "center" as const }}>
                      {row.range}
                    </div>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: row.color }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}> — {row.desc}</span>
                    </div>
                  </div>
                ))}
                {spamScore !== null && (
                  <div style={{ marginTop: 16, padding: "12px 16px", background: `${spamColor}10`, border: `1px solid ${spamColor}30`, borderRadius: 8 }}>
                    <p style={{ fontSize: 13, color: spamColor, fontWeight: 600 }}>
                      Your avg spam score: {spamScore}/100
                    </p>
                    <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {spamScore > 60 ? "High risk — disavow toxic links asap" : spamScore > 40 ? "Moderate risk — review link sources" : "Your profile looks healthy"}
                    </p>
                  </div>
                )}
              </div>

              {/* Disavow List */}
              <div style={{ background: "#fff", border: toxicLinks.length > 0 ? "2px solid #ef4444" : "1px solid #e2e8f0", borderRadius: 14, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Disavow Tool</h3>
                  {toxicLinks.length > 0 && (
                    <span style={{ marginLeft: "auto", background: "#fef2f2", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>
                      {toxicLinks.length} toxic
                    </span>
                  )}
                </div>
                {toxicLinks.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                    {snapshot
                      ? "No toxic links detected. Your profile looks safe."
                      : "Run a report to detect toxic links."}
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>
                      We found <strong style={{ color: "#ef4444" }}>{toxicLinks.length} toxic links</strong> from {[...new Set(toxicLinks.map((t) => t.domain))].length} domains.
                      Download your disavow file and upload it to Google Search Console to tell Google to ignore these links.
                    </p>
                    <a
                      href={`/api/projects/disavow?projectId=${project?.id}`}
                      download
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        background: "#ef4444", color: "#fff", padding: "12px 0", borderRadius: 8,
                        fontSize: 14, fontWeight: 700, textDecoration: "none", marginBottom: 12,
                      }}
                    >
                      ⬇ Download disavow.txt
                    </a>
                    <p style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
                      In Google Search Console → Search traffic → Disavow links. Upload this file to protect your rankings.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
