"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useGame } from "./GameContext";

type Entry = { rank: number; username: string; score: number };

const rankColor = (r: number) => (r === 1 ? "text-amber-400" : r === 2 ? "text-slate-400" : r === 3 ? "text-amber-700" : "text-slate-500");

export default function Leaderboard({ id: initial = "all", limit = 5, tabs = false, linked = false }: { id?: string; limit?: number; tabs?: boolean; linked?: boolean }) {
  const { score, user, blockId } = useGame();
  const [local, setId] = useState(initial);
  const id = linked ? blockId : local;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [blocks, setBlocks] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (tabs) fetch("/api/blocks").then((r) => r.json()).then(setBlocks).catch(() => {});
  }, [tabs]);

  useEffect(() => {
    fetch(`/api/leaderboard?block=${id}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .catch(() => setEntries([]));
  }, [id, limit, score]);

  const name = id === "all" ? "All Blocks" : blocks.find((b) => b.id === id)?.name || id.charAt(0).toUpperCase() + id.slice(1);

  return (
    <aside className="bg-[#1a1a27] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">{name} Leaderboard</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase">Top {limit}</span>
      </div>

      {tabs && !linked && (
        <div className="flex gap-2 bg-[#12121b] p-1 rounded-xl border border-white/5 mb-4 overflow-x-auto">
          {[{ id: "all", name: "All" }, ...blocks].map((b) => (
            <button key={b.id} onClick={() => setId(b.id)}
              className={`flex-1 whitespace-nowrap py-1.5 px-3 rounded-lg font-mono text-xs transition ${local === b.id ? "font-bold bg-[#1b2f27] border-2 border-emerald-400 text-emerald-300" : "font-semibold bg-[#212130] hover:bg-[#28283a] border border-transparent text-slate-300"}`}>
              {b.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2 text-sm flex-1">
        {entries.length === 0 ? (
          <div className="text-center py-6 text-slate-500 font-mono text-xs">No scores yet.</div>
        ) : (
          entries.map((e) => (
            <div key={e.rank} className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${user?.name === e.username ? "bg-amber-500/10 border-amber-500/30" : "bg-white/[0.02] border-transparent hover:border-white/5"}`}>
              <span className={`font-mono font-bold w-6 text-center text-sm ${rankColor(e.rank)}`}>#{e.rank}</span>
              <div className="w-8 h-8 rounded bg-[#1e293b] border border-white/10 flex-shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(e.username)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate text-xs text-white">{e.username}</div>
                <div className="text-[11px] font-mono text-slate-400">{e.score.toLocaleString()} score</div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
