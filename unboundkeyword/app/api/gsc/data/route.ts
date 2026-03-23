import { auth } from "@/lib/auth";
import { logApiQuery } from "@/lib/api-query-log";
import { prisma } from "@/lib/prisma";
import { getSelectedSiteForUser } from "@/lib/site-context";

interface GscRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function parseRequestBody(body: BodyInit | null | undefined): unknown {
  if (!body) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return "[non-text body]";
}

async function fetchGoogleLogged(params: {
  userId: string;
  siteId?: string | null;
  useCase: string;
  url: string;
  init?: RequestInit;
}) {
  const startedAt = Date.now();
  const method = params.init?.method ?? "GET";
  const requestBody = parseRequestBody(params.init?.body ?? null);
  const response = await fetch(params.url, params.init);
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  void logApiQuery({
    userId: params.userId,
    siteId: params.siteId ?? null,
    provider: "google",
    method,
    endpoint: params.url,
    queryKey: params.url,
    useCase: params.useCase,
    durationMs: Date.now() - startedAt,
    statusCode: response.status,
    success: response.ok,
    requestBody,
    responseBody: json,
    errorMessage: response.ok ? null : (typeof text === "string" ? text.slice(0, 500) : null),
  });

  return { response, text, json };
}

async function refreshAccessToken(refreshToken: string, userId?: string, siteId?: string | null): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const { response, json } = await fetchGoogleLogged({
    userId: userId ?? "unknown",
    siteId: siteId ?? null,
    useCase: "google_oauth_refresh",
    url: "https://oauth2.googleapis.com/token",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    },
  });

  if (!response.ok) return null;
  const data = (json ?? {}) as { access_token?: string };
  return data.access_token ?? null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const selectedSite = await getSelectedSiteForUser(userId);
  const selectedSiteId = selectedSite?.id ?? null;

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true },
  });

  if (!account) {
    return Response.json({ error: "No Google account connected. Sign in with Google to enable GSC.", notConnected: true }, { status: 400 });
  }

  let token = account.access_token;

  if (!token && account.refresh_token) {
    token = await refreshAccessToken(account.refresh_token, userId, selectedSiteId);
  }

  if (!token) {
    return Response.json({ error: "Google access token unavailable. Please sign out and sign back in with Google.", notConnected: true }, { status: 400 });
  }

  const domain = selectedSite?.domain;
  const siteVariants = domain
    ? [
        `https://${domain}/`,
        `https://www.${domain}/`,
        `http://${domain}/`,
        `sc-domain:${domain}`,
      ]
    : [];

  const sitesResult = await fetchGoogleLogged({
    userId,
    siteId: selectedSiteId,
    useCase: "gsc_sites_list",
    url: "https://www.googleapis.com/webmasters/v3/sites",
    init: { headers: { Authorization: `Bearer ${token}` } },
  });

  if (!sitesResult.response.ok) {
    const errText = sitesResult.text;
    if (sitesResult.response.status === 401) {
      if (account.refresh_token) {
        const newToken = await refreshAccessToken(account.refresh_token, userId, selectedSiteId);
        if (newToken) token = newToken;
        else return Response.json({ error: "Google token expired. Please sign out and sign back in." }, { status: 401 });
      } else {
        return Response.json({ error: "Google session expired. Please sign out and sign back in." }, { status: 401 });
      }
    } else {
      return Response.json({ error: `GSC error: ${errText.slice(0, 200)}` }, { status: 500 });
    }
  }

  const sitesData = (sitesResult.json ?? {}) as { siteEntry?: { siteUrl: string; permissionLevel: string }[] };
  const verifiedSites = sitesData.siteEntry ?? [];

  let siteUrl: string | null = null;
  if (domain) {
    for (const variant of siteVariants) {
      if (verifiedSites.some((s) => s.siteUrl === variant)) {
        siteUrl = variant;
        break;
      }
    }
    if (!siteUrl) {
      const match = verifiedSites.find((s) =>
        s.siteUrl.includes(domain) && ["siteOwner", "siteFullUser", "siteDelegatedUser"].includes(s.permissionLevel)
      );
      if (match) siteUrl = match.siteUrl;
    }
  }

  if (!siteUrl && verifiedSites.length > 0) {
    siteUrl = verifiedSites[0].siteUrl;
  }

  if (!siteUrl) {
    return Response.json({
      rows: [],
      message: "No verified GSC property found. Add your site in Google Search Console.",
    });
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  const analyticsResult = await fetchGoogleLogged({
    userId,
    siteId: selectedSiteId,
    useCase: "gsc_search_analytics",
    url: `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    init: {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        dimensions: ["query"],
        rowLimit: 100,
        dataState: "all",
      }),
    },
  });

  if (!analyticsResult.response.ok) {
    return Response.json({ error: `GSC analytics error: ${analyticsResult.text.slice(0, 200)}` }, { status: 500 });
  }

  const analyticsData = (analyticsResult.json ?? {}) as {
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
