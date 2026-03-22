export default function TermsPage() {
  return (
    <div style={{ background: "#f8fafc" }}>
      <section style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1a2d47 60%,#1e429f 100%)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>Terms of Service</h1>
          <p style={{ color: "#94a3b8", fontSize: 15 }}>Last updated: March 1, 2026</p>
        </div>
      </section>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "48px 56px" }}>
          {[
            {
              title: "1. Acceptance of Terms",
              content: `By accessing or using SearchAuditPro ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all users, including individuals, agencies, and organizations.`
            },
            {
              title: "2. Account Registration",
              content: `You must create an account to use most features of the Service. You agree to:

• Provide accurate, current, and complete information during registration.
• Maintain the security of your password and account.
• Promptly notify us of any unauthorized use of your account.
• Be responsible for all activities that occur under your account.

You must be at least 18 years old to create an account.`
            },
            {
              title: "3. Acceptable Use",
              content: `You agree not to use the Service to:

• Violate any applicable laws or regulations.
• Crawl or scrape websites without authorization.
• Attempt to gain unauthorized access to our systems or other users' accounts.
• Transmit any malicious code, viruses, or harmful software.
• Engage in any activity that unreasonably burdens our infrastructure.
• Resell or redistribute API access without written permission.
• Use the Service for spam, phishing, or deceptive practices.`
            },
            {
              title: "4. Subscription and Billing",
              content: `SearchAuditPro offers paid subscription plans. By subscribing, you agree to:

• Pay all fees associated with your selected plan.
• Automatic renewal at the end of each billing period unless cancelled.
• No refunds for partial months, except where required by law.
• Annual plan subscribers are entitled to a 30-day money-back guarantee.

We reserve the right to modify pricing with 30 days' advance notice.`
            },
            {
              title: "5. Data and Content",
              content: `You retain ownership of all data you input into the Service. By using the Service, you grant us a limited license to process your data to provide the Service.

We will not sell your data or use it for purposes unrelated to providing the Service. You are responsible for ensuring you have the right to use any domains, keywords, or content you enter into the platform.`
            },
            {
              title: "6. Third-Party Services",
              content: `The Service integrates with third-party services including DataForSEO, Google Search Console, Google Analytics, and Stripe. Your use of these integrations is also governed by the respective third-party terms of service. We are not responsible for any third-party service downtime or data inaccuracies.`
            },
            {
              title: "7. Service Availability",
              content: `We strive to maintain 99.9% uptime, but we do not guarantee uninterrupted access. We may perform scheduled maintenance with advance notice. We are not liable for any downtime or data loss resulting from circumstances beyond our reasonable control.`
            },
            {
              title: "8. Intellectual Property",
              content: `SearchAuditPro and all related software, designs, text, and content are proprietary to SearchAuditPro Inc. and protected by copyright and trademark law. You may not copy, reproduce, or distribute any part of the Service without our express written consent.`
            },
            {
              title: "9. Limitation of Liability",
              content: `To the maximum extent permitted by law, SearchAuditPro Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, resulting from your use of or inability to use the Service.`
            },
            {
              title: "10. Governing Law",
              content: `These Terms are governed by the laws of the State of Texas, United States, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Travis County, Texas.`
            },
            {
              title: "11. Changes to Terms",
              content: `We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice on the Service. Continued use of the Service after changes constitutes acceptance of the updated Terms.`
            },
            {
              title: "12. Contact",
              content: `For questions about these Terms, contact us at:
legal@searchauditpro.com`
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
