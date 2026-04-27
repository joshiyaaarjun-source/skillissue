import { Router, type IRouter } from "express";
import { db, skillBattlesTable, usersTable } from "@workspace/db";
import { eq, desc, ne } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();
const DEMO_USER_ID = 1;
const BATTLE_CREDITS = 15;

interface BattleQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

const AI_OPPONENTS = [
  { name: "Kai Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kai" },
  { name: "Priya Nair", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya" },
  { name: "Marcus Webb", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus" },
];

function formatBattle(b: typeof skillBattlesTable.$inferSelect) {
  return {
    id: String(b.id),
    skill: b.skill,
    status: b.status as "active" | "completed" | "voting",
    opponentName: b.opponentName,
    opponentAvatar: b.opponentAvatar,
    questions: (b.questions as BattleQuestion[]) ?? [],
    challengerAnswers: (b.challengerAnswers as number[]) ?? [],
    challengerScore: b.challengerScore,
    opponentScore: b.opponentScore,
    votesForChallenger: b.votesForChallenger,
    votesForOpponent: b.votesForOpponent,
    timeLimitSeconds: b.timeLimitSeconds,
    creditsAwarded: b.creditsAwarded,
    badgeAwarded: b.badgeAwarded ?? undefined,
    createdAt: b.createdAt.toISOString(),
    endedAt: b.endedAt?.toISOString() ?? undefined,
  };
}

async function generateBattleQuestions(skill: string): Promise<BattleQuestion[]> {
  try {
    const client = new Anthropic({
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
    });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Generate 3 multiple-choice questions to test knowledge of "${skill}". Each question should have 4 options (a, b, c, d). Return JSON array: [{"text": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}]. No extra text.`,
      }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]) as BattleQuestion[];
  } catch {}

  // Fallback questions
  return [
    { text: `What is a core concept in ${skill}?`, options: ["Abstraction", "Compilation", "Iteration", "All of the above"], correctIndex: 3 },
    { text: `Which best practice applies to ${skill}?`, options: ["Code review", "Documentation", "Testing", "All of the above"], correctIndex: 3 },
    { text: `A common challenge in ${skill} is?`, options: ["Performance optimization", "Maintenance", "Scalability", "All of the above"], correctIndex: 3 },
  ];
}

// GET /battles
router.get("/battles", async (req, res): Promise<void> => {
  const battles = await db.select().from(skillBattlesTable)
    .orderBy(desc(skillBattlesTable.createdAt))
    .limit(20);
  res.json(battles.map(formatBattle));
});

// POST /battles
router.post("/battles", async (req, res): Promise<void> => {
  const { skill } = req.body as { skill?: string };
  if (!skill) { res.status(400).json({ error: "skill is required" }); return; }

  const opponent = AI_OPPONENTS[Math.floor(Math.random() * AI_OPPONENTS.length)];
  const questions = await generateBattleQuestions(skill);

  const [battle] = await db.insert(skillBattlesTable).values({
    challengerId: DEMO_USER_ID,
    opponentName: opponent.name,
    opponentAvatar: opponent.avatar,
    skill,
    status: "active",
    questions,
    timeLimitSeconds: 60,
  }).returning();

  res.json(formatBattle(battle));
});

// POST /battles/:battleId/submit
router.post("/battles/:battleId/submit", async (req, res): Promise<void> => {
  const battleId = parseInt(req.params.battleId, 10);
  const { answers, timeUsedSeconds } = req.body as { answers?: number[]; timeUsedSeconds?: number };

  const [battle] = await db.select().from(skillBattlesTable).where(eq(skillBattlesTable.id, battleId));
  if (!battle) { res.status(404).json({ error: "Battle not found" }); return; }

  const questions = (battle.questions as BattleQuestion[]) ?? [];
  const submittedAnswers = answers ?? [];

  // Score the challenger
  let challengerScore = 0;
  for (let i = 0; i < questions.length; i++) {
    if (submittedAnswers[i] === questions[i].correctIndex) challengerScore++;
  }

  // Simulate opponent score (AI gets 1-2 correct)
  const opponentScore = Math.floor(Math.random() * 2) + 1;

  // Time bonus: faster = better (up to 0.5 extra score equivalent)
  const timeBonus = timeUsedSeconds && timeUsedSeconds < 30 ? 0.5 : 0;
  const challengerTotal = challengerScore + timeBonus;

  const challengerWins = challengerTotal > opponentScore;
  const creditsAwarded = challengerWins ? BATTLE_CREDITS : 0;
  const badgeAwarded = challengerWins && challengerScore === questions.length ? "Battle Dominator" :
                       challengerWins ? "Battle Victor" : undefined;

  // Update user credits if they won
  if (challengerWins) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
    if (user) {
      await db.update(usersTable).set({
        creditBalance: (user.creditBalance ?? 20) + creditsAwarded,
        xp: (user.xp ?? 0) + 100,
      }).where(eq(usersTable.id, DEMO_USER_ID));
    }
  }

  const [updated] = await db.update(skillBattlesTable).set({
    challengerAnswers: submittedAnswers,
    challengerScore,
    opponentScore,
    status: "voting",
    creditsAwarded,
    badgeAwarded: badgeAwarded ?? null,
    endedAt: new Date(),
    // Seed some community votes
    votesForChallenger: challengerWins ? Math.floor(Math.random() * 8) + 3 : Math.floor(Math.random() * 4) + 1,
    votesForOpponent: challengerWins ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 8) + 3,
  }).where(eq(skillBattlesTable.id, battleId)).returning();

  res.json(formatBattle(updated));
});

// POST /battles/:battleId/vote
router.post("/battles/:battleId/vote", async (req, res): Promise<void> => {
  const battleId = parseInt(req.params.battleId, 10);
  const { voteFor } = req.body as { voteFor?: "challenger" | "opponent" };

  const [battle] = await db.select().from(skillBattlesTable).where(eq(skillBattlesTable.id, battleId));
  if (!battle) { res.status(404).json({ error: "Battle not found" }); return; }

  const update = voteFor === "challenger"
    ? { votesForChallenger: battle.votesForChallenger + 1 }
    : { votesForOpponent: battle.votesForOpponent + 1 };

  const [updated] = await db.update(skillBattlesTable).set(update)
    .where(eq(skillBattlesTable.id, battleId)).returning();

  res.json(formatBattle(updated));
});

export default router;
