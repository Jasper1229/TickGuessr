import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { db } from "@/lib/db";

export const runtime = "nodejs";

// Crops the single frame server-side so the client never sees the whole sheet or any indices.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await db.gameRound.findUnique({ where: { id } });
  const s = r && (await db.spriteSheet.findUnique({ where: { blockId_idx: { blockId: r.blockId, idx: r.sheet } } }));
  if (!r || !s) return new Response("Not found", { status: 404 });
  const buf = await readFile(path.join(process.cwd(), "assets", "sprites", s.file));
  let img = sharp(buf).extract({ left: 0, top: Math.floor(r.frame / s.frametime) * s.size, width: s.size, height: s.size });
  if (r.flip) img = img.flop();
  const out = await img.resize(256, 256, { kernel: "nearest" }).png().toBuffer();
  return new Response(new Uint8Array(out), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
}
