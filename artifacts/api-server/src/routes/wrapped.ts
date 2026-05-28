import { Router, type IRouter } from "express";
import { db, skillWrappedTable, usersTable, exchangesTable, creditTransactionsTable, badgesTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

async function generateWrappedCopy(stats: {
  topSkillTaught: string; topSkillLearned: string; creditsEarned: number;
  creditsSpent: number; totalExchanges: number; longestStreak: number; newBadges: number;
}): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Write a witty, personalised 2-sentence "month in skills" summary for a skill exchange app user.
Stats: taught ${stats.topSkillTaught}, learned ${stats.topSkillLearned}, ${stats.totalExchanges} exchanges, ${stats.creditsEarned} credits earned, ${stats.longestStreak}-day streak, ${stats.newBadges} badges.
Make it feel like a cool year-end wrapped feature. Casual, clever, specific to the data.`
      }]
    });
    return (msg.content[0] as { type: string; text: string }).text.trim();
  } catch {
    return `You smashed ${stats.totalExchanges} exchanges this month, teaching ${stats.topSkillTaught} and picking up ${stats.topSkillLearned}. ${stats.longestStreak}-day streak? That's not discipline, that's obsession — the good kind.`;
  }
}

router.get("/wrapped", async (req, res) => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const existing = await db.select().from(skillWrappedTable).where(and(eq(skillWrappedTable.userId, DEMO_USER_ID), eq(skillWrappedTable.month, month)));
  if (existing.length > 0) return res.json(existing[0]);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  const exchanges = await db.select().from(exchangesTable).where(or(eq(exchangesTable.teacherId, DEMO_USER_ID), eq(exchangesTable.learnerId, DEMO_USER_ID)));
  const completed = exchanges.filter(e => e.status === "completed");

  const skillCountTaught: Record<string, number> = {};
  const skillCountLearned: Record<string, number> = {};
  completed.forEach(e => {
    skillCountTaught[e.teachSkill] = (skillCountTaught[e.teachSkill] ?? 0) + 1;
    skillCountLearned[e.learnSkill] = (skillCountLearned[e.learnSkill] ?? 0) + 1;
  });

  const topSkillTaught = Object.entries(skillCountTaught).sort((a, b) => b[1] - a[1])[0]?.[0] ?? user.skillsOffered[0] ?? "React";
  const topSkillLearned = Object.entries(skillCountLearned).sort((a, b) => b[1] - a[1])[0]?.[0] ?? user.skillsWanted[0] ?? "Design";

  const transactions = await db.select().from(creditTransactionsTable).where(eq(creditTransactionsTable.userId, DEMO_USER_ID));
  const creditsEarned = transactions.filter(t => t.type === "earned").reduce((s, t) => s + t.amount, 0);
  const creditsSpent = transactions.filter(t => t.type === "spent").reduce((s, t) => s + t.amount, 0);

  const stats = {
    topSkillTaught, topSkillLearned, creditsEarned, creditsSpent,
    totalExchanges: completed.length,
    longestStreak: user.streakDays ?? 0,
    newBadges: 0,
  };

  const aiCopy = await generateWrappedCopy(stats);

  const [wrapped] = await db.insert(skillWrappedTable).values({ userId: DEMO_USER_ID, month, ...stats, aiCopy }).returning();
  return res.json(wrapped);
});

export default router;
