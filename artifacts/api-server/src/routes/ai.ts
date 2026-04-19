import { Router, type IRouter } from "express";
import { db, usersTable, exchangesTable, learningPathsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { GenerateLearningPathBody } from "@workspace/api-zod";
import type { LearningPathStepData } from "@workspace/db";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

function getAnthropicClient() {
  return new Anthropic({
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  });
}

// GET /ai/skill-coach — generate AI coaching feedback from user's exchange history
router.get("/ai/skill-coach", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const exchanges = await db.select().from(exchangesTable).where(eq(exchangesTable.learnerId, DEMO_USER_ID));

  try {
    const client = getAnthropicClient();

    const recentSkillsTaught = user.skillsOffered.slice(0, 3).join(", ") || "general skills";
    const recentSkillsLearned = user.skillsWanted.slice(0, 3).join(", ") || "various skills";
    const exchangeCount = exchanges.length;

    const prompt = `You are an intelligent skill coach on a peer-to-peer skill exchange platform called Skillissu.

User profile:
- Name: ${user.name}
- Skills they teach: ${recentSkillsTaught}
- Skills they want to learn: ${recentSkillsLearned}
- Total exchanges completed: ${exchangeCount}
- Credibility score: ${user.credibilityScore}/5.0
- XP: ${user.xp}

Generate personalized skill coaching feedback. Be specific, encouraging, and actionable.
Respond ONLY with valid JSON in this exact format:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["area to improve 1", "area to improve 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "coachNote": "A warm, personal 1-2 sentence motivational note addressed to the user by name."
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);

    res.json({
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      suggestions: parsed.suggestions ?? [],
      coachNote: parsed.coachNote ?? "Keep going — every skill session brings you closer to mastery.",
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Skill coach error:", err);
    // Graceful fallback
    res.json({
      strengths: [`Strong foundation in ${user.skillsOffered[0] ?? "your primary skill"}`, "Consistent platform engagement", "High credibility score"],
      weaknesses: ["Could teach more frequently to build reputation", "Learning variety could be expanded"],
      suggestions: [
        `Try scheduling a session in ${user.skillsWanted[0] ?? "a new skill"} this week`,
        "Ask for detailed feedback after your next exchange",
        "Complete a skill verification quiz to boost your credibility badge",
      ],
      coachNote: `${user.name}, you're building something real here. Every exchange is a step forward — keep showing up.`,
      generatedAt: new Date().toISOString(),
    });
  }
});

// GET /ai/learning-paths — get all saved learning paths for current user
router.get("/ai/learning-paths", async (req, res): Promise<void> => {
  const paths = await db
    .select()
    .from(learningPathsTable)
    .where(eq(learningPathsTable.userId, DEMO_USER_ID));

  res.json(paths.map(p => ({
    id: String(p.id),
    goal: p.goal,
    steps: p.steps,
    createdAt: p.createdAt.toISOString(),
    totalXp: p.totalXp,
    completedSteps: p.completedSteps,
  })));
});

// POST /ai/learning-paths — generate a new learning path via Claude
router.post("/ai/learning-paths", async (req, res): Promise<void> => {
  const body = GenerateLearningPathBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const { goal } = body.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));

  try {
    const client = getAnthropicClient();

    const prompt = `You are an expert learning path designer on Skillissu, a peer-to-peer skill exchange platform.

Generate a structured, 7-step learning roadmap for this goal: "${goal}"

The user's current skills: ${user?.skillsOffered?.join(", ") ?? "general"}

Rules:
- Steps must be ordered from beginner to advanced
- Each step should be achievable in 1-2 weeks via peer learning
- Each step has an XP reward (50–200 XP based on difficulty)
- The first step is always available; others are locked until previous step completes
- Keep titles short (4-6 words), descriptions actionable (1 sentence)
- Resources should be skill names that can be exchanged on Skillissu (e.g., "React Fundamentals", "CSS Layout")

Respond ONLY with valid JSON:
{
  "steps": [
    {
      "id": "step-1",
      "title": "Short title here",
      "description": "One actionable sentence describing what to learn/do.",
      "xp": 75,
      "status": "available",
      "order": 1,
      "resources": ["Resource Skill 1", "Resource Skill 2"]
    }
  ]
}
Provide exactly 7 steps. First step status = "available", rest = "locked".`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    const steps: LearningPathStepData[] = parsed.steps ?? [];
    const totalXp = steps.reduce((acc, s) => acc + s.xp, 0);

    const [inserted] = await db.insert(learningPathsTable).values({
      userId: DEMO_USER_ID,
      goal,
      steps,
      totalXp,
      completedSteps: 0,
    }).returning();

    res.json({
      id: String(inserted.id),
      goal: inserted.goal,
      steps: inserted.steps,
      createdAt: inserted.createdAt.toISOString(),
      totalXp: inserted.totalXp,
      completedSteps: inserted.completedSteps,
    });
  } catch (err) {
    console.error("Learning path generation error:", err);
    res.status(500).json({ error: "Failed to generate learning path" });
  }
});

// POST /ai/learning-paths/:pathId/steps/:stepId/complete
router.post("/ai/learning-paths/:pathId/steps/:stepId/complete", async (req, res): Promise<void> => {
  const { pathId, stepId } = req.params;

  const [path] = await db
    .select()
    .from(learningPathsTable)
    .where(and(eq(learningPathsTable.id, parseInt(pathId)), eq(learningPathsTable.userId, DEMO_USER_ID)));

  if (!path) { res.status(404).json({ error: "Path not found" }); return; }

  const steps = path.steps as LearningPathStepData[];
  const stepIndex = steps.findIndex(s => s.id === stepId);
  if (stepIndex === -1) { res.status(404).json({ error: "Step not found" }); return; }

  // Mark this step completed and unlock the next
  steps[stepIndex].status = "completed";
  if (stepIndex + 1 < steps.length) {
    steps[stepIndex + 1].status = "available";
  }

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const xpEarned = steps[stepIndex].xp;

  const [updated] = await db
    .update(learningPathsTable)
    .set({ steps, completedSteps })
    .where(eq(learningPathsTable.id, parseInt(pathId)))
    .returning();

  // Award XP to user
  await db
    .update(usersTable)
    .set({ xp: (path.totalXp || 0) + xpEarned })
    .where(eq(usersTable.id, DEMO_USER_ID));

  res.json({
    id: String(updated.id),
    goal: updated.goal,
    steps: updated.steps,
    createdAt: updated.createdAt.toISOString(),
    totalXp: updated.totalXp,
    completedSteps: updated.completedSteps,
  });
});

export default router;
