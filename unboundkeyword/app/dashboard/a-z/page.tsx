import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";

async function AZClient() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  // Fetch all discovered keywords grouped by letter
  const keywords = await prisma.discoveryKeyword.findMany({
    where: { userId: userId! },
    select: {
      keyword: true,
      letter: true,
      volume: true,
      difficulty: true,
      platform: true,
    },
    orderBy: [{ letter: "asc" }, { volume: "desc" }],
  });

  // Group by letter
  const grouped: Record<string, any[]> = {};
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((letter) => {
    grouped[letter] = keywords.filter((k) => k.letter === letter);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">A-Z Autocomplete Keywords</h1>
        <p className="text-slate-600 mt-2">Browse all discovered keywords organized by letter</p>
      </div>

      {/* Letter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(grouped).map(([letter, kws]) => (
          <div key={letter} className="bg-white rounded-lg border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-[#f15b27] flex items-center justify-center">
                <span className="text-white font-bold text-lg">{letter}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{kws.length} keywords</h3>
            </div>

            {kws.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {kws.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded hover:bg-slate-50 transition cursor-pointer group"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{kw.keyword}</p>
                      <p className="text-xs text-slate-500">
                        {kw.platform} • {kw.volume?.toLocaleString() || "N/A"} searches
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {kw.difficulty && (
                        <span
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{
                            background:
                              kw.difficulty > 70
                                ? "#fee2e2"
                                : kw.difficulty > 40
                                ? "#fef3c7"
                                : "#dcfce7",
                            color:
                              kw.difficulty > 70
                                ? "#991b1b"
                                : kw.difficulty > 40
                                ? "#9a3412"
                                : "#15803d",
                          }}
                        >
                          KD {kw.difficulty}
                        </span>
                      )}
                      <svg
                        className="w-4 h-4 text-slate-400 group-hover:text-[#f15b27] transition"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-4">No keywords starting with {letter}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AZPage() {
  return (
    <div className="p-8">
      <Suspense fallback={<div className="text-center py-12">Loading A-Z keywords...</div>}>
        <AZClient />
      </Suspense>
    </div>
  );
}
