import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — UnboundKeyword",
  description: "UnboundKeyword privacy policy — how we collect, use, and protect your data.",
};

const EFFECTIVE_DATE = "January 1, 2025";
const COMPANY = "Redwagon Agency LLC";
const EMAIL = "privacy@unboundkeyword.com";

export default function PrivacyPage() {
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
        <h1 className="text-4xl md:text-5xl font-black mb-4">Privacy Policy</h1>
        <p className="text-white/50 text-sm">Effective date: {EFFECTIVE_DATE}</p>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 pb-20 space-y-10 text-white/70 text-sm leading-relaxed">

        <div>
          <p>
            {COMPANY} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates UnboundKeyword.com (the &ldquo;Service&rdquo;).
            This page explains how we collect, use, and protect information about you when you use our Service.
            By using UnboundKeyword you agree to the practices described in this policy.
          </p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">1. Information we collect</h2>
          <p className="mb-3">We collect information you provide directly, and information generated through your use of the Service.</p>
          <h3 className="text-white/90 font-semibold mb-2">Account information</h3>
          <p className="mb-3">When you register, we collect your email address and a password hash. If you sign in via OAuth (Google), we receive the email and name associated with your Google account.</p>
          <h3 className="text-white/90 font-semibold mb-2">Usage data</h3>
          <p className="mb-3">We log searches you perform, keyword lists you create, and features you interact with. This helps us improve the Service and understand how it is used.</p>
          <h3 className="text-white/90 font-semibold mb-2">Payment information</h3>
          <p>Payments are processed by Stripe. We do not store credit card numbers. We receive a billing record that includes your email, plan name, amount, and subscription status.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">2. How we use your information</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Provide, operate, and improve the Service</li>
            <li>Send transactional emails (account confirmations, billing receipts, password resets)</li>
            <li>Respond to support requests</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
            <li>Send product updates if you opt in (you may opt out at any time)</li>
          </ul>
          <p className="mt-3">We do not sell your personal data.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">3. Data sharing</h2>
          <p className="mb-3">We share data only with service providers who help us operate the Service, under strict confidentiality agreements. These include:</p>
          <ul className="space-y-2 list-disc list-inside mb-3">
            <li><strong className="text-white/90">Stripe</strong> — payment processing</li>
            <li><strong className="text-white/90">Vercel / hosting providers</strong> — infrastructure</li>
            <li><strong className="text-white/90">Search data providers</strong> — powering keyword volume and suggestion data (no personal data is shared with these providers)</li>
          </ul>
          <p>We may disclose information if required by law, or to protect the rights, property, or safety of our users or the public.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">4. Data retention</h2>
          <p>We retain your account data for as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where we are required to retain it for legal or billing purposes.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">5. Cookies and tracking</h2>
          <p className="mb-3">We use essential cookies to keep you logged in and remember your session. We may use analytics cookies (e.g., Plausible Analytics or similar privacy-first tools) to understand aggregate usage patterns. These tools do not track you across other websites.</p>
          <p>You may disable cookies in your browser settings, but some features of the Service may not function correctly without them.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">6. Your rights</h2>
          <p className="mb-3">Depending on your location, you may have the right to:</p>
          <ul className="space-y-2 list-disc list-inside mb-3">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability (receive your data in a machine-readable format)</li>
          </ul>
          <p>To exercise any of these rights, email <a href={`mailto:${EMAIL}`} className="text-[#f97316] hover:underline">{EMAIL}</a>. We will respond within 30 days.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">7. Children</h2>
          <p>Our Service is not directed to children under 16. We do not knowingly collect personal data from anyone under 16. If you believe we have collected data from a minor, contact us and we will delete it promptly.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">8. Security</h2>
          <p>We use industry-standard encryption (TLS in transit, AES-256 at rest) and access controls to protect your data. No system is perfectly secure; we encourage you to use a strong, unique password and to notify us immediately if you believe your account has been compromised.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">9. Changes to this policy</h2>
          <p>We may update this policy from time to time. When we make material changes, we will notify you by email (if you have an account) or by posting a prominent notice on the site at least 7 days before the changes take effect.</p>
        </div>

        <div>
          <h2 className="text-white text-xl font-bold mb-4">10. Contact</h2>
          <p>
            Questions about this policy? Email{" "}
            <a href={`mailto:${EMAIL}`} className="text-[#f97316] hover:underline">{EMAIL}</a>.
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
