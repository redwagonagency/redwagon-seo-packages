// Bing Webmaster Tools integration (API-key auth, JSON responses)
// Docs: https://learn.microsoft.com/en-us/bingwebmaster/getting-started/bing-webmaster-tools-api

const BING_BASE = "https://ssl.bing.com/webmaster/api.svc/json/";

async function bingRequest(method: string, params: Record<string, string> = {}) {
  const key = process.env.BING_WEBMASTER_API_KEY;
  if (!key) throw new Error("BING_WEBMASTER_API_KEY is not configured");
  const url = new URL(BING_BASE + method);
  url.search = new URLSearchParams({ ...params, apikey: key }).toString();
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bing Webmaster API error (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function getBingSites() {
  return bingRequest("GetUserSites");
}

export async function getBingRankAndTrafficStats(siteUrl: string) {
  return bingRequest("GetRankAndTrafficStats", { siteUrl });
}

export async function getBingQueryStats(siteUrl: string) {
  return bingRequest("GetQueryStats", { siteUrl });
}

export async function getBingCrawlStats(siteUrl: string) {
  return bingRequest("GetCrawlStats", { siteUrl });
}

export async function getBingUrlTrafficInfo(siteUrl: string, targetUrl: string) {
  return bingRequest("GetUrlTrafficInfo", { siteUrl, url: targetUrl });
}
