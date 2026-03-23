"use client";

import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-slate-950/70 py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-lg font-black tracking-tight ubk-logo mb-4">
              Unbound<span className="text-white/50">Keyword</span>
            </h3>
            <p className="text-white/50 text-sm">
              Cut through the noise and find the keywords that drive revenue.
            </p>
          </div>

          {/* Free Tools */}
          <div>
            <h4 className="font-bold text-white mb-4">Free Tools</h4>
            <ul className="space-y-2">
              <li><Link href="/tools/competitor-research" className="text-white/60 hover:text-white text-sm transition">Competitor Research</Link></li>
              <li><Link href="/tools/local-keywords" className="text-white/60 hover:text-white text-sm transition">Local Keywords</Link></li>
              <li><Link href="/tools/a-z-keywords" className="text-white/60 hover:text-white text-sm transition">A-Z Explorer</Link></li>
              <li><Link href="/tools/keyword-overview" className="text-white/60 hover:text-white text-sm transition">Keyword Overview</Link></li>
              <li><Link href="/tools/content-ideas" className="text-white/60 hover:text-white text-sm transition">Content Ideas</Link></li>
              <li><Link href="/tools/hashtag-research" className="text-white/60 hover:text-white text-sm transition">Hashtag Research</Link></li>
              <li><Link href="/tools/keyword-ideas" className="text-white/60 hover:text-white text-sm transition">Keyword Ideas</Link></li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-bold text-white mb-4">Features</h4>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-white/60 hover:text-white text-sm transition">All Features</Link></li>
              <li><Link href="/features/keyword-research" className="text-white/60 hover:text-white text-sm transition">Keyword Research</Link></li>
              <li><Link href="/features/competitor-analysis" className="text-white/60 hover:text-white text-sm transition">Competitor Analysis</Link></li>
              <li><Link href="/features/local-seo" className="text-white/60 hover:text-white text-sm transition">Local SEO</Link></li>
              <li><Link href="/features/content-strategy" className="text-white/60 hover:text-white text-sm transition">Content Strategy</Link></li>
              <li><Link href="/features/rank-tracking" className="text-white/60 hover:text-white text-sm transition">Rank Tracking</Link></li>
              <li><Link href="/features/a-z-explorer" className="text-white/60 hover:text-white text-sm transition">A-Z Explorer</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-bold text-white mb-4">Solutions</h4>
            <ul className="space-y-2">
              <li><Link href="/for/agencies" className="text-white/60 hover:text-white text-sm transition">For Agencies</Link></li>
              <li><Link href="/for/content-strategists" className="text-white/60 hover:text-white text-sm transition">For Content Teams</Link></li>
              <li><Link href="/for/local-seo" className="text-white/60 hover:text-white text-sm transition">For Local SEO</Link></li>
              <li><Link href="/for/ecommerce" className="text-white/60 hover:text-white text-sm transition">For E-commerce</Link></li>
              <li><Link href="/for/small-business" className="text-white/60 hover:text-white text-sm transition">For Small Business</Link></li>
              <li><Link href="/for/bloggers" className="text-white/60 hover:text-white text-sm transition">For Bloggers</Link></li>
              <li><Link href="/for/startups" className="text-white/60 hover:text-white text-sm transition">For Startups</Link></li>
              <li><Link href="/for/freelancers" className="text-white/60 hover:text-white text-sm transition">For Freelancers</Link></li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="text-white/60 hover:text-white text-sm transition">Pricing</Link></li>
              <li><Link href="/integrations" className="text-white/60 hover:text-white text-sm transition">Integrations</Link></li>
              <li><Link href="/comparison" className="text-white/60 hover:text-white text-sm transition">Comparison</Link></li>
              <li><Link href="/use-cases" className="text-white/60 hover:text-white text-sm transition">Use Cases</Link></li>
              <li><Link href="/how-it-works" className="text-white/60 hover:text-white text-sm transition">How It Works</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-white/60 hover:text-white text-sm transition">About</Link></li>
              <li><Link href="/blog" className="text-white/60 hover:text-white text-sm transition">Blog</Link></li>
              <li><Link href="/contact" className="text-white/60 hover:text-white text-sm transition">Contact</Link></li>
              <li><a href="https://twitter.com/unboundkeyword" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-sm transition">Twitter</a></li>
            </ul>
          </div>

          {/* Redwagon Ecosystem */}
          <div>
            <h4 className="font-bold text-white mb-4">Redwagon Ecosystem</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://redwagon.agency" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-sm transition">
                  redwagon.agency
                </a>
              </li>
              <li>
                <a href="https://ppcgrader.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-sm transition">
                  ppcgrader.com
                </a>
              </li>
              <li>
                <a href="https://e-mailgrader.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-sm transition">
                  e-mailgrader.com
                </a>
              </li>
              <li>
                <a href="https://searchauditpro.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-sm transition">
                  searchauditpro.com
                </a>
              </li>
              <li>
                <a href="https://optinyeti.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-sm transition">
                  optinyeti.com
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
