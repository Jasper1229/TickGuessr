// Server-side round store. The answer never leaves the server until a round is resolved.
export type Round = { block: string; sheet: number; frame: number; flip: boolean; start: number; guesses: number };
const g = globalThis as unknown as { __rounds?: Map<string, Round> };
export const rounds: Map<string, Round> = (g.__rounds ??= new Map<string, Round>());
export function prune() {
  const now = Date.now();
  for (const [k, r] of rounds) if (now - r.start > 10 * 60_000) rounds.delete(k);
}
