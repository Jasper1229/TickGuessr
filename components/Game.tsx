"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Timer } from "lucide-react";
import { useGame } from "./GameContext";
import { play } from "@/lib/sfx";

type Round = { roundId: string; imageUrl: string; blockName: string; totalSheets: number; totalFrames: number; maxGuesses: number };
const KEYS = "asdfghjk"; // hotkeys for sheets 0..7

async function fetchRound(): Promise<Round> {
  const r: Round = await (await fetch("/api/round?block=all", { cache: "no-store" })).json();
  new Image().src = r.imageUrl; // warm the image before it's shown
  return r;
}

export default function Game() {
  const { score, setScore, streak, setStreak, muted, user } = useGame();
  const [round, setRound] = useState<Round | null>(null);
  const [sheet, setSheet] = useState(0);
  const [frame, setFrame] = useState("");
  const [used, setUsed] = useState(0);
  const [status, setStatus] = useState<"play" | "wrong" | "correct" | "fail">("play");
  const [msg, setMsg] = useState("");
  const [pts, setPts] = useState<number | null>(null);
  const [fx, setFx] = useState(0);
  const [secs, setSecs] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef(Date.now());
  const input = useRef<HTMLInputElement>(null);
  const sfx = (k: "correct" | "wrong" | "fail") => { if (!muted) play(k); };
  const locked = busy || status === "correct" || status === "fail";

  const apply = useCallback((r: Round) => {
    setRound(r); setUsed(0); setFrame(""); setStatus("play"); setMsg(""); setPts(null);
    setSecs(0); setBusy(false); start.current = Date.now();
    setTimeout(() => input.current?.focus(), 0);
  }, []);

  useEffect(() => { fetchRound().then(apply); }, [apply]);
  useEffect(() => {
    const t = setInterval(() => setSecs(Math.floor((Date.now() - start.current) / 1000)), 250);
    return () => clearInterval(t);
  }, []);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!round || locked || frame === "") return;
    setBusy(true);
    const res = await fetch("/api/guess", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: round.roundId, sheet, frame: Number(frame), streak }),
    });
    if (!res.ok) { apply(await fetchRound()); return; }
    const d = await res.json();
    setUsed(d.guessesUsed); setStreak(d.streak); setFx((n) => n + 1);
    if (d.resolved) {
      const next = fetchRound();
      if (d.correct) {
        setScore((s) => s + d.points); setPts(d.points); setStatus("correct");
        setMsg(d.voided ? "Correct! Over a minute, so the streak reset." : "Correct!"); sfx("correct");
      } else {
        setStatus("fail"); setMsg(`Answer: sheet ${d.answer.sheet}, frame ${d.answer.frame}`); sfx("fail");
      }
      setTimeout(async () => apply(await next), d.correct ? 800 : 2000);
    } else {
      setStatus("wrong"); sfx("wrong");
      { const left = max - d.guessesUsed; setMsg(`Not quite. ${left} guess${left === 1 ? "" : "es"} left`); }
      setFrame(""); setBusy(false); input.current?.focus();
    }
  }

  function onKey(e: React.KeyboardEvent) {
    const i = KEYS.indexOf(e.key.toLowerCase());
    if (round && e.key.length === 1 && i >= 0 && i < round.totalSheets) { e.preventDefault(); setSheet(i); }
  }

  const max = round?.maxGuesses ?? 3;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <section className="lg:col-span-8 bg-[#1a1a27] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">What sprite sheet &amp; tick is this?</h1>
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="text-slate-400 font-mono text-xs uppercase tracking-wider">Block:</span>
          <span className="text-amber-400 font-bold font-mono text-sm tracking-wider uppercase">{round?.blockName ?? "..."}</span>
          <div className="flex items-center gap-1.5 ml-2" aria-label={`${max - used} guesses left`}>
            {Array.from({ length: max }, (_, i) => (
              <span key={i} className={`w-2.5 h-2.5 rounded-full transition ${i < used ? (status === "correct" && i === used - 1 ? "bg-emerald-400 shadow-sm shadow-emerald-500/50" : "bg-red-500 shadow-sm shadow-red-500/50") : "bg-slate-600/70"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mb-4">
        <div className="relative p-2.5 rounded-lg bg-[#3a2c20] border-2 border-[#5c4432] shadow-[0_0_30px_rgba(0,0,0,0.6)]">
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 bg-[#14121a] rounded flex items-center justify-center border border-black/60 overflow-hidden">
            {round ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={round.imageUrl} alt="Animated texture frame" className="pixel w-full h-full" draggable={false} />
            ) : (
              <div className="w-16 h-16 rounded bg-white/5 animate-pulse" />
            )}
            {fx > 0 && <div key={fx} className={`absolute inset-0 pointer-events-none ${status === "correct" ? "flash-g" : "flash-r"}`} />}
            {pts !== null && <span key={`p${fx}`} className="floatup absolute top-1/3 font-mono font-extrabold text-3xl text-emerald-300 drop-shadow">+{pts.toLocaleString()}</span>}
          </div>
        </div>
      </div>

      <div key={fx} className={`h-6 mb-3 text-center font-mono text-sm font-semibold ${status === "correct" ? "text-emerald-300" : status === "play" ? "text-slate-400" : "text-red-400 shake"}`} aria-live="polite">{msg}</div>

      <form onSubmit={submit} className="max-w-md mx-auto space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            1. Select Sprite Sheet <span className="text-slate-500 font-normal normal-case">(keys: {KEYS.slice(0, round?.totalSheets ?? 2).split("").join(" / ")})</span>
          </label>
          <div className="grid gap-2 bg-[#12121b] p-1 rounded-xl border border-white/5" style={{ gridTemplateColumns: `repeat(${round?.totalSheets ?? 2}, minmax(0, 1fr))` }}>
            {Array.from({ length: round?.totalSheets ?? 2 }, (_, i) => (
              <button key={i} type="button" disabled={locked} onClick={() => { setSheet(i); input.current?.focus(); }}
                className={`py-2.5 px-4 rounded-lg font-mono text-sm transition ${sheet === i ? "font-bold bg-[#1b2f27] border-2 border-emerald-400 text-emerald-300 shadow-sm" : "font-semibold bg-[#212130] hover:bg-[#28283a] border border-transparent text-slate-300"}`}>
                SHEET {i}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="frame" className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            2. Enter Frame Number <span className="text-slate-500 font-normal">(0-{(round?.totalFrames ?? 32) - 1})</span>
          </label>
          <input id="frame" ref={input} value={frame} disabled={locked} inputMode="numeric" autoComplete="off" placeholder="0"
            onChange={(e) => setFrame(e.target.value.replace(/\D/g, "").slice(0, 3))} onKeyDown={onKey}
            className="w-full bg-[#12121b] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition disabled:opacity-60" />
        </div>

        <div className="space-y-4 pt-1">
          <button type="submit" disabled={locked || frame === ""}
            className="w-full py-3 px-4 rounded-xl font-mono font-extrabold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 active:translate-y-0.5 transition disabled:opacity-50">
            Submit Guess
          </button>
          <div className="flex items-center justify-between text-sm pt-1">
            <div className={`flex items-center gap-1.5 font-mono font-semibold ${secs >= 60 ? "text-red-400" : "text-amber-400"}`}>
              <Timer className="w-4 h-4" /><span>{mm}:{ss}s</span>
            </div>
            <div className="font-mono text-slate-300 text-xs text-right">SCORE: <span className="font-bold text-white text-sm">{score.toLocaleString()}</span>{!user && <Link href="/login" className="block text-[10px] text-slate-500 underline hover:text-white">Log in to save scores</Link>}</div>
          </div>
        </div>
      </form>
    </section>
  );
}
