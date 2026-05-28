import { Router, type IRouter } from "express";
import { db, liveDropsTable, usersTable } from "@workspace/db";
import { eq, desc, gte } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

async function seedDrops() {
  const existing = await db.select().from(liveDropsTable).where(eq(liveDropsTable.status, "announced")).limit(1);
  if (existing.length > 0) return;
  const expiresAt = new Date(Date.now() + 25 * 60 * 1000);
  await db.insert(liveDropsTable).values([
    { userId: 2, skillTag: "React", title: "React hooks Q&A — live in 10 min", description: "Bring your burning hooks questions. useCallback? useMemo? Context? All fair game.", startsInMinutes: 10, expiresAt },
    { userId: 3, skillTag: "Figma", title: "Figma component live-build session", description: "Building a full design system component from scratch. Watch + ask questions.", startsInMinutes: 20, expiresAt: new Date(Date.now() + 28 * 60 * 1000) },
  ]);
}
seedDrops();

router.get("/live-drops", async (req, res) => {
  const now = new Date();
  const drops = await db.select().from(liveDropsTable).where(eq(liveDropsTable.status, "announced")).orderBy(desc(liveDropsTable.announcedAt));
  const users = await db.select().from(usersTable);

  const active = drops.filter(d => d.expiresAt > now);
  const expired = drops.filter(d => d.expiresAt <= now);

  for (const d of expired) {
    await db.update(liveDropsTable).set({ status: "expired" }).where(eq(liveDropsTable.id, d.id));
  }

  const result = active.map(d => {
    const user = users.find(u => u.id === d.userId);
    const msLeft = d.expiresAt.getTime() - now.getTime();
    const minutesLeft = Math.floor(msLeft / 60000);
    return { ...d, hostName: user?.name ?? "Unknown", hostAvatar: user?.avatar ?? "", minutesLeft };
  });

  res.json(result);
});

router.post("/live-drops", async (req, res) => {
  const { skillTag, title, description, startsInMinutes } = req.body as { skillTag: string; title: string; description?: string; startsInMinutes?: number };
  const starts = startsInMinutes ?? 10;
  const expiresAt = new Date(Date.now() + (starts + 30) * 60 * 1000);

  const [drop] = await db.insert(liveDropsTable).values({
    userId: DEMO_USER_ID, skillTag, title,
    description: description ?? "",
    startsInMinutes: starts,
    expiresAt,
  }).returning();

  res.json(drop);
});

router.delete("/live-drops/:id", async (req, res) => {
  await db.update(liveDropsTable).set({ status: "cancelled" }).where(eq(liveDropsTable.id, parseInt(req.params.id)));
  res.json({ success: true });
});

export default router;
