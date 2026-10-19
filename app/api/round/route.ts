import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getBlocks } from "@/lib/registry";
import { currentUser } from "@/lib/auth";

const rand = (n: number) => Math.floor(Math.random() * n);

// Returns an image URL and metadata only. Sheet/frame indices stay in the database.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("block") ?? "all";
  const pool = (await getBlocks()).filter((b) => id === "all" || b.id === id);
  if (!pool.length) return NextResponse.json({ error: "Unknown block" }, { status: 404 });
  await db.gameRound.deleteMany({ where: { resolved: false, startedAt: { lt: new Date(Date.now() - 10 * 60_000) } } });
  const block = pool[rand(pool.length)];
  const sheet = block.sheets[rand(block.sheets.length)];
  const me = await currentUser();
  const r = await db.gameRound.create({
    data: { userId: me?.id, blockId: block.id, sheet: sheet.idx, frame: rand(sheet.frames) * sheet.frametime, flip: block.flip && Math.random() < 0.5 },
  });
  return NextResponse.json(
    {
      roundId: r.id, imageUrl: `/api/round/${r.id}/image`, blockId: block.id, blockName: block.name,
      totalSheets: block.sheets.length,    totalFrames: Math.max(...block.sheets.map((s) => s.frames * s.frametime)), maxGuesses: 3,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
