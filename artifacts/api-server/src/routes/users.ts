import { Router, type IRouter } from "express";
import { db, usersTable, monthlyGoalsTable, skillProgressTable, swipesTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { GetUserParams, GetMeResponse, GetUserResponse, GetExploreUsersResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

function mapVerificationStatus(raw: string): "unverified" | "partial" | "fully_verified" {
  if (raw === "fully_verified") return "fully_verified";
  if (raw === "quiz_passed" || raw === "partial") return "partial";
  return "unverified";
}

function formatUser(user: typeof usersTable.$inferSelect, goals: typeof monthlyGoalsTable.$inferSelect[], progress: typeof skillProgressTable.$inferSelect[]) {
  return {
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
    onboarded: user.onboarded ?? false,
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
  };
}

router.get("/users/me", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const goals = await db.select().from(monthlyGoalsTable).where(eq(monthlyGoalsTable.userId, DEMO_USER_ID));
  const progress = await db.select().from(skillProgressTable).where(eq(skillProgressTable.userId, DEMO_USER_ID));
  res.json(GetMeResponse.parse(formatUser(user, goals, progress)));
});

router.get("/users/explore", async (req, res): Promise<void> => {
  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!currentUser) { res.json([]); return; }

  const mySkillsOffered = currentUser.skillsOffered;
  const mySkillsWanted = currentUser.skillsWanted;
  const [others, priorSwipes] = await Promise.all([
    db.select().from(usersTable).where(ne(usersTable.id, DEMO_USER_ID)),
    db.select({ targetId: swipesTable.targetId })
      .from(swipesTable)
      .where(eq(swipesTable.swiperId, DEMO_USER_ID)),
  ]);
  const swipedUserIds = new Set(priorSwipes.map(swipe => swipe.targetId));

  const exploreUsers = others.filter(u => !swipedUserIds.has(u.id)).map(u => {
    const overlapping = [
      ...mySkillsWanted.filter(s => u.skillsOffered.includes(s)),
      ...mySkillsOffered.filter(s => u.skillsWanted.includes(s)),
    ].filter((v, i, a) => a.indexOf(v) === i);

    const matchScore = Math.min(100, overlapping.length * 20 + 40);
    return {
      id: String(u.id),
      name: u.name,
      avatar: u.avatar,
      bio: u.bio || "",
      skillsOffered: u.skillsOffered,
      skillsWanted: u.skillsWanted,
      credits: u.creditBalance,
      credibilityScore: u.credibilityScore,
      matchScore: Math.round(matchScore),
      overlappingSkills: overlapping,
      verificationStatus: mapVerificationStatus(u.verificationStatus || "unverified"),
      exchangeCount: u.exchangeCount || 0,
      isNew: u.isNew || false,
    };
  });

  res.json(GetExploreUsersResponse.parse(exploreUsers));
});

router.get("/users/:userId", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const userId = parseInt(params.data.userId, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const goals = await db.select().from(monthlyGoalsTable).where(eq(monthlyGoalsTable.userId, userId));
  const progress = await db.select().from(skillProgressTable).where(eq(skillProgressTable.userId, userId));
  res.json(GetUserResponse.parse(formatUser(user, goals, progress)));
});

export default router;
