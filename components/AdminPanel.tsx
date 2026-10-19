"use client";
import { useCallback, useEffect, useState } from "react";

type U = { id: string; name: string; role: string; banned: boolean; streak: number; createdAt: string };
type B = { id: string; name: string; flip: boolean; enabled: boolean; sheets: { idx: number; file: string; frames: number; size: number }[] };
type D = { stats: { users: number; rounds: number; scores: number }; users: U[]; blocks: B[] };
type FE = React.FormEvent<HTMLFormElement>;

const card = "bg-[#1a1a27] border border-white/5 rounded-2xl p-5 shadow-2xl space-y-3";
const h2 = "text-xs font-mono font-bold uppercase tracking-wider text-amber-400";
const btn = "px-3 py-1.5 rounded-lg font-mono text-xs font-semibold bg-[#212130] hover:bg-[#28283a] border border-white/10 text-slate-200 transition";
const inp = "bg-[#12121b] border border-white/10 rounded-lg px-3 py-1.5 font-mono text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50";

export default function AdminPanel() {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    const r = await fetch("/api/admin", { cache: "no-store" });
    if (r.ok) setD(await r.json()); else setErr("Not authorized");
  }, []);
  useEffect(() => { load(); }, [load]);

  async function send(init: RequestInit) {
    setErr("");
    const r = await fetch("/api/admin", { method: "POST", ...init });
    if (!r.ok) setErr((await r.json().catch(() => ({}))).error ?? "Request failed");
    await load();
  }
  const act = (body: object) => send({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const upload = (e: FE) => { e.preventDefault(); const f = new FormData(e.currentTarget); e.currentTarget.reset(); return send({ body: f }); };
  const create = (e: FE) => {
    e.preventDefault(); const f = new FormData(e.currentTarget); e.currentTarget.reset();
    return act({ action: "createBlock", id: f.get("id"), name: f.get("name"), flip: f.get("flip") === "on" });
  };

  if (!d) return <p className="text-center font-mono text-sm text-slate-400">{err || "Loading..."}</p>;
  return (
    <div className="space-y-6">
      {err && <p className="text-center font-mono text-sm text-red-400" role="alert">{err}</p>}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(d.stats).map(([k, v]) => (
          <div key={k} className={card}><div className="text-xs font-mono uppercase text-slate-400">{k}</div><div className="text-2xl font-mono font-bold text-white">{v.toLocaleString()}</div></div>
        ))}
      </div>

      <section className={card}>
        <h2 className={h2}>Blocks &amp; sprite sheets</h2>
        {d.blocks.map((b) => (
          <div key={b.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-white">{b.name}</span>
              <span className="font-mono text-xs text-slate-500">{b.id}</span>
              <div className="ml-auto flex gap-2">
                <button className={btn} onClick={() => act({ action: "patchBlock", id: b.id, enabled: !b.enabled })}>{b.enabled ? "Enabled" : "Disabled"}</button>
                <button className={btn} onClick={() => act({ action: "patchBlock", id: b.id, flip: !b.flip })}>Flip: {b.flip ? "on" : "off"}</button>
                <button className={btn} onClick={() => confirm(`Delete ${b.name} and its scores?`) && act({ action: "deleteBlock", id: b.id })}>Delete</button>
              </div>
            </div>
            <ul className="font-mono text-xs text-slate-300 space-y-1">
              {b.sheets.map((s) => <li key={s.idx}>Sheet {s.idx}: {s.file} ({s.frames} frames, {s.size}px)</li>)}
              {!b.sheets.length && <li className="text-slate-500">No sheets yet. Blocks without sheets are never played.</li>}
            </ul>
            <form onSubmit={upload} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="blockId" value={b.id} />
              <input name="file" type="file" accept="image/png" required className="text-xs text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-[#212130] file:px-3 file:py-1.5 file:text-slate-200" />
              <input name="size" type="number" placeholder="frame px" defaultValue={16} className={`${inp} w-24`} aria-label="Frame size in pixels" />
              <button className={btn}>Add sheet</button>
            </form>
          </div>
        ))}
        <form onSubmit={create} className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <input name="id" placeholder="id (e.g. water)" required className={inp} />
          <input name="name" placeholder="Display name" required className={inp} />
          <label className="flex items-center gap-1.5 text-xs font-mono text-slate-300"><input name="flip" type="checkbox" /> random flip</label>
          <button className={btn}>Create block</button>
        </form>
      </section>

      <section className={card}>
        <h2 className={h2}>Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead className="text-slate-500"><tr><th className="py-1">Name</th><th>Role</th><th>Streak</th><th>Joined</th><th></th></tr></thead>
            <tbody>
              {d.users.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="py-2 text-white">{u.name}{u.banned && <span className="ml-2 text-red-400">banned</span>}</td>
                  <td>{u.role}</td><td>{u.streak}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="text-right space-x-2">
                    <button className={btn} onClick={() => act({ action: "setRole", id: u.id, role: u.role === "ADMIN" ? "USER" : "ADMIN" })}>{u.role === "ADMIN" ? "Make user" : "Make admin"}</button>
                    <button className={btn} onClick={() => act({ action: "ban", id: u.id, banned: !u.banned })}>{u.banned ? "Unban" : "Ban"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
