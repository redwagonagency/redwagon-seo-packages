"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const PAIN_POINTS = [
  {
    pain: "Writing content without knowing if anyone will find it",
    fix: "Validate every article idea with real search volume data before you spend hours writing it.",
  },
  {
    pain: "Targeting keywords that are impossible to rank for",
    fix: "Difficulty scores and quick-win filters surface keywords where you can actually hit page 1 — even without a massive domain.",
  },
  {
    pain: "Publishing posts that never get indexed or clicked",
    fix: "Click-through rate data and title optimization help you write headlines that rank and get clicked.",
  },
  {
    pain: "No idea what to write next — content calendar is empty",
    fix: "A-Z keyword explorer and content ideas tool generate your next 3 months of content ideas in under 5 minutes.",
  },
  {
    pain: "Competitors stealing your traffic with similar posts",
    fix: "Gap analysis finds the keyword angles and subtopics your competitors missed — so your content has a unique take that ranks.",
  },
];

const WORKFLOW = [
  { n: "1", title: "Discover your niche keywords", desc: "Enter your blog topic and get every related keyword cluster — from beginner questions to advanced searches — organized by traffic opportunity." },
  { n: "2", title: "Pick the right articles to write", desc: "Each keyword shows difficulty, volume, and estimated traffic so you always pick topics with the best odds of ranking and traffic ROI." },
  { n: "3", title: "Optimize while you write", desc: "Get on-page recommendations: word count targets, LSI keywords to include, and which related questions to answer for better rankings." },
  { n: "4", title: "Track your posts' rankings", desc: "See exactly where each post ranks, how it's trending, and get alerts when you slip so you can update before traffic drops." },
];

export default function BloggersPage() {
  return (
    <main className="ubk-bg min-h-screen text-white">
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-lg font-black tracking-tight ubk-logo">Unbound<span className="text-white/50">Keyword</span></Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition hidden sm:block">Sign in</Link>
          <Link href="/pricing" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="ubk-dot" /> For Bloggers
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Write less. Rank more.<br />
          <span className="ubk-orange-accent">Grow your blog faster.</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Every post you write should bring traffic. UnboundKeyword shows you exactly which keywords to target — so every article has a real shot at page 1 before you write word one.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/pricing" className="ubk-btn-primary font-black px-10 py-4 rounded-full text-base">Start Free Trial</Link>
          <Link href="/tools/keyword-ideas" className="border border-white/20 text-white/80 hover:text-white font-bold px-10 py-4 rounded-full text-base transition">Try keyword ideas tool</Link>
        </div>
        <p className="text-white/30 text-sm mt-6">No credit card required · Cancel anytime</p>
      </section>

      {/* Pain points */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-10">Why good blogs fail to grow. <span className="ubk-orange-accent">And how to fix it.</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PAIN_POINTS.slice(0, 4).map((p) => (
            <div key={p.pain} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-red-400 text-lg mt-0.5 shrink-0">✗</span>
                <p className="text-white/50 text-sm">{p.pain}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-400 text-lg mt-0.5 shrink-0">✓</span>
                <p className="text-white/80 text-sm font-medium">{p.fix}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-4">Your blogging workflow, powered by data</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">From topic idea to page 1 ranking — here&apos;s how UnboundKeyword fits into every step of your content process.</p>
        <div className="space-y-6">
          {WORKFLOW.map((w) => (
            <div key={w.n} className="flex gap-6 items-start rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-4xl font-black ubk-orange-accent shrink-0 leading-none">{w.n}</div>
              <div>
                <h3 className="font-black text-xl mb-2">{w.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick tools callout */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-black text-center mb-8">Tools built for content creators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { href: "/tools/keyword-ideas", icon: "💡", label: "Keyword Ideas — expand any topic" },
            { href: "/tools/content-ideas", icon: "📝", label: "Content Ideas — 100+ article topics" },
            { href: "/tools/a-z-keywords", icon: "🔤", label: "A-Z Explorer — full alphabet research" },
            { href: "/tools/keyword-overview", icon: "📊", label: "Keyword Overview — instant metrics" },
            { href: "/tools/competitor-research", icon: "🕵️", label: "Competitor Research — see what ranks" },
            { href: "/tools/hashtag-research", icon: "📸", label: "Hashtag Research — amplify your posts" },
          ].map((t) => (
            <Link key={t.href} href={t.href} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 hover:border-[#f15b27]/40 transition-colors">
              <span className="text-2xl">{t.icon}</span>
              <span className="text-sm text-white/70 font-medium leading-snug">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Every post you write should <span className="ubk-orange-accent">bring traffic</span></h2>
        <p className="text-white/55 text-lg mb-8">Stop publishing into the void. Start making data-driven content decisions that turn your blog into a real traffic asset.</p>
        <Link href="/pricing" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
