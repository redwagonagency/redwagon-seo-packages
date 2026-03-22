import {
  getDomainCompetitors,
  getDomainRankOverview,
  getKeywordGap,
  getKeywordOverviewLabs,
  getSerpFeatures,
  getTopSearches,
} from "@/lib/dataforseo/client";

export type Priority = "High" | "Medium" | "Low";

export type InsightBlock = {
  insight: string;
  recommendation: string;
  action: string;
};

export type OpportunityOutput = {
  keyword: string;
  opportunityScore: number;
  estimatedTrafficPotential: number;
  monetizationPotential: number;
  aiOverviewLikelihood: number;
  difficultyRewardRatio: number;
  whyWorthPursuing: string;
  priority: Priority;
  block: InsightBlock;
};

export type ActionEngineOutput = {
  keyword: string;
  blogTitleIdeas: string[];
  contentOutline: {
    h1: string;
    h2: string[];
    h3: string[];
  };
  keyTalkingPoints: string[];
  faqSchemaSuggestions: string[];
  internalLinkSuggestions: string[];
  suggestedCta: string;
  block: InsightBlock;
};

export type AeoOutput = {
  keyword: string;
  snippetReadyAnswers: string[];
  structuredFormatting: string[];
  paragraphLengthRecommendation: string;
  schemaTypes: string[];
  winPlan: string;
  aiOverviewLikelihood: number;
  block: InsightBlock;
};

export type GapItem = {
  keyword: string;
  volume: number;
  competitorDomain: string;
  yourPosition: number | null;
  competitorPosition: number | null;
  priority: Priority;
  nextAction: string;
};

export type CompetitorGapOutput = {
  domain: string;
  fastWinGaps: GapItem[];
  weakContentAreas: string[];
  block: InsightBlock;
};

export type DailyIntelItem = {
  title: string;
  impactScore: number;
  priority: Priority;
  whatChanged: string;
  whyItMatters: string;
  whatYouShouldDo: string;
};

export function priorityByScore(score: number): Priority {
  if (score >= 75) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreFromKeywordOverview(
  volume: number,
  cpc: number,
  difficulty: number,
  aiLikelihood: number
): { opportunityScore: number; difficultyRewardRatio: number } {
  const volumeScore = clamp(Math.round((Math.log10(Math.max(volume, 1)) / 6) * 100), 0, 100);
  const cpcScore = clamp(Math.round((Math.min(cpc, 30) / 30) * 100), 0, 100);
  const difficultyPenalty = clamp(difficulty, 0, 100);

  const reward = Math.round(volumeScore * 0.55 + cpcScore * 0.3 + aiLikelihood * 0.15);
  const opportunityScore = clamp(Math.round(reward - difficultyPenalty * 0.35), 0, 100);
  const ratio = Number(((difficultyPenalty + 1) / Math.max(reward, 1)).toFixed(2));
  return { opportunityScore, difficultyRewardRatio: ratio };
}

function buildInsightBlock(mode: "opportunity" | "action" | "aeo" | "gap", keywordOrDomain: string): InsightBlock {
  if (mode === "opportunity") {
    return {
      insight: `Search demand + CPC indicate measurable upside for ${keywordOrDomain}.`,
      recommendation: "Prioritize this keyword in your next publishing sprint and map it to a single conversion goal.",
      action: "Create one primary landing page and one support article within 72 hours.",
    };
  }
  if (mode === "action") {
    return {
      insight: `The topic ${keywordOrDomain} benefits from comparison + implementation content formats.`,
      recommendation: "Ship one deep guide and one conversion-focused comparison page.",
      action: "Use the generated outline + FAQ schema and publish with internal links in one session.",
    };
  }
  if (mode === "aeo") {
    return {
      insight: `AI Overviews favor direct answers, structure, and clear entity context for ${keywordOrDomain}.`,
      recommendation: "Front-load concise answers and schema blocks above fold.",
      action: "Add FAQ + HowTo schema and tighten intro answer blocks to 40-60 words.",
    };
  }
  return {
    insight: `Competitive overlap reveals under-served opportunities around ${keywordOrDomain}.`,
    recommendation: "Target the highest-volume weak/missing keywords before broad expansion.",
    action: "Execute top 3 fast-win gaps first and track movement weekly.",
  };
}

export async function buildOpportunityEngine(input: {
  keyword: string;
  domain: string;
  locationCode?: number;
  languageCode?: string;
}): Promise<OpportunityOutput> {
  const locationCode = input.locationCode ?? 2840;
  const languageCode = input.languageCode ?? "en";

  const [overviewRows, serpFeatures] = await Promise.all([
    getKeywordOverviewLabs([input.keyword], locationCode, languageCode).catch(() => []),
    getSerpFeatures(input.keyword, input.domain, locationCode).catch(() => null),
  ]);

  const row = overviewRows[0] ?? null;
  const volume = row?.searchVolume ?? 0;
  const cpc = row?.cpc ?? 0;
  const difficulty = row?.competition != null ? Math.round(row.competition * 100) : 45;

  const aiLikelihood = serpFeatures
    ? clamp(
        (serpFeatures.hasAiOverview ? 45 : 20) +
          (serpFeatures.hasPeopleAlsoAsk ? 20 : 0) +
          (serpFeatures.hasFeaturedSnippet ? 20 : 0) +
          (serpFeatures.hasVideoCarousel ? 5 : 0),
        0,
        100
      )
    : 30;

  const { opportunityScore, difficultyRewardRatio } = scoreFromKeywordOverview(volume, cpc, difficulty, aiLikelihood);
  const estimatedTrafficPotential = Math.round(volume * 0.28);
  const monetizationPotential = Math.round(estimatedTrafficPotential * Math.max(cpc, 1.2) * 0.07);

  const priority = priorityByScore(opportunityScore);
  const whyWorthPursuing =
    opportunityScore >= 70
      ? "Strong upside with favorable risk-reward. Fast to monetize if execution is focused."
      : opportunityScore >= 45
      ? "Moderate upside. Worth pursuing when paired with intent-matched content and internal links."
      : "Higher difficulty relative to reward. Best as a secondary keyword cluster target.";

  return {
    keyword: input.keyword,
    opportunityScore,
    estimatedTrafficPotential,
    monetizationPotential,
    aiOverviewLikelihood: aiLikelihood,
    difficultyRewardRatio,
    whyWorthPursuing,
    priority,
    block: buildInsightBlock("opportunity", input.keyword),
  };
}

export function buildActionEngine(keyword: string): ActionEngineOutput {
  const base = keyword.trim();
  const blogTitleIdeas = [
    `How to Win ${base} in 2026: A Practical Playbook`,
    `${base}: Strategy, Costs, and What Actually Works`,
    `${base} vs Alternatives: What to Choose and Why`,
    `${base} Checklist: 14 Steps to Better Rankings`,
    `Beginner to Pro: ${base} Framework for Growth`,
  ];

  const contentOutline = {
    h1: `${base}: Complete Execution Guide`,
    h2: [
      `What ${base} means in today's SERP`,
      `How to evaluate opportunity before creating content`,
      `Step-by-step implementation plan`,
      `Common mistakes and fixes`,
      `Measurement and optimization loop`,
    ],
    h3: [
      "Intent mapping and audience stage",
      "SERP feature targeting",
      "Internal linking architecture",
      "Conversion CTA placement",
      "Weekly KPI scorecard",
    ],
  };

  const keyTalkingPoints = [
    "Match content format to SERP intent before writing.",
    "Use concise answer blocks for AI retrieval.",
    "Pair each section with one measurable user outcome.",
    "Embed internal links where decision friction appears.",
    "Close with one action CTA, not multiple competing CTAs.",
  ];

  const faqSchemaSuggestions = [
    `What is ${base}?`,
    `How long does ${base} take to show results?`,
    `Is ${base} worth it for small businesses?`,
    `How much does ${base} cost?`,
    `What are the best tools for ${base}?`,
  ];

  const internalLinkSuggestions = [
    "Link to your core service page from intro + conclusion.",
    "Link to a pricing or ROI calculator section before CTA.",
    "Link to at least 2 supporting guides with anchor text variations.",
    "Add a comparison page link near decision-stage paragraphs.",
  ];

  return {
    keyword,
    blogTitleIdeas,
    contentOutline,
    keyTalkingPoints,
    faqSchemaSuggestions,
    internalLinkSuggestions,
    suggestedCta: "Book an SEO opportunity teardown for this keyword cluster.",
    block: buildInsightBlock("action", keyword),
  };
}

export async function buildAeoEngine(input: {
  keyword: string;
  domain: string;
  locationCode?: number;
}): Promise<AeoOutput> {
  const features = await getSerpFeatures(input.keyword, input.domain, input.locationCode ?? 2840).catch(() => null);
  const aiLikelihood = features
    ? clamp(
        (features.hasAiOverview ? 50 : 20) +
          (features.hasPeopleAlsoAsk ? 25 : 0) +
          (features.hasFeaturedSnippet ? 15 : 0) +
          (features.hasMapPack ? 5 : 0),
        0,
        100
      )
    : 35;

  const snippetReadyAnswers = [
    `${input.keyword} is most effective when tied to a measurable business outcome and intent-matched page type.`,
    `The fastest gains for ${input.keyword} come from concise answer blocks, schema markup, and internal links to conversion pages.`,
    `To rank ${input.keyword}, publish structured content that answers one core question per section in plain language.`,
  ];

  return {
    keyword: input.keyword,
    snippetReadyAnswers,
    structuredFormatting: [
      "Start sections with a direct 1-2 sentence answer.",
      "Use short paragraphs + bullet lists for scannability.",
      "Include comparison tables where decision intent exists.",
      "Surface one key statistic per section with citation.",
    ],
    paragraphLengthRecommendation: "40-60 words for definition/answer blocks, 90-140 words for explanatory blocks.",
    schemaTypes: ["FAQPage", "HowTo", "Article", "BreadcrumbList"],
    winPlan: "Add answer-first intros, implement FAQ + HowTo schema, and reformat top sections for extraction readability.",
    aiOverviewLikelihood: aiLikelihood,
    block: buildInsightBlock("aeo", input.keyword),
  };
}

export async function buildCompetitorGapEngine(input: {
  domain: string;
  locationCode?: number;
  languageCode?: string;
}): Promise<CompetitorGapOutput> {
  const locationCode = input.locationCode ?? 2840;
  const languageCode = input.languageCode ?? "en";

  const competitorRows = await getDomainCompetitors(input.domain, locationCode, languageCode, 6).catch(() => []);
  const competitorDomains = competitorRows.map((row) => row.domain).filter(Boolean).slice(0, 4);

  const gaps = competitorDomains.length > 0
    ? await getKeywordGap(input.domain, competitorDomains, locationCode, languageCode, 60).catch(() => [])
    : [];

  const fastWinGaps: GapItem[] = gaps.slice(0, 20).map((gap) => {
    const bestCompetitor = gap.competitorPositions
      .filter((item) => item.position != null)
      .sort((a, b) => (a.position as number) - (b.position as number))[0];

    const volume = gap.volume ?? 0;
    const urgency = (gap.yourPosition == null ? 25 : Math.max(0, (gap.yourPosition - (bestCompetitor?.position ?? 30)) * 2)) +
      (volume > 2000 ? 40 : volume > 500 ? 25 : 10);

    return {
      keyword: gap.keyword,
      volume,
      competitorDomain: bestCompetitor?.domain ?? "competitor",
      yourPosition: gap.yourPosition,
      competitorPosition: bestCompetitor?.position ?? null,
      priority: priorityByScore(clamp(urgency, 0, 100)),
      nextAction:
        gap.yourPosition == null
          ? "Create net-new page targeting this term with intent-aligned structure."
          : "Refresh existing page and strengthen internal links + answer blocks.",
    };
  });

  const weakContentAreas = [
    "Comparison pages are underrepresented vs competitors.",
    "Question-led bottom-funnel content is thin.",
    "Entity coverage and schema depth are weaker on money pages.",
  ];

  return {
    domain: input.domain,
    fastWinGaps,
    weakContentAreas,
    block: buildInsightBlock("gap", input.domain),
  };
}

export async function buildDailyIntelFeed(topic: string): Promise<DailyIntelItem[]> {
  const topSearches = await getTopSearches(2840, "en", 20).catch(() => []);

  const seed = topic.trim().toLowerCase();
  const filtered = topSearches
    .filter((item) => item.query.toLowerCase().includes(seed.split(" ")[0] ?? seed))
    .slice(0, 8);

  const rows = (filtered.length > 0 ? filtered : topSearches.slice(0, 8)).map((item, index) => {
    const trend = item.trend ?? 0;
    const impactScore = clamp(
      Math.round((item.searchVolume / 1000) * 12 + trend * 4 + (8 - index) * 3),
      10,
      100
    );

    return {
      title: item.query,
      impactScore,
      priority: priorityByScore(impactScore),
      whatChanged: `Search momentum for \"${item.query}\" shifted with volume around ${item.searchVolume.toLocaleString()}/mo.`,
      whyItMatters: "This affects topical demand and can open short-window ranking opportunities.",
      whatYouShouldDo: "Publish or refresh one page this week targeting this intent cluster.",
    };
  });

  return rows;
}

export async function buildDecisionEngineBundle(input: {
  keyword: string;
  domain: string;
  locationCode?: number;
  languageCode?: string;
}) {
  const [opportunity, aeo, gap] = await Promise.all([
    buildOpportunityEngine(input),
    buildAeoEngine({ keyword: input.keyword, domain: input.domain, locationCode: input.locationCode }),
    buildCompetitorGapEngine({ domain: input.domain, locationCode: input.locationCode, languageCode: input.languageCode }),
  ]);

  const action = buildActionEngine(input.keyword);
  const dailyFeed = await buildDailyIntelFeed(input.keyword);

  return {
    generatedAt: new Date().toISOString(),
    input,
    opportunity,
    action,
    aeo,
    competitorGap: gap,
    dailyFeed,
  };
}
