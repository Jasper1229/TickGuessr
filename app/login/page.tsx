"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/components/GameContext";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [err, setErr] = useState("");
  const { refreshUser } = useGame();
  const router = useRouter();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: mode, name: f.get("name"), password: f.get("password") }) });
    if (!r.ok) return setErr((await r.json()).error);
    await refreshUser();
    router.push("/");
  }
  const field = "w-full bg-[#12121b] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition";
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1a1a27] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
        <h1 className="text-xl font-bold tracking-tight text-center">{mode === "login" ? "Log in to save your scores" : "Create an account"}</h1>
        <div className="grid grid-cols-2 gap-2 bg-[#12121b] p-1 rounded-xl border border-white/5">
          {(["login", "register"] as const).map((m) => (
            <button key={m} type="button" onClick={() => { setMode(m); setErr(""); }} className={`py-2 rounded-lg font-mono text-sm transition ${mode === m ? "font-bold bg-[#1b2f27] border-2 border-emerald-400 text-emerald-300" : "font-semibold bg-[#212130] hover:bg-[#28283a] border border-transparent text-slate-300"}`}>{m === "login" ? "Log in" : "Register"}</button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input name="name" placeholder="Username" autoComplete="username" required className={field} />
          <input name="password" type="password" placeholder="Password" autoComplete={mode === "login" ? "current-password" : "new-password"} required className={field} />
          {err && <p className="text-sm font-mono text-red-400" role="alert">{err}</p>}
          <button className="w-full py-3 px-4 rounded-xl font-mono font-extrabold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 active:translate-y-0.5 transition">{mode === "login" ? "Log in" : "Register"}</button>
        </form>
      </div>
    </main>
  );
}
