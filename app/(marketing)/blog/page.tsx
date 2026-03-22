const posts = [
  {
    slug: "llm-visibility-seo-2026",
    category: "LLM & AI Search",
    title: "LLM Visibility in 2026: Why Your Brand Needs an AI Search Strategy",
    excerpt: "AI-generated answers are now appearing for over 40% of search queries. Here's how to measure and improve your brand's presence in AI answers.",
    author: "Marcus Webb",
    date: "March 15, 2026",
    readTime: "8 min read",
    featured: true,
  },
  {
    slug: "core-web-vitals-update-2026",
    category: "Technical SEO",
    title: "Google's Core Web Vitals Update: What Changed and How to Adapt",
    excerpt: "Google rolled out a significant update to its Core Web Vitals thresholds. We analyzed 10,000 sites to understand the real-world impact.",
    author: "Priya Nair",
    date: "March 10, 2026",
    readTime: "12 min read",
    featured: false,
  },
  {
    slug: "local-seo-google-business-profile",
    category: "Local SEO",
    title: "Google Business Profile in 2026: The Complete Optimization Guide",
    excerpt: "GBP has changed dramatically with new AI features. Here's everything you need to know to maximize your local search visibility.",
    author: "Ana Torres",
    date: "March 5, 2026",
    readTime: "10 min read",
    featured: false,
  },
  {
    slug: "backlink-analysis-dataforseo",
    category: "Link Building",
    title: "How to Conduct a Professional Backlink Audit (Step-by-Step)",
    excerpt: "A comprehensive guide to auditing your backlink profile, identifying toxic links, and building a clean, authoritative link portfolio.",
    author: "David Kim",
    date: "Feb 28, 2026",
    readTime: "15 min read",
    featured: false,
  },
  {
    slug: "rank-tracking-best-practices",
    category: "Rank Tracking",
    title: "Rank Tracking Best Practices: What Most Agencies Get Wrong",
    excerpt: "Tracking keyword rankings sounds simple but most agencies make critical mistakes that lead to misleading reports. Here's how to do it right.",
    author: "Liam O'Brien",
    date: "Feb 20, 2026",
    readTime: "7 min read",
    featured: false,
  },
  {
    slug: "site-audit-agency-workflow",
    category: "Site Audits",
    title: "How Top Agencies Run Site Audits at Scale (Without Burning Out)",
    excerpt: "Running monthly audits for 50+ clients is only possible with the right workflow. Here's the exact process our most successful agency customers use.",
    author: "Fatima Hassan",
    date: "Feb 14, 2026",
    readTime: "9 min read",
    featured: false,
  },
];

const categories = ["All Posts", "Technical SEO", "LLM & AI Search", "Local SEO", "Link Building", "Rank Tracking", "Site Audits", "Agency Growth"];

export default function BlogPage() {
  const featured = posts.find(p => p.featured)!;
  const rest = posts.filter(p => !p.featured);

  return (
    <div style={{ background: "#f8fafc" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1a2d47 60%,#1e429f 100%)", padding: "80px 24px 64px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 16, letterSpacing: -1 }}>
            The SearchAuditPro Blog
          </h1>
          <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.7 }}>
            Actionable SEO insights, product updates, and in-depth guides from our team of experts.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        {/* Categories */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 48 }}>
          {categories.map((cat, i) => (
            <button key={cat} style={{
              background: i === 0 ? "#1a56db" : "#ffffff",
              color: i === 0 ? "#ffffff" : "#64748b",
              border: "1px solid #e2e8f0",
              padding: "8px 18px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 40, marginBottom: 48, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-block", background: "#1a56db18", color: "#1a56db", padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
              Featured Post
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", lineHeight: 1.3, marginBottom: 16 }}>{featured.title}</h2>
            <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>{featured.excerpt}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>By {featured.author}</span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{featured.date}</span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>{featured.readTime}</span>
            </div>
          </div>
          <div style={{ background: "linear-gradient(135deg,#1a56db14,#06b6d414)", borderRadius: 12, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 64 }}>🤖</span>
          </div>
        </div>

        {/* Post Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
          {rest.map(post => (
            <article key={post.slug} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg,#f1f5f9,#e2e8f0)", height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 48 }}>
                  {post.category === "Technical SEO" ? "⚙️" : post.category === "Local SEO" ? "📍" : post.category === "Link Building" ? "🔗" : post.category === "Rank Tracking" ? "📈" : post.category === "Site Audits" ? "🔍" : "📊"}
                </span>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: "inline-block", background: "#1a56db12", color: "#1a56db", padding: "3px 10px", borderRadius: 5, fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
                  {post.category}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: 10 }}>{post.title}</h3>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>{post.excerpt}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{post.date}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{post.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
