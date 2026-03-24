/**
 * Google API helpers — token refresh, GA4 sessions by date, GSC top queries.
 * Access tokens come from NextAuth's Account table (provider="google").
 */
import { prisma } from "@/lib/prisma";

// ── Token management ────────────────────────────────────────────────────────

export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account) return null;

  const nowSecs = Math.floor(Date.now() / 1000);
  // If still valid for more than 60 seconds, use it
  if (account.access_token && account.expires_at && account.expires_at > nowSecs + 60) {
    return account.access_token;
  }

  // Try to refresh
  if (!account.refresh_token) return account.access_token ?? null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return account.access_token ?? null;

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return account.access_token ?? null;

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: data.expires_in ? nowSecs + data.expires_in : undefined,
    },
  });

  return data.access_token;
}

// ── GA4 ─────────────────────────────────────────────────────────────────────

export async function fetchGa4Properties(accessToken: string) {
  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/-",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.json() as Promise<{
    properties?: Array<{ name: string; displayName: string; parent: string }>;
  }>;
}

export async function fetchGa4SessionsByDate(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: 31,
      }),
    }
  );
  return res.json() as Promise<{
    rows?: Array<{
      dimensionValues: Array<{ value: string }>;
      metricValues: Array<{ value: string }>;
    }>;
    error?: { message: string };
  }>;
}

// ── Google Search Console ────────────────────────────────────────────────────

export async function fetchGscSites(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json() as Promise<{
    siteEntry?: Array<{ siteUrl: string; permissionLevel: string }>;
  }>;
}

export async function fetchGscTopQueries(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  rowLimit = 20
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
        dimensions: ["query"],
        rowLimit,
        orderBys: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
      }),
    }
  );
  return res.json() as Promise<{
    rows?: Array<{
      keys: string[];
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>;
    error?: { message: string };
  }>;
}
