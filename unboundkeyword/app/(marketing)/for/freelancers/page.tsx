"use client";

import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const PAIN_POINTS = [
  {
    pain: "Spending hours on keyword research for every client",
    fix: "Automated keyword discovery and gap analysis cuts client research time from days to under an hour.",
  },
  {
    pain: "Clients who don't understand the value of SEO work",
    fix: "Beautiful reports with traffic value estimates and ranking progress make your work impossible to dismiss.",
  },
  {
    pain: "Expensive tools eating your per-client profit margin",
    fix: "One subscription for all your clients, with multi-project support. Your margin stays yours.",
  },
  {
    pain: "Losing clients because results take too long to show",
    fix: "Quick-win filters find low-competition keywords that start ranking in weeks — not months.",
  },
  {
    pain: "Building strategies without the right competitor data",
    fix: "Full keyword gap analysis for any client vs. any competitor. Walk into every kickoff meeting armed with data.",
  },
];

const WORKFLOW = [
  { n: "1", title: "Set up client projects instantly", desc: "Add a client domain and their top 3 competitors. UnboundKeyword builds a complete keyword opportunity map in minutes." },
  { n: "2", title: "Start with the quick wins", desc: "Sort by difficulty to surface keywords your client can rank for in 30-60 days. Deliver early wins that build trust — and renewals." },
  { n: "3", title: "Build the long-term strategy", desc: "Create a content roadmap organized by topic clusters and keyword intent. Give clients a 6-month plan they can actually visualize." },
  { n: "4", title: "Report results they care about", desc: "Automated ranking reports show traffic growth, position changes, and estimated revenue impact — in language clients understand." },
];

export default function FreelancersPage() {
  return (
    <main className="ubk-bg min-h-screen text-white">
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-lg font-black tracking-tight ubk-logo">Unbound<span className="text-white/50">Keyword</span></Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm font-medium transition hidden sm:block">Sign in</Link>
          <Link href="/register" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-16 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="ubk-dot" /> For Freelancers
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Deliver better SEO<br />
          <span className="ubk-orange-accent">in half the time</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          UnboundKeyword is the freelancer&apos;s secret weapon. Run full keyword research, competitor analysis, and ranking reports for all your clients — without burning your nights or killing your margins.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/register" className="ubk-btn-primary font-black px-10 py-4 rounded-full text-base">Start Free Trial</Link>
          <Link href="/for/agencies" className="border border-white/20 text-white/80 hover:text-white font-bold px-10 py-4 rounded-full text-base transition">For agencies</Link>
        </div>
        <p className="text-white/30 text-sm mt-6">No credit card required · Cancel anytime</p>
      </section>

      {/* Pain points */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-black text-center mb-10">The freelancer SEO frustrations. <span className="ubk-orange-accent">All fixed.</span></h2>
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
        <h2 className="text-3xl font-black text-center mb-4">Your client workflow, systematized</h2>
        <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">From onboarding to monthly reporting — here&apos;s how UnboundKeyword runs your entire SEO client workflow.</p>
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

      {/* Value prop highlight */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10">
          <p className="text-white/50 text-sm uppercase tracking-widest font-bold mb-6">What freelancers say</p>
          <blockquote className="text-xl font-medium text-white/80 leading-relaxed mb-6">
            &ldquo;I used to spend 10 hours on every new client audit. Now it&apos;s 90 minutes — and the output is better than anything I was delivering before.&rdquo;
          </blockquote>
          <div className="text-[#f15b27] font-bold text-sm">Freelance SEO Consultant · 14 active clients</div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-4xl font-black mb-4">Take on more clients. <span className="ubk-orange-accent">Work fewer hours.</span></h2>
        <p className="text-white/55 text-lg mb-8">UnboundKeyword handles the research so you can focus on strategy and client relationships — the parts of the job that actually require you.</p>
        <Link href="/register" className="ubk-btn-primary font-black px-12 py-5 rounded-full text-lg inline-block">Start Free Trial</Link>
        <p className="text-white/30 text-sm mt-4">14-day free trial · No credit card required</p>
      </section>

      <MarketingFooter />
    </main>
  );
}
