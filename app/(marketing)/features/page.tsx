export default function FeaturesPage() {
  const features = [
    {
      category: "Site Auditing",
      icon: "🔍",
      color: "#1a56db",
      items: [
        { name: "200+ SEO Checks", desc: "Comprehensive crawl of your entire site covering on-page, technical, and content issues." },
        { name: "Core Web Vitals", desc: "Monitor LCP, CLS, and FID scores with actionable improvement recommendations." },
        { name: "Broken Link Detection", desc: "Find and fix all 4xx and 5xx errors before they hurt your rankings." },
        { name: "Duplicate Content", desc: "Identify cannibalization issues and pages competing for the same keywords." },
        { name: "Schema Markup Validator", desc: "Ensure structured data is correctly implemented for rich results." },
        { name: "Crawl Scheduling", desc: "Run weekly or monthly automated audits and get email notifications on regressions." },
      ],
    },
    {
      category: "Backlink Analysis",
      icon: "🔗",
      color: "#7c3aed",
      items: [
        { name: "Full Backlink Profile", desc: "Explore every referring domain and page linking to your site via DataForSEO's 500M+ link index." },
        { name: "Domain Rating Tracking", desc: "Monitor your DR score over time and compare against competitors." },
        { name: "Toxic Link Detection", desc: "Identify and disavow harmful backlinks before they trigger a Google penalty." },
        { name: "Anchor Text Analysis", desc: "Visualize anchor distribution to spot over-optimization risks." },
        { name: "Link Gap Analysis", desc: "Find backlink opportunities your competitors have but you don't." },
        { name: "New & Lost Links", desc: "Get daily alerts when you gain or lose important backlinks." },
      ],
    },
    {
      category: "Rank Tracking",
      icon: "📈",
      color: "#0891b2",
      items: [
        { name: "Daily Position Updates", desc: "Check keyword rankings every day across Google and Bing." },
        { name: "SERP Feature Tracking", desc: "Monitor featured snippets, image packs, and local packs for your keywords." },
        { name: "Multi-Device & Location", desc: "Track rankings on desktop and mobile in any city, region, or country." },
        { name: "Competitor Comparison", desc: "Side-by-side ranking comparison against up to 10 competitors." },
        { name: "Automated Reports", desc: "Weekly PDF reports delivered to clients or stakeholders automatically." },
        { name: "Keyword Segmentation", desc: "Group keywords by topic, intent, funnel stage, or custom tags." },
      ],
    },
    {
      category: "LLM Visibility",
      icon: "🤖",
      color: "#059669",
      items: [
        { name: "AI Answer Monitoring", desc: "Track when your brand, products, or content appears in AI-generated answers." },
        { name: "Multi-Model Coverage", desc: "Monitor ChatGPT, Perplexity, Google AI Overviews, and Gemini simultaneously." },
        { name: "Share of Voice", desc: "Measure your AI visibility percentage vs. competitors across tracked queries." },
        { name: "Prompt Library", desc: "Build a library of queries to monitor your brand's AI presence over time." },
        { name: "Sentiment Analysis", desc: "Understand how AI models describe your brand — positively or negatively." },
        { name: "Citation Tracking", desc: "See which of your pages are being cited as sources by AI systems." },
      ],
    },
    {
      category: "Local SEO",
      icon: "📍",
      color: "#d97706",
      items: [
        { name: "Citation Audit", desc: "Check your business listing across 100+ directories for NAP consistency." },
        { name: "GBP Monitoring", desc: "Track your Google Business Profile performance: views, clicks, calls, and directions." },
        { name: "Citation Builder", desc: "Submit or update business listings to top directories from one dashboard." },
        { name: "Review Monitoring", desc: "Track reviews across Google, Yelp, and Facebook in real time." },
        { name: "Local Rank Tracking", desc: "Monitor keyword positions in local pack and maps results by city." },
        { name: "Competitor Citation Gap", desc: "Discover directories your local competitors are listed in that you're not." },
      ],
    },
    {
      category: "Analytics & Integrations",
      icon: "📊",
      color: "#e11d48",
      items: [
        { name: "Google Search Console", desc: "Import impressions, clicks, CTR, and position data directly from GSC." },
        { name: "Google Analytics 4", desc: "Connect GA4 for conversion tracking, user behavior, and traffic source data." },
        { name: "Unified Dashboard", desc: "View all your SEO KPIs in a single, customizable dashboard." },
        { name: "Custom Report Builder", desc: "Create branded PDF reports with the metrics that matter most to your clients." },
        { name: "API Access", desc: "Pull all data programmatically via our REST API for custom integrations." },
        { name: "Team Collaboration", desc: "Invite team members with role-based access controls (Admin, Editor, Viewer)." },
      ],
    },
  ];

  return (
    <div style={{ background: "#f8fafc" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1a2d47 60%,#1e429f 100%)", padding: "80px 24px 64px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: 24, padding: "6px 16px", marginBottom: 24 }}>
            <span style={{ color: "#06b6d4", fontSize: 13, fontWeight: 600 }}>Everything you need to dominate search</span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 20, letterSpacing: -1 }}>
            Powerful Features for Every SEO Workflow
          </h1>
          <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.7 }}>
            From technical audits to AI visibility tracking — SearchAuditPro has every tool your team needs to outrank the competition.
          </p>
        </div>
      </section>

      {/* Feature Categories */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px" }}>
        {features.map((cat) => (
          <div key={cat.category} style={{ marginBottom: 72 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
              <div style={{ width: 48, height: 48, background: `${cat.color}18`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                {cat.icon}
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{cat.category}</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {cat.items.map((item) => (
                <div key={item.name} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, background: cat.color, borderRadius: "50%" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{item.name}</h3>
                  </div>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg,#1a56db,#0891b2)", padding: "64px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: "#ffffff", marginBottom: 16 }}>Ready to try all these features?</h2>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 32 }}>Start your 14-day free trial. No credit card required.</p>
        <a href="/register" style={{ background: "#ffffff", color: "#1a56db", padding: "16px 36px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none", display: "inline-block" }}>
          Start Free Trial
        </a>
      </section>
    </div>
  );
}
