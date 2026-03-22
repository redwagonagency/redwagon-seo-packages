"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type EndpointId =
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

type EndpointConfig = {
  id: EndpointId;
  label: string;
  description: string;
  group: string;
  mode: "keyword" | "keywords" | "task" | "image";
  supportsLocation?: boolean;
  supportsLanguage?: boolean;
  supportsDevice?: boolean;
  supportsOs?: boolean;
  supportsDepth?: boolean;
  supportsLimit?: boolean;
  supportsSeDomain?: boolean;
  supportsPriority?: boolean;
  supportsCallbacks?: boolean;
  note?: string;
};

type ToolkitResponse = {
  endpoint: EndpointId;
  data: {
    items?: unknown[];
    taskIds?: string[];
    result?: Record<string, unknown> | null;
    raw?: unknown;
  };
};

const ENDPOINTS: EndpointConfig[] = [
  {
    id: "autocomplete-live-advanced",
    label: "Google Autocomplete Live",
    description: "Run instant Google autocomplete lookups for a seed keyword.",
    group: "SERP discovery",
    mode: "keyword",
    supportsLocation: true,
    supportsLanguage: true,
    supportsDevice: true,
    supportsOs: true,
    supportsDepth: true,
    supportsSeDomain: true,
  },
  {
    id: "autocomplete-task-post",
    label: "Google Autocomplete Task Post",
    description: "Create an async autocomplete task and capture its task ID for later retrieval.",
    group: "SERP discovery",
    mode: "keyword",
    supportsLocation: true,
    supportsLanguage: true,
    supportsDevice: true,
    supportsOs: true,
    supportsSeDomain: true,
    supportsPriority: true,
    supportsCallbacks: true,
    note: "Use the returned task ID with Google Autocomplete Task Get.",
  },
  {
    id: "autocomplete-task-get-advanced",
    label: "Google Autocomplete Task Get",
    description: "Fetch a previously created autocomplete task by task ID.",
    group: "SERP discovery",
    mode: "task",
  },
  {
    id: "ai-mode-live-advanced",
    label: "Google AI Mode Live",
    description: "Inspect Google AI Mode results synchronously for a prompt-like query.",
    group: "AI search",
    mode: "keyword",
    supportsLocation: true,
    supportsLanguage: true,
    supportsDevice: true,
    supportsOs: true,
    supportsDepth: true,
    supportsSeDomain: true,
  },
  {
    id: "ai-mode-task-post",
    label: "Google AI Mode Task Post",
    description: "Queue AI Mode retrieval as an asynchronous task.",
    group: "AI search",
    mode: "keyword",
    supportsLocation: true,
    supportsLanguage: true,
    supportsDevice: true,
    supportsOs: true,
    supportsSeDomain: true,
    supportsPriority: true,
    supportsCallbacks: true,
  },
  {
    id: "local-finder-live-advanced",
    label: "Google Local Finder Live",
    description: "Run local finder SERPs for map-pack style local intent queries.",
    group: "SERP discovery",
    mode: "keyword",
    supportsLocation: true,
    supportsLanguage: true,
    supportsDevice: true,
    supportsDepth: true,
    supportsSeDomain: true,
  },
  {
    id: "dataset-search-live-advanced",
    label: "Google Dataset Search Live",
    description: "Search Google Dataset Search results for a keyword.",
    group: "SERP discovery",
    mode: "keyword",
    supportsLocation: true,
    supportsLanguage: true,
    supportsDepth: true,
    supportsSeDomain: true,
  },
  {
    id: "ads-search-live-advanced",
    label: "Google Ads Search Live",
    description: "Inspect the ad SERP for a query and market.",
    group: "SERP discovery",
    mode: "keyword",
    supportsLocation: true,
    supportsLanguage: true,
    supportsDevice: true,
    supportsOs: true,
    supportsDepth: true,
    supportsSeDomain: true,
  },
  {
    id: "search-by-image-task-post",
    label: "Google Search By Image Task Post",
    description: "Submit an image URL or base64 payload for reverse-image search.",
    group: "Visual search",
    mode: "image",
    supportsLocation: true,
    supportsLanguage: true,
    supportsSeDomain: true,
    supportsPriority: true,
    supportsCallbacks: true,
  },
  {
    id: "yahoo-organic-task-get-advanced",
    label: "Yahoo Organic Task Get",
    description: "Retrieve a completed Yahoo organic task when you already have its task ID.",
    group: "Legacy task retrieval",
    mode: "task",
  },
  {
    id: "clickstream-global-search-volume-live",
    label: "Clickstream Global Search Volume",
    description: "Get global clickstream-based search volume for a batch of keywords.",
    group: "Clickstream",
    mode: "keywords",
  },
  {
    id: "clickstream-bulk-search-volume-live",
    label: "Clickstream Bulk Search Volume",
    description: "Get location-scoped clickstream search volume for a batch of keywords.",
    group: "Clickstream",
    mode: "keywords",
    supportsLocation: true,
  },
  {
    id: "content-analysis-search-live",
    label: "Content Analysis Search",
    description: "Run the live content-analysis search endpoint for a topic seed.",
    group: "Content analysis",
    mode: "keyword",
    supportsLimit: true,
    note: "Use advanced options to add endpoint-specific filters or fields beyond the default keyword payload.",
  },
  {
    id: "content-analysis-phrase-trends-live",
    label: "Content Analysis Phrase Trends",
    description: "Inspect phrase-trend output for a single topic or phrase.",
    group: "Content analysis",
    mode: "keyword",
    supportsLimit: true,
    note: "If you need a richer content-analysis body, add it in Advanced options JSON.",
  },
  {
    id: "content-analysis-category-trends-live",
    label: "Content Analysis Category Trends",
    description: "Inspect category-trend output for a single topic or phrase.",
    group: "Content analysis",
    mode: "keyword",
    supportsLimit: true,
    note: "If you need a richer content-analysis body, add it in Advanced options JSON.",
  },
];

const GROUPS = Array.from(new Set(ENDPOINTS.map((endpoint) => endpoint.group)));

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function SerpToolkitClient() {
  const [endpointId, setEndpointId] = useState<EndpointId>("autocomplete-live-advanced");
  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState("");
  const [taskId, setTaskId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [location, setLocation] = useState("2840");
  const [language, setLanguage] = useState("en");
  const [seDomain, setSeDomain] = useState("google.com");
  const [device, setDevice] = useState("desktop");
  const [os, setOs] = useState("windows");
  const [depth, setDepth] = useState("20");
  const [limit, setLimit] = useState("100");
  const [priority, setPriority] = useState("1");
  const [postbackUrl, setPostbackUrl] = useState("");
  const [pingbackUrl, setPingbackUrl] = useState("");
  const [advancedJson, setAdvancedJson] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<ToolkitResponse | null>(null);

  const endpoint = ENDPOINTS.find((item) => item.id === endpointId) ?? ENDPOINTS[0];

  async function runRequest(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      let advancedOptions: Record<string, unknown> | undefined;
      const trimmedAdvanced = advancedJson.trim();
      if (trimmedAdvanced && trimmedAdvanced !== "{}") {
        const parsed = JSON.parse(trimmedAdvanced) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Advanced options must be a JSON object.");
        }
        advancedOptions = parsed as Record<string, unknown>;
      }

      const body: Record<string, unknown> = {
        endpoint: endpoint.id,
        advancedOptions,
      };

      if (endpoint.mode === "keyword") body.keyword = keyword.trim();
      if (endpoint.mode === "keywords") body.keywords = keywords;
      if (endpoint.mode === "task") body.taskId = taskId.trim();
      if (endpoint.mode === "image") {
        body.imageUrl = imageUrl.trim();
        body.imageBase64 = imageBase64.trim();
      }

      if (endpoint.supportsLocation) body.location = Number(location);
      if (endpoint.supportsLanguage) body.language = language.trim();
      if (endpoint.supportsSeDomain && seDomain.trim()) body.seDomain = seDomain.trim();
      if (endpoint.supportsDevice && device.trim()) body.device = device.trim();
      if (endpoint.supportsOs && os.trim()) body.os = os.trim();
      if (endpoint.supportsDepth) body.depth = Number(depth);
      if (endpoint.supportsLimit) body.limit = Number(limit);
      if (endpoint.supportsPriority) body.priority = Number(priority);
      if (endpoint.supportsCallbacks && postbackUrl.trim()) body.postbackUrl = postbackUrl.trim();
      if (endpoint.supportsCallbacks && pingbackUrl.trim()) body.pingbackUrl = pingbackUrl.trim();

      const res = await fetch("/api/serp-toolkit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as ToolkitResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setResponse(data);
      const returnedTaskId = data.data?.taskIds?.[0];
      if (returnedTaskId) {
        setTaskId(returnedTaskId);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const itemCount = Array.isArray(response?.data?.items) ? response.data.items.length : 0;
  const taskCount = Array.isArray(response?.data?.taskIds) ? response.data.taskIds.length : 0;

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">SERP Toolkit</h1>
        <p className="text-sm text-slate-500">
          Run the newly wired DataForSEO autocomplete, AI Mode, local finder, dataset, ads, image, clickstream,
          Yahoo task, and content-analysis endpoints from one place.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form onSubmit={runRequest} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Endpoint</label>
              <select
                value={endpointId}
                onChange={(e) => {
                  setEndpointId(e.target.value as EndpointId);
                  setError("");
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {ENDPOINTS.filter((item) => item.group === group).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">{endpoint.description}</p>
              {endpoint.note ? <p className="mt-2 text-xs text-amber-700">{endpoint.note}</p> : null}
            </div>

            {endpoint.mode === "keyword" ? (
              <Input
                label="Keyword"
                placeholder="e.g. best espresso machine"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                required
              />
            ) : null}

            {endpoint.mode === "keywords" ? (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Keywords
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-32"
                  placeholder={"keyword research\nseo audit\nlocal seo"}
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  required
                />
                <p className="mt-2 text-xs text-slate-500">One per line or comma-separated. Up to 1000 keywords.</p>
              </div>
            ) : null}

            {endpoint.mode === "task" ? (
              <Input
                label="Task ID"
                placeholder="Paste a DataForSEO task ID"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                required
              />
            ) : null}

            {endpoint.mode === "image" ? (
              <div className="space-y-3">
                <Input
                  label="Image URL"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <div className="text-center text-xs uppercase tracking-wide text-slate-400">or</div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Image Base64</label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-28"
                    placeholder="Paste a base64-encoded image payload"
                    value={imageBase64}
                    onChange={(e) => setImageBase64(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {(endpoint.supportsLocation || endpoint.supportsLanguage) ? (
              <div className="grid grid-cols-2 gap-3">
                {endpoint.supportsLocation ? (
                  <Input
                    label="Location Code"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    inputMode="numeric"
                  />
                ) : null}
                {endpoint.supportsLanguage ? (
                  <Input
                    label="Language Code"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  />
                ) : null}
              </div>
            ) : null}

            {(endpoint.supportsSeDomain || endpoint.supportsDevice || endpoint.supportsOs) ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {endpoint.supportsSeDomain ? (
                  <Input
                    label="Search Engine Domain"
                    value={seDomain}
                    onChange={(e) => setSeDomain(e.target.value)}
                  />
                ) : null}
                {endpoint.supportsDevice ? (
                  <Input
                    label="Device"
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                  />
                ) : null}
                {endpoint.supportsOs ? (
                  <Input
                    label="OS"
                    value={os}
                    onChange={(e) => setOs(e.target.value)}
                  />
                ) : null}
              </div>
            ) : null}

            {(endpoint.supportsDepth || endpoint.supportsLimit || endpoint.supportsPriority) ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {endpoint.supportsDepth ? (
                  <Input
                    label="Depth"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    inputMode="numeric"
                  />
                ) : null}
                {endpoint.supportsLimit ? (
                  <Input
                    label="Limit"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    inputMode="numeric"
                  />
                ) : null}
                {endpoint.supportsPriority ? (
                  <Input
                    label="Priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    inputMode="numeric"
                  />
                ) : null}
              </div>
            ) : null}

            {endpoint.supportsCallbacks ? (
              <div className="grid grid-cols-1 gap-3">
                <Input
                  label="Postback URL"
                  value={postbackUrl}
                  onChange={(e) => setPostbackUrl(e.target.value)}
                  placeholder="Optional callback URL"
                />
                <Input
                  label="Pingback URL"
                  value={pingbackUrl}
                  onChange={(e) => setPingbackUrl(e.target.value)}
                  placeholder="Optional pingback URL"
                />
              </div>
            ) : null}

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Advanced Options JSON</label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-y min-h-40"
                value={advancedJson}
                onChange={(e) => setAdvancedJson(e.target.value)}
                spellCheck={false}
              />
              <p className="mt-2 text-xs text-slate-500">
                This JSON object is merged into the default request body before the server calls DataForSEO.
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Running request..." : "Run endpoint"}
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Response</h2>
                <p className="text-sm text-slate-500">Task IDs are persisted in the Task ID field for quick follow-up requests.</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="slate">{endpoint.group}</Badge>
                <Badge variant="blue">{endpoint.mode}</Badge>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {!error && !response ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-sm text-slate-500">
                Run an endpoint to inspect the normalized response and raw DataForSEO payload.
              </div>
            ) : null}

            {response ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="green">Endpoint: {response.endpoint}</Badge>
                  {taskCount > 0 ? <Badge variant="purple">Task IDs: {taskCount}</Badge> : null}
                  {itemCount > 0 ? <Badge variant="orange">Items: {itemCount}</Badge> : null}
                </div>

                {taskCount > 0 ? (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 mb-2">Returned task IDs</p>
                    <div className="flex flex-col gap-2">
                      {response.data.taskIds?.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTaskId(id)}
                          className="text-left text-sm font-mono text-indigo-700 hover:text-indigo-900"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Raw JSON
                  </div>
                  <pre className={cn(
                    "overflow-auto p-4 text-xs leading-6 bg-slate-950 text-slate-100",
                    "max-h-[640px]"
                  )}>
                    {prettyJson(response.data.raw ?? response.data)}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-slate-900 text-slate-100 rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">What is wired</p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Google autocomplete task post, live advanced, and task get.</li>
                <li>Google AI Mode task post and live advanced.</li>
                <li>Google local finder, dataset search, ads search, and search by image.</li>
                <li>Yahoo organic task retrieval plus clickstream volume endpoints.</li>
                <li>Content analysis search, phrase trends, and category trends.</li>
              </ul>
            </div>
            <div className="bg-amber-50 rounded-3xl p-5 border border-amber-200">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-700 mb-2">Implementation note</p>
              <p className="text-sm text-amber-900 leading-6">
                Some advanced DataForSEO endpoints accept richer request bodies than the lightweight defaults shown here.
                Use Advanced options JSON to add those fields without changing code.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}