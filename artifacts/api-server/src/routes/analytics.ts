import { Router, type IRouter } from "express";
import { db, exchangesTable, creditTransactionsTable, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { GetMyAnalyticsResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/analytics/me", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const exchanges = await db.select().from(exchangesTable).where(
    or(eq(exchangesTable.teacherId, DEMO_USER_ID), eq(exchangesTable.learnerId, DEMO_USER_ID))
  );

  const transactions = await db.select().from(creditTransactionsTable).where(eq(creditTransactionsTable.userId, DEMO_USER_ID));

  const creditsEarned = transactions.filter(t => t.type === "earned").reduce((sum, t) => sum + t.amount, 0);
  const creditsSpent = transactions.filter(t => t.type === "spent").reduce((sum, t) => sum + t.amount, 0);

  const skillsLearned = [...new Set(exchanges.filter(e => e.learnerId === DEMO_USER_ID).map(e => e.learnSkill))];
  const skillsTaught = [...new Set(exchanges.filter(e => e.teacherId === DEMO_USER_ID).map(e => e.teachSkill))];

  const monthlyMap: Record<string, number> = {};
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  months.forEach(m => { monthlyMap[m] = 0; });

  exchanges.forEach(e => {
    const d = e.createdAt;
    const label = d.toLocaleString("en-US", { month: "short" });
    if (monthlyMap[label] !== undefined) {
      monthlyMap[label]++;
    }
  });

  const exchangesByMonth = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));

  const skillCounts: Record<string, number> = {};
  [...skillsLearned, ...skillsTaught].forEach(s => {
    skillCounts[s] = (skillCounts[s] ?? 0) + 1;
  });

  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  res.json(GetMyAnalyticsResponse.parse({
    totalExchanges: exchanges.length,
    creditsEarned,
    creditsSpent,
    skillsLearned,
    skillsTaught,
    exchangesByMonth,
    topSkills,
  }));
});

export default router;
