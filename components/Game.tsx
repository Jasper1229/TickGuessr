"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Timer } from "lucide-react";
import { useGame } from "./GameContext";
import { play } from "@/lib/sfx";

type Round = {
  roundId: string;
  imageUrl: string;
  blockName: string;
  totalSheets: number;
  sheetLabels?: string[];
  maxFrame: number;
};

type Result = {
  correct: boolean;
  sheetCorrect: boolean;
  frameCorrect: boolean;
  guessesUsed: number;
  resolved: boolean;
  points: number;
  streak: number;
  answer?: { sheet: number; frame: number };
};

const MAX_GUESSES = 3;
const ROUND_SECONDS = 60;
const pill = "py-2.5 px-4 rounded-lg font-mono text-sm transition disabled:opacity-60";
const pillOn = "font-bold bg-[#1b2f27] border-2 border-emerald-400 text-emerald-300 shadow-sm";
const pillOff = "font-semibold bg-[#212130] hover:bg-[#28283a] border border-transparent text-slate-300";

export default function Game() {
  const { score, setScore, streak, setStreak, muted, user, blockId, setBlockId } = useGame();

  const [blocks, setBlocks] = useState<{ id: string; name: string }[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [sheet, setSheet] = useState(0);
  const [frame, setFrame] = useState("");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [locked, setLocked] = useState(false);
  const [used, setUsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [fx, setFx] = useState<"g" | "r" | null>(null);

  const frameInputRef = useRef<HTMLInputElement>(null);

  const apply = useCallback((r: Round) => {
    setRound(r);
    setSheet((s) => (s < r.totalSheets ? s : 0));
    setFrame("");
    setTimeLeft(ROUND_SECONDS);
    setLocked(false);
    setUsed(0);
    setResult(null);
    setFx(null);
    setTimeout(() => frameInputRef.current?.focus(), 50);
  }, []);

  async function fetchRound(targetBlock: string): Promise<Round> {
    const r: Round = await (await fetch(`/api/round?block=${targetBlock}`, { cache: "no-store" })).json();
    new Image().src = r.imageUrl;
    return r;
  }

  useEffect(() => {
    fetch("/api/blocks").then((res) => res.json()).then(setBlocks).catch(() => {});
  }, []);

  useEffect(() => {
    let live = true;
    fetchRound(blockId).then((r) => { if (live) apply(r); });
    return () => { live = false; };
  }, [apply, blockId]);

  useEffect(() => {
    if (locked || !round) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          submit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, round]);

  // a, s, d... pick sheet 0, 1, 2... even while typing in the frame input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (locked || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      const i = "asdfghjkl".indexOf(e.key.toLowerCase());
      if (i >= 0 && i < (round?.totalSheets ?? 0)) { e.preventDefault(); setSheet(i); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, round?.totalSheets]);

  const submit = async (timeout = false) => {
    if (locked || !round) return;
    setLocked(true);

    const f = timeout ? -1 : parseInt(frame, 10);
    const res = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundId: round.roundId, sheet, frame: Number.isInteger(f) ? f : 0, streak }),
    });

    if (!res.ok) {
      apply(await fetchRound(blockId));
      return;
    }

    const data: Result = await res.json();
    setResult(data);
    setUsed(data.guessesUsed);
    setFx(data.correct ? "g" : "r");

    if (data.correct) {
      if (!muted) play("correct");
      setScore((s) => s + data.points);
    } else if (!muted) play(data.resolved ? "fail" : "wrong");

    if (!data.resolved) {
      // wrong, but guesses remain: retry the same round
      setFrame("");
      setLocked(false);
      setTimeout(() => { setFx(null); frameInputRef.current?.focus(); }, 600);
      return;
    }
    setStreak(data.streak);

    const next = fetchRound(blockId);
    setTimeout(async () => apply(await next), 1800);
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const left = MAX_GUESSES - used;

  let feedback = "";
  let feedbackColor = "text-slate-400";
  if (result?.correct) { feedback = `Correct! +${result.points.toLocaleString()} pts`; feedbackColor = "text-emerald-400"; }
  else if (result?.resolved) { feedback = `Out of guesses. It was sheet ${result.answer?.sheet}, tick ${result.answer?.frame}`; feedbackColor = "text-rose-400"; }
  else if (result) { feedback = `Sheet ${result.sheetCorrect ? "✓" : "✗"}  ·  Tick ${result.frameCorrect ? "✓" : "✗"}`; feedbackColor = "text-amber-400"; }

  return (
    <section className="lg:col-span-8 bg-[#1a1a27] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {fx && <div className={`pointer-events-none absolute inset-0 rounded-2xl ${fx === "g" ? "flash-g" : "flash-r"}`} />}

      <div className="text-center space-y-2 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">What sprite sheet &amp; tick is this?</h1>
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="text-slate-400 font-mono text-xs uppercase tracking-wider">Block:</span>
          <span className="text-amber-400 font-bold font-mono text-sm tracking-wider uppercase">{round?.blockName ?? "..."}</span>
          <div className="flex items-center gap-1.5 ml-2" aria-label={`${left} guesses left`}>
            {Array.from({ length: MAX_GUESSES }).map((_, i) => (
              <span key={i} className={`w-2.5 h-2.5 rounded-full transition ${i < used ? "bg-slate-600/70" : "bg-amber-400"}`} />
            ))}
          </div>
        </div>
      </div>

      {blocks.length > 1 && (
        <div className="max-w-md mx-auto mb-6 flex flex-wrap gap-2 bg-[#12121b] p-1 rounded-xl border border-white/5">
          {[{ id: "all", name: "All" }, ...blocks].map((b) => (
            <button key={b.id} type="button" disabled={locked} onClick={() => setBlockId(b.id)}
              className={`flex-1 ${pill} ${blockId === b.id ? pillOn : pillOff}`}>{b.name}</button>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center justify-center mb-4">
        <div className={`relative p-2.5 rounded-lg bg-[#3a2c20] border-2 border-[#5c4432] shadow-[0_0_30px_rgba(0,0,0,0.6)] ${fx === "r" && !result?.resolved ? "shake" : ""}`}>
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 bg-[#14121a] rounded flex items-center justify-center border border-black/60 overflow-hidden">
            {round ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={round.imageUrl} alt="Animated texture frame" draggable={false} className="pixel w-full h-full" />
            ) : (
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </div>

      <div className={`h-6 mb-3 text-center font-mono text-sm font-semibold ${feedbackColor}`} aria-live="polite">{feedback}</div>

      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="max-w-md mx-auto space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            1. Select Sprite Sheet <span className="text-slate-500 font-normal normal-case">(keys: a / s)</span>
          </label>
          <div className="grid gap-2 bg-[#12121b] p-1 rounded-xl border border-white/5" style={{ gridTemplateColumns: `repeat(${round?.totalSheets || 2}, minmax(0, 1fr))` }}>
            {Array.from({ length: round?.totalSheets || 2 }).map((_, idx) => (
              <button key={idx} type="button" disabled={locked} onClick={() => setSheet(idx)}
                className={`${pill} ${sheet === idx ? pillOn : pillOff}`}>{round?.sheetLabels?.[idx] ?? `sheet_${idx}`}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="frame" className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            2. Enter Frame Number <span className="text-slate-500 font-normal">(0-{round?.maxFrame ?? 31})</span>
          </label>
          <input id="frame" ref={frameInputRef} inputMode="numeric" autoComplete="off" placeholder="0" value={frame} disabled={locked}
            onChange={(e) => setFrame(e.target.value.replace(/\D/g, ""))}
            className="w-full bg-[#12121b] border border-white/10 rounded-xl px-4 py-2.5 font-mono text-white text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition disabled:opacity-60" />
        </div>

        <div className="space-y-4 pt-1">
          <button type="submit" disabled={locked || frame === ""}
            className="w-full py-3 px-4 rounded-xl font-mono font-extrabold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 active:translate-y-0.5 transition disabled:opacity-50">
            Submit Guess
          </button>
          <div className="flex items-center justify-between text-sm pt-1">
            <div className="flex items-center gap-1.5 font-mono font-semibold text-amber-400">
              <Timer className="w-4 h-4" /><span>{mm}:{ss}s</span>
            </div>
            <div className="font-mono text-slate-300 text-xs text-right">
              SCORE: <span className="font-bold text-white text-sm">{score.toLocaleString()}</span>
              {!user && <Link href="/login" className="block text-[10px] text-slate-500 underline hover:text-white">Log in to save scores</Link>}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
