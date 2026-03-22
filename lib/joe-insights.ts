type IndustryStat = {
  metricKey: string;
  metricValue: number;
  unit?: string | null;
  note?: string | null;
};

type JoeInsightInput = {
  userName: string;
  tenantName: string;
  projectCount: number;
  topProjectDomain: string | null;
  trackedKeywords: number;
  avgKeywordCpc: number;
  industryStats: IndustryStat[];
};

export function buildJoeInsight(input: JoeInsightInput): string {
  const ctrStat = input.industryStats.find((s) => s.metricKey === "avg_organic_ctr");
  const mobileStat = input.industryStats.find((s) => s.metricKey === "mobile_search_share");
  const cpcStat = input.industryStats.find((s) => s.metricKey === "avg_cpc");

  const ctr = ctrStat ? `${ctrStat.metricValue.toFixed(1)}${ctrStat.unit || "%"}` : "3.5%";
  const mobile = mobileStat ? `${mobileStat.metricValue.toFixed(1)}${mobileStat.unit || "%"}` : "61%";
  const cpc = cpcStat ? `$${cpcStat.metricValue.toFixed(2)}` : "$2.80";

  const projectContext = input.topProjectDomain
    ? `Right now, ${input.topProjectDomain} is your lead project with ${input.trackedKeywords.toLocaleString()} tracked keywords.`
    : `You currently have ${input.projectCount} project${input.projectCount === 1 ? "" : "s"} and ${input.trackedKeywords.toLocaleString()} tracked keywords.`;

  const cpcContext =
    input.avgKeywordCpc > 0
      ? `Your current dataset averages around $${input.avgKeywordCpc.toFixed(2)} CPC.`
      : "Your CPC baseline is still forming as you add more tracked keywords.";

  return [
    `${input.userName || "Team"}, Joe here from SearchAuditPro. ${projectContext}`,
    `${cpcContext} Market anchors this month: ${ctr} average organic CTR, ${mobile} mobile share, and ${cpc} benchmark CPC.`,
    "Priority play: publish one conversion page and one support comparison page this week, then review keyword and traffic deltas after the next report run.",
  ].join(" ");
}
