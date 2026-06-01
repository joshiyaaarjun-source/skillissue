import { Router, type IRouter } from "express";
import { db, roastsTable, usersTable, exchangesTable, sessionsTable } from "@workspace/db";
import { eq, desc, or } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

async function generateRoast(user: { name: string; skillsOffered: string[]; credibilityScore: number; totalExchanges: number; streakDays: number }, weakestSkill: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `You are a witty, playful skill coach giving a friendly roast. Be funny and a little savage but never mean or cruel. Roast this user's skill profile in 2-3 sentences.
Name: ${user.name}
Skills offered: ${user.skillsOffered.join(", ")}
Weakest area: ${weakestSkill}
Rating: ${user.credibilityScore}/5
Exchanges: ${user.totalExchanges}
Streak: ${user.streakDays} days
Be specific to their data. Keep it under 60 words. End with one actionable improvement.`
      }]
    });
    return (msg.content[0] as { type: string; text: string }).text.trim();
  } catch {
    return `${user.name}, your ${weakestSkill} skills are giving "barely functional" vibes — ${user.credibilityScore.toFixed(1)}/5 with ${user.totalExchanges} exchanges? Even your streak of ${user.streakDays} days can't save you. Hot take: actually practice ${weakestSkill} instead of just listing it.`;
  }
}

router.get("/roast", async (_req, res): Promise<void> => {
  const existing = await db.select().from(roastsTable).where(eq(roastsTable.userId, DEMO_USER_ID)).orderBy(desc(roastsTable.createdAt)).limit(1);
  if (existing.length > 0) { res.json(existing[0]); return; }
  res.json({ id: 0, roastText: "", weakestSkill: "", optedIn: false, createdAt: new Date().toISOString() });
});

router.post("/roast/opt-in", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const exchanges = await db.select().from(exchangesTable).where(or(eq(exchangesTable.teacherId, DEMO_USER_ID), eq(exchangesTable.learnerId, DEMO_USER_ID)));
  const weakestSkill = user.skillsOffered[Math.floor(Math.random() * user.skillsOffered.length)] ?? "general teaching";
  const roastText = await generateRoast(user, weakestSkill);

  await db.delete(roastsTable).where(eq(roastsTable.userId, DEMO_USER_ID));
  const [roast] = await db.insert(roastsTable).values({ userId: DEMO_USER_ID, roastText, weakestSkill, optedIn: true }).returning();
  res.json({ ...roast, createdAt: roast.createdAt.toISOString() });
});

export default router;
