"use client";

import Link from "next/link";

const INTEGRATIONS = [
  {
    name: "Google Search Console",
    description: "Connect your GSC data to validate keywords and compare to your rankings.",
    icon: "🔍",
    features: [
      "Sync your ranking keywords",
      "See search impressions & clicks",
      "Validate keyword opportunities",
      "Export validated keywords"
    ]
  },
  {
    name: "Google Analytics",
    description: "Understand which keywords drive traffic and conversions to your site.",
    icon: "📊",
    features: [
      "View keyword traffic performance",
      "Track conversion attribution",
      "Segment by country and device",
      "Build content recommendations"
    ]
  },
  {
    name: "Rank Tracking",
    description: "Monitor how your target keywords perform over time and across competitors.",
    icon: "📈",
    features: [
      "Daily/weekly rank updates",
      "Competitor keyword tracking",
      "Visibility score trends",
      "Alert on rank changes"
    ]
  },
  {
    name: "Google Sheets",
    description: "Export keywords and analysis directly to Google Sheets for collaboration.",
    icon: "📋",
    features: [
      "One-click exports to Sheets",
      "Team collaboration ready",
      "Auto-refresh keyword data",
      "Custom pivot tables"
    ]
  },
  {
    name: "CSV & API",
    description: "Get your keyword data in any format you need, via CSV or REST API.",
    icon: "⚙️",
    features: [
      "Download structured CSV files",
      "REST API for developers",
      "Bulk operations support",
      "Custom integrations"
    ]
  },
  {
    name: "Coming Soon",
    description: "We're building connectors to more tools you use every day.",
    icon: "🚀",
    features: [
      "Zapier / Make integration",
      "WordPress plugins",
      "CMS connectors",
      "Email your keywords"
    ]
  },
];

const WORKFLOW_INTEGRATIONS = [
  { name: "HubSpot", category: "CRM", icon: "🎯" },
  { name: "Slack", category: "Communication", icon: "💬" },
  { name: "Monday.com", category: "Project Management", icon: "📅" },
  { name: "Airtable", category: "Database", icon: "🗂️" },
  { name: "Trello", category: "Project Management", icon: "🎴" },
  { name: "Notion", category: "Notes & Docs", icon: "📝" },
];

export default function IntegrationsPage() {
  return (
    <main className="ubk-bg min-h-screen text-white">
      {/* Header */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <span className="text-lg font-black tracking-tight ubk-logo">
          Unbound<span className="text-white/50">Keyword</span>
        </span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition hidden sm:block">
            Sign in
          </Link>
          <Link href="/register" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-20 max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Works with your <span className="ubk-orange-accent">favorite tools</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto">
          UnboundKeyword integrates with the platforms you already use for content, analytics, and project management.
        </p>
      </section>

      {/* First-Party Integrations */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">Native Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {INTEGRATIONS.map((integration) => (
            <div
              key={integration.name}
              className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06] hover:border-[rgba(241,91,39,0.35)] transition"
            >
              <div className="text-4xl mb-3">{integration.icon}</div>
              <h3 className="text-xl font-bold mb-2">{integration.name}</h3>
              <p className="text-white/60 mb-6 text-sm">{integration.description}</p>
              <ul className="space-y-2">
                {integration.features.map((feature, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-[#f97316] text-lg shrink-0">•</span>
                    <span className="text-white/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How Integrations Work */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-2xl font-bold mb-12">How It Works</h2>
        <div className="space-y-4">
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <div className="flex gap-4">
              <div className="text-3xl font-black text-[#f97316] shrink-0">1</div>
              <div>
                <h4 className="font-bold mb-2">Connect Your Account</h4>
                <p className="text-white/60 text-sm">Authorize UnboundKeyword to access your search, analytics, or ranking data through secure OAuth.</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <div className="flex gap-4">
              <div className="text-3xl font-black text-[#f97316] shrink-0">2</div>
              <div>
                <h4 className="font-bold mb-2">Data Syncs Automatically</h4>
                <p className="text-white/60 text-sm">Your keywords, rankings, and analytics data update automatically so you only analyze fresh information.</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <div className="flex gap-4">
              <div className="text-3xl font-black text-[#f97316] shrink-0">3</div>
              <div>
                <h4 className="font-bold mb-2">Get Better Insights</h4>
                <p className="text-white/60 text-sm">Combine keyword discovery with your real performance data to find opportunities that actually matter.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Integrations Coming */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-2xl font-bold mb-8">Workflow Integrations (Coming Soon)</h2>
        <p className="text-white/60 mb-8">We're building connectors to push keywords directly into your team's workflow tools.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {WORKFLOW_INTEGRATIONS.map((tool) => (
            <div
              key={tool.name}
              className="bg-slate-900/30 rounded-lg p-4 border border-white/[0.06] text-center"
            >
              <div className="text-2xl mb-2">{tool.icon}</div>
              <h4 className="font-bold text-sm mb-1">{tool.name}</h4>
              <p className="text-white/40 text-xs">{tool.category}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Export Options */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-2xl font-bold mb-8">Export Any Way You Want</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06]">
            <h4 className="font-bold text-lg mb-3">📊 CSV & Excel</h4>
            <p className="text-white/60 text-sm">Download your keywords, metrics, and analysis in standard CSV format for Excel, Sheets, or any tool.</p>
          </div>
          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06]">
            <h4 className="font-bold text-lg mb-3">📋 Google Sheets</h4>
            <p className="text-white/60 text-sm">Push data directly to your Sheets with one click. Updates sync automatically as your keyword data changes.</p>
          </div>
          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06]">
            <h4 className="font-bold text-lg mb-3">⚙️ REST API</h4>
            <p className="text-white/60 text-sm">Developer-friendly API for custom integrations, automation, and building your own tools on top of UnboundKeyword.</p>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-2xl font-bold mb-8 text-center">Enterprise-Grade Security</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h4 className="font-bold mb-3">🔐 OAuth 2.0 Authentication</h4>
            <p className="text-white/60 text-sm">We never store your credentials. Connect securely using OAuth 2.0, just like Google does.</p>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h4 className="font-bold mb-3">📡 Encrypted Data Transfer</h4>
            <p className="text-white/60 text-sm">All data in transit is encrypted with TLS 1.3. Your information stays protected between systems.</p>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h4 className="font-bold mb-3">✅ SOC 2 Ready</h4>
            <p className="text-white/60 text-sm">We maintain security best practices and are building toward SOC 2 compliance for enterprise customers.</p>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-white/[0.06]">
            <h4 className="font-bold mb-3">🛡️ Audit Logs</h4>
            <p className="text-white/60 text-sm">Track integration activity and API access to maintain visibility and compliance requirements.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Connect UnboundKeyword to your <span className="ubk-orange-accent">entire stack</span>
          </h2>
          <p className="text-white/55 mb-8">Sync your keywords, analytics, and rankings with one secure connection.</p>
          <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-8 text-center text-sm text-white/25">
        © 2026 UnBoundKeyword.com · All rights reserved ·{" "}
        <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
        {" · "}
        <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
      </footer>
    </main>
  );
}
