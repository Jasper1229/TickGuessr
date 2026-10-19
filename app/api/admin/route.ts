import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getBlocks } from "@/lib/registry";

export const runtime = "nodejs";
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const ok = () => NextResponse.json({ ok: true });

export async function GET() {
  if (!(await requireAdmin())) return bad("Forbidden", 403);
  await getBlocks();
  const [users, rounds, scores, userList, blocks] = await Promise.all([
    db.user.count(), db.gameRound.count(), db.score.count(),
    db.user.findMany({ orderBy: { createdAt: "asc" }, take: 200, select: { id: true, name: true, role: true, banned: true, streak: true, createdAt: true } }),
    db.block.findMany({ include: { sheets: { orderBy: { idx: "asc" } } } }),
  ]);
  return NextResponse.json({ stats: { users, rounds, scores }, users: userList, blocks });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return bad("Forbidden", 403);

  if ((req.headers.get("content-type") ?? "").includes("multipart")) {
    const f = await req.formData();
    const blockId = String(f.get("blockId")), file = f.get("file");
    if (!(file instanceof File) || file.size > 2_000_000) return bad("Upload a PNG under 2 MB.");
    const block = await db.block.findUnique({ where: { id: blockId }, include: { _count: { select: { sheets: true } } } });
    if (!block) return bad("Unknown block");
    const buf = Buffer.from(await file.arrayBuffer());
    const m = await sharp(buf).metadata().catch(() => null);
    const size = Number(f.get("size")) || m?.width || 0;
    if (!m || m.format !== "png" || !size || m.width !== size || !m.height || m.height % size) return bad("Sheet must be a PNG: one column of square frames.");
    const idx = block._count.sheets, name = `${blockId}_${idx}.png`, dir = path.join(process.cwd(), "assets", "sprites");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), buf);
    await db.spriteSheet.create({ data: { blockId, idx, file: name, frames: m.height / size, size } });
    return ok();
  }

  const b = await req.json().catch(() => ({}));
  const self = b.id === admin.id;
  switch (b.action) {
    case "setRole":
      if (self) return bad("You can't change your own role.");
      await db.user.update({ where: { id: b.id }, data: { role: b.role === "ADMIN" ? "ADMIN" : "USER" } });
      return ok();
    case "ban":
      if (self) return bad("You can't ban yourself.");
      await db.user.update({ where: { id: b.id }, data: { banned: !!b.banned } });
      if (b.banned) await db.session.deleteMany({ where: { userId: b.id } });
      return ok();
    case "patchBlock":
      await db.block.update({ where: { id: b.id }, data: { ...(typeof b.enabled === "boolean" && { enabled: b.enabled }), ...(typeof b.flip === "boolean" && { flip: b.flip }) } });
      return ok();
    case "createBlock":
      if (!/^[a-z0-9_]{2,24}$/.test(b.id ?? "") || !String(b.name ?? "").trim()) return bad("Block id: 2-24 lowercase letters, numbers or underscores, plus a name.");
      if (await db.block.findUnique({ where: { id: b.id } })) return bad("That block id exists.");
      await db.block.create({ data: { id: b.id, name: String(b.name).trim(), flip: !!b.flip } });
      return ok();
    case "deleteBlock":
      await db.block.delete({ where: { id: b.id } });
      return ok();
  }
  return bad("Unknown action");
}
