import { Router, type IRouter } from "express";
import { db, partnerStreaksTable, matchesTable, usersTable, exchangesTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/partner-streaks", async (_req, res): Promise<void> => {
  const matches = await db.select().from(matchesTable).where(or(eq(matchesTable.userAId, DEMO_USER_ID), eq(matchesTable.userBId, DEMO_USER_ID)));
  const users = await db.select().from(usersTable);
  const exchanges = await db.select().from(exchangesTable).where(eq(exchangesTable.status, "completed"));

  const result = [];
  for (const match of matches) {
    const partnerId = match.userAId === DEMO_USER_ID ? match.userBId : match.userAId;
    const partner = users.find(u => u.id === partnerId);

    const sharedExchanges = exchanges.filter(e =>
      (e.teacherId === DEMO_USER_ID && e.learnerId === partnerId) ||
      (e.teacherId === partnerId && e.learnerId === DEMO_USER_ID)
    );
    if (sharedExchanges.length < 3) continue;

    let streak = await db.select().from(partnerStreaksTable).where(eq(partnerStreaksTable.matchId, match.id));
    if (streak.length === 0) {
      const [inserted] = await db.insert(partnerStreaksTable).values({
        matchId: match.id,
        userId1: DEMO_USER_ID,
        userId2: partnerId,
        currentStreak: sharedExchanges.length,
        longestStreak: sharedExchanges.length,
      }).returning();
      streak = [inserted];
    }

    const s = streak[0];
    const teachSkill = sharedExchanges[0]?.teachSkill ?? "Skills";
    result.push({
      id: s.id,
      matchId: match.id,
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      lastSessionAt: s.lastSessionAt?.toISOString() ?? null,
      partnerName: partner?.name ?? "Unknown",
      partnerAvatar: partner?.avatar ?? "",
      skill: teachSkill,
    });
  }
  res.json(result);
});

export default router;
