import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "./db";

export const hash = (pw: string) => {
  const s = randomBytes(16).toString("hex");
  return `${s}:${scryptSync(pw, s, 64).toString("hex")}`;
};
export const verify = (pw: string, h: string) => {
  const [s, k] = h.split(":");
  const a = Buffer.from(k, "hex"), b = scryptSync(pw, s, 64);
  return a.length === b.length && timingSafeEqual(a, b);
};

export async function startSession(userId: string) {
  const id = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 864e5);
  await db.session.create({ data: { id, userId, expires } });
  (await cookies()).set("sid", id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires });
}
export async function endSession() {
  const c = await cookies();
  const sid = c.get("sid")?.value;
  if (sid) await db.session.deleteMany({ where: { id: sid } });
  c.delete("sid");
}
export async function currentUser() {
  const sid = (await cookies()).get("sid")?.value;
  if (!sid) return null;
  const s = await db.session.findUnique({ where: { id: sid }, include: { user: true } });
  return !s || s.expires < new Date() || s.user.banned ? null : s.user;
}
export async function requireAdmin() {
  const u = await currentUser();
  return u?.role === "ADMIN" ? u : null;
}
