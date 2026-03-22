export default function PrivacyPage() {
  return (
    <div style={{ background: "#f8fafc" }}>
      <section style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1a2d47 60%,#1e429f 100%)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>Privacy Policy</h1>
          <p style={{ color: "#94a3b8", fontSize: 15 }}>Last updated: March 1, 2026</p>
        </div>
      </section>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "48px 56px" }}>
          {[
            {
              title: "1. Information We Collect",
              content: `We collect information you provide directly to us, including when you create an account, connect integrations, or contact support. This includes:

• Account information: name, email address, password (hashed), and profile details.
• Payment information: processed securely by Stripe. We do not store credit card numbers.
• Connected service data: OAuth tokens for Google Search Console and Google Analytics 4, which are encrypted at rest.
• Usage data: pages visited, features used, and interaction patterns to improve the product.
• SEO project data: domains, keywords, and audit results you enter into the platform.`
            },
            {
              title: "2. How We Use Your Information",
              content: `We use the information we collect to:

• Provide, maintain, and improve our services.
• Process transactions and send billing-related notifications.
• Send product updates, security alerts, and support messages.
• Respond to comments and questions.
• Monitor and analyze usage trends to improve your experience.
• Detect and prevent fraudulent transactions or other illegal activities.`
            },
            {
              title: "3. Data Sharing and Disclosure",
              content: `We do not sell, trade, or rent your personal information to third parties. We may share your information with:

• Service providers: companies that help us deliver our services (Stripe for payments, AWS for hosting, SendGrid for email). These parties are bound by confidentiality agreements.
• DataForSEO: domains and keywords you track are transmitted to DataForSEO to retrieve SEO data. Please review DataForSEO's privacy policy for their data handling practices.
• Law enforcement: when required by law, court order, or governmental authority.
• Business transfers: in connection with a merger, acquisition, or sale of company assets.`
            },
            {
              title: "4. Data Security",
              content: `We take data security seriously. All data is encrypted in transit using TLS 1.3 and at rest using AES-256. We conduct regular security audits, maintain SOC 2 Type II compliance, and follow industry best practices for access control and data handling.

If you discover a security vulnerability, please report it responsibly to security@searchauditpro.com.`
            },
            {
              title: "5. Data Retention",
              content: `We retain your data for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes.`
            },
            {
              title: "6. Your Rights",
              content: `Depending on your location, you may have the right to:

• Access the personal data we hold about you.
• Correct inaccurate or incomplete data.
• Request deletion of your data ("right to be forgotten").
• Object to or restrict processing of your data.
• Export your data in a portable format.
• Withdraw consent where processing is based on consent.

To exercise any of these rights, contact us at privacy@searchauditpro.com.`
            },
            {
              title: "7. Cookies",
              content: `We use cookies and similar tracking technologies to maintain sessions, remember your preferences, and analyze site usage. We use:

• Essential cookies: required for the platform to function.
• Analytics cookies: help us understand how users interact with our product (Google Analytics 4).
• Marketing cookies: optional, used for advertising if you consent.

You can manage cookie preferences through your browser settings or our cookie consent manager.`
            },
            {
              title: "8. Contact Us",
              content: `If you have any questions about this Privacy Policy, please contact us at:

SearchAuditPro Inc.
privacy@searchauditpro.com
123 Congress Ave, Suite 400
Austin, TX 78701`
            },
          ].map(section => (
            <div key={section.title} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>{section.title}</h2>
              <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-line" }}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
