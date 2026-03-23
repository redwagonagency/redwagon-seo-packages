import Link from "next/link";

export const metadata = {
  title: "Contact UnboundKeyword — Get in Touch",
  description: "Questions about UnboundKeyword? Need help with your account? We're here.",
};

export default function ContactPage() {
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
          <Link href="/pricing" className="ubk-btn-primary text-sm font-bold px-5 py-2 rounded-full">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 py-20 max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Let&apos;s <span className="ubk-orange-accent">talk</span>
        </h1>
        <p className="text-white/60 text-xl max-w-xl mx-auto">
          Questions, feedback, partnership requests, or just want to say hi — we read every message.
        </p>
      </section>

      {/* Contact options */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <div className="text-3xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">General questions</h3>
            <p className="text-white/55 text-sm mb-4">Anything about features, plans, or how the tool works.</p>
            <a href="mailto:hello@unboundkeyword.com" className="text-[#f97316] hover:underline text-sm font-medium">
              hello@unboundkeyword.com
            </a>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <div className="text-3xl mb-4">🛠️</div>
            <h3 className="text-xl font-bold mb-2">Support &amp; billing</h3>
            <p className="text-white/55 text-sm mb-4">Issues with your account, unexpected charges, or access problems.</p>
            <a href="mailto:support@unboundkeyword.com" className="text-[#f97316] hover:underline text-sm font-medium">
              support@unboundkeyword.com
            </a>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <div className="text-3xl mb-4">🤝</div>
            <h3 className="text-xl font-bold mb-2">Partnerships</h3>
            <p className="text-white/55 text-sm mb-4">Agency partnerships, affiliate programs, or integrations with our platform.</p>
            <a href="mailto:partners@unboundkeyword.com" className="text-[#f97316] hover:underline text-sm font-medium">
              partners@unboundkeyword.com
            </a>
          </div>

          <div className="bg-slate-900/40 rounded-2xl p-8 border border-white/[0.06]">
            <div className="text-3xl mb-4">🏢</div>
            <h3 className="text-xl font-bold mb-2">Enterprise &amp; custom plans</h3>
            <p className="text-white/55 text-sm mb-4">High-volume needs, custom pricing, white-label, or invoicing options.</p>
            <a href="mailto:sales@unboundkeyword.com" className="text-[#f97316] hover:underline text-sm font-medium">
              sales@unboundkeyword.com
            </a>
          </div>
        </div>

        {/* Response time notice */}
        <div className="bg-slate-900/30 border border-white/[0.05] rounded-xl px-7 py-5 text-center">
          <p className="text-white/55 text-sm">
            ⏱ We typically respond within <strong className="text-white/80">1 business day</strong>. 
            For urgent support issues, include your account email in the subject line.
          </p>
        </div>
      </section>

      {/* FAQ shortcuts */}
      <section className="max-w-4xl mx-auto px-6 pb-16 border-t border-white/[0.06] pt-16">
        <h2 className="text-2xl font-bold mb-8">Before you write — quick answers</h2>
        <div className="space-y-4">
          {[
            ["How do I cancel my subscription?", "Log in → Settings → Billing → Cancel Plan. No fees, no penalties — you keep access until the end of your billing period."],
            ["Can I get a refund?", "If you've been on a paid plan for 30 days or less and aren't satisfied, email support@unboundkeyword.com and we'll refund in full."],
            ["Do you have a free plan?", "Yes. The free plan gives you a limited number of keyword hunts and lookups per month with no credit card required."],
            ["Can I upgrade or downgrade anytime?", "Absolutely. Changes take effect at your next billing cycle. Upgrades are prorated immediately."],
          ].map(([q, a]) => (
            <div key={q as string} className="bg-slate-900/30 rounded-xl p-5 border border-white/[0.05]">
              <h3 className="font-semibold mb-2">{q}</h3>
              <p className="text-white/55 text-sm">{a}</p>
            </div>
          ))}
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
