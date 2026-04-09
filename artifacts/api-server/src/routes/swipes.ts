import { Router, type IRouter } from "express";
import { db, swipesTable, matchesTable, usersTable, ledgerTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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
  const targetIdNum = parseInt(targetUserId, 10);

  const existing = await db.select().from(swipesTable).where(
    and(
      eq(swipesTable.swiperId, DEMO_USER_ID),
      eq(swipesTable.targetId, targetIdNum)
    )
  );

  if (existing.length > 0) {
    res.json(RecordSwipeResponse.parse({ matched: false }));
    return;
  }

  await db.insert(swipesTable).values({
    swiperId: DEMO_USER_ID,
    targetId: targetIdNum,
    direction,
  });

  let matched = false;
  let matchId: string | undefined;
  let matchedUser: Record<string, unknown> | undefined;

  if (direction === "right") {
    const theirSwipe = await db.select().from(swipesTable).where(
      and(
        eq(swipesTable.swiperId, targetIdNum),
        eq(swipesTable.targetId, DEMO_USER_ID),
        eq(swipesTable.direction, "right")
      )
    );

    if (theirSwipe.length > 0) {
      const existingMatch = await db.select().from(matchesTable).where(
        and(
          eq(matchesTable.userAId, DEMO_USER_ID),
          eq(matchesTable.userBId, targetIdNum)
        )
      );

      if (existingMatch.length === 0) {
        const [match] = await db.insert(matchesTable).values({
          userAId: DEMO_USER_ID,
          userBId: targetIdNum,
          status: "active",
        }).returning();

        await db.insert(ledgerTable).values({
          eventType: "MATCH_CREATED",
          description: `Match created between users ${DEMO_USER_ID} and ${targetIdNum}`,
          userId: DEMO_USER_ID,
          metadata: { matchId: match.id },
        });

        matched = true;
        matchId = String(match.id);

        const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.id, targetIdNum));
        if (targetUser) {
          const myUser = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
          const mySkillsWanted = myUser[0]?.skillsWanted ?? [];
          const mySkillsOffered = myUser[0]?.skillsOffered ?? [];
          const overlapping = [
            ...mySkillsWanted.filter((s: string) => targetUser.skillsOffered.includes(s)),
            ...mySkillsOffered.filter((s: string) => targetUser.skillsWanted.includes(s)),
          ].filter((v, i, a) => a.indexOf(v) === i);

          matchedUser = {
            id: String(targetUser.id),
            name: targetUser.name,
            avatar: targetUser.avatar,
            bio: targetUser.bio,
            skillsOffered: targetUser.skillsOffered,
            skillsWanted: targetUser.skillsWanted,
            credits: targetUser.creditBalance,
            credibilityScore: targetUser.credibilityScore,
            matchScore: overlapping.length * 25,
            overlappingSkills: overlapping,
          };
        }
      }
    }
  }

  const result: Record<string, unknown> = { matched };
  if (matchId) result.matchId = matchId;
  if (matchedUser) result.matchedUser = matchedUser;

  res.json(RecordSwipeResponse.parse(result));
});

export default router;
