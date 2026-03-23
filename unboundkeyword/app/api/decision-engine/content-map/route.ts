/**
 * POST /api/decision-engine/content-map
 *
 * Accepts a batch of keywords and a domain, runs the full decision-engine
 * bundle on each, clusters keywords by intent, and returns a prioritised
 * content map with execution phases.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSelectedSiteForUser } from "@/lib/site-context";
import {
  buildDecisionEngineBundle,
  priorityByScore,
  type OpportunityOutput,
  type ActionEngineOutput,
} from "@/lib/decision-engine";

// ─── Types ──────────────────────────────────────────────────────────────────

type ContentIntent = "pillar" | "supporting" | "commercial" | "comparison" | "faq";

type KeywordSignal = {
  keyword: string;
  opportunityScore: number;
  estimatedTraffic: number;
  monetizationPotential: number;
  difficulty: number;
  priority: "High" | "Medium" | "Low";
  intent: ContentIntent;
  blogTitleIdeas: string[];
  contentOutline: ActionEngineOutput["contentOutline"];
  faqSuggestions: string[];
  suggestedCta: string;
};

type ContentCluster = {
  theme: string;
  pillarKeyword: string;
  keywords: KeywordSignal[];
  totalOpportunityScore: number;
  priority: "High" | "Medium" | "Low";
  pillarTitle: string;
  supportingPageTitles: string[];
  internalLinkMap: { from: string; to: string }[];
};

type ExecutionPhase = {
  phase: number;
  label: string;
  rationale: string;
  keywords: string[];
};

export type ContentMapResult = {
  domain: string;
  generatedAt: string;
  totalKeywords: number;
  executiveSummary: string;
  topOpportunities: KeywordSignal[];
  clusters: ContentCluster[];
  executionPlan: ExecutionPhase[];
  quickWins: string[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function detectIntent(keyword: string): ContentIntent {
  const kw = keyword.toLowerCase();
  if (/\bvs\b|versus|compare|comparison|difference|better|best between/.test(kw))
    return "comparison";
  if (/^(buy|order|shop|get|hire|find|pricing|price|cost|cheap|affordable|near me)/.test(kw) ||
      /\b(buy|order|shop|price|cost|hire|service|quote|deal)\b/.test(kw))
    return "commercial";
  if (/^(what|how|why|when|where|who|can|is|are|does|do|should|will)/.test(kw) ||
      /\?$/.test(kw))
    return "faq";
  if (/\b(guide|tutorial|introduction|overview|complete|ultimate|everything|beginners)\b/.test(kw))
    return "pillar";
  return "supporting";
}

function extractTheme(keyword: string): string {
  // Take first 2-3 meaningful words as the cluster theme
  const stopwords = new Set(["the", "a", "an", "to", "for", "of", "in", "on", "at", "with", "and", "or", "is", "are", "how", "what", "why", "when", "where", "who", "can", "does", "do"]);
  const words = keyword
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
  return words.slice(0, 2).join(" ");
}

function clusterKeywords(signals: KeywordSignal[]): ContentCluster[] {
  const themeMap = new Map<string, KeywordSignal[]>();

  for (const sig of signals) {
    const theme = extractTheme(sig.keyword);
    if (!themeMap.has(theme)) themeMap.set(theme, []);
    themeMap.get(theme)!.push(sig);
  }

  const clusters: ContentCluster[] = [];

  for (const [theme, members] of themeMap.entries()) {
    // Pillar = highest opportunity score in this cluster
    const sorted = [...members].sort((a, b) => b.opportunityScore - a.opportunityScore);
    const pillar = sorted[0];
    const supporting = sorted.slice(1);

    const totalScore = members.reduce((s, m) => s + m.opportunityScore, 0);
    const avgScore = totalScore / members.length;

    // Internal link map: supporting pages link to pillar
    const internalLinkMap = supporting.map((s) => ({
      from: s.blogTitleIdeas[0] ?? s.keyword,
      to: pillar.blogTitleIdeas[0] ?? pillar.keyword,
    }));

    clusters.push({
      theme,
      pillarKeyword: pillar.keyword,
      keywords: sorted,
      totalOpportunityScore: Math.round(totalScore),
      priority: priorityByScore(avgScore),
      pillarTitle: pillar.contentOutline.h1 || pillar.blogTitleIdeas[0] || pillar.keyword,
      supportingPageTitles: supporting.map((s) => s.blogTitleIdeas[0] ?? s.keyword),
      internalLinkMap,
    });
  }

  return clusters.sort((a, b) => b.totalOpportunityScore - a.totalOpportunityScore);
}

function buildExecutionPlan(signals: KeywordSignal[]): ExecutionPhase[] {
  const quick = signals.filter((s) => s.opportunityScore >= 70 && s.intent === "faq");
  const authority = signals.filter((s) => s.intent === "pillar" || s.intent === "supporting");
  const commercial = signals.filter((s) => s.intent === "commercial" || s.intent === "comparison");

  return [
    {
      phase: 1,
      label: "Quick Wins (0–30 days)",
      rationale: "FAQ-intent, high score, low-competition questions that can rank within weeks with a well-structured answer page.",
      keywords: quick.slice(0, 10).map((s) => s.keyword),
    },
    {
      phase: 2,
      label: "Authority Building (30–90 days)",
      rationale: "Pillar and supporting content that establishes topical depth across your core themes.",
      keywords: authority.slice(0, 15).map((s) => s.keyword),
    },
    {
      phase: 3,
      label: "Commercial Push (60–180 days)",
      rationale: "Comparison and commercial-intent pages that convert once topical authority is established.",
      keywords: commercial.slice(0, 10).map((s) => s.keyword),
    },
  ];
}

function buildExecutiveSummary(domain: string, signals: KeywordSignal[], clusters: ContentCluster[]): string {
  const highCount = signals.filter((s) => s.priority === "High").length;
  const topCluster = clusters[0];
  const avgScore = Math.round(signals.reduce((s, k) => s + k.opportunityScore, 0) / Math.max(signals.length, 1));
  return `AI analysis of ${signals.length} keywords across ${clusters.length} content clusters for ${domain}. Average opportunity score: ${avgScore}/100. ${highCount} high-priority keywords identified. Top cluster: "${topCluster?.theme ?? "—"}" (${topCluster?.keywords.length ?? 0} keywords). Execute Phase 1 quick wins first to establish relevance signals, then build topical authority with pillar content.`;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user && "id" in session.user ? (session.user.id as string | undefined) : undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    keywords?: string[];
    domain?: string;
    locationCode?: number;
    languageCode?: string;
  };

  const keywords = (body.keywords ?? []).map((k) => k.trim()).filter(Boolean).slice(0, 30);
  if (keywords.length < 1) return NextResponse.json({ error: "At least 1 keyword required" }, { status: 400 });

  const selectedSite = await getSelectedSiteForUser(userId);
  const domain = (body.domain?.trim() || selectedSite?.domain || "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  if (!domain) return NextResponse.json({ error: "domain is required" }, { status: 400 });

  const locationCode = body.locationCode ?? 2840;
  const languageCode = body.languageCode ?? "en";

  // Run bundles in batches of 5 to avoid rate-limit issues
  const signals: KeywordSignal[] = [];
  const batchSize = 5;

  for (let i = 0; i < keywords.length; i += batchSize) {
    const batch = keywords.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((keyword) =>
        buildDecisionEngineBundle({ keyword, domain, locationCode, languageCode })
      )
    );
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      const keyword = batch[j];
      if (r.status === "fulfilled") {
        const b = r.value;
        const opp: OpportunityOutput = b.opportunity;
        const act: ActionEngineOutput = b.action;
        signals.push({
          keyword,
          opportunityScore: opp.opportunityScore,
          estimatedTraffic: opp.estimatedTrafficPotential,
          monetizationPotential: opp.monetizationPotential,
          difficulty: Math.round(100 - opp.difficultyRewardRatio),
          priority: opp.priority,
          intent: detectIntent(keyword),
          blogTitleIdeas: act.blogTitleIdeas,
          contentOutline: act.contentOutline,
          faqSuggestions: act.faqSchemaSuggestions,
          suggestedCta: act.suggestedCta,
        });
      } else {
        // Include with minimal data so user sees the keyword still
        signals.push({
          keyword,
          opportunityScore: 0,
          estimatedTraffic: 0,
          monetizationPotential: 0,
          difficulty: 50,
          priority: "Low",
          intent: detectIntent(keyword),
          blogTitleIdeas: [],
          contentOutline: { h1: keyword, h2: [], h3: [] },
          faqSuggestions: [],
          suggestedCta: "",
        });
      }
    }
  }

  const clusters = clusterKeywords(signals);
  const executionPlan = buildExecutionPlan(signals);
  const topOpportunities = [...signals].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 10);
  const quickWins = signals.filter((s) => s.opportunityScore >= 70 && s.intent === "faq").slice(0, 5).map((s) => s.keyword);
  const executiveSummary = buildExecutiveSummary(domain, signals, clusters);

  const result: ContentMapResult = {
    domain,
    generatedAt: new Date().toISOString(),
    totalKeywords: signals.length,
    executiveSummary,
    topOpportunities,
    clusters,
    executionPlan,
    quickWins,
  };

  return NextResponse.json(result);
}
