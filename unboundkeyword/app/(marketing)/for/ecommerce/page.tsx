"use client";

import Link from "next/link";

const ECOM_TYPES = [
  { icon: "🛍️", name: "Fashion & Apparel", ex: "Best white sneakers for women, wide-fit women's shoes, how to style high tops" },
  { icon: "🏠", name: "Home & Garden", ex: "Outdoor furniture for small balconies, best indoor plants low light, how to clean a couch" },
  { icon: "💻", name: "Electronics & Tech", ex: "Best laptop for graphic design under $1000, wireless earbuds for working out, gaming monitor 144hz" },
  { icon: "🧴", name: "Beauty & Health", ex: "Face moisturizer for sensitive skin, best hair mask for dry hair, vitamin C serum vs retinol" },
  { icon: "🐾", name: "Pet Supplies", ex: "Best dog food for large breeds, hypoallergenic cat food, dog crate size guide" },
  { icon: "🏋️", name: "Sports & Fitness", ex: "Best resistance bands for beginners, home gym equipment list, yoga mat non-slip" },
];

export default function ForEcommerce() {
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
      <section className="relative px-6 py-20 max-w-5xl mx-auto text-center">
        <div className="ubk-badge inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-6">
          For E-commerce
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          Find the <span className="ubk-orange-accent">buyer keywords</span><br />
          your competitors missed
        </h1>
        <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
          Discover product keywords, comparison searches, and buyer-intent questions your customers
          type before they buy — across Google, Amazon, YouTube, and more.
        </p>
        <Link href="/pricing" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
          Find your buyer keywords
        </Link>
      </section>

      {/* Why multi-platform matters for ecom */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-slate-900/50 border border-white/[0.07] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-4">E-commerce shoppers search everywhere</h3>
          <p className="text-white/60 text-sm mb-6 max-w-xl mx-auto">
            Only 27% of product searches happen on Google. Your buyers are also on YouTube (&ldquo;best X review&rdquo;),
            Amazon (&ldquo;X vs Y&rdquo;), Pinterest (&ldquo;X ideas&rdquo;), and Reddit (&ldquo;honest review of X&rdquo;).
            UnboundKeyword surfaces keyword intent from all of them.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-white/65">
            {["Google Shopping", "YouTube Reviews", "Amazon Top Results", "Bing Product Search", "Pinterest Boards", "DuckDuckGo"].map((p) => (
              <span key={p} className="bg-slate-800/60 border border-white/[0.08] px-4 py-1.5 rounded-full">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 3 keyword types for ecom */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-10 text-center">3 keyword types that drive e-commerce revenue</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-[rgba(241,91,39,0.2)] rounded-xl p-6">
            <div className="text-2xl mb-3">🛒</div>
            <h3 className="font-bold mb-2 text-[#f97316]">Transactional</h3>
            <p className="text-white/60 text-sm mb-4">Ready-to-buy searches with purchase intent. These drive direct conversions.</p>
            <div className="space-y-1 text-xs text-white/45">
              <div className="bg-slate-800/50 rounded px-3 py-1.5">&ldquo;buy yoga mat online&rdquo;</div>
              <div className="bg-slate-800/50 rounded px-3 py-1.5">&ldquo;cheap wireless headphones free shipping&rdquo;</div>
              <div className="bg-slate-800/50 rounded px-3 py-1.5">&ldquo;best deal on standing desk&rdquo;</div>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/[0.06] rounded-xl p-6">
            <div className="text-2xl mb-3">⚖️</div>
            <h3 className="font-bold mb-2">Commercial Investigation</h3>
            <p className="text-white/60 text-sm mb-4">Comparison and review searches. Win these and you win the sale.</p>
            <div className="space-y-1 text-xs text-white/45">
              <div className="bg-slate-800/50 rounded px-3 py-1.5">&ldquo;Airpods Pro vs Sony WH-1000XM5&rdquo;</div>
              <div className="bg-slate-800/50 rounded px-3 py-1.5">&ldquo;best laptop for college students&rdquo;</div>
              <div className="bg-slate-800/50 rounded px-3 py-1.5">&ldquo;is [product] worth buying&rdquo;</div>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-white/[0.06] rounded-xl p-6">
            <div className="text-2xl mb-3">🔍</div>
            <h3 className="font-bold mb-2">Informational + Funnel Top</h3>
            <p className="text-white/60 text-sm mb-4">Research-stage queries. Win these to build brand and feed the funnel.</p>
            <div className="space-y-1 text-xs text-white/45">
              <div className="bg-slate-800/50 rounded px-3 py-1.5">&ldquo;how to choose a yoga mat thickness&rdquo;</div>
              <div className="bg-slate-800/50 rounded px-3 py-1.5">&ldquo;what is the difference between X and Y&rdquo;</div>
              <div className="bg-slate-800/50 rounded px-3 py-1.5">&ldquo;[product category] for beginners&rdquo;</div>
            </div>
          </div>
        </div>
      </section>

      {/* How to use it for ecom */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-10 text-center">E-commerce keyword use cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            ["📦", "Product page optimization", "Find the exact phrases buyers use when ready to purchase. Optimize your product titles, meta descriptions, and copy for transactional keywords with real volume."],
            ["📂", "Category page keywords", "Use topic discovery to find all the relevant subtopics for a product category. Turn category pages into SEO magnets with the right keyword focus."],
            ["📝", "Buying guide content", "Discover every comparison and question buyers search before making a purchase decision. Write buying guides that intercept buyers at the research stage."],
            ["🌟", "Review and comparison pages", "Find all the &ldquo;X vs Y&rdquo; and &ldquo;best X for Y&rdquo; searches in your niche. Create comparison content that captures high-intent comparison traffic."],
            ["🏷️", "Long-tail product discovery", "Uncover specific, low-competition product variants people search for. &ldquo;navy blue ribbed high waist leggings size plus&rdquo; — these convert at 2–4× the rate of generic terms."],
            ["📣", "Post-purchase content", "Surface questions people ask after buying (&ldquo;how to clean X&rdquo;, &ldquo;how to assemble X&rdquo;). Rank for these to reduce support load and earn loyalty-loop traffic."],
          ].map(([icon, title, desc]) => (
            <div key={title as string} className="bg-slate-900/30 border border-white/[0.05] rounded-xl p-6 flex gap-4">
              <div className="text-2xl shrink-0">{icon}</div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-white/55 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Works for every category */}
      <section className="max-w-5xl mx-auto px-6 pb-16 border-t border-white/[0.06] pt-16">
        <h2 className="text-3xl font-bold mb-10 text-center">Works for every product category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ECOM_TYPES.map((t) => (
            <div key={t.name} className="bg-slate-900/30 border border-white/[0.05] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{t.icon}</span>
                <span className="font-semibold text-sm">{t.name}</span>
              </div>
              <p className="text-white/40 text-xs italic">{t.ex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 max-w-3xl mx-auto text-center">
        <div className="ubk-cta-banner rounded-3xl p-10 md:p-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Find the keywords<br />
            <span className="ubk-orange-accent">your buyers are already typing</span>
          </h2>
          <p className="text-white/55 mb-8">Free trial. No credit card. Results in under 60 seconds.</p>
          <Link href="/pricing" className="ubk-btn-primary text-base font-bold px-10 py-4 rounded-full inline-block">
            Start for free
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
