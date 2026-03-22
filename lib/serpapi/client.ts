// DataForSEO SERP client -- rank tracking, AI visibility, local SEO
// Docs: https://docs.dataforseo.com/v3/serp/overview/
// Uses the same DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD as the main client.

const DFS_BASE = "https://api.dataforseo.com/v3";

function getAuthHeaders() {
  const login = process.env.DATAFORSEO_LOGIN ?? "";
  const password = process.env.DATAFORSEO_PASSWORD ?? "";
  const encoded = Buffer.from(`${login}:${password}`).toString("base64");
  return { Authorization: `Basic ${encoded}`, "Content-Type": "application/json" };
}

async function dfsPost(endpoint: string, body: unknown) {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DataForSEO ${endpoint} error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Map a human-readable location string to a DataForSEO location_code. */
function locationNameToCode(location: string | undefined): number {
  if (!location) return 2840;
  const l = location.toLowerCase();
  if (l.includes("united kingdom") || l === "uk" || l === "england" || l === "gb") return 2826;
  if (l.includes("canada") || l === "ca") return 2124;
  if (l.includes("australia") || l === "au") return 2036;
  if (l.includes("germany") || l === "de") return 2276;
  if (l.includes("france") || l === "fr") return 2250;
  if (l.includes("spain") || l === "es") return 2724;
  if (l.includes("italy") || l === "it") return 2380;
  if (l.includes("netherlands") || l === "nl") return 2528;
  if (l.includes("brazil") || l === "br") return 2076;
  if (l.includes("india") || l === "in") return 2356;
  return 2840; // default: United States
}

// --- Rank Tracking -----------------------------------------------------------

export interface RankResult {
  position: number | null;
  url: string | null;
  title: string | null;
}

export async function getRankForDomain(
  keyword: string,
  domain: string,
  options: { gl?: string; device?: string; location?: string } = {}
): Promise<RankResult> {
  const locationCode = locationNameToCode(options.location ?? options.gl);
  const data = await dfsPost("/serp/google/organic/live/advanced", [
    {
      keyword,
      location_code: locationCode,
      language_code: "en",
      device: options.device ?? "desktop",
      calculate_rectangles: false,
    },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];

  const cleanDomain = domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();

  const match = items.find((item) => {
    if (item.type !== "organic") return false;
    const url = String(item.url ?? "")
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .toLowerCase();
    return url.startsWith(cleanDomain) || url.includes(cleanDomain);
  });

  if (!match) return { position: null, url: null, title: null };
  return {
    position: typeof match.rank_absolute === "number" ? match.rank_absolute : null,
    url: typeof match.url === "string" ? match.url : null,
    title: typeof match.title === "string" ? match.title : null,
  };
}

// --- LLM / AI Overview Visibility --------------------------------------------

export interface AiMentionResult {
  query: string;
  mentioned: boolean;
  source: string;
  snippet: string | null;
}

export async function checkAiVisibility(
  query: string,
  domain: string
): Promise<AiMentionResult> {
  const data = await dfsPost("/serp/google/organic/live/advanced", [
    {
      keyword: query,
      location_code: 2840,
      language_code: "en",
      device: "desktop",
      calculate_rectangles: false,
    },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];

  const cleanDomain = domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .toLowerCase();

  const featured = items.find((i) => i.type === "featured_snippet" || i.type === "answer_box");
  if (featured) {
    const text = JSON.stringify(featured).toLowerCase();
    if (text.includes(cleanDomain)) {
      return {
        query,
        mentioned: true,
        source: "Featured Snippet",
        snippet:
          typeof featured.description === "string"
            ? featured.description
            : typeof featured.pre_snippet === "string"
            ? featured.pre_snippet
            : null,
      };
    }
  }

  const organic = items.filter((i) => i.type === "organic").slice(0, 3);
  const inTop3 = organic.some((r) =>
    String(r.url ?? "")
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .toLowerCase()
      .startsWith(cleanDomain)
  );

  return {
    query,
    mentioned: inTop3,
    source: inTop3 ? "Organic Top 3" : "Google SERP",
    snippet: null,
  };
}

// --- Local SEO (Google Maps via DataForSEO) ----------------------------------

export interface LocalResult {
  position: number | null;
  rating: number | null;
  reviews: number | null;
  address: string | null;
  phone: string | null;
  found: boolean;
}

export async function getLocalPackResult(
  businessName: string,
  location: string,
  domain: string
): Promise<LocalResult> {
  const query = `${businessName} near ${location}`;
  const locationCode = locationNameToCode(location);

  const data = await dfsPost("/serp/google/maps/live/advanced", [
    {
      keyword: query,
      location_code: locationCode,
      language_code: "en",
      device: "desktop",
    },
  ]);

  const items = (data?.tasks?.[0]?.result?.[0]?.items ?? []) as Record<string, unknown>[];

  const cleanDomain = domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .toLowerCase();

  const match = items.find((r) => {
    const website = String(r.domain ?? r.website ?? r.url ?? "").toLowerCase();
    const title = String(r.title ?? "").toLowerCase();
    return (
      website.includes(cleanDomain) ||
      title.includes(businessName.toLowerCase().split(" ")[0])
    );
  });

  if (!match) return { position: null, rating: null, reviews: null, address: null, phone: null, found: false };

  const ratingObj = match.rating as Record<string, unknown> | null | undefined;
  const rating = ratingObj ? (typeof ratingObj.value === "number" ? ratingObj.value : null) : null;
  const reviews = ratingObj ? (typeof ratingObj.votes_count === "number" ? ratingObj.votes_count : null) : null;

  return {
    position: typeof match.rank_absolute === "number" ? match.rank_absolute : null,
    rating,
    reviews,
    address: typeof match.address === "string" ? match.address : null,
    phone: typeof match.phone === "string" ? match.phone : null,
    found: true,
  };
}
