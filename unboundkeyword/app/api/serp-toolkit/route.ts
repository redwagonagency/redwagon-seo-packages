import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  createGoogleAiModeTask,
  createGoogleAutocompleteTask,
  createGoogleSearchByImageTask,
  getClickstreamBulkSearchVolumeAdvanced,
  getClickstreamGlobalSearchVolumeAdvanced,
  getContentAnalysisCategoryTrendsLive,
  getContentAnalysisPhraseTrendsLive,
  getContentAnalysisSearchLive,
  getGoogleAdsSearchLiveAdvanced,
  getGoogleAiModeLiveAdvanced,
  getGoogleAutocompleteLiveAdvanced,
  getGoogleAutocompleteTaskAdvanced,
  getGoogleDatasetSearchLiveAdvanced,
  getGoogleLocalFinderLiveAdvanced,
  getYahooOrganicTaskAdvanced,
  type SerpToolkitRequestOptions,
} from "@/lib/dataforseo/client";

type ToolkitEndpoint =
  | "autocomplete-task-post"
  | "autocomplete-live-advanced"
  | "autocomplete-task-get-advanced"
  | "ai-mode-task-post"
  | "ai-mode-live-advanced"
  | "local-finder-live-advanced"
  | "dataset-search-live-advanced"
  | "ads-search-live-advanced"
  | "search-by-image-task-post"
  | "yahoo-organic-task-get-advanced"
  | "clickstream-global-search-volume-live"
  | "clickstream-bulk-search-volume-live"
  | "content-analysis-search-live"
  | "content-analysis-phrase-trends-live"
  | "content-analysis-category-trends-live";

type RequestBody = {
  endpoint?: ToolkitEndpoint;
  keyword?: string;
  keywords?: string[] | string;
  taskId?: string;
  location?: number;
  language?: string;
  seDomain?: string;
  device?: string;
  os?: string;
  depth?: number;
  limit?: number;
  priority?: number;
  postbackUrl?: string;
  pingbackUrl?: string;
  imageUrl?: string;
  imageBase64?: string;
  advancedOptions?: Record<string, unknown>;
};

function normalizeKeywords(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value !== "string") return [];

  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildOptions(body: RequestBody): SerpToolkitRequestOptions {
  return {
    locationCode: body.location ?? 2840,
    languageCode: body.language ?? "en",
    seDomain: body.seDomain,
    device: body.device,
    os: body.os,
    depth: body.depth,
    limit: body.limit,
    priority: body.priority,
    postbackUrl: body.postbackUrl,
    pingbackUrl: body.pingbackUrl,
    advancedOptions: body.advancedOptions,
  };
}

function requireKeyword(keyword: string | undefined): string {
  const normalized = keyword?.trim();
  if (!normalized) {
    throw new Error("A keyword is required for this endpoint.");
  }
  return normalized;
}

function requireTaskId(taskId: string | undefined): string {
  const normalized = taskId?.trim();
  if (!normalized) {
    throw new Error("A task ID is required for this endpoint.");
  }
  return normalized;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const endpoint = body.endpoint;

    if (!endpoint) {
      return Response.json({ error: "endpoint is required" }, { status: 400 });
    }

    const options = buildOptions(body);
    const keywords = normalizeKeywords(body.keywords);

    switch (endpoint) {
      case "autocomplete-task-post": {
        const data = await createGoogleAutocompleteTask(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      case "autocomplete-live-advanced": {
        const data = await getGoogleAutocompleteLiveAdvanced(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      case "autocomplete-task-get-advanced": {
        const data = await getGoogleAutocompleteTaskAdvanced(requireTaskId(body.taskId));
        return Response.json({ endpoint, data });
      }
      case "ai-mode-task-post": {
        const data = await createGoogleAiModeTask(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      case "ai-mode-live-advanced": {
        const data = await getGoogleAiModeLiveAdvanced(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      case "local-finder-live-advanced": {
        const data = await getGoogleLocalFinderLiveAdvanced(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      case "dataset-search-live-advanced": {
        const data = await getGoogleDatasetSearchLiveAdvanced(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      case "ads-search-live-advanced": {
        const data = await getGoogleAdsSearchLiveAdvanced(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      case "search-by-image-task-post": {
        const data = await createGoogleSearchByImageTask(body.imageUrl?.trim(), body.imageBase64?.trim(), options);
        return Response.json({ endpoint, data });
      }
      case "yahoo-organic-task-get-advanced": {
        const data = await getYahooOrganicTaskAdvanced(requireTaskId(body.taskId));
        return Response.json({ endpoint, data });
      }
      case "clickstream-global-search-volume-live": {
        if (keywords.length === 0) {
          return Response.json({ error: "At least one keyword is required." }, { status: 400 });
        }
        const data = await getClickstreamGlobalSearchVolumeAdvanced(keywords);
        return Response.json({ endpoint, data });
      }
      case "clickstream-bulk-search-volume-live": {
        if (keywords.length === 0) {
          return Response.json({ error: "At least one keyword is required." }, { status: 400 });
        }
        const data = await getClickstreamBulkSearchVolumeAdvanced(keywords, body.location ?? 2840);
        return Response.json({ endpoint, data });
      }
      case "content-analysis-search-live": {
        const data = await getContentAnalysisSearchLive(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      case "content-analysis-phrase-trends-live": {
        const data = await getContentAnalysisPhraseTrendsLive(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      case "content-analysis-category-trends-live": {
        const data = await getContentAnalysisCategoryTrendsLive(requireKeyword(body.keyword), options);
        return Response.json({ endpoint, data });
      }
      default:
        return Response.json({ error: "Unsupported endpoint" }, { status: 400 });
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "SERP toolkit request failed" },
      { status: 500 }
    );
  }
}