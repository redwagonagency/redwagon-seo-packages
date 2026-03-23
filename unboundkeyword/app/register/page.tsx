"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registration failed");
    } else {
      router.push("/login?registered=1");
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
