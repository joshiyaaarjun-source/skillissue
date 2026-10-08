import { Router, type IRouter } from "express";
import { db, matchesTable, swipesTable, usersTable } from "@workspace/db";
import { desc, eq, or } from "drizzle-orm";
import { GetMatchesResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

function mapVerificationStatus(raw: string): "unverified" | "partial" | "fully_verified" {
  if (raw === "fully_verified") return "fully_verified";
  if (raw === "quiz_passed" || raw === "partial") return "partial";
  return "unverified";
}

router.get("/matches", async (req, res): Promise<void> => {
  const [userSwipes, matches] = await Promise.all([
    db.select().from(swipesTable).where(
      or(eq(swipesTable.swiperId, DEMO_USER_ID), eq(swipesTable.targetId, DEMO_USER_ID))
    ),
    db.select().from(matchesTable).where(
      or(eq(matchesTable.userAId, DEMO_USER_ID), eq(matchesTable.userBId, DEMO_USER_ID))
    ).orderBy(desc(matchesTable.createdAt)),
  ]);

  const [myUser] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  const mySkillsWanted = myUser?.skillsWanted ?? [];
  const mySkillsOffered = myUser?.skillsOffered ?? [];

  const rightSwipesByMe = new Map<number, typeof userSwipes[number]>();
  for (const swipe of userSwipes
    .filter(swipe => swipe.swiperId === DEMO_USER_ID && swipe.direction === "right")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
    if (!rightSwipesByMe.has(swipe.targetId)) rightSwipesByMe.set(swipe.targetId, swipe);
  }

  const usersWhoAcceptedMe = new Set(
    userSwipes
      .filter(swipe => swipe.targetId === DEMO_USER_ID && swipe.direction === "right")
      .map(swipe => swipe.swiperId)
  );

  const matchByPartnerId = new Map<number, typeof matches[number]>();
  for (const match of matches) {
    const partnerId = match.userAId === DEMO_USER_ID ? match.userBId : match.userAId;
    if (!matchByPartnerId.has(partnerId)) matchByPartnerId.set(partnerId, match);
  }

  const result = await Promise.all(Array.from(rightSwipesByMe.entries()).map(async ([partnerId, swipe]) => {
    const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
    if (!partner) return null;

    const isMutual = usersWhoAcceptedMe.has(partnerId);
    const match = isMutual ? matchByPartnerId.get(partnerId) : undefined;
    const overlapping = [
      ...mySkillsWanted.filter((s: string) => partner.skillsOffered.includes(s)),
      ...mySkillsOffered.filter((s: string) => partner.skillsWanted.includes(s)),
    ].filter((v, i, a) => a.indexOf(v) === i);

    return {
      id: match ? String(match.id) : `${isMutual ? "mutual" : "pending"}-${swipe.id}`,
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
      createdAt: (match?.createdAt ?? swipe.createdAt).toISOString(),
      overlappingSkills: overlapping,
      status: isMutual ? (match?.status ?? "active") : "pending",
      isMutual,
    };
  }));

  const filtered = result.filter(Boolean);
  res.json(GetMatchesResponse.parse(filtered));
});

export default router;
