const team = [
  { name: "Joe Whyte", role: "Founder, Red Wagon Growth Marketing Agency", bio: "Agency owner and marketing technologist who builds the tools his own clients need — SearchAuditPro included — when nothing on the market fits how real agency work actually gets done.", initials: "JW" },
];

const values = [
  { icon: "🎯", title: "Data over guesswork", desc: "Every feature we build is grounded in real data. We integrate the best data sources so you never have to guess." },
  { icon: "🚀", title: "Speed matters", desc: "SEO moves fast. Our platform delivers real-time insights so you can act before your competitors even notice the change." },
  { icon: "🤝", title: "Built for agencies", desc: "We've worked inside SEO agencies. We know the pain. SearchAuditPro is designed around real agency workflows." },
  { icon: "🔒", title: "Privacy first", desc: "Your client data is yours. We never sell analytics data, and all data is encrypted at rest and in transit." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "#f8fafc" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1a2d47 60%,#1e429f 100%)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 20, letterSpacing: -1 }}>
            Built by SEOs, for SEOs
          </h1>
          <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.7 }}>
            We started SearchAuditPro because we were frustrated with fragmented tools, expensive data, and dashboards that didn't match how real SEO work gets done. So we built something better.
          </p>
        </div>
      </section>

      {/* Story */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Our Story</h2>
            <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
              SearchAuditPro is built and run by{" "}
              <a href="https://redwagon.agency/arizona/" target="_blank" rel="noopener noreferrer" style={{ color: "#1a56db" }}>
                Red Wagon Growth Marketing Agency
              </a>
              , a working marketing agency. We built it because the audit and reporting tools on the market were either too expensive, too limited, or didn't match how real agency work actually gets done — and none of them tracked what's becoming one of the fastest-growing channels in search: AI-generated answers.
            </p>
            <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.8, marginBottom: 16 }}>
              It started as an internal tool to run Red Wagon's own client audits — including the Arizona-market campaigns Red Wagon runs for local businesses across the state — and grew into a platform other agencies and in-house teams can use too.
            </p>
            <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.8 }}>
              It's still in active development, with new modules (LLM visibility tracking, autonomous link development, and more) shipping regularly.
            </p>
          </div>
          <div style={{ background: "linear-gradient(135deg,#1a56db14,#06b6d414)", border: "1px solid #e2e8f0", borderRadius: 16, padding: 40, textAlign: "center" }}>
            {[
              { value: "200+", label: "SEO Checks" },
              { value: "100+", label: "Directories Audited" },
              { value: "6", label: "Core Modules" },
              { value: "2026", label: "In Active Development" },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: "#1a56db" }}>{s.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ background: "#ffffff", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 48 }}>What We Stand For</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28 }}>
            {values.map(v => (
              <div key={v.title} style={{ textAlign: "center", padding: 24 }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{v.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 48 }}>Who Built This</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, maxWidth: 360, margin: "0 auto" }}>
          {team.map(member => (
            <div key={member.name} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 28 }}>
              <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#1a56db,#06b6d4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, marginBottom: 16 }}>
                {member.initials}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{member.name}</h3>
              <p style={{ fontSize: 13, color: "#1a56db", fontWeight: 600, marginBottom: 12 }}>{member.role}</p>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{member.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
