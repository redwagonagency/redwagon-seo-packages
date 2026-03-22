"use client";

import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-slate-950/50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-black tracking-tight ubk-logo mb-4">
              Unbound<span className="text-white/50">Keyword</span>
            </h3>
            <p className="text-white/50 text-sm">
              Keyword research software built by people who actually do SEO.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-white/60 hover:text-white text-sm transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-white/60 hover:text-white text-sm transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-white/60 hover:text-white text-sm transition">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/comparison" className="text-white/60 hover:text-white text-sm transition">
                  Comparison
                </Link>
              </li>
            </ul>
          </div>

          {/* Use Cases */}
          <div>
            <h4 className="font-bold text-white mb-4">Solutions</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/use-cases" className="text-white/60 hover:text-white text-sm transition">
                  Use Cases
                </Link>
              </li>
              <li>
                <Link href="/for/content-strategists" className="text-white/60 hover:text-white text-sm transition">
                  For Content Teams
                </Link>
              </li>
              <li>
                <Link href="/for/agencies" className="text-white/60 hover:text-white text-sm transition">
                  For Agencies
                </Link>
              </li>
              <li>
                <Link href="/for/local-seo" className="text-white/60 hover:text-white text-sm transition">
                  For Local SEO
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-white/60 hover:text-white text-sm transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white/60 hover:text-white text-sm transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white/60 hover:text-white text-sm transition">
                  Contact
                </Link>
              </li>
              <li>
                <a href="https://twitter.com/unboundkeyword" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-sm transition">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-white/25">
            © 2026 UnBoundKeyword.com · All rights reserved
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-white/40 hover:text-white/80 text-sm transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white/40 hover:text-white/80 text-sm transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
