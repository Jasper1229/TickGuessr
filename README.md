# TickGuessr
Next.js (App Router) + TypeScript + Tailwind v4 + Prisma (SQLite).

    npm install      # also runs prisma generate
    npm run dev      # pushes the schema to prisma/dev.db, then starts Next

The **first account you register becomes admin** and gets an Admin link in the header.

## Sprites
`assets/sprites/fire_0.png` / `fire_1.png` are generated placeholders (16x512, 32 frames). Replace them with the real textures from your Minecraft jar (same filenames).
Add more blocks in /admin: create a block, then upload sheets (PNG, one column of square frames). Sheet numbers follow upload order.
Sheets live outside `public/`, so the client never sees a full sheet.

## How it works
- Rounds are stored in the DB (answer never sent to the client until resolved). Guesses use an optimistic lock so replays can't gain attempts.
- Auth: scrypt password hashes, DB-backed sessions, httpOnly cookie. Logged-in play persists scores and streaks; guests can play but nothing is saved.
- Leaderboards are `SUM(points)` per user, per block or across all blocks, polled every 10s.

## Production notes
- Switch `provider` in `prisma/schema.prisma` to `postgresql`, set `DATABASE_URL`, and use `prisma migrate` instead of `db push`.
- Uploaded sheets are written to local disk; use object storage on serverless hosts.
- No login rate limiting yet.
