import { Router, type IRouter } from "express";
import { db, sessionsTable, sessionFeedbackTable, usersTable, exchangesTable, matchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { StartSessionBody, SubmitSessionFeedbackBody } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;
const CREDITS_EARNED_PER_SESSION = 10;
const CREDITS_SPENT_PER_SESSION = 5;

function formatSession(s: typeof sessionsTable.$inferSelect) {
  return {
    id: String(s.id),
    matchId: String(s.matchId),
    partnerName: s.partnerName,
    partnerAvatar: s.partnerAvatar,
    status: s.status as "active" | "completed" | "cancelled",
    durationSeconds: s.durationSeconds,
    creditsEarned: s.creditsEarned,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt?.toISOString() ?? undefined,
  };
}

// POST /sessions/start
router.post("/sessions/start", async (req, res): Promise<void> => {
  const body = StartSessionBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const { matchId, exchangeId } = body.data;
  const matchIdNum = parseInt(matchId, 10);

  // Find partner from the match
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchIdNum));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  const partnerId = match.userAId === DEMO_USER_ID ? match.userBId : match.userAId;
  const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
  if (!partner) { res.status(404).json({ error: "Partner not found" }); return; }

  const [session] = await db.insert(sessionsTable).values({
    matchId: matchIdNum,
    userId: DEMO_USER_ID,
    partnerId,
    partnerName: partner.name,
    partnerAvatar: partner.avatar,
    exchangeId: exchangeId ? parseInt(exchangeId, 10) : null,
    status: "active",
  }).returning();

  res.json(formatSession(session));
});

// POST /sessions/:sessionId/end
router.post("/sessions/:sessionId/end", async (req, res): Promise<void> => {
  const sessionId = parseInt(req.params.sessionId, 10);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  const now = new Date();
  const durationSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);

  // Transfer credits: teacher earns 10, update user balance
  const [updatedSession] = await db.update(sessionsTable).set({
    status: "completed",
    endedAt: now,
    durationSeconds,
    creditsEarned: CREDITS_EARNED_PER_SESSION,
  }).where(eq(sessionsTable.id, sessionId)).returning();

  // Award credits to demo user (acting as teacher)
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (user) {
    await db.update(usersTable).set({
      creditBalance: (user.creditBalance ?? 20) + CREDITS_EARNED_PER_SESSION,
      totalExchanges: (user.totalExchanges ?? 0) + 1,
      xp: (user.xp ?? 0) + 150,
    }).where(eq(usersTable.id, DEMO_USER_ID));
  }

  // Mark exchange as completed if one was linked
  if (session.exchangeId) {
    await db.update(exchangesTable).set({ status: "completed" }).where(eq(exchangesTable.id, session.exchangeId));
  }

  res.json(formatSession(updatedSession));
});

// POST /sessions/:sessionId/feedback
router.post("/sessions/:sessionId/feedback", async (req, res): Promise<void> => {
  const sessionId = parseInt(req.params.sessionId, 10);
  const body = SubmitSessionFeedbackBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const { rating, review } = body.data;

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  await db.insert(sessionFeedbackTable).values({
    sessionId,
    fromUserId: DEMO_USER_ID,
    toUserId: session.partnerId,
    rating,
    review,
  });

  // Update partner's credibility score (rolling average approximation)
  const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, session.partnerId));
  if (partner) {
    const currentScore = partner.credibilityScore ?? 4.0;
    const newScore = Math.min(5.0, Math.max(1.0, (currentScore * 0.85 + rating * 0.15)));
    await db.update(usersTable).set({ credibilityScore: parseFloat(newScore.toFixed(2)) })
      .where(eq(usersTable.id, session.partnerId));
  }

  res.json({ success: true });
});

// GET /sessions/history
router.get("/sessions/history", async (req, res): Promise<void> => {
  const sessions = await db.select().from(sessionsTable)
    .where(eq(sessionsTable.userId, DEMO_USER_ID));
  res.json(sessions.map(formatSession));
});

export default router;
