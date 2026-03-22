import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer style={{ background: "#0d1b2a", borderTop: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", paddingTop: 64, paddingBottom: 32 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          <div>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#1a56db,#06b6d4)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 16 }}>SearchAudit<span style={{ color: "#06b6d4" }}>Pro</span></span>
            </Link>
            <p style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 280 }}>Enterprise-grade SEO tools for agencies, marketers, and growing businesses. Powered by DataForSEO.</p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {["twitter","linkedin","facebook","youtube"].map(s => (
                <div key={s} style={{ width: 34, height: 34, background: "rgba(255,255,255,0.06)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <span style={{ color: "#94a3b8", fontSize: 12, textTransform: "capitalize" }}>{s[0].toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: "#ffffff", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Product</h4>
            {["Features","Pricing","Integrations","API Docs","Changelog"].map(l => (
              <div key={l} style={{ marginBottom: 10 }}><Link href="/features" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>{l}</Link></div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "#ffffff", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Solutions</h4>
            {["SEO Agencies","Enterprise","Freelancers","Local Business","eCommerce"].map(l => (
              <div key={l} style={{ marginBottom: 10 }}><Link href="/features" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>{l}</Link></div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "#ffffff", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Company</h4>
            {[["About","about"],["Blog","blog"],["Contact","contact"],["Careers","contact"],["Press","contact"]].map(([l,h]) => (
              <div key={l} style={{ marginBottom: 10 }}><Link href={`/${h}`} style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>{l}</Link></div>
            ))}
          </div>
          <div>
            <h4 style={{ color: "#ffffff", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Legal</h4>
            {[["Privacy Policy","/privacy"],["Terms of Service","/terms"],["Do Not Sell","/donotsell"],["Cookie Policy","/privacy"]].map(([l,h]) => (
              <div key={l} style={{ marginBottom: 10 }}><Link href={h} style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>{l}</Link></div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 13 }}>© 2026 SearchAuditPro. All rights reserved.</p>
          <p style={{ fontSize: 13 }}>Made with ♥ for SEO professionals worldwide</p>
        </div>
      </div>
    </footer>
  );
}
