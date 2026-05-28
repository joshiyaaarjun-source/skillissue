import { Router, type IRouter } from "express";
import { db, coldStartChallengesTable, usersTable, creditTransactionsTable, ledgerTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

async function generateChallenge(skills: string[]): Promise<{ prompt: string; skillContext: string }> {
  const skill = skills[Math.floor(Math.random() * skills.length)] ?? "general knowledge";
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `Generate ONE short micro-challenge for a skill exchange platform. The user knows: ${skill}.
Challenge must be completable in 60 seconds (e.g. "Explain X in 3 sentences", "List 3 uses of Y").
Reply with ONLY the challenge prompt, no extra text. Max 20 words.`
      }]
    });
    const prompt = (msg.content[0] as { type: string; text: string }).text.trim();
    return { prompt, skillContext: skill };
  } catch {
    const fallbacks = [
      `Explain ${skill} to a 10-year-old in 3 sentences.`,
      `Name 3 real-world uses of ${skill}.`,
      `What's the most surprising thing about ${skill}?`,
    ];
    return { prompt: fallbacks[Math.floor(Math.random() * fallbacks.length)], skillContext: skill };
  }
}

router.get("/challenges/today", async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) return res.status(404).json({ error: "User not found" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allChallenges = await db.select().from(coldStartChallengesTable).where(eq(coldStartChallengesTable.userId, DEMO_USER_ID));
  const completedCount = allChallenges.filter(c => c.completed).length;

  if (completedCount >= 3) return res.json({ graduated: true, completedCount });

  const todayChallenge = allChallenges.find(c => !c.completed && c.generatedAt >= today);
  if (todayChallenge) return res.json({ challenge: todayChallenge, completedCount });

  const { prompt, skillContext } = await generateChallenge(user.skillsOffered.length > 0 ? user.skillsOffered : ["programming"]);
  const [challenge] = await db.insert(coldStartChallengesTable).values({
    userId: DEMO_USER_ID, prompt, skillContext
  }).returning();

  return res.json({ challenge, completedCount });
});

router.post("/challenges/:id/complete", async (req, res) => {
  const [challenge] = await db.select().from(coldStartChallengesTable).where(
    and(eq(coldStartChallengesTable.id, parseInt(req.params.id)), eq(coldStartChallengesTable.userId, DEMO_USER_ID))
  );
  if (!challenge) return res.status(404).json({ error: "Challenge not found" });
  if (challenge.completed) return res.status(400).json({ error: "Already completed" });

  await db.update(coldStartChallengesTable).set({ completed: true, completedAt: new Date(), creditsAwarded: 5 }).where(eq(coldStartChallengesTable.id, challenge.id));
  await db.update(usersTable).set({ creditBalance: (db as any).sql`credit_balance + 5` }).where(eq(usersTable.id, DEMO_USER_ID));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  await db.update(usersTable).set({ creditBalance: user.creditBalance + 5 }).where(eq(usersTable.id, DEMO_USER_ID));

  await db.insert(creditTransactionsTable).values({
    userId: DEMO_USER_ID, type: "earned", amount: 5, description: `Cold-start challenge: ${challenge.skillContext}`,
  });
  await db.insert(ledgerTable).values({
    eventType: "CREDITS_UPDATED", userId: DEMO_USER_ID, description: 'Cold-start challenge completed', metadata: { reason: 'cold_start_challenge', amount: 5 },
  });

  return res.json({ success: true, creditsEarned: 5 });
});

export default router;
