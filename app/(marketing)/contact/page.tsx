export default function ContactPage() {
  return (
    <div style={{ background: "#f8fafc" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#1a2d47 60%,#1e429f 100%)", padding: "80px 24px 64px", textAlign: "center" }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: "#ffffff", lineHeight: 1.15, marginBottom: 16, letterSpacing: -1 }}>
          Get in Touch
        </h1>
        <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
          Have a question, need support, or want to explore enterprise pricing? We&apos;d love to hear from you.
        </p>
      </section>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 60 }}>
        {/* Contact Info */}
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 32 }}>Contact Options</h2>

          {[
            { icon: "💬", title: "Live Chat", desc: "Available Mon–Fri, 9am–6pm EST. Click the chat icon at the bottom right to start a conversation.", cta: "Start Chat" },
            { icon: "📧", title: "Email Support", desc: "For general questions and technical support. We respond within 24 hours.", cta: "support@searchauditpro.com" },
            { icon: "📞", title: "Sales", desc: "Interested in the Enterprise plan or volume pricing? Talk to our sales team.", cta: "sales@searchauditpro.com" },
            { icon: "🏢", title: "Office", desc: "SearchAuditPro Inc.\n123 Congress Ave, Suite 400\nAustin, TX 78701\nUnited States", cta: null },
          ].map(item => (
            <div key={item.title} style={{ display: "flex", gap: 16, marginBottom: 28 }}>
              <div style={{ width: 48, height: 48, background: "#1a56db14", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: item.cta ? 8 : 0, whiteSpace: "pre-line" }}>{item.desc}</p>
                {item.cta && (
                  <span style={{ fontSize: 14, color: "#1a56db", fontWeight: 600 }}>{item.cta}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Send Us a Message</h2>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 28 }}>Fill out the form and we&apos;ll get back to you within one business day.</p>

          <form style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>First Name</label>
                <input type="text" placeholder="Marcus" style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Last Name</label>
                <input type="text" placeholder="Webb" style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email Address</label>
              <input type="email" placeholder="marcus@youragency.com" style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Subject</label>
              <select style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff" }}>
                <option>General Question</option>
                <option>Technical Support</option>
                <option>Billing & Account</option>
                <option>Enterprise Sales</option>
                <option>Partnership Inquiry</option>
                <option>Feature Request</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Message</label>
              <textarea placeholder="Tell us how we can help..." rows={6} style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
            </div>
            <button type="submit" style={{ background: "#1a56db", color: "#fff", border: "none", padding: "14px 0", borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
