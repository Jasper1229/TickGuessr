import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const id = sp.get("block") ?? "all";
  const limit = Math.min(Number(sp.get("limit")) || 5, 50);
  const g = await db.score.groupBy({
    by: ["userId"], where: { user: { banned: false }, ...(id === "all" ? {} : { blockId: id }) },
    _sum: { points: true }, orderBy: { _sum: { points: "desc" } }, take: limit,
  });
  const users = await db.user.findMany({ where: { id: { in: g.map((x) => x.userId) } }, select: { id: true, name: true } });
  const names = new Map(users.map((u) => [u.id, u.name]));
  const me = (await currentUser())?.name;
  const blocks = await db.block.findMany({ where: { enabled: true }, select: { id: true, name: true } });
  return NextResponse.json(
    { blocks, entries: g.map((x, i) => { const username = names.get(x.userId) ?? "?"; return { rank: i + 1, username, score: x._sum.points ?? 0, me: username === me }; }) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
