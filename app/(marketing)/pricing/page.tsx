import Link from "next/link";

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const plans = [
  {
    name: "Starter",
    price: 49,
    description: "Perfect for freelancers and small businesses just getting started with SEO.",
    color: "#1a56db",
    popular: false,
    features: [
      "3 Projects",
      "500 Keywords Tracked",
      "Monthly Site Audit (up to 1K pages)",
      "Basic Backlink Analysis",
      "Google Search Console Integration",
      "Email Reports",
      "1 User",
    ],
  },
  {
    name: "Professional",
    price: 149,
    description: "For growing agencies and in-house teams managing multiple clients.",
    color: "#7c3aed",
    popular: true,
    features: [
      "20 Projects",
      "5,000 Keywords Tracked",
      "Weekly Site Audit (up to 10K pages)",
      "Full Backlink Analysis + Toxic Links",
      "GSC & GA4 Integration",
      "LLM Visibility Tracking (5 queries/project)",
      "Local SEO Citation Audit",
      "PDF Report Builder",
      "5 Users",
      "API Access",
    ],
  },
  {
    name: "Enterprise",
    price: 399,
    description: "Unlimited scale for large agencies, enterprises, and power users.",
    color: "#059669",
    popular: false,
    features: [
      "Unlimited Projects",
      "50,000 Keywords Tracked",
      "Daily Site Audit (unlimited pages)",
      "Advanced Backlink Intelligence",
      "Full GSC + GA4 + Custom Integrations",
      "LLM Visibility (unlimited queries)",
      "Full Local SEO Suite",
      "White-label Reports",
      "Unlimited Users",
      "Priority API with SLA",
      "Dedicated Account Manager",
    ],
  },
];

const faqs = [
  { q: "Can I change plans at any time?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle." },
  { q: "Do you offer a free trial?", a: "All plans include a 14-day free trial with full access. No credit card required to start." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, Amex) and PayPal. Enterprise clients can also pay by invoice." },
  { q: "Is there a setup fee?", a: "No setup fees on any plan. You only pay the monthly or annual subscription price." },
  { q: "Can I get a refund?", a: "We offer a 30-day money-back guarantee on all annual plans. Monthly plans can be cancelled at any time." },
  { q: "Do you offer agency discounts?", a: "Yes, agencies managing 10+ clients can contact us for custom enterprise pricing with volume discounts." },
];

export default function PricingPage() {
  return (
    <div style={{ background: "#f8fafc" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1a2d47 60%,#1e429f 100%)", padding: "80px 24px 64px", textAlign: "center" }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 16, letterSpacing: -1 }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 32px" }}>
          Choose the plan that fits your team. All plans include a 14-day free trial.
        </p>
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: 4, gap: 4 }}>
          <button style={{ background: "#1a56db", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Monthly</button>
          <button style={{ background: "transparent", color: "#94a3b8", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Annual <span style={{ color: "#10b981", fontSize: 12 }}>Save 20%</span></button>
        </div>
      </section>

      {/* Plans */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, alignItems: "start" }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{
              background: "#ffffff",
              border: plan.popular ? `2px solid ${plan.color}` : "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 32,
              position: "relative",
              boxShadow: plan.popular ? `0 8px 40px ${plan.color}22` : "none",
            }}>
              {plan.popular && (
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", padding: "4px 18px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                  Most Popular
                </div>
              )}
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{plan.name}</h3>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.5 }}>{plan.description}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: "#0f172a" }}>${plan.price}</span>
                <span style={{ color: "#64748b", fontSize: 14 }}>/month</span>
              </div>
              <Link href="/register" style={{
                display: "block", textAlign: "center", background: plan.popular ? plan.color : "transparent",
                border: `2px solid ${plan.color}`, color: plan.popular ? "#fff" : plan.color,
                padding: "13px 0", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", marginBottom: 28,
              }}>
                Start Free Trial
              </Link>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {plan.features.map((feat) => (
                  <li key={feat} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <span style={{ color: plan.color, marginTop: 1, flexShrink: 0 }}><CheckIcon /></span>
                    <span style={{ fontSize: 14, color: "#374151" }}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 48 }}>Frequently Asked Questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {faqs.map((faq) => (
            <div key={faq.q} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "24px 28px" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>{faq.q}</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
