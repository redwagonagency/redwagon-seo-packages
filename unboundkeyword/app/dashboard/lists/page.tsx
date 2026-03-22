"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface KeywordList {
  id: string;
  name: string;
  description?: string;
  color: string;
  _count: { keywords: number };
  updatedAt: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#3b82f6", "#ef4444", "#f59e0b"];

export default function ListsPage() {
  const [lists, setLists] = useState<KeywordList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);

  async function fetchLists() {
    const res = await fetch("/api/lists");
    const data = await res.json();
    setLists(data.lists || []);
    setLoading(false);
  }

  useEffect(() => { fetchLists(); }, []);

  async function createList(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim(), color: newColor }),
    });
    setCreating(false);
    setNewName("");
    setNewDesc("");
    setNewColor(COLORS[0]);
    setShowCreate(false);
    fetchLists();
  }

  async function deleteList(id: string) {
    if (!confirm("Delete this list and all its keywords?")) return;
    await fetch(`/api/lists?id=${id}`, { method: "DELETE" });
    fetchLists();
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Keyword Lists</h1>
          <p className="text-slate-500 mt-1 text-sm">Organise your keywords into named, colour-coded lists</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ New List</Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : lists.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No lists yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create a list to start organising your keywords</p>
          <Button onClick={() => setShowCreate(true)}>Create your first list</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => (
            <div key={list.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                  <div>
                    <h3 className="font-semibold text-slate-900">{list.name}</h3>
                    {list.description && (
                      <p className="text-slate-400 text-xs mt-0.5">{list.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteList(list.id)}
                  className="text-slate-300 hover:text-red-500 transition text-lg leading-none"
                  title="Delete list"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{list._count.keywords} keywords</span>
                <Link
                  href={`/dashboard/lists/${list.id}`}
                  className="text-sm text-indigo-600 font-semibold hover:text-indigo-800"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">New keyword list</h3>
            <form onSubmit={createList} className="flex flex-col gap-3">
              <Input
                label="Name"
                placeholder="e.g. Top-of-funnel blog"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <Input
                label="Description (optional)"
                placeholder="What's this list for?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Color</p>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-full transition ring-offset-2 ${newColor === c ? "ring-2 ring-slate-900" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Creating…" : "Create list"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
