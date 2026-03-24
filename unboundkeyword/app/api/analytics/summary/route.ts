import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSelectedSiteForUser } from "@/lib/site-context";
import {
  getGoogleAccessToken,
  fetchGa4SessionsByDate,
  fetchGa4Properties,
  fetchGscTopQueries,
  fetchGscSites,
} from "@/lib/google-apis";

function toIsoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toIsoDate(d);
}

export interface AnalyticsSummary {
  domain: string;
  startDate: string;
  endDate: string;
  ga4: {
    propertyId: string | null;
    sessions: { date: string; sessions: number; users: number }[];
    totalSessions: number;
    totalUsers: number;
  } | null;
  gsc: {
    siteUrl: string | null;
    keywords: {
      keyword: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }[];
    totalClicks: number;
    totalImpressions: number;
  } | null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const site = await getSelectedSiteForUser(userId);
  if (!site) {
    return NextResponse.json({ error: "No selected site" }, { status: 400 });
  }

  const accessToken = await getGoogleAccessToken(userId);
  if (!accessToken) {
    return NextResponse.json({ error: "No Google token" }, { status: 400 });
  }

  const startDate = daysAgo(30);
  const endDate = daysAgo(0);
  const domain = site.domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

  // ── GA4 ─────────────────────────────────────────────────────────────────
  let ga4: AnalyticsSummary["ga4"] = null;

  if (site.ga4Connected) {
    try {
      const propsData = await fetchGa4Properties(accessToken);
      const props = propsData.properties ?? [];

      let propertyId: string | null = null;
      if (props.length > 0) {
        const match =
          props.find(
            (p) =>
              p.displayName.toLowerCase().includes(domain) ||
              p.name.toLowerCase().includes(domain)
          ) ?? props[0];
        propertyId = match.name.replace("properties/", "");
      }

      if (propertyId) {
        const report = await fetchGa4SessionsByDate(accessToken, propertyId, startDate, endDate);
        const rows = report.rows ?? [];
        const sessions = rows.map((r) => {
          const raw = r.dimensionValues[0].value; // YYYYMMDD
          return {
            date: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
            sessions: parseInt(r.metricValues[0].value) || 0,
            users: parseInt(r.metricValues[1].value) || 0,
          };
        });
        ga4 = {
          propertyId,
          sessions,
          totalSessions: sessions.reduce((s, r) => s + r.sessions, 0),
          totalUsers: sessions.reduce((s, r) => s + r.users, 0),
        };
      }
    } catch {
      // Non-fatal: ga4 stays null
    }
  }

  // ── GSC ──────────────────────────────────────────────────────────────────
  let gsc: AnalyticsSummary["gsc"] = null;

  if (site.gscConnected) {
    try {
      // First, list all sites the user has access to so we pick the right one
      const sitesData = await fetchGscSites(accessToken);
      const allSites = (sitesData.siteEntry ?? []).map((s) => s.siteUrl);

      // Prefer exact sc-domain or https match for this site's domain
      const candidates = [
        `sc-domain:${domain}`,
        `https://${domain}/`,
        `https://www.${domain}/`,
        `http://${domain}/`,
        `https://${domain}`,
        `https://www.${domain}`,
      ];

      // Pick exact match from verified sites, or fall back to trying all candidates
      const verified = candidates.find((c) => allSites.includes(c));
      const siteUrlsToTry = verified ? [verified] : candidates;

      let resolvedSiteUrl: string | null = null;
      let keywords: NonNullable<AnalyticsSummary["gsc"]>["keywords"] = [];

      for (const siteUrl of siteUrlsToTry) {
        const data = await fetchGscTopQueries(accessToken, siteUrl, startDate, endDate);
        if (data.rows?.length) {
          resolvedSiteUrl = siteUrl;
          keywords = data.rows.map((r) => ({
            keyword: r.keys[0],
            clicks: r.clicks,
            impressions: r.impressions,
            ctr: Math.round(r.ctr * 10000) / 100,
            position: Math.round(r.position * 10) / 10,
          }));
          break;
        }
      }

      gsc = {
        siteUrl: resolvedSiteUrl,
        keywords,
        totalClicks: keywords.reduce((s, k) => s + k.clicks, 0),
        totalImpressions: keywords.reduce((s, k) => s + k.impressions, 0),
      };
    } catch {
      // Non-fatal: gsc stays null
    }
  }

  return NextResponse.json({
    domain: site.domain,
    startDate,
    endDate,
    ga4,
    gsc,
  } satisfies AnalyticsSummary);
}
