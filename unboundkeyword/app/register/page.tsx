"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Capture plan from URL so we can route to Stripe after sign-up
  const planParam = searchParams.get("plan") ?? "free";
  const isPaidPlan = planParam !== "free";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Registration failed");
      return;
    }

    // Auto-sign in after successful registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      // Sign-in failed — send to login with plan hint
      router.push(isPaidPlan ? `/login?plan=${planParam}` : "/login?registered=1");
      return;
    }

    // Redirect paid plans straight to Stripe checkout; free plan to dashboard
    if (isPaidPlan) {
      window.location.href = `/api/billing/checkout?plan=${planParam}`;
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="ubk-bg min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black ubk-logo">
            Unbound<span className="text-white/50">Keyword</span>
          </Link>
          <p className="text-white/40 mt-2 text-sm">Create your free account</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-white/70">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:border-[#f15b27]/60 focus:ring-2 focus:ring-[#f15b27]/20 transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-white/70">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:border-[#f15b27]/60 focus:ring-2 focus:ring-[#f15b27]/20 transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-white/70">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-white/[0.06] border border-white/[0.12] text-white placeholder:text-white/25 focus:outline-none focus:border-[#f15b27]/60 focus:ring-2 focus:ring-[#f15b27]/20 transition"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="ubk-btn-primary w-full py-3 rounded-xl text-sm font-black mt-1 disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="relative my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={() => void signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] text-white text-sm font-semibold hover:bg-white/[0.10] transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mt-5 text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link href="/login" className="text-[#f97316] font-semibold hover:text-[#f15b27] transition">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
