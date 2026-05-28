import { Router, type IRouter } from "express";
import { db, skillDnaTable, usersTable, exchangesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

function computeDna(exchanges: { status: string; teachSkill: string; learnSkill: string }[], credibilityScore: number, skillsOffered: string[]) {
  const completed = exchanges.filter(e => e.status === "completed");
  const uniqueSkillsTaught = new Set(completed.map(e => e.teachSkill)).size;
  const uniqueSkillsLearned = new Set(completed.map(e => e.learnSkill)).size;

  return {
    depth: Math.min(100, uniqueSkillsTaught * 20 + completed.length * 5),
    breadth: Math.min(100, (uniqueSkillsTaught + uniqueSkillsLearned) * 10 + skillsOffered.length * 8),
    teaching: Math.min(100, credibilityScore * 18 + completed.length * 4),
    speed: Math.min(100, 40 + completed.length * 8),
    curiosity: Math.min(100, uniqueSkillsLearned * 20 + skillsOffered.length * 5 + 20),
  };
}

router.get("/skill-dna", async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) return res.status(404).json({ error: "User not found" });

  const existing = await db.select().from(skillDnaTable).where(eq(skillDnaTable.userId, DEMO_USER_ID));
  const exchanges = await db.select().from(exchangesTable).where(or(eq(exchangesTable.teacherId, DEMO_USER_ID), eq(exchangesTable.learnerId, DEMO_USER_ID)));

  if (exchanges.filter(e => e.status === "completed").length < 1 && existing.length === 0) {
    return res.json({ available: false, message: "Complete at least 1 exchange to unlock your Skill DNA" });
  }

  const dna = computeDna(exchanges, user.credibilityScore, user.skillsOffered);

  if (existing.length > 0) {
    await db.update(skillDnaTable).set({ ...dna, computedAt: new Date() }).where(eq(skillDnaTable.userId, DEMO_USER_ID));
    return res.json({ available: true, ...dna });
  }

  await db.insert(skillDnaTable).values({ userId: DEMO_USER_ID, ...dna });
  return res.json({ available: true, ...dna });
});

export default router;
