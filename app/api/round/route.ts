import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getBlocks } from "@/lib/registry";

export async function GET(req: Request) {
  const blockParam = new URL(req.url).searchParams.get("block") || "all";

  const allBlocks = await getBlocks();
  if (!allBlocks.length) return NextResponse.json({ error: "No blocks available" }, { status: 404 });

  const eligible = blockParam === "all" ? allBlocks : allBlocks.filter((b) => b.id === blockParam);
  const pool = eligible.length ? eligible : allBlocks;
  const block = pool[Math.floor(Math.random() * pool.length)];

  const sheetIdx = Math.floor(Math.random() * block.sheets.length);
  const sheet = block.sheets[sheetIdx];
  // frame is a tick number: each sheet row lasts `frametime` ticks
  const frame = Math.floor(Math.random() * sheet.frames * sheet.frametime);
  const flip = block.flip && Math.random() < 0.5;

  const me = await currentUser();
  const round = await db.gameRound.create({
    data: { userId: me?.id ?? null, blockId: block.id, sheet: sheet.idx, frame, flip },
  });

  return NextResponse.json(
    {
      roundId: round.id,
      imageUrl: `/api/round/${round.id}/image`,
      blockName: block.name,
      totalSheets: block.sheets.length,
      sheetLabels: block.sheets.map((s) => s.file.replace(/\.png$/, "")),
      maxFrame: Math.max(...block.sheets.map((s) => s.frames * s.frametime)) - 1,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
