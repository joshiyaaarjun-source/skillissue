import { Router, type IRouter } from "express";
import { db, usersTable, badgesTable, creditTransactionsTable, capsulesTable, partnerStreaksTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/passport", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const badges = await db.select().from(badgesTable).where(eq(badgesTable.userId, DEMO_USER_ID));
  const earnedBadges = badges.filter(b => b.earned);

  const transactions = await db.select().from(creditTransactionsTable).where(eq(creditTransactionsTable.userId, DEMO_USER_ID));
  const creditsEarnedLifetime = transactions.filter(t => t.type === "earned").reduce((s, t) => s + t.amount, 0);

  const capsules = await db.select().from(capsulesTable);
  const myCapsulesCreated = capsules.filter(c => (c as unknown as { creatorId?: number }).creatorId === DEMO_USER_ID).length;

  const streaks = await db.select().from(partnerStreaksTable).where(or(eq(partnerStreaksTable.userId1, DEMO_USER_ID), eq(partnerStreaksTable.userId2, DEMO_USER_ID)));

  res.json({
    user: { id: user.id, name: user.name, avatar: user.avatar, bio: user.bio, level: user.level, xp: user.xp },
    verifiedSkills: user.verificationStatus === "verified" ? user.skillsOffered : [],
    topSessions: user.totalExchanges,
    creditsEarnedLifetime,
    badgeCount: earnedBadges.length,
    capsulesCreated: myCapsulesCreated,
    longestStreak: user.longestStreak,
    partnerStreakCount: streaks.length,
    totalExchanges: user.totalExchanges,
  });
});

export default router;
