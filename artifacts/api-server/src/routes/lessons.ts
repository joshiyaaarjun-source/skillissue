import { Router, type IRouter } from "express";
import { db, usersTable, microLessonsTable, lessonProgressTable } from "@workspace/db";
import { eq, and, inArray, notInArray, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

async function generateLesson(skill: string): Promise<{
  title: string;
  body: string;
  tip: string;
  emoji: string;
}> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Create a 5-minute micro-lesson for the skill: "${skill}".
Return ONLY a JSON object (no markdown) with these exact keys:
- title: catchy lesson title (max 8 words)
- body: lesson content (2-3 short paragraphs, practical and actionable, max 200 words)
- tip: one quick pro-tip (max 20 words)
- emoji: one relevant emoji for this skill

Keep it beginner-friendly but insightful. Do not include code blocks.`
    }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "{}";
  const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  return JSON.parse(clean) as { title: string; body: string; tip: string; emoji: string };
}

router.get("/lessons", async (_req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const skills = [...(user.skillsWanted ?? []), ...(user.skillsOffered ?? [])].slice(0, 6);
  if (skills.length === 0) {
    res.json({ lessons: [] });
    return;
  }

  const completedProgress = await db.select().from(lessonProgressTable).where(
    and(eq(lessonProgressTable.userId, DEMO_USER_ID), eq(lessonProgressTable.completed, true))
  );
  const completedLessonIds = completedProgress.map(p => p.lessonId);

  const existing = await db.select().from(microLessonsTable)
    .where(inArray(microLessonsTable.skill, skills));

  const uncompleted = existing.filter(l => !completedLessonIds.includes(l.id));

  if (uncompleted.length >= 5) {
    res.json({ lessons: uncompleted.slice(0, 5) });
    return;
  }

  const needed = 5 - uncompleted.length;
  const skillsToGenerate = skills.slice(0, Math.min(needed, skills.length));
  const newLessons = [];

  for (const skill of skillsToGenerate) {
    try {
      const content = await generateLesson(skill);
      const [lesson] = await db.insert(microLessonsTable).values({
        skill,
        title: content.title,
        body: content.body,
        tip: content.tip,
        emoji: content.emoji,
        durationMinutes: 5,
      }).returning();
      newLessons.push(lesson);
    } catch {
      newLessons.push({
        id: -Math.random(),
        skill,
        title: `Quick ${skill} Essentials`,
        body: `${skill} is a powerful skill that opens many doors. Start with the fundamentals: understand the core concepts, practice consistently, and apply what you learn in real projects. Focus on one concept at a time and build your confidence gradually.`,
        tip: `Practice ${skill} for just 10 minutes a day — consistency beats intensity.`,
        emoji: "💡",
        durationMinutes: 5,
        createdAt: new Date(),
      });
    }
  }

  res.json({ lessons: [...uncompleted, ...newLessons].slice(0, 5) });
});

router.post("/lessons/:id/complete", async (req, res): Promise<void> => {
  const lessonId = parseInt(req.params.id);
  if (isNaN(lessonId)) { res.status(400).json({ error: "Invalid lesson ID" }); return; }

  const existing = await db.select().from(lessonProgressTable).where(
    and(eq(lessonProgressTable.userId, DEMO_USER_ID), eq(lessonProgressTable.lessonId, lessonId))
  );

  if (existing.length > 0) {
    await db.update(lessonProgressTable).set({ completed: true }).where(
      and(eq(lessonProgressTable.userId, DEMO_USER_ID), eq(lessonProgressTable.lessonId, lessonId))
    );
  } else {
    await db.insert(lessonProgressTable).values({
      userId: DEMO_USER_ID,
      lessonId,
      completed: true,
    });
  }

  await db.update(usersTable).set({
    xp: sql`${usersTable.xp} + 20`,
    creditBalance: sql`${usersTable.creditBalance} + 2`,
  }).where(eq(usersTable.id, DEMO_USER_ID));

  res.json({ success: true, xpGained: 20, creditsGained: 2 });
});

router.post("/lessons/:id/save", async (req, res): Promise<void> => {
  const lessonId = parseInt(req.params.id);
  if (isNaN(lessonId)) { res.status(400).json({ error: "Invalid lesson ID" }); return; }

  const alreadySaved = await db.select().from(lessonProgressTable).where(
    and(eq(lessonProgressTable.userId, DEMO_USER_ID), eq(lessonProgressTable.lessonId, lessonId))
  );
  if (alreadySaved.length === 0) {
    await db.insert(lessonProgressTable).values({
      userId: DEMO_USER_ID,
      lessonId,
      completed: false,
    });
  }

  res.json({ success: true });
});

export default router;
