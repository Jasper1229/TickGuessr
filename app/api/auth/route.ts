import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, endSession, hash, startSession, verify } from "@/lib/auth";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET() {
  const u = await currentUser();
  return NextResponse.json({ user: u && { name: u.name, role: u.role, streak: u.streak } });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  if (b.action === "logout") { await endSession(); return NextResponse.json({ ok: true }); }
  const name = String(b.name ?? "").trim(), pw = String(b.password ?? "");
  if (b.action === "register") {
    if (!/^\w{3,20}$/.test(name) || pw.length < 8) return fail("Username: 3-20 letters, numbers or underscores. Password: 8+ characters.", 400);
    if (await db.user.findUnique({ where: { name } })) return fail("That username is taken.", 409);
    const first = (await db.user.count()) === 0; // first account becomes admin
    const u = await db.user.create({ data: { name, passwordHash: hash(pw), role: first ? "ADMIN" : "USER" } });
    await startSession(u.id);
    return NextResponse.json({ ok: true });
  }
  if (b.action === "login") {
    const u = await db.user.findUnique({ where: { name } });
    if (!u || u.banned || !verify(pw, u.passwordHash)) return fail("Invalid username or password.", 401);
    await startSession(u.id);
    return NextResponse.json({ ok: true });
  }
  return fail("Bad request", 400);
}
