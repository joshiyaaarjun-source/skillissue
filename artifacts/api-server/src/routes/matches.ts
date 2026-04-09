import { Router, type IRouter } from "express";
import { db, matchesTable, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { GetMatchesResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/matches", async (req, res): Promise<void> => {
  const matches = await db.select().from(matchesTable).where(
    or(
      eq(matchesTable.userAId, DEMO_USER_ID),
      eq(matchesTable.userBId, DEMO_USER_ID)
    )
  );

  const myUser = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  const mySkillsWanted = myUser[0]?.skillsWanted ?? [];
  const mySkillsOffered = myUser[0]?.skillsOffered ?? [];

  const result = await Promise.all(matches.map(async m => {
    const partnerId = m.userAId === DEMO_USER_ID ? m.userBId : m.userAId;
    const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
    if (!partner) return null;

    const overlapping = [
      ...mySkillsWanted.filter((s: string) => partner.skillsOffered.includes(s)),
      ...mySkillsOffered.filter((s: string) => partner.skillsWanted.includes(s)),
    ].filter((v, i, a) => a.indexOf(v) === i);

    return {
      id: String(m.id),
      matchedUser: {
        id: String(partner.id),
        name: partner.name,
        avatar: partner.avatar,
        bio: partner.bio,
        skillsOffered: partner.skillsOffered,
        skillsWanted: partner.skillsWanted,
        credits: partner.creditBalance,
        credibilityScore: partner.credibilityScore,
        matchScore: overlapping.length * 25,
        overlappingSkills: overlapping,
      },
      createdAt: m.createdAt.toISOString(),
      overlappingSkills: overlapping,
      status: m.status as "pending" | "active" | "completed",
    };
  }));

  const filtered = result.filter(Boolean);
  res.json(GetMatchesResponse.parse(filtered));
});

export default router;
