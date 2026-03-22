"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatNumber, cn } from "@/lib/utils";

type DomainOverview = {
  domain: string;
  organicKeywords: number;
  organicTraffic: number;
  domainRank: number;
  etv: number;
  topKeywords: { keyword: string; position: number; traffic: number }[];
};

type SuggestedCompetitor = {
  domain: string;
  intersections: number;
  avgPosition: number | null;
  etv: number | null;
};

type GapKeyword = {
  keyword: string;
  volume: number | null;
  yourPosition: number | null;
  competitorPosition: number | null;
  opportunity: string;
};

type TargetKeyword = {
  keyword: string;
  url: string | null;
  position: number;
  searchVolume: number;
  traffic: number;
};

type IntelligenceResponse = {
  domain: string;
  competitorDomain: string | null;
  yourOverview: DomainOverview | null;
  suggestedCompetitors: SuggestedCompetitor[];
  competitorOverview: DomainOverview | null;
  gapKeywords: GapKeyword[];
  competitorTargetKeywords: TargetKeyword[];
};

const DOMAIN_PRESETS = [
  "semrush.com",
  "ahrefs.com",
  "moz.com",
  "hubspot.com",
  "shopify.com",
];

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn("rounded-2xl border p-4", tone)}>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">{label}</div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

export default function CompetitorIntelligenceClient() {
  const [domain, setDomain] = useState("");
  const [competitorDomain, setCompetitorDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<IntelligenceResponse | null>(null);

  async function requestAnalysis(presetCompetitor?: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/competitors/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          competitorDomain: presetCompetitor ?? competitorDomain,
        }),
      });

      const data = (await res.json()) as IntelligenceResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Competitor analysis failed");

      setResult(data);
      setCompetitorDomain(data.competitorDomain ?? presetCompetitor ?? competitorDomain);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis(e: FormEvent) {
    e.preventDefault();
    await requestAnalysis();
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.22),_transparent_38%),linear-gradient(135deg,_#0f172a,_#111827_60%,_#1e293b)] p-7 text-white shadow-2xl">
            <Badge variant="orange" className="mb-4 bg-white/10 text-orange-200">Competitor Intelligence</Badge>
            <h1 className="text-3xl font-black tracking-tight mb-3">Replace site audit with real market targeting research</h1>
            <p className="text-sm leading-6 text-slate-300 mb-6">
              Find who competes with you, what those domains target, and where their highest-value keyword gaps are.
            </p>

            <form onSubmit={(event) => void runAnalysis(event)} className="space-y-4">
              <Input
                label="Your domain"
                placeholder="yourdomain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="border-white/15 bg-white text-slate-900"
                required
              />
              <Input
                label="Competitor domain"
                placeholder="optional: competitor.com"
                value={competitorDomain}
                onChange={(e) => setCompetitorDomain(e.target.value)}
                className="border-white/15 bg-white text-slate-900"
              />
              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 focus:ring-orange-400">
                {loading ? "Mapping competitors..." : "Run competitor intelligence"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">Try a known market leader</div>
              <div className="flex flex-wrap gap-2">
                {DOMAIN_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDomain(preset)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          <Card>
            <CardHeader>
              <div className="text-sm font-semibold text-slate-900">How this page works</div>
            </CardHeader>
            <CardBody className="space-y-2 text-sm text-slate-600">
              <p>1. Enter your domain to discover overlapping organic competitors.</p>
              <p>2. Pick a competitor to compare their targeted keywords against your current footprint.</p>
              <p>3. Use gap keywords and target pages to decide what content, product pages, or landing pages to build next.</p>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {!result ? (
            <Card className="min-h-[460px] flex items-center justify-center border-dashed border-slate-300 bg-slate-50">
              <CardBody className="text-center max-w-xl">
                <div className="text-4xl mb-4">⚔️</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Competitor intelligence workspace</h2>
                <p className="text-sm text-slate-500 leading-6">
                  This replaces the old site-audit slot with keyword-market research: suggested competitors, their top targets, and the keyword gaps they own.
                </p>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard label="Your Keywords" value={formatNumber(result.yourOverview?.organicKeywords ?? 0)} tone="border-violet-200 bg-violet-50" />
                <StatCard label="Your Traffic" value={formatNumber(result.yourOverview?.organicTraffic ?? 0)} tone="border-blue-200 bg-blue-50" />
                <StatCard label="Competitors Found" value={String(result.suggestedCompetitors.length)} tone="border-amber-200 bg-amber-50" />
                <StatCard label="Gap Keywords" value={String(result.gapKeywords.length)} tone="border-emerald-200 bg-emerald-50" />
              </div>

              <Card>
                <CardHeader className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">Suggested competitors</div>
                    <div className="text-sm text-slate-500">Choose one to populate the comparison side automatically.</div>
                  </div>
                  <Badge variant="orange">{result.domain}</Badge>
                </CardHeader>
                <CardBody className="grid gap-3 md:grid-cols-2">
                  {result.suggestedCompetitors.length === 0 ? (
                    <div className="text-sm text-slate-500">No competitor suggestions returned for this domain yet.</div>
                  ) : result.suggestedCompetitors.map((competitor) => (
                    <button
                      key={competitor.domain}
                      type="button"
                      onClick={() => void requestAnalysis(competitor.domain)}
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-left transition",
                        result.competitorDomain === competitor.domain
                          ? "border-orange-300 bg-orange-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="font-semibold text-slate-900">{competitor.domain}</div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                        <div>
                          <div className="uppercase tracking-wide">Overlap</div>
                          <div className="font-semibold text-slate-800">{formatNumber(competitor.intersections)}</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wide">Avg Pos</div>
                          <div className="font-semibold text-slate-800">{competitor.avgPosition ?? "-"}</div>
                        </div>
                        <div>
                          <div className="uppercase tracking-wide">ETV</div>
                          <div className="font-semibold text-slate-800">{formatNumber(competitor.etv ?? 0)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardBody>
              </Card>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="text-lg font-semibold text-slate-900">Your footprint</div>
                    <div className="text-sm text-slate-500">Top current targets on your domain.</div>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    {(result.yourOverview?.topKeywords ?? []).slice(0, 8).map((keyword) => (
                      <div key={keyword.keyword} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <div>
                          <div className="font-medium text-slate-900">{keyword.keyword}</div>
                          <div className="text-xs text-slate-500">Position {keyword.position}</div>
                        </div>
                        <Badge variant="blue">Traffic {formatNumber(keyword.traffic)}</Badge>
                      </div>
                    ))}
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="text-lg font-semibold text-slate-900">Competitor targeting</div>
                    <div className="text-sm text-slate-500">What {result.competitorDomain ?? "your competitor"} is actively ranking with.</div>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    {result.competitorTargetKeywords.slice(0, 8).map((keyword) => (
                      <div key={`${keyword.keyword}-${keyword.url ?? ""}`} className="rounded-xl bg-slate-50 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-slate-900">{keyword.keyword}</div>
                            <div className="text-xs text-slate-500 break-all">{keyword.url ?? "No URL returned"}</div>
                          </div>
                          <Badge variant="purple">Pos {keyword.position}</Badge>
                        </div>
                        <div className="mt-2 flex gap-4 text-xs text-slate-500">
                          <span>Volume {formatNumber(keyword.searchVolume)}</span>
                          <span>Traffic {formatNumber(keyword.traffic)}</span>
                        </div>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">High-value keyword gaps</div>
                    <div className="text-sm text-slate-500">Keywords the competitor owns where you are missing or weak.</div>
                  </div>
                  {result.competitorDomain ? <Badge variant="red">vs {result.competitorDomain}</Badge> : null}
                </CardHeader>
                <CardBody className="overflow-x-auto">
                  {result.gapKeywords.length === 0 ? (
                    <div className="text-sm text-slate-500">Choose a competitor to see their keyword gap profile.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500">
                          <th className="px-2 py-3 text-left font-semibold">Keyword</th>
                          <th className="px-2 py-3 text-right font-semibold">Volume</th>
                          <th className="px-2 py-3 text-center font-semibold">Your Pos</th>
                          <th className="px-2 py-3 text-center font-semibold">Competitor Pos</th>
                          <th className="px-2 py-3 text-center font-semibold">Opportunity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.gapKeywords.slice(0, 24).map((keyword) => (
                          <tr key={keyword.keyword} className="border-b border-slate-50">
                            <td className="px-2 py-3 font-medium text-slate-900">{keyword.keyword}</td>
                            <td className="px-2 py-3 text-right text-slate-600">{formatNumber(keyword.volume ?? 0)}</td>
                            <td className="px-2 py-3 text-center text-slate-600">{keyword.yourPosition ?? "-"}</td>
                            <td className="px-2 py-3 text-center text-slate-600">{keyword.competitorPosition ?? "-"}</td>
                            <td className="px-2 py-3 text-center">
                              <Badge variant={keyword.opportunity === "missing" ? "red" : "orange"}>{keyword.opportunity}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardBody>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}