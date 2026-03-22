"use client";

import { useEffect, useState } from "react";

export type KWToSave = {
  keyword: string;
  volume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: string;
};

type ListItem = {
  id: string;
  name: string;
  color: string;
  _count?: { keywords: number };
};

interface Props {
  keywords: KWToSave[];
  onClose: () => void;
  onSaved?: (count: number) => void;
}

export default function SaveToListModal({ keywords, onClose, onSaved }: Props) {
  const [lists, setLists] = useState<ListItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [createMode, setCreateMode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/lists")
      .then((r) => r.json())
      .then((data: { lists?: ListItem[] }) => {
        const fetched = data.lists ?? [];
        setLists(fetched);
        if (fetched.length === 0) {
          setCreateMode(true);
        } else {
          setSelectedListId(fetched[0]?.id ?? null);
        }
      })
      .catch(() => setCreateMode(true))
      .finally(() => setLoadingLists(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      let listId = selectedListId;

      if (createMode) {
        const name = newListName.trim();
        if (!name) { setError("Enter a list name"); setSaving(false); return; }
        const r = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const d = (await r.json()) as { list?: ListItem; error?: string };
        if (!r.ok) throw new Error(d.error ?? "Failed to create list");
        listId = d.list!.id;
      }

      if (!listId) { setError("Select a list"); setSaving(false); return; }

      const r = await fetch(`/api/lists/${listId}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Failed to save keywords");

      onSaved?.(keywords.length);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const canSave =
    !saving &&
    !loadingLists &&
    (createMode ? newListName.trim().length > 0 : !!selectedListId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Save to List</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-5">
            Saving{" "}
            <span className="font-semibold text-slate-900">{keywords.length}</span>{" "}
            keyword{keywords.length !== 1 ? "s" : ""} to a list
          </p>

          {loadingLists ? (
            <div className="text-sm text-slate-400">Loading lists…</div>
          ) : (
            <>
              {!createMode && lists.length > 0 && (
                <>
                  <div className="space-y-2 max-h-52 overflow-y-auto mb-4 pr-1">
                    {lists.map((list) => (
                      <button
                        key={list.id}
                        type="button"
                        onClick={() => setSelectedListId(list.id)}
                        className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition ${
                          selectedListId === list.id
                            ? "border-[#f15b27] bg-[#fff3ee] text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: list.color }}
                            />
                            <span className="font-semibold">{list.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {list._count?.keywords ?? 0} kws
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateMode(true)}
                    className="text-sm text-[#f15b27] hover:underline font-semibold"
                  >
                    + Create new list
                  </button>
                </>
              )}

              {createMode && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name…"
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#f15b27]"
                    onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
                  />
                  {lists.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCreateMode(false)}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      ← Back to existing lists
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSave}
            className="rounded-xl bg-[#f15b27] px-6 py-2 text-sm font-black text-white hover:bg-[#d94e1f] disabled:opacity-50 transition"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
