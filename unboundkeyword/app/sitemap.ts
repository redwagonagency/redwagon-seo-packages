import type { MetadataRoute } from "next";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://unboundkeyword.com";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const routes = [
    "",
    "/pricing",
    "/features",
    "/how-it-works",
    "/use-cases",
    "/comparison",
    "/integrations",
    "/about",
    "/blog",
    "/contact",
    "/help",
    "/terms",
    "/privacy",
    "/for/agencies",
    "/for/bloggers",
    "/for/content-strategists",
    "/for/ecommerce",
    "/for/freelancers",
    "/for/local-seo",
    "/for/small-business",
    "/for/startups",
    "/features/a-z-explorer",
    "/features/competitor-analysis",
    "/features/content-strategy",
    "/features/keyword-research",
    "/features/local-seo",
    "/features/rank-tracking",
    "/tools/a-z-keywords",
    "/tools/competitor-research",
    "/tools/content-ideas",
    "/tools/hashtag-research",
    "/tools/keyword-ideas",
    "/tools/keyword-overview",
    "/tools/local-keywords",
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : route === "/pricing" ? 0.9 : 0.7,
  }));
}
