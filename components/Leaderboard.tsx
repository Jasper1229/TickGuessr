"use client";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { useGame } from "./GameContext";

type Row = { name: string; score: number; me: boolean };
const rankColor = ["text-amber-400", "text-slate-400", "text-amber-700"];

export default function Leaderboard({ id: initial = "all", limit = 5, tabs = false }: { id?: string; limit?: number; tabs?: boolean }) {
  const { score, user } = useGame();
  const [id, setId] = useState(initial);
  const [rows, setRows] = useState<Row[]>([]);
  const [blocks, setBlocks] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const load = () => fetch(`/api/leaderboard?block=${id}&limit=${limit}`, { cache: "no-store" }).then((r) => r.json()).then((d) => { setRows(d.rows); setBlocks(d.blocks); }).catch(() => {});
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [id, limit, score, user]);

  const name = id === "all" ? "All Blocks" : blocks.find((b) => b.id === id)?.name ?? id;
  return (
    <aside className="bg-[#1a1a27] border border-white/5 rounded-2xl p-5 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">{name} Leaderboard</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase">Top {limit}</span>
      </div>
      {tabs && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[{ id: "all", name: "All Blocks" }, ...blocks].map((t) => (
            <button key={t.id} onClick={() => setId(t.id)} className={`py-1.5 px-4 rounded-lg font-mono text-xs transition ${id === t.id ? "font-bold bg-[#1b2f27] border-2 border-emerald-400 text-emerald-300" : "font-semibold bg-[#212130] hover:bg-[#28283a] border border-transparent text-slate-300"}`}>{t.name}</button>
          ))}
        </div>
      )}
      <div className="space-y-2 text-sm flex-1">
        {rows.length === 0 && <p className="text-xs font-mono text-slate-500 text-center py-4">No scores yet. Log in and get one right.</p>}
        {rows.map((r, i) => (
          <div key={r.name} className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${r.me ? "bg-amber-500/10 border-amber-500/40 shadow-sm" : "bg-white/[0.02] border-transparent hover:border-white/5"}`}>
            <span className={`font-mono font-bold w-6 text-center text-sm ${rankColor[i] ?? "text-slate-500"}`}>#{i + 1}</span>
            <div className="w-8 h-8 rounded bg-[#1e293b] border border-white/10 flex-shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(r.name)}`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold truncate text-xs ${r.me ? "text-amber-300" : "text-white"}`}>{r.name}</div>
              <div className="text-[11px] font-mono text-slate-400">{r.score.toLocaleString()} score</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
