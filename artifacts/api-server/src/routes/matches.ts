import { Router, type IRouter } from "express";
import { db, matchesTable, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { GetMatchesResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

function mapVerificationStatus(raw: string): "unverified" | "partial" | "fully_verified" {
  if (raw === "fully_verified") return "fully_verified";
  if (raw === "quiz_passed" || raw === "partial") return "partial";
  return "unverified";
}

router.get("/matches", async (req, res): Promise<void> => {
  const matches = await db.select().from(matchesTable).where(
    or(eq(matchesTable.userAId, DEMO_USER_ID), eq(matchesTable.userBId, DEMO_USER_ID))
  );

  const [myUser] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  const mySkillsWanted = myUser?.skillsWanted ?? [];
  const mySkillsOffered = myUser?.skillsOffered ?? [];

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
        bio: partner.bio || "",
        skillsOffered: partner.skillsOffered,
        skillsWanted: partner.skillsWanted,
        credits: partner.creditBalance,
        credibilityScore: partner.credibilityScore,
        matchScore: Math.min(100, overlapping.length * 25 + 40),
        overlappingSkills: overlapping,
        verificationStatus: mapVerificationStatus(partner.verificationStatus || "unverified"),
        exchangeCount: partner.exchangeCount || 0,
        isNew: partner.isNew || false,
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
