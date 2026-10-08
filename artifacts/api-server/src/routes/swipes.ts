import { Router, type IRouter } from "express";
import { db, swipesTable, matchesTable, usersTable, ledgerTable } from "@workspace/db";
import { and, desc, eq, or } from "drizzle-orm";
import { RecordSwipeBody, RecordSwipeResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.post("/swipe", async (req, res): Promise<void> => {
  const parsed = RecordSwipeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { targetUserId, direction } = parsed.data;
  const targetIdNum = Number(targetUserId);
  if (!/^\d+$/.test(targetUserId) || !Number.isSafeInteger(targetIdNum) || targetIdNum <= 0) {
    res.status(400).json({ error: "Choose a valid profile to swipe on" });
    return;
  }

  if (targetIdNum === DEMO_USER_ID) {
    res.status(400).json({ error: "You cannot swipe on your own profile" });
    return;
  }

  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.id, targetIdNum));
  if (!targetUser) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const swipeResult = await db.transaction(async tx => {
    const [existingSwipe] = await tx.select().from(swipesTable).where(
      and(
        eq(swipesTable.swiperId, DEMO_USER_ID),
        eq(swipesTable.targetId, targetIdNum)
      )
    ).limit(1);

    if (!existingSwipe) {
      await tx.insert(swipesTable).values({
        swiperId: DEMO_USER_ID,
        targetId: targetIdNum,
        direction,
      });
    }

    const savedDirection = existingSwipe?.direction ?? direction;
    if (savedDirection !== "right") return { matched: false, matchId: undefined };

    const [theirRightSwipe] = await tx.select().from(swipesTable).where(
      and(
        eq(swipesTable.swiperId, targetIdNum),
        eq(swipesTable.targetId, DEMO_USER_ID),
        eq(swipesTable.direction, "right")
      )
    ).limit(1);

    if (!theirRightSwipe) return { matched: false, matchId: undefined };

    const [existingMatch] = await tx.select().from(matchesTable).where(
      or(
        and(
          eq(matchesTable.userAId, DEMO_USER_ID),
          eq(matchesTable.userBId, targetIdNum)
        ),
        and(
          eq(matchesTable.userAId, targetIdNum),
          eq(matchesTable.userBId, DEMO_USER_ID)
        )
      )
    ).orderBy(desc(matchesTable.createdAt)).limit(1);

    if (existingMatch) return { matched: true, matchId: String(existingMatch.id) };

    const [match] = await tx.insert(matchesTable).values({
      userAId: DEMO_USER_ID,
      userBId: targetIdNum,
      status: "active",
    }).returning();

    if (!match) return { matched: false, matchId: undefined };

    await tx.insert(ledgerTable).values({
      eventType: "MATCH_CREATED",
      description: `Match created between users ${DEMO_USER_ID} and ${targetIdNum}`,
      userId: DEMO_USER_ID,
      metadata: { matchId: match.id },
    });

    return { matched: true, matchId: String(match.id) };
  });

  const response: Record<string, unknown> = { matched: swipeResult.matched };
  if (swipeResult.matchId) response.matchId = swipeResult.matchId;

  if (swipeResult.matched) {
    const [myUser] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
    const mySkillsWanted = myUser?.skillsWanted ?? [];
    const mySkillsOffered = myUser?.skillsOffered ?? [];
    const overlapping = [
      ...mySkillsWanted.filter((skill: string) => targetUser.skillsOffered.includes(skill)),
      ...mySkillsOffered.filter((skill: string) => targetUser.skillsWanted.includes(skill)),
    ].filter((value, index, values) => values.indexOf(value) === index);

    response.matchedUser = {
      id: String(targetUser.id),
      name: targetUser.name,
      avatar: targetUser.avatar,
      bio: targetUser.bio || "",
      skillsOffered: targetUser.skillsOffered,
      skillsWanted: targetUser.skillsWanted,
      credits: targetUser.creditBalance,
      credibilityScore: targetUser.credibilityScore,
      matchScore: Math.min(100, overlapping.length * 25 + 40),
      overlappingSkills: overlapping,
      verificationStatus: targetUser.verificationStatus === "fully_verified"
        ? "fully_verified"
        : targetUser.verificationStatus === "quiz_passed" || targetUser.verificationStatus === "partial"
          ? "partial"
          : "unverified",
      exchangeCount: targetUser.exchangeCount || 0,
      isNew: targetUser.isNew || false,
    };
  }

  res.json(RecordSwipeResponse.parse(response));
});

export default router;
