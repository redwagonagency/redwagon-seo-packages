// Semrush integration (classic Analytics API, API-key auth, CSV responses)
// Docs: https://developer.semrush.com/api/v3/analytics/

const SEMRUSH_BASE = "https://api.semrush.com/";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(";").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(";");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cols[i] ?? "").trim()));
    return row;
  });
}

async function semrushRequest(params: Record<string, string>) {
  const key = process.env.SEMRUSH_KEY;
  if (!key) throw new Error("SEMRUSH_KEY is not configured");
  const url = new URL(SEMRUSH_BASE);
  url.search = new URLSearchParams({ ...params, key }).toString();
  const res = await fetch(url.toString());
  const text = await res.text();
  if (!res.ok || text.startsWith("ERROR")) {
    throw new Error(`Semrush API error: ${text.slice(0, 200)}`);
  }
  return parseCsv(text);
}

export async function getSemrushDomainOverview(domain: string, database = "us") {
  const rows = await semrushRequest({
    type: "domain_ranks",
    domain,
    database,
    export_columns: "Dn,Rk,Or,Ot,Oc,Ad,At,Ac",
  });
  return rows[0] ?? null;
}

export async function getSemrushOrganicKeywords(domain: string, database = "us", limit = 50) {
  return semrushRequest({
    type: "domain_organic",
    domain,
    database,
    display_limit: String(limit),
    export_columns: "Ph,Po,Pp,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td",
  });
}

export async function getSemrushKeywordOverview(keyword: string, database = "us") {
  const rows = await semrushRequest({
    type: "phrase_this",
    phrase: keyword,
    database,
    export_columns: "Ph,Nq,Cp,Co,Nr,Td",
  });
  return rows[0] ?? null;
}

export async function getSemrushCompetitors(domain: string, database = "us", limit = 10) {
  return semrushRequest({
    type: "domain_organic_organic",
    domain,
    database,
    display_limit: String(limit),
    export_columns: "Dn,Cr,Np,Or,Ot,Oc,Ad",
  });
}
