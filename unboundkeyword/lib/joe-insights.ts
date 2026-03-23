type IndustryStat = {
  metricKey: string;
  metricValue: number;
  unit: string | null;
  note: string | null;
};

type JoeInsightInput = {
  domain: string;
  listCount: number;
  keywordCount: number;
  topKeyword: string | null;
  topKeywordVolume: number;
  avgKeywordCpc: number;
  industryStats: IndustryStat[];
};

export type JoeInsightResult = {
  headline: string;
  body: string;
  action: string;
  metric1: { label: string; value: string };
  metric2: { label: string; value: string };
  metric3: { label: string; value: string };
};

export function buildJoeInsight(input: JoeInsightInput): JoeInsightResult {
  const ctrStat = input.industryStats.find((s) => s.metricKey === "avg_organic_ctr");
  const cpcStat = input.industryStats.find((s) => s.metricKey === "avg_cpc");
  const mobileStat = input.industryStats.find((s) => s.metricKey === "mobile_share");

  const ctr = ctrStat ? ctrStat.metricValue : 3.5;
  const benchmarkCpc = cpcStat ? cpcStat.metricValue : 2.8;
  const mobileShare = mobileStat ? mobileStat.metricValue : 61;

  const hasData = input.keywordCount > 0;
  const hasSite = input.domain !== "your site" && input.domain !== "";

  // Headline based on account state
  let headline: string;
  let body: string;
  let action: string;

  if (!hasSite) {
    headline = "Start by adding your domain";
    body = "Add your first site under Settings → Projects to unlock keyword tracking, competitive analysis, and AI-powered content planning.";
    action = "Go to Settings → Projects";
  } else if (!hasData && input.listCount === 0) {
    headline = `${input.domain} has no keywords tracked yet`;
    body = "Your workspace is ready but has no tracked keywords yet. Create your first keyword list and add your core terms to unlock prioritization, CPC insights, and AI planning.";
    action = "Create first keyword list";
  } else if (input.listCount > 0 && input.keywordCount < 20) {
    headline = `${input.keywordCount} keywords tracked — build your first real cluster`;
    body = `You have ${input.listCount} list${input.listCount > 1 ? "s" : ""} started. The sweet spot for a first content cluster is 15–30 tightly grouped keywords. Add supporting and long-tail variations around your core topic to unlock the AI Decision Report.`;
    action = "Add keywords to your list";
  } else if (hasData && input.topKeyword) {
    const cpcDelta = input.avgKeywordCpc > 0
      ? (input.avgKeywordCpc > benchmarkCpc
        ? `Your avg CPC of $${input.avgKeywordCpc.toFixed(2)} is above the $${benchmarkCpc.toFixed(2)} benchmark — high commercial intent.`
        : `Your avg CPC of $${input.avgKeywordCpc.toFixed(2)} is below benchmark — great for organic-first plays.`)
      : "Enrich your keywords with CPC data by running Keyword Overview.";
    headline = `"${input.topKeyword}" is your strongest signal right now`;
    body = `${cpcDelta} With ${input.keywordCount.toLocaleString()} keywords tracked across ${input.listCount} list${input.listCount > 1 ? "s" : ""}, you have enough data to run the AI Decision Report and get a full content map with priority scores.`;
    action = "Run AI Decision Report";
  } else {
    headline = `${input.keywordCount.toLocaleString()} keywords ready for strategy`;
    body = `You have solid data across ${input.listCount} list${input.listCount > 1 ? "s" : ""}. Industry CTR averages ${ctr.toFixed(1)}%, meaning each top-3 ranking keyword at 1,000/mo volume drives ~35 visits. Run the AI Decision Report to turn your list into a prioritized content plan.`;
    action = "Run AI Decision Report";
  }

  return {
    headline,
    body,
    action,
    metric1: { label: "Industry CTR", value: `${ctr.toFixed(1)}%` },
    metric2: { label: "Avg CPC", value: `$${benchmarkCpc.toFixed(2)}` },
    metric3: { label: "Mobile Share", value: `${mobileShare.toFixed(0)}%` },
  };
}


