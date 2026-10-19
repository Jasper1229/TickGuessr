import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const MAX = 3;
const err = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.roundId !== "string" || !Number.isInteger(b.sheet) || !Number.isInteger(b.frame)) return err("Bad request", 400);
  const r = await db.gameRound.findUnique({ where: { id: b.roundId } });
  const me = await currentUser();
  if (!r || r.resolved || (r.userId && r.userId !== me?.id)) return err("Round expired", 404);
  // Optimistic lock: a replayed/parallel guess can't get extra attempts.
  const lock = await db.gameRound.updateMany({ where: { id: r.id, guesses: r.guesses, resolved: false }, data: { guesses: { increment: 1 } } });
  if (!lock.count) return err("Conflict", 409);

  const owner = r.userId ? me : null; // only logged-in rounds persist scores/streaks
  const guesses = r.guesses + 1;
  const sheetCorrect = b.sheet === r.sheet, frameCorrect = b.frame === r.frame;
  const correct = sheetCorrect && frameCorrect;
  const resolved = correct || guesses >= MAX;
  const elapsedMs = Date.now() - r.startedAt.getTime();
  const voided = correct && elapsedMs > 60_000;
  const streak = owner ? owner.streak : Number.isInteger(b.streak) ? Math.max(0, b.streak) : 0;

  let points = 0;
  if (correct) {
    const speed = Math.max(0.2, 1 - elapsedMs / 30_000);
    points = Math.round(1000 * speed * [1, 0.5, 0.25][guesses - 1] * (voided ? 1 : 1 + Math.min(streak, 10) * 0.1));
  }
  const newStreak = correct ? (voided ? 0 : streak + 1) : resolved ? 0 : streak;

  if (resolved) {
    await db.gameRound.update({ where: { id: r.id }, data: { resolved: true, correct, points } });
    if (owner) {
      await db.user.update({ where: { id: owner.id }, data: { streak: newStreak, bestStreak: Math.max(owner.bestStreak, newStreak) } });
      if (correct) await db.score.create({ data: { userId: owner.id, blockId: r.blockId, points } });
    }
  }
  return NextResponse.json(
    { correct, sheetCorrect, frameCorrect, guessesUsed: guesses, resolved, points, streak: newStreak, voided, elapsedMs, saved: !!owner && correct, answer: resolved ? { sheet: r.sheet, frame: r.frame } : undefined },
    { headers: { "Cache-Control": "no-store" } },
  );
}
