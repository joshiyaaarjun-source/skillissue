import { Router, type IRouter } from "express";
import { db, usersTable, badgesTable, exchangesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetGamificationResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/gamification/me", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const badges = await db.select().from(badgesTable).where(eq(badgesTable.userId, DEMO_USER_ID));
  const completedExchanges = await db.select().from(exchangesTable).where(eq(exchangesTable.teacherId, DEMO_USER_ID));
  const completedCount = completedExchanges.filter(e => e.status === "completed").length;

  const badgeList = badges.map(b => ({
    id: String(b.id),
    name: b.name,
    description: b.description,
    icon: b.icon,
    earned: b.earned,
    earnedAt: b.earnedAt?.toISOString(),
    progress: b.progress,
    target: b.target,
  }));

  const unearned = badgeList.find(b => !b.earned);

  const level = Math.floor(user.xp / 100) + 1;

  res.json(GetGamificationResponse.parse({
    streakDays: user.streakDays,
    longestStreak: user.longestStreak,
    xp: user.xp,
    level,
    badges: badgeList,
    ...(unearned ? { nextBadge: unearned } : {}),
  }));
});

export default router;
