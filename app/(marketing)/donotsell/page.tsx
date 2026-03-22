export default function DoNotSellPage() {
  return (
    <div style={{ background: "#f8fafc" }}>
      <section style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1a2d47 60%,#1e429f 100%)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontSize: 42, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>
            Do Not Sell or Share My Personal Information
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 15 }}>California Consumer Privacy Act (CCPA) | Last updated: March 1, 2026</p>
        </div>
      </section>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "48px 56px" }}>
          <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, padding: "16px 20px", marginBottom: 40, display: "flex", gap: 12 }}>
            <span style={{ fontSize: 20 }}>ℹ️</span>
            <p style={{ fontSize: 14, color: "#92400e", lineHeight: 1.6 }}>
              <strong>Our current practice:</strong> SearchAuditPro does not sell or share your personal information with third parties for cross-context behavioral advertising. This page is provided to comply with the California Consumer Privacy Act (CCPA) and similar regulations.
            </p>
          </div>

          {[
            {
              title: "Your Rights Under CCPA",
              content: `If you are a California resident, you have the following rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):

• Right to Know: You have the right to know what personal information we collect, use, disclose, and sell (or share).
• Right to Delete: You have the right to request that we delete your personal information.
• Right to Correct: You have the right to correct inaccurate personal information.
• Right to Opt-Out: You have the right to opt out of the sale or sharing of your personal information.
• Right to Non-Discrimination: We will not discriminate against you for exercising any of these rights.
• Right to Limit Use of Sensitive Personal Information: You may limit how we use sensitive personal information.`
            },
            {
              title: "Categories of Personal Information We Collect",
              content: `We collect the following categories of personal information:

• Identifiers: name, email address, IP address, device identifiers.
• Commercial information: subscription plan, purchase history.
• Internet activity: pages viewed, features used, referral source.
• Professional information: job title, company name (if provided).
• Geolocation data: derived from IP address (country/region/city level only).`
            },
            {
              title: "We Do Not Sell Your Personal Information",
              content: `SearchAuditPro does not sell your personal information in exchange for monetary compensation. We also do not share your personal information for cross-context behavioral advertising purposes.

We do share certain data with service providers (such as our hosting provider and payment processor) that help us deliver our services. These are not "sales" under the CCPA because these providers are bound by data processing agreements and are not permitted to use your data for their own purposes.`
            },
            {
              title: "How to Submit a Request",
              content: `To exercise any of your CCPA rights, you may:

• Email us at: privacy@searchauditpro.com
• Write to us at: SearchAuditPro Inc., 123 Congress Ave, Suite 400, Austin, TX 78701

We will respond to verified requests within 45 days. We may need to verify your identity before processing your request.`
            },
            {
              title: "Authorized Agents",
              content: `You may designate an authorized agent to submit requests on your behalf. Authorized agents must provide written permission from you, and we may still require direct verification from you as the consumer.`
            },
          ].map(section => (
            <div key={section.title} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>{section.title}</h2>
              <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-line" }}>{section.content}</p>
            </div>
          ))}

          {/* Opt-out form */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 32, marginTop: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Submit an Opt-Out Request</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Although we do not currently sell or share personal information, you may submit a formal request for our records.</p>
            <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Full Name</label>
                <input type="text" style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email Address</label>
                <input type="email" style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Request Type</label>
                <select style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: "#fff" }}>
                  <option>Do Not Sell My Personal Information</option>
                  <option>Do Not Share My Personal Information</option>
                  <option>Delete My Personal Information</option>
                  <option>Access My Personal Information</option>
                </select>
              </div>
              <button type="submit" style={{ background: "#1a56db", color: "#fff", border: "none", padding: "13px 0", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
