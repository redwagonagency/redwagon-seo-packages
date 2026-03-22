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
  discoveryCount: number;
  topKeyword: string | null;
  topKeywordVolume: number;
  avgKeywordCpc: number;
  industryStats: IndustryStat[];
};

export function buildJoeInsight(input: JoeInsightInput): string {
  const ctrStat = input.industryStats.find((s) => s.metricKey === "avg_organic_ctr");
  const cpcStat = input.industryStats.find((s) => s.metricKey === "avg_cpc");
  const mobileStat = input.industryStats.find((s) => s.metricKey === "mobile_share");

  const ctrText = ctrStat
    ? `${ctrStat.metricValue.toFixed(1)}${ctrStat.unit || "%"} average organic CTR`
    : "~3.5% average organic CTR";
  const cpcText = cpcStat
    ? `$${cpcStat.metricValue.toFixed(2)} avg CPC benchmark`
    : "$2.80 avg CPC benchmark";
  const mobileText = mobileStat
    ? `${mobileStat.metricValue.toFixed(1)}${mobileStat.unit || "%"} mobile share`
    : "~61% mobile share";

  const topKeywordText = input.topKeyword
    ? `Your strongest tracked term right now is \"${input.topKeyword}\" (${input.topKeywordVolume.toLocaleString()}/mo).`
    : "You do not have a strongest tracked term yet, so your first win is tightening one core keyword cluster.";

  const cpcContext =
    input.avgKeywordCpc > 0
      ? `Your current keyword set averages about $${input.avgKeywordCpc.toFixed(2)} CPC.`
      : "Your current keyword CPC baseline is still building from fresh data.";

  return [
    `Joe here. For ${input.domain}, we currently have ${input.keywordCount.toLocaleString()} tracked keywords across ${input.listCount} lists and ${input.discoveryCount} discovery sessions.`,
    topKeywordText,
    `${cpcContext} Industry anchors this month: ${ctrText}, ${cpcText}, and ${mobileText}.`,
    "My recommendation: ship one money-page refresh plus one supporting intent article this week, then track desktop/mobile volume deltas in keyword overview.",
  ].join(" ");
}
