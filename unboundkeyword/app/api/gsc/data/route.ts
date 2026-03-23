import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteForUser } from "@/lib/site-context";

interface GscRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true },
  });

  if (!account) {
    return Response.json({ error: "No Google account connected. Sign in with Google to enable GSC.", notConnected: true }, { status: 400 });
  }

  let token = account.access_token;

  // Try to refresh if no token
  if (!token && account.refresh_token) {
    token = await refreshAccessToken(account.refresh_token);
  }

  if (!token) {
    return Response.json({ error: "Google access token unavailable. Please sign out and sign back in with Google.", notConnected: true }, { status: 400 });
  }

  // Get user's site to determine the GSC property
  const site = await getSelectedSiteForUser(userId);
  const domain = site?.domain;

  // Build list of site URL variants to try
  const siteVariants = domain
    ? [
        `https://${domain}/`,
        `https://www.${domain}/`,
        `http://${domain}/`,
        `sc-domain:${domain}`,
      ]
    : [];

  // First, get the list of verified sites
  const sitesRes = await fetch(
    "https://www.googleapis.com/webmasters/v3/sites",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!sitesRes.ok) {
    const errText = await sitesRes.text();
    if (sitesRes.status === 401) {
      // Try refresh
      if (account.refresh_token) {
        const newToken = await refreshAccessToken(account.refresh_token);
        if (newToken) token = newToken;
        else return Response.json({ error: "Google token expired. Please sign out and sign back in." }, { status: 401 });
      } else {
        return Response.json({ error: "Google session expired. Please sign out and sign back in." }, { status: 401 });
      }
    } else {
      return Response.json({ error: `GSC error: ${errText.slice(0, 200)}` }, { status: 500 });
    }
  }

  const sitesData = (await sitesRes.json()) as { siteEntry?: { siteUrl: string; permissionLevel: string }[] };
  const verifiedSites = sitesData.siteEntry ?? [];

  // Find a matching site
  let siteUrl: string | null = null;

  if (domain) {
    // Try each variant
    for (const variant of siteVariants) {
      if (verifiedSites.some((s) => s.siteUrl === variant)) {
        siteUrl = variant;
        break;
      }
    }
    // Fallback: find any site that contains the domain
    if (!siteUrl) {
      const match = verifiedSites.find((s) =>
        s.siteUrl.includes(domain) && ["siteOwner", "siteFullUser", "siteDelegatedUser"].includes(s.permissionLevel)
      );
      if (match) siteUrl = match.siteUrl;
    }
  }

  // If still not found, use first accessible site
  if (!siteUrl && verifiedSites.length > 0) {
    siteUrl = verifiedSites[0].siteUrl;
  }

  if (!siteUrl) {
    return Response.json({
      rows: [],
      message: "No verified GSC property found. Add your site in Google Search Console.",
    });
  }

  // Query search analytics
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const analyticsRes = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        dimensions: ["query"],
        rowLimit: 100,
        dataState: "all",
      }),
    }
  );

  if (!analyticsRes.ok) {
    const errText = await analyticsRes.text();
    return Response.json({ error: `GSC analytics error: ${errText.slice(0, 200)}` }, { status: 500 });
  }

  const analyticsData = (await analyticsRes.json()) as {
    rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  };

  const rows: GscRow[] = (analyticsData.rows ?? []).map((r) => ({
    query: r.keys[0] ?? "",
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr: r.ctr,
    position: r.position,
  }));

  return Response.json({ rows, siteUrl });
}
