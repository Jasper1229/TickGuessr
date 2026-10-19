"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

export type User = {
  name: string;
  role: string;
  streak: number;
};

export type GameContextType = {
  score: number;
  setScore: Dispatch<SetStateAction<number>>;
  streak: number;
  setStreak: Dispatch<SetStateAction<number>>;
  muted: boolean;
  setMuted: Dispatch<SetStateAction<boolean>>;
  user: User | null;
  refreshUser: () => Promise<void>;
  blockId: string;
  setBlockId: Dispatch<SetStateAction<string>>;
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [muted, setMuted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [blockId, setBlockId] = useState("all");

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
      <GameContext.Provider
          value={{
            score,
            setScore,
            streak,
            setStreak,
            muted,
            setMuted,
            user,
            refreshUser,
            blockId,
            setBlockId,
          }}
      >
        {children}
      </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}