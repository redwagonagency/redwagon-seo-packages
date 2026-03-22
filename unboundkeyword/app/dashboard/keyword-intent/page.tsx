import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";

const INTENT_TYPES = [
  {
    type: "informational",
    label: "Informational",
    description: "Users seeking knowledge or answers",
    icon: "ℹ️",
    color: "bg-blue-50",
    accent: "text-blue-700",
    border: "border-blue-200",
  },
  {
    type: "transactional",
    label: "Transactional",
    description: "Users ready to buy or complete an action",
    icon: "🛒",
    color: "bg-green-50",
    accent: "text-green-700",
    border: "border-green-200",
  },
  {
    type: "navigational",
    label: "Navigational",
    description: "Users looking for a specific brand/site",
    icon: "📍",
    color: "bg-purple-50",
    accent: "text-purple-700",
    border: "border-purple-200",
  },
  {
    type: "commercial",
    label: "Commercial",
    description: "Users comparing products or researching",
    icon: "🔍",
    color: "bg-amber-50",
    accent: "text-amber-700",
    border: "border-amber-200",
  },
];

async function KeywordIntentClient() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  // Fetch all keywords with their intent
  const keywords = await prisma.discoveryKeyword.findMany({
    where: { userId: userId! },
    select: {
      keyword: true,
      intent: true,
      volume: true,
      difficulty: true,
      platform: true,
      seedKeyword: true,
    },
    orderBy: [{ intent: "asc" }, { volume: "desc" }],
  });

  // Group by intent
  const grouped: Record<string, any[]> = {
    informational: [],
    transactional: [],
    navigational: [],
    commercial: [],
    unknown: [],
  };

  keywords.forEach((kw) => {
    const intentKey = kw.intent?.toLowerCase() || "unknown";
    if (intentKey in grouped) {
      grouped[intentKey].push(kw);
    } else {
      grouped.unknown.push(kw);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Keyword Intent Analysis</h1>
        <p className="text-slate-600 mt-2">
          Understand the true intent behind keywords to optimize your content strategy
        </p>
      </div>

      {/* Intent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {INTENT_TYPES.map((intentInfo) => {
          const keywords_in_intent = grouped[intentInfo.type] || [];
          const totalVolume = keywords_in_intent.reduce((sum, k) => sum + (k.volume || 0), 0);

          return (
            <div
              key={intentInfo.type}
              className={`rounded-lg border-2 ${intentInfo.border} ${intentInfo.color} p-6`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{intentInfo.icon}</span>
                <div>
                  <h3 className={`text-lg font-bold ${intentInfo.accent}`}>{intentInfo.label}</h3>
                  <p className="text-xs text-slate-600">{intentInfo.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mb-4 pb-4 border-b border-slate-200">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{keywords_in_intent.length}</p>
                  <p className="text-xs text-slate-600">Keywords</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalVolume.toLocaleString()}</p>
                  <p className="text-xs text-slate-600">Total Volume</p>
                </div>
              </div>

              {/* Keywords List */}
              {keywords_in_intent.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {keywords_in_intent.slice(0, 10).map((kw, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-white/50 transition">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{kw.keyword}</p>
                        <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                          <span>📊 {kw.volume?.toLocaleString() || "N/A"}</span>
                          {kw.difficulty && <span>KD {kw.difficulty}</span>}
                          <span className="text-[#f15b27]">{kw.platform}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {keywords_in_intent.length > 10 && (
                    <p className="text-xs text-slate-500 py-2 text-center">
                      +{keywords_in_intent.length - 10} more keywords
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-4">No keywords with this intent yet</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg border border-slate-100 p-6 mt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Overall Intent Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {["informational", "transactional", "navigational", "commercial", "unknown"].map((intent) => {
            const count = grouped[intent]?.length || 0;
            const total = Object.values(grouped).flat().length;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={intent} className="bg-slate-50 rounded p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{percentage}%</p>
                <p className="text-xs text-slate-600 mt-1 capitalize">{intent}</p>
                <p className="text-xs text-slate-500 mt-0.5">{count} keywords</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function KeywordIntentPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<div className="text-center py-12">Loading keyword intents...</div>}>
        <KeywordIntentClient />
      </Suspense>
    </div>
  );
}
