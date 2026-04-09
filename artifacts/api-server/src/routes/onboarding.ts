import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CompleteOnboardingBody, GetMeResponse } from "@workspace/api-zod";
import { monthlyGoalsTable, skillProgressTable } from "@workspace/db";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.post("/onboarding/complete", async (req, res): Promise<void> => {
  const body = CompleteOnboardingBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { name, skillsOffered, skillsWanted, availability } = body.data;

  await db.update(usersTable).set({
    name: name || undefined,
    skillsOffered: skillsOffered.length > 0 ? skillsOffered : undefined,
    skillsWanted: skillsWanted.length > 0 ? skillsWanted : undefined,
    availability: availability || "Flexible",
    onboarded: true,
  }).where(eq(usersTable.id, DEMO_USER_ID));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const goals = await db.select().from(monthlyGoalsTable).where(eq(monthlyGoalsTable.userId, DEMO_USER_ID));
  const progress = await db.select().from(skillProgressTable).where(eq(skillProgressTable.userId, DEMO_USER_ID));

  res.json(GetMeResponse.parse({
    id: String(user.id),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio || "",
    skillsOffered: user.skillsOffered,
    skillsWanted: user.skillsWanted,
    skillTBR: user.skillTBR,
    creditBalance: user.creditBalance,
    credibilityScore: user.credibilityScore,
    totalExchanges: user.totalExchanges,
    streakDays: user.streakDays,
    xp: user.xp,
    onboarded: user.onboarded,
    monthlyGoals: goals.map(g => ({
      id: String(g.id),
      title: g.title,
      progress: g.progress,
      target: g.target,
    })),
    skillProgress: progress.map(p => ({
      id: String(p.id),
      skill: p.skill,
      status: p.status as "completed" | "in_progress" | "to_start",
      progress: p.progress,
    })),
  }));
});

export default router;
