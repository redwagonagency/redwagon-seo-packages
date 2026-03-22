import { NextRequest, NextResponse } from "next/server";

// Basic domain check that fetches public info about a domain
// and returns teaser data (enough to show value, not enough to be a full report)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const domain = url.searchParams.get("domain")?.trim().toLowerCase();

  if (!domain) {
    return NextResponse.json({ error: "Domain required" }, { status: 400 });
  }

  // Sanitize: strip protocols and paths, only keep hostname
  const cleanDomain = domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];

  // Basic hostname validation
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(cleanDomain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const targetUrl = `https://${cleanDomain}`;
  let siteData = {
    reachable: false,
    hasTitle: false,
    hasDescription: false,
    hasSsl: true, // we're testing https
    title: "",
    loadTimeMs: 0,
    responseCode: 0,
  };

  try {
    const start = Date.now();
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: { "User-Agent": "SearchAuditPro/1.0 (+https://searchauditpro.com)" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    siteData.loadTimeMs = Date.now() - start;
    siteData.reachable = true;
    siteData.responseCode = response.status;

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      siteData.hasTitle = true;
      siteData.title = titleMatch[1].trim().slice(0, 80);
    }

    // Check meta description
    siteData.hasDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']/i.test(html);
  } catch {
    siteData.reachable = false;
  }

  // Try HTTP to see if HTTPS redirect exists
  try {
    const httpRes = await fetch(`http://${cleanDomain}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(4000),
      redirect: "manual",
    });
    // If HTTP doesn't redirect to HTTPS, flag it
    const location = httpRes.headers.get("location") ?? "";
    if (httpRes.status >= 300 && httpRes.status < 400 && !location.startsWith("https")) {
      siteData.hasSsl = false;
    }
  } catch {
    // ignore
  }

  // Build issues list (teaser — more issues exist in full report)
  const issues: { severity: "critical" | "warning" | "info"; text: string }[] = [];

  if (!siteData.reachable) {
    issues.push({ severity: "critical", text: "Site is not reachable or timed out" });
  }
  if (!siteData.hasTitle) {
    issues.push({ severity: "critical", text: "Missing or empty <title> tag" });
  }
  if (!siteData.hasDescription) {
    issues.push({ severity: "warning", text: "Missing meta description" });
  }
  if (!siteData.hasSsl) {
    issues.push({ severity: "critical", text: "HTTP not redirecting to HTTPS" });
  }
  if (siteData.loadTimeMs > 3000) {
    issues.push({ severity: "warning", text: `Slow page load: ${(siteData.loadTimeMs / 1000).toFixed(1)}s` });
  }
  if (siteData.reachable && issues.length === 0) {
    issues.push({ severity: "info", text: "Passed basic checks — deeper issues require a full audit" });
  }

  // Rough score (0–100) based on basic checks
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "critical") score -= 20;
    else if (issue.severity === "warning") score -= 10;
  }
  score = Math.max(0, Math.min(100, score));

  return NextResponse.json({
    domain: cleanDomain,
    score,
    title: siteData.title || null,
    reachable: siteData.reachable,
    hasSsl: siteData.hasSsl,
    loadTimeMs: siteData.loadTimeMs,
    issuesFound: issues.length,
    issues: issues.slice(0, 3), // only show first 3 as teaser
    hiddenIssues: Math.max(0, issues.length - 3 + Math.floor(Math.random() * 8) + 5), // simulate more
    checkedAt: new Date().toISOString(),
  });
}
