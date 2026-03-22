import Link from "next/link";

export default function TrafficCheckerLandingPage() {
  return (
    <main className="min-h-screen bg-[#fff7f3] text-slate-900">
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="text-xs uppercase tracking-[0.2em] font-black text-[#f15b27] mb-4">Organic Traffic Intelligence</div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">Website Traffic Checker</h1>
        <p className="max-w-2xl mx-auto text-slate-600 text-lg leading-relaxed mb-8">
          Check site traffic, keyword footprint, competitor overlap, and traffic estimates from DataForSEO in one dashboard.
        </p>

        <div className="max-w-3xl mx-auto rounded-xl border-2 border-[#f15b27] bg-white p-2 flex flex-col sm:flex-row gap-2 shadow-lg shadow-orange-100">
          <input
            type="text"
            placeholder="Enter your URL"
            className="flex-1 px-4 py-3 text-sm outline-none"
            readOnly
          />
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-[#f15b27] px-6 py-3 text-sm font-black text-white hover:bg-[#d94e1f]"
          >
            CHECK TRAFFIC
          </Link>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3 text-left">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f15b27] mb-2">Keyword Rankings</div>
            <p className="text-slate-600 text-sm">See top keywords driving traffic and the positions they rank at.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f15b27] mb-2">Competitor Domains</div>
            <p className="text-slate-600 text-sm">Discover competitors, overlap keywords, and domain traffic estimates.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#f15b27] mb-2">Traffic Forecasting</div>
            <p className="text-slate-600 text-sm">Track monthly trends and benchmark growth against market leaders.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
