import { db } from "./db";

// Enabled blocks with their sheets. Seeds the fire block on first use.
export async function getBlocks() {
  if ((await db.block.count()) === 0) {
    await db.block
      .create({ data: { id: "fire", name: "Fire", flip: true, sheets: { create: [0, 1].map((i) => ({ idx: i, file: `fire_${i}.png`, frames: 32, size: 16 })) } } })
      .catch(() => {}); // concurrent first request
  }
  return db.block.findMany({ where: { enabled: true, sheets: { some: {} } }, include: { sheets: { orderBy: { idx: "asc" } } } });
}
