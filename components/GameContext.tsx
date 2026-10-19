"use client";
import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

type User = { name: string; role: string; streak: number } | null;
type G = {
  score: number; setScore: Dispatch<SetStateAction<number>>;
  streak: number; setStreak: Dispatch<SetStateAction<number>>;
  muted: boolean; setMuted: Dispatch<SetStateAction<boolean>>;
  user: User; refreshUser: () => Promise<void>;
};
const Ctx = createContext<G | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [muted, setMuted] = useState(false);
  const [user, setUser] = useState<User>(null);
  const refreshUser = useCallback(async () => {
    const d = await fetch("/api/auth", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ user: null }));
    setUser(d.user);
    setStreak(d.user?.streak ?? 0);
  }, []);
  useEffect(() => { refreshUser(); }, [refreshUser]);
  return <Ctx.Provider value={{ score, setScore, streak, setStreak, muted, setMuted, user, refreshUser }}>{children}</Ctx.Provider>;
}
export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error("GameProvider missing");
  return c;
}
