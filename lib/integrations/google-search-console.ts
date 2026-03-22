// Google Search Console integration
// OAuth tokens are stored per-tenant in the Integration table

export async function getGscSites(accessToken: string) {
  const res = await fetch(
    "https://www.googleapis.com/webmasters/v3/sites",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.json();
}

export async function getGscSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[] = ["query", "page"]
) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions,
        rowLimit: 1000,
      }),
    }
  );
  return res.json();
}

export async function getGscSitemaps(accessToken: string, siteUrl: string) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.json();
}

export async function getGscIndexingStatus(accessToken: string, siteUrl: string) {
  const res = await fetch(
    `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl: siteUrl,
        siteUrl,
      }),
    }
  );
  return res.json();
}

// Refresh a Google OAuth token
export async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return res.json();
}
