import Link from "next/link";
import MarketingNav from "@/components/marketing/Navbar";
import MarketingFooter from "@/components/marketing/Footer";
import DomainSearch from "@/components/marketing/DomainSearch";

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const features = [
  { icon: "🔍", title: "On-Site SEO Audit", description: "Deep crawl with 200+ SEO checks. Identify broken links, missing meta tags, duplicate content, Core Web Vitals failures, and get prioritized fix recommendations.", color: "#1a56db" },
  { icon: "🔗", title: "Backlink Analysis", description: "Monitor your full backlink profile. Track referring domains, domain rating, anchor text, toxic links, and competitive gaps via DataForSEO's massive link index.", color: "#7c3aed" },
  { icon: "📈", title: "Rank Tracking", description: "Track keyword positions across Google and Bing. Monitor daily position changes, segment by device and location, compare competitors, get automated weekly reports.", color: "#0891b2" },
  { icon: "🤖", title: "LLM Visibility Tracking", description: "Track how often your brand appears in AI answers from Google AI Overviews, ChatGPT, Perplexity, and Gemini. Measure your AI share of voice.", color: "#059669" },
  { icon: "📍", title: "Local SEO & Citations", description: "Audit citations across 100+ directories, check NAP consistency, monitor Google Business Profile, and build new citations for maximum local search visibility.", color: "#d97706" },
  { icon: "📊", title: "GSC & GA4 Integration", description: "Connect Google Search Console and Analytics 4 for unified reporting. Impressions, clicks, conversions, and user behavior all in one dashboard.", color: "#e11d48" },
];

const stats = [
  { value: "50K+", label: "Active Users" },
  { value: "2M+", label: "Keywords Tracked" },
  { value: "500M+", label: "Backlinks Indexed" },
  { value: "99.9%", label: "Uptime SLA" },
];

const testimonials = [
  { name: "Sarah Mitchell", title: "SEO Director, Nexus Digital", quote: "SearchAuditPro transformed our agency. We went from managing 12 clients to 45 clients with the same team. The automated audits save us 20+ hours per week.", avatar: "SM" },
  { name: "James Rodriguez", title: "Head of Growth, TechVenture", quote: "The LLM visibility tracking is a game changer. We discovered our competitors were dominating AI answers and fixed it in 30 days. Our organic traffic is up 340%.", avatar: "JR" },
  { name: "Emily Chen", title: "Marketing Manager, RetailCo", quote: "Local SEO citation tracking finally makes sense. We found 47 inconsistent NAP listings killing our rankings. Fixed them all through the platform in one week.", avatar: "EC" },
];

export default function HomePage() {
  return (
    <div style={{ background: "#f8fafc" }}>
      <MarketingNav />

      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1a2d47 55%,#1e429f 100%)", padding: "100px 24px 90px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -200, width: 700, height: 700, background: "radial-gradient(circle,rgba(6,182,212,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 500, height: 500, background: "radial-gradient(circle,rgba(26,86,219,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: 24, padding: "6px 16px", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, background: "#06b6d4", borderRadius: "50%", display: "inline-block" }} />
            <span style={{ color: "#06b6d4", fontSize: 13, fontWeight: 600 }}>Trusted by 50,000+ SEO Professionals</span>
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 800, color: "#ffffff", lineHeight: 1.1, marginBottom: 20, letterSpacing: -1.5 }}>
            Find Out What&apos;s Holding{" "}
            <span style={{ background: "linear-gradient(135deg,#06b6d4,#1a56db)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Your Site Back
            </span>
          </h1>
          <p style={{ fontSize: 19, color: "#94a3b8", lineHeight: 1.7, marginBottom: 44, maxWidth: 600, margin: "0 auto 44px" }}>
            Enter your domain for a free instant SEO audit. Uncover issues, check your score, and see what competitors are doing better.
          </p>

          {/* Domain Search */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <DomainSearch />
            <div style={{ display: "flex", gap: 28 }}>
              {["No credit card required", "Results in seconds", "200+ SEO checks"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "#10b981" }}><CheckIcon /></span>
                  <span style={{ color: "#94a3b8", fontSize: 13 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
          {stats.map(s => (
            <div key={s.value} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#1a56db", letterSpacing: -1 }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "96px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ color: "#1a56db", fontWeight: 600, fontSize: 14, textTransform: "uppercase" as const, letterSpacing: 1 }}>Everything You Need</span>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: "#0f172a", marginTop: 8 }}>All-in-One SEO & Marketing Toolkit</h2>
            <p style={{ color: "#64748b", fontSize: 18, maxWidth: 560, margin: "16px auto 0", lineHeight: 1.6 }}>Powerful solutions built for agencies, enterprises, and marketers who demand real results.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {features.map(f => (
              <div key={f.title} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{f.description}</p>
                <Link href="/features" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: f.color, fontSize: 14, fontWeight: 600, textDecoration: "none", marginTop: 16 }}>
                  Learn more <ArrowRightIcon />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "96px 24px", background: "#0d1b2a" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ color: "#06b6d4", fontWeight: 600, fontSize: 14, textTransform: "uppercase" as const, letterSpacing: 1 }}>Simple Onboarding</span>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: "#ffffff", marginTop: 8 }}>Up and Running in Minutes</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
            {[
              { step: "01", title: "Connect Your Site", desc: "Add your domain and connect Google Search Console + GA4 with one-click OAuth." },
              { step: "02", title: "Run Audits", desc: "Our crawler automatically scans your site, backlinks, rankings, and local citations." },
              { step: "03", title: "Get Insights", desc: "Receive prioritized recommendations with estimated traffic impact for each fix." },
              { step: "04", title: "Track Progress", desc: "Monitor improvements monthly with automated reports sent to your inbox." },
            ].map(s => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, background: "rgba(26,86,219,0.2)", border: "2px solid rgba(26,86,219,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <span style={{ color: "#1a56db", fontWeight: 800, fontSize: 16 }}>{s.step}</span>
                </div>
                <h3 style={{ color: "#ffffff", fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section style={{ padding: "80px 24px", background: "#ffffff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>Connects With Your Entire Stack</h2>
          <p style={{ color: "#64748b", fontSize: 16, marginBottom: 48 }}>Seamless integrations with the tools you already use.</p>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, justifyContent: "center" }}>
            {["Google Search Console","Google Analytics 4","Google Business Profile","DataForSEO","Meta Ads","Bing Webmaster","Screaming Frog","Zapier","Semrush","Ahrefs"].map(i => (
              <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, color: "#334155" }}>{i}</div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "96px 24px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: "#0f172a" }}>Loved by SEO Teams Worldwide</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {testimonials.map(t => (
              <div key={t.name} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[1,2,3,4,5].map(i => <span key={i} style={{ color: "#f59e0b", fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ color: "#334155", fontSize: 15, lineHeight: 1.7, marginBottom: 24, fontStyle: "italic" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#1a56db,#06b6d4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{t.name}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section style={{ padding: "96px 24px", background: "#0d1b2a" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ color: "#06b6d4", fontWeight: 600, fontSize: 14, textTransform: "uppercase" as const, letterSpacing: 1 }}>Simple Pricing</span>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: "#ffffff", marginTop: 8 }}>Plans for Every Team</h2>
            <p style={{ color: "#94a3b8", fontSize: 18, marginTop: 12 }}>Start with a 14-day free trial. No credit card required.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
            {[
              { name: "Starter", price: "$99", features: ["5 Projects","50 Keywords","Monthly Site Audit","Backlink Monitoring","Local SEO Basics","Email Reports"], accent: "#1a56db", popular: false },
              { name: "Professional", price: "$249", features: ["25 Projects","500 Keywords","Weekly Audits","Full Backlink Suite","LLM Visibility Tracking","GSC + GA4 Integration","White-label Reports"], accent: "#06b6d4", popular: true },
              { name: "Agency", price: "$599", features: ["Unlimited Projects","5,000 Keywords","Daily Audits","Full Platform Access","Multi-tenant Teams","API Access","Priority Support"], accent: "#7c3aed", popular: false },
            ].map(p => (
              <div key={p.name} style={{ background: p.popular ? "rgba(26,86,219,0.15)" : "rgba(255,255,255,0.04)", border: `2px solid ${p.popular ? "#1a56db" : "rgba(255,255,255,0.1)"}`, borderRadius: 16, padding: 32, position: "relative" as const }}>
                {p.popular && <div style={{ position: "absolute" as const, top: -13, left: "50%", transform: "translateX(-50%)", background: "#1a56db", color: "#fff", padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" as const }}>MOST POPULAR</div>}
                <div style={{ color: "#94a3b8", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 24 }}>
                  <span style={{ color: "#ffffff", fontSize: 40, fontWeight: 800 }}>{p.price}</span>
                  <span style={{ color: "#64748b", fontSize: 14 }}>/mo</span>
                </div>
                <div style={{ marginBottom: 28 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ color: p.accent }}><CheckIcon /></span>
                      <span style={{ color: "#94a3b8", fontSize: 14 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" style={{ display: "block", textAlign: "center", background: p.popular ? "#1a56db" : "transparent", border: `2px solid ${p.accent}`, color: p.popular ? "#ffffff" : p.accent, padding: "12px 0", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href="/pricing" style={{ color: "#64748b", fontSize: 14, textDecoration: "none" }}>View full pricing comparison →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "96px 24px", background: "linear-gradient(135deg,#1a56db,#0891b2)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: "#ffffff", marginBottom: 16 }}>Get Started with SearchAuditPro Today</h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, marginBottom: 36, lineHeight: 1.6 }}>Join 50,000+ SEO professionals who trust SearchAuditPro to grow their organic traffic.</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <Link href="/register" style={{ background: "#ffffff", color: "#1a56db", padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>Start Your Free Trial</Link>
            <Link href="/contact" style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", color: "#ffffff", padding: "14px 32px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>Request a Demo</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
