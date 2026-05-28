import { Router, type IRouter } from "express";
import { db, usersTable, matchesTable, swipesTable } from "@workspace/db";
import { eq, or, ne, and, notInArray } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const readyNowUsers = new Set<number>([DEMO_USER_ID]);

router.get("/instant-match", async (_req, res): Promise<void> => {
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!me) { res.status(404).json({ error: "User not found" }); return; }

  const existingMatches = await db.select().from(matchesTable).where(
    or(eq(matchesTable.userAId, DEMO_USER_ID), eq(matchesTable.userBId, DEMO_USER_ID))
  );
  const matchedUserIds = existingMatches.map(m =>
    m.userAId === DEMO_USER_ID ? m.userBId : m.userAId
  );

  const existingSwipes = await db.select().from(swipesTable).where(eq(swipesTable.swiperId, DEMO_USER_ID));
  const swipedUserIds = existingSwipes.map(s => s.targetId);

  const excludeIds = [...new Set([DEMO_USER_ID, ...matchedUserIds, ...swipedUserIds])];

  const allUsers = await db.select().from(usersTable);
  const candidates = allUsers.filter(u =>
    !excludeIds.includes(u.id) ||
    [...readyNowUsers].includes(u.id)
  );

  const scored = candidates.map(u => {
    const teachOverlap = me.skillsWanted.filter(s => u.skillsOffered.includes(s)).length;
    const learnOverlap = me.skillsOffered.filter(s => u.skillsWanted.includes(s)).length;
    const score = teachOverlap * 3 + learnOverlap * 2;
    return { user: u, score, isReadyNow: readyNowUsers.has(u.id) };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);

  const readyCount = [...readyNowUsers].filter(id => id !== DEMO_USER_ID).length;

  res.json({
    isReady: readyNowUsers.has(DEMO_USER_ID),
    readyCount,
    matches: top.map(({ user, score, isReadyNow }) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
      credibilityScore: user.credibilityScore,
      score,
      isReadyNow,
      overlap: {
        canTeach: me.skillsWanted.filter(s => user.skillsOffered.includes(s)),
        canLearn: me.skillsOffered.filter(s => user.skillsWanted.includes(s)),
      },
    })),
  });
});

router.post("/instant-match/ready", async (req, res): Promise<void> => {
  const { ready } = req.body as { ready?: boolean };
  if (ready === true) {
    readyNowUsers.add(DEMO_USER_ID);
  } else {
    readyNowUsers.delete(DEMO_USER_ID);
  }
  res.json({ isReady: readyNowUsers.has(DEMO_USER_ID), readyCount: readyNowUsers.size });
});

export default router;
