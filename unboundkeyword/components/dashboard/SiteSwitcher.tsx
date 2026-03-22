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
};

export default function SiteSwitcher() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/sites", { cache: "no-store" });
    const data = (await res.json()) as { sites: Site[]; selectedSiteId: string | null };
    setSites(data.sites ?? []);
    setSelectedSiteId(data.selectedSiteId ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  const selected = useMemo(
    () => sites.find((site) => site.id === selectedSiteId) ?? null,
    [sites, selectedSiteId]
  );

  async function createSite() {
    if (!domainInput.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainInput.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Unable to add domain");
      setDomainInput("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add domain");
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
    <div className="flex items-center gap-2">
      <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
        <span className="text-[10px] font-black tracking-[0.16em] uppercase text-slate-400">Site</span>
        <select
          value={selectedSiteId ?? ""}
          onChange={(e) => void selectSite(e.target.value)}
          className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
        >
          {sites.length === 0 ? <option value="">No domain selected</option> : null}
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.domain}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden xl:flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 py-1">
        <input
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void createSite();
            }
          }}
          placeholder="add domain.com"
          className="w-40 text-xs px-2 py-1.5 outline-none"
        />
        <button
          type="button"
          onClick={() => void createSite()}
          disabled={busy}
          className="rounded-lg bg-[#f15b27] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#d94e1f] disabled:opacity-60"
        >
          Add
        </button>
      </div>

      {selected ? (
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className={`inline-block w-2 h-2 rounded-full ${selected.ga4Connected ? "bg-emerald-500" : "bg-slate-300"}`} />
          GA4
          <span className={`inline-block w-2 h-2 rounded-full ml-1 ${selected.gscConnected ? "bg-emerald-500" : "bg-slate-300"}`} />
          GSC
        </div>
      ) : null}
      {error ? <span className="hidden md:inline text-[11px] text-rose-600">{error}</span> : null}
    </div>
  );
}
