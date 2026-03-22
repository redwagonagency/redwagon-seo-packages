"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }
      // Sign in automatically after registration
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0d1b2a", display: "flex", padding: 24 }}>
      {/* Left panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          {/* Logo */}
          <div style={{ marginBottom: 40 }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#1a56db,#06b6d4)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 20 }}>SearchAudit<span style={{ color: "#06b6d4" }}>Pro</span></span>
            </Link>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>Start your free trial</h1>
          <p style={{ fontSize: 15, color: "#64748b", marginBottom: 32 }}>14 days free. No credit card required.</p>

          {/* Social Sign Up */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#ffffff", padding: "12px 0", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ color: "#475569", fontSize: 13 }}>or register with email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 32 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontSize: 14 }}>
                  {error}
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Marcus Webb"
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#ffffff", padding: "12px 14px", borderRadius: 9, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#ffffff", padding: "12px 14px", borderRadius: 9, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#94a3b8", marginBottom: 8 }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#ffffff", padding: "12px 14px", borderRadius: 9, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ background: "#1a56db", color: "#ffffff", border: "none", padding: "14px 0", borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Creating account…" : "Create Free Account"}
              </button>
              <p style={{ fontSize: 12, color: "#475569", textAlign: "center", lineHeight: 1.6 }}>
                By creating an account, you agree to our{" "}
                <Link href="/terms" style={{ color: "#64748b", textDecoration: "underline" }}>Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" style={{ color: "#64748b", textDecoration: "underline" }}>Privacy Policy</Link>.
              </p>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, color: "#64748b", fontSize: 14 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#06b6d4", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right panel - value props */}
      <div style={{ width: 420, background: "rgba(255,255,255,0.02)", borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", marginBottom: 32 }}>Everything you need to rank higher</h2>
          {[
            "14-day free trial, no credit card required",
            "Full access to all features during trial",
            "Site audit, rank tracking & backlink analysis",
            "LLM visibility monitoring for AI search",
            "Google Search Console & GA4 integration",
            "Cancel anytime — no contracts",
          ].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 22, height: 22, background: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, marginTop: 1 }}>
                <CheckIcon />
              </div>
              <span style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 20, marginTop: 40 }}>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, fontStyle: "italic", marginBottom: 12 }}>
              &ldquo;SearchAuditPro saved our agency 20 hours per week. The automated audits and reports are a game-changer.&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#1a56db,#06b6d4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>SM</div>
              <div>
                <p style={{ fontSize: 13, color: "#ffffff", fontWeight: 600 }}>Sarah Mitchell</p>
                <p style={{ fontSize: 12, color: "#64748b" }}>SEO Director, Nexus Digital</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
