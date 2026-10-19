"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, LogOut, Volume2, VolumeX } from "lucide-react";
import { useGame } from "./GameContext";

export default function Header() {
  const path = usePathname();
  const { streak, muted, setMuted, user, refreshUser } = useGame();
  const links = [["/", "Play"], ["/leaderboard", "Leaderboard"], ["/about", "About"], ...(user?.role === "ADMIN" ? [["/admin", "Admin"]] : [])];
  const logout = async () => {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    await refreshUser();
  };
  return (
    <header className="w-full border-b border-white/5 bg-[#171722]/80 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-slate-950 text-xl font-mono shadow-md shadow-orange-950/40">?</div>
        <span className="font-extrabold text-xl tracking-tight text-white font-mono">Tick<span className="text-amber-400">Guessr</span></span>
      </Link>
      <nav className="hidden sm:flex items-center gap-8 text-sm font-medium">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? "text-amber-400 font-semibold" : "text-slate-400 hover:text-white transition"}>{label}</Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2.5 bg-[#20202e] border border-white/5 rounded-lg py-1.5 px-3">
            <span className="text-xs font-semibold text-slate-200">{user.name}</span>
            <div className="w-6 h-6 rounded bg-[#2b3d56] overflow-hidden border border-white/10 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user.name)}`} alt="" className="w-full h-full object-cover" />
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-white transition" title="Log out" aria-label="Log out"><LogOut className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <Link href="/login" className="bg-[#20202e] border border-white/5 rounded-lg py-1.5 px-3 text-xs font-semibold text-amber-400 hover:bg-white/5 transition">Log in</Link>
        )}
        <div className="flex items-center gap-1.5 bg-orange-950/40 border border-orange-500/30 text-amber-400 rounded-lg py-1.5 px-3 text-xs font-mono font-bold" title="Streak">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /><span>{streak}</span>
        </div>
        <button onClick={() => setMuted((m) => !m)} className="p-2 rounded-lg bg-[#20202e] border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 transition" title="Toggle audio" aria-label="Toggle audio">
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
