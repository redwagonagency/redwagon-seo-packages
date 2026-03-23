"use client";

import { useEffect, useMemo, useState } from "react";

type Site = {
  id: string;
  domain: string;
  label: string | null;
  location: string;
  language: string;
  ga4Connected: boolean;
  gscConnected: boolean;
  competitorList?: string[];
};

export default function SiteSwitcher() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>(["", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/sites", { cache: "no-store" });
    const data = (await res.json()) as { sites: Site[]; selectedSiteId: string | null };
    setSites(data.sites ?? []);
    setSelectedSiteId(data.selectedSiteId ?? null);
  }

  useEffect(() => { void load(); }, []);

  const selected = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? null,
    [sites, selectedSiteId]
  );

  function openEdit(site: Site) {
    setEditingSiteId(site.id);
    setDomainInput(site.domain);
    const saved = site.competitorList ?? [];
    const padded = [...saved, "", "", "", "", ""].slice(0, 5);
    setCompetitors(padded);
    setShowAddPanel(true);
    setError("");
  }

  function openAdd() {
    setEditingSiteId(null);
    setDomainInput("");
    setCompetitors(["", "", "", "", ""]);
    setShowAddPanel(true);
    setError("");
  }

  async function saveSite() {
    if (!editingSiteId && !domainInput.trim()) return;
    setBusy(true);
    setError("");
    const compList = competitors.map((c) => c.trim()).filter(Boolean);
    try {
      let res: Response;
      if (editingSiteId) {
        res = await fetch("/api/sites", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSiteId, competitors: compList }),
        });
      } else {
        res = await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain: domainInput.trim(), competitors: compList }),
        });
      }
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Unable to save");
      setShowAddPanel(false);
      setDomainInput("");
      setCompetitors(["", "", "", "", ""]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }

  async function selectSite(siteId: string) {
    setSelectedSiteId(siteId);
    await fetch("/api/sites/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId }),
    });
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-2 relative">
      {/* Site selector */}
      <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
        <span className="text-[10px] font-black tracking-[0.16em] uppercase text-slate-400">Site</span>
        <select
          value={selectedSiteId ?? ""}
          onChange={(e) => void selectSite(e.target.value)}
          className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
        >
          {sites.length === 0 ? <option value="">No domain selected</option> : null}
          {sites.map((site) => (
            <option key={site.id} value={site.id}>{site.domain}</option>
          ))}
        </select>
        {selected && (
          <button
            type="button"
            onClick={() => openEdit(selected)}
            title="Edit project / set competitors"
            className="ml-1 text-slate-400 hover:text-[#f15b27] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
      </div>

      {/* Add domain quick input */}
      <div className="hidden xl:flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 py-1">
        <input
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveSite(); } }}
          placeholder="add domain.com"
          className="w-40 text-xs px-2 py-1.5 outline-none"
          onClick={() => { if (!showAddPanel && !editingSiteId) openAdd(); }}
        />
        <button
          type="button"
          onClick={() => { if (!showAddPanel) openAdd(); else void saveSite(); }}
          disabled={busy}
          className="rounded-lg bg-[#f15b27] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#d94e1f] disabled:opacity-60"
        >
          {editingSiteId ? "Save" : "Add"}
        </button>
      </div>

      {selected && (
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className={`inline-block w-2 h-2 rounded-full ${selected.ga4Connected ? "bg-emerald-500" : "bg-slate-300"}`} />
          GA4
          <span className={`inline-block w-2 h-2 rounded-full ml-1 ${selected.gscConnected ? "bg-emerald-500" : "bg-slate-300"}`} />
          GSC
        </div>
      )}

      {error && !showAddPanel ? <span className="hidden md:inline text-[11px] text-rose-600">{error}</span> : null}

      {showAddPanel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowAddPanel(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 w-96 rounded-2xl border border-slate-200 bg-white shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                {editingSiteId
                  ? `Edit: ${sites.find((s) => s.id === editingSiteId)?.domain}`
                  : "Add New Domain"}
              </span>
              <button type="button" onClick={() => setShowAddPanel(false)} className="text-slate-300 hover:text-slate-600">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M6 6l8 8M6 14L14 6" /></svg>
              </button>
            </div>

            {!editingSiteId && (
              <div className="mb-4">
                <label className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-1.5 block">Your Domain</label>
                <input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="yourdomain.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f15b27]"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-1.5 block">
                Competitors (up to 5) — used across all reports automatically
              </label>
              <div className="flex flex-col gap-2">
                {competitors.map((val, idx) => (
                  <input
                    key={idx}
                    value={val}
                    onChange={(e) => {
                      const next = [...competitors];
                      next[idx] = e.target.value;
                      setCompetitors(next);
                    }}
                    placeholder={`Competitor ${idx + 1} (e.g. competitor.com)`}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-[#f15b27]"
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void saveSite()}
                disabled={busy}
                className="flex-1 rounded-lg bg-[#f15b27] py-2.5 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-60"
              >
                {busy ? "Saving…" : editingSiteId ? "Save Changes" : "Add Domain"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddPanel(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
