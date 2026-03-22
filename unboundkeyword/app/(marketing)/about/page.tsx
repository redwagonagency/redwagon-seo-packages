import Link from "next/link";

export const metadata = {
  title: "About UnboundKeyword — Built by Marketers, for Marketers",
  description: "The story behind UnboundKeyword — why we built a keyword research tool focused on depth, not bloat.",
};

export default function AboutPage() {
  return (
    <main className="ubk-bg min-h-screen text-white">
      {/* Nav */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-lg font-black tracking-tight ubk-logo">
          Unbound<span className="text-white/50">Keyword</span>
        </Link>
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
      <section className="relative px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          Our Story
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Built by marketers.<br />
          <span className="ubk-orange-accent">For marketers.</span>
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto">
          We got tired of paying for bloated SEO suites to use 5% of their features.
          So we built the tool we actually wanted.
        </p>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-6 pb-16 space-y-8">
        <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
          <h2 className="text-2xl font-bold mb-4">The origin story</h2>
          <p className="text-white/65 leading-relaxed mb-4">
            UnboundKeyword started with a simple frustration: every keyword tool on the market either
            cost a fortune or gave you surface-level data. We were spending $200/month on an all-in-one
            platform — and 80% of what we used was keyword research.
          </p>
          <p className="text-white/65 leading-relaxed mb-4">
            So we asked: what if we took just keyword research and made it genuinely excellent?
            Not a checkbox feature, but the core product. Deeper questions, more variations,
            local targeting at city-level, multi-platform coverage, real autocomplete data.
          </p>
          <p className="text-white/65 leading-relaxed">
            What we built surprised us. The depth of keyword data available when you focus on one
            job is staggering. Questions nobody else was surfacing. Autocomplete paths we&apos;d never
            seen. 51 billion searches across platforms that aren&apos;t Google. UnboundKeyword was live.
          </p>
        </div>

        <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
          <h2 className="text-2xl font-bold mb-4">Our mission</h2>
          <p className="text-white/65 leading-relaxed mb-4">
            Keyword research is the foundation of all great content. If you don&apos;t know what people are
            searching for — their exact words, their real questions, their purchase intent — you&apos;re
            creating content in the dark.
          </p>
          <p className="text-white/65 leading-relaxed">
            Our mission is to make that foundation accessible. Not just for big-budget enterprise teams,
            but for solo bloggers, freelancers, local businesses, and growing agencies. Start at $25/month
            and get keyword data that punches above tools 4x the price.
          </p>
        </div>

        <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
          <h2 className="text-2xl font-bold mb-6">What we believe</h2>
          <div className="space-y-5">
            {[
              ["Specificity beats breadth", "A tool that does one thing exceptionally well beats one that does ten things adequately. We obsess over keyword research so you can focus on strategy."],
              ["Transparency in pricing", "No seat-based pricing traps, no usage overages that come out of nowhere, no \"contact us\" tiers that actually mean something. Simple, predictable plans."],
              ["Data should be actionable", "Volume numbers are just numbers. We pair them with context: question patterns, content angles, intent signals — so you know what to actually write."],
              ["Accessible tools win", "The full-suite tools cost $100–$200/mo minimum. That shuts out freelancers, solopreneurs, and small teams. Good keyword research shouldn't be gated behind an enterprise price tag."],
            ].map(([title, desc]) => (
              <div key={title as string} className="flex gap-4">
                <span className="text-[#f97316] text-lg shrink-0 mt-0.5">✓</span>
                <div>
                  <h3 className="font-bold mb-1">{title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
          <h2 className="text-2xl font-bold mb-4">Part of the Redwagon ecosystem</h2>
          <p className="text-white/65 leading-relaxed mb-4">
            UnboundKeyword is built and maintained by <strong className="text-white/90">Redwagon Agency</strong> — a
            digital marketing team that uses these tools in our own client work every day.
            That&apos;s why they stay sharp: if the tools don&apos;t work in the real world, we feel it first.
          </p>
          <p className="text-white/65 leading-relaxed">
            Our companion product, <a href="https://searchauditpro.com" target="_blank" rel="noopener noreferrer" className="text-[#f97316] hover:underline">SearchAuditPro.com</a>,
            handles the other half of the SEO equation: site audits, rank tracking, on-page optimization,
            and LLM visibility. Together, the two tools cover the complete SEO workflow for $50/month.
          </p>
        </div>
      </section>

      {/* Values grid */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">By the numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            ["51B+", "Searches indexed across all platforms"],
            ["500+", "PAA questions per topic"],
            ["$25", "Starting price (not $99)"],
            ["2024", "Built fresh — not a legacy tool"],
          ].map(([stat, label]) => (
            <div key={stat as string} className="bg-slate-900/40 border border-white/[0.06] rounded-xl p-5 text-center">
              <div className="text-2xl font-black text-[#f97316] mb-1">{stat}</div>
              <div className="text-white/55 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            See what keyword research<br />
            <span className="ubk-orange-accent">looks like at full depth</span>
          </h2>
          <p className="text-white/55 mb-8">Try UnboundKeyword free. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
              Get started free
            </Link>
            <Link href="/contact" className="border border-white/25 text-white/80 hover:border-white/50 text-base font-bold px-10 py-4 rounded-full inline-block transition">
              Contact us
            </Link>
          </div>
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
