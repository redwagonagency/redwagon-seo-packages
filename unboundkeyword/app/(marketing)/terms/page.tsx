import Link from "next/link";

export const metadata = {
  title: "Terms of Service — UnboundKeyword",
  description: "UnboundKeyword terms of service — what you can do, what we promise, and how we work together.",
};

const EFFECTIVE_DATE = "January 1, 2025";
const COMPANY = "Redwagon Agency LLC";
const EMAIL = "legal@unboundkeyword.com";

export default function TermsPage() {
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
      <section className="px-6 pt-16 pb-10 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-4">Terms of Service</h1>
        <p className="text-white/50 text-sm">Effective date: {EFFECTIVE_DATE}</p>
        <p className="text-white/50 text-sm mt-1">Plain-language summary precedes each section where helpful, but the legal text governs.</p>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 pb-20 space-y-10 text-white/70 text-sm leading-relaxed">

        <div>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of UnboundKeyword.com
            (&ldquo;Service&rdquo;), operated by {COMPANY} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account
            or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
          </p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">1. Eligibility</h2>
          <p>You must be at least 16 years old to use the Service. By using it, you represent that you meet this requirement and that you have the authority to enter into these Terms on behalf of yourself or the organization you represent.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">2. Account</h2>
          <p className="mb-3">You are responsible for maintaining the security of your account credentials. Notify us immediately if you suspect unauthorized access. We are not liable for losses resulting from unauthorized use of your account.</p>
          <p>You may not share your account with others or create accounts on behalf of persons who have been suspended from the Service.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">3. Acceptable use</h2>
          <p className="mb-3">You may use the Service for lawful keyword research, content planning, and SEO work. You agree <strong className="text-white/90">not</strong> to:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Use automated scraping, bots, or crawlers against the Service outside of our documented API</li>
            <li>Attempt to circumvent rate limits, usage quotas, or access controls</li>
            <li>Reverse-engineer, copy, or resell the underlying keyword data without written permission</li>
            <li>Use the Service to research keywords for spam, phishing, or other malicious purposes</li>
            <li>Violate any applicable law or regulation</li>
          </ul>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">4. Plans, billing and cancellation</h2>
          <p className="mb-3">Paid plans are billed monthly or annually as selected at checkout. Prices are shown in USD. Taxes may apply depending on your location.</p>
          <p className="mb-3">You may cancel at any time from your account settings. Cancellation takes effect at the end of your current billing period — you retain access until then. We do not provide prorated refunds for unused time except as described in Section 5.</p>
          <p>We reserve the right to change pricing with at least 30 days&apos; notice. Price changes will not affect your current billing period.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">5. Refunds</h2>
          <p>If you have been on a paid plan for 30 days or fewer and are not satisfied with the Service, contact us at <a href={`mailto:${EMAIL}`} className="text-[#f97316] hover:underline">{EMAIL}</a> and we will issue a full refund. After 30 days, refunds are at our discretion and are generally not provided for partial months.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">6. Intellectual property</h2>
          <p className="mb-3">We own the Service, its code, design, and branding. You retain ownership of the keyword lists, content, and data you create using the Service.</p>
          <p>By using the Service, you grant us a limited license to process your searches and queries in order to provide the Service. We do not claim ownership of your data.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">7. Service availability</h2>
          <p>We aim for high availability but do not guarantee uninterrupted access. The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We may perform maintenance, which we will communicate in advance when possible.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">8. Disclaimer of warranties</h2>
          <p>To the fullest extent permitted by law, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. Keyword and search volume data is provided for informational purposes and may not reflect real-time search behavior.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">9. Limitation of liability</h2>
          <p>To the fullest extent permitted by law, our total liability to you for any claim arising out of or relating to these Terms or the Service will not exceed the amount you paid us in the 12 months preceding the claim. We are not liable for indirect, incidental, consequential, or punitive damages.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">10. Suspension and termination</h2>
          <p className="mb-3">We may suspend or terminate your account if you violate these Terms, engage in abuse, or fail to pay. We will try to give you prior notice except where immediate action is required to protect the Service or other users.</p>
          <p>You may delete your account at any time. Upon deletion, your data will be removed as described in our <Link href="/privacy" className="text-[#f97316] hover:underline">Privacy Policy</Link>.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">11. Governing law</h2>
          <p>These Terms are governed by the laws of the State of [State], United States, without regard to conflict-of-law principles. Any disputes will be resolved in the courts of [State], and you consent to the personal jurisdiction of those courts.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">12. Changes to these Terms</h2>
          <p>We may update these Terms from time to time. When we make material changes, we will notify you by email and/or prominent notice on the site at least 14 days before the changes take effect. Continued use of the Service after changes take effect constitutes acceptance.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">13. Contact</h2>
          <p>
            Questions about these Terms?{" "}
            <a href={`mailto:${EMAIL}`} className="text-[#f97316] hover:underline">{EMAIL}</a>
          </p>
          <p className="mt-2 text-white/45 text-xs">{COMPANY} · unboundkeyword.com</p>
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
