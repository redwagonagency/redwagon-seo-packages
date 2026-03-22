"use client";

import Link from "next/link";

const RESOURCES = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of keyword research and how to use UnboundKeyword to find opportunities.",
    icon: "📖",
    topics: ["Setup your account", "First search", "Understanding metrics", "Exporting keywords"]
  },
  {
    title: "Keyword Research Masterclass",
    description: "Deep dive into keyword research strategy, from discovery to implementation.",
    icon: "🎓",
    topics: ["Research methodology", "Identifying intent", "Competitive analysis", "Content mapping"]
  },
  {
    title: "Local SEO Playbook",
    description: "Master local keyword research for cities, states, and regions.",
    icon: "📍",
    topics: ["Multi-location strategy", "Local intent keywords", "Geographic targeting", "Local rankings"]
  },
  {
    title: "Content Strategy with Keywords",
    description: "Turn keyword data into a content roadmap that drives results.",
    icon: "📋",
    topics: ["Content gap analysis", "Topic clustering", "Pillar pages", "Editorial calendars"]
  },
  {
    title: "Agency Workflows",
    description: "Best practices for using UnboundKeyword with your team and clients.",
    icon: "🤝",
    topics: ["Team collaboration", "Client reporting", "Project management", "Billing & permissions"]
  },
  {
    title: "API Documentation",
    description: "Developer guide for integrating UnboundKeyword into your tools and apps.",
    icon: "⚙️",
    topics: ["Authentication", "Endpoints", "Rate limiting", "Code examples"]
  },
];

const FAQ_ITEMS = [
  {
    question: "How often is your keyword data updated?",
    answer: "Our keyword data is aggregated from multiple sources and updated weekly. Search volume metrics, competition data, and related keywords refresh automatically."
  },
  {
    question: "Can I track keywords over time?",
    answer: "Yes. Save keywords to lists and export regularly to track metrics over time. For real-time rank tracking, integrate with our rank tracking partners."
  },
  {
    question: "How many searches can I do with my plan?",
    answer: "Each plan has a monthly search limit. See your dashboard for current usage and remaining searches. If you exceed your limit, you can upgrade or purchase add-ons."
  },
  {
    question: "Can I export all my keywords at once?",
    answer: "Yes. Bulk export to CSV, Google Sheets, or via API. You can export individual lists or combine multiple lists for batch operations."
  },
  {
    question: "How does local keyword research work?",
    answer: "Enter a topic and select a state, city, or region. UnboundKeyword shows search volume and variations specific to that geographic area."
  },
  {
    question: "Can multiple people use one account?",
    answer: "Yes. Professional and Enterprise plans include team management. Invite team members and set permissions for collaboration."
  },
  {
    question: "Is my data secure?",
    answer: "All data is encrypted in transit and at rest. We use OAuth 2.0 for authentication and follow industry security standards. SOC 2 compliance coming soon."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 14-day free trial for all plans. If you're not satisfied, contact support within 7 days of purchase for a full refund."
  },
];

export default function HelpPage() {
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
          Get help and <span className="ubk-orange-accent">learn</span>
        </h1>
        <p className="text-white/60 text-lg max-w-3xl mx-auto mb-8">
          Resources, guides, and documentation to help you succeed with UnboundKeyword.
        </p>

        {/* Search Bar */}
        <div className="flex gap-2 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Search help articles..."
            className="flex-1 bg-slate-900/50 border border-white/[0.08] rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[rgba(241,91,39,0.35)] transition"
          />
          <button className="ubk-btn-primary px-6 py-3 rounded-lg font-bold text-sm">
            Search
          </button>
        </div>
      </section>

      {/* Resource Library */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">Learning Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RESOURCES.map((resource) => (
            <div
              key={resource.title}
              className="bg-slate-900/40 rounded-2xl p-6 border border-white/[0.06] hover:border-[rgba(241,91,39,0.35)] transition cursor-pointer group"
            >
              <div className="text-4xl mb-4">{resource.icon}</div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-[#f97316] transition">{resource.title}</h3>
              <p className="text-white/60 text-sm mb-4">{resource.description}</p>
              <div className="space-y-1">
                {resource.topics.map((topic, i) => (
                  <div key={i} className="flex gap-2 text-white/50 text-xs">
                    <span className="text-[#f97316]">→</span>
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-8 text-center">Still Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06] text-center">
            <div className="text-3xl mb-4">💬</div>
            <h4 className="font-bold mb-2">Live Chat</h4>
            <p className="text-white/60 text-sm mb-4">Chat with our support team (Mon-Fri, 9am-5pm EST)</p>
            <button className="ubk-btn-primary text-sm font-bold px-4 py-2 rounded-full w-full">
              Start chat
            </button>
          </div>

          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06] text-center">
            <div className="text-3xl mb-4">✉️</div>
            <h4 className="font-bold mb-2">Email Support</h4>
            <p className="text-white/60 text-sm mb-4">Response within 24 hours</p>
            <a href="mailto:support@unboundkeyword.com" className="ubk-btn-primary text-sm font-bold px-4 py-2 rounded-full w-full inline-block">
              Email us
            </a>
          </div>

          <div className="bg-slate-900/40 rounded-xl p-6 border border-white/[0.06] text-center">
            <div className="text-3xl mb-4">❓</div>
            <h4 className="font-bold mb-2">Community</h4>
            <p className="text-white/60 text-sm mb-4">Connect with other users and share tips</p>
            <a href="https://twitter.com/unboundkeyword" target="_blank" rel="noopener noreferrer" className="ubk-btn-primary text-sm font-bold px-4 py-2 rounded-full w-full inline-block border border-[rgba(241,91,39,0.5)] hover:bg-[rgba(241,91,39,0.1)]">
              Join us on Twitter
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="bg-slate-900/30 rounded-lg border border-white/[0.06] group"
            >
              <summary className="px-6 py-4 font-bold cursor-pointer hover:text-[#f97316] transition">
                {item.question}
              </summary>
              <div className="px-6 pb-4 text-white/60 text-sm border-t border-white/[0.06] group-open:border-white/[0.06]">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-950 rounded-2xl p-8 border border-white/[0.06]">
            <h3 className="text-2xl font-bold mb-3">Ready to get started?</h3>
            <p className="text-white/60 mb-6">Try UnboundKeyword free for 14 days and see how it can transform your keyword research.</p>
            <Link href="/register" className="ubk-btn-primary font-bold px-8 py-3 rounded-full inline-block">
              Start free trial
            </Link>
          </div>

          <div className="bg-gradient-to-br from-slate-900/50 to-slate-950 rounded-2xl p-8 border border-white/[0.06]">
            <h3 className="text-2xl font-bold mb-3">Want to learn more?</h3>
            <p className="text-white/60 mb-6">Check out our features, use cases, and comparison pages to see if UnboundKeyword is right for you.</p>
            <div className="flex gap-3">
              <Link href="/features" className="ubk-btn-primary font-bold px-6 py-3 rounded-full text-sm">
                Features
              </Link>
              <Link href="/use-cases" className="ubk-btn-primary font-bold px-6 py-3 rounded-full text-sm border border-[rgba(241,91,39,0.5)] hover:bg-[rgba(241,91,39,0.1)]">
                Use Cases
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-8 text-center text-sm text-white/25 mt-16">
        © 2026 UnBoundKeyword.com · All rights reserved ·{" "}
        <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
        {" · "}
        <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
      </footer>
    </main>
  );
}
