import { Router, type IRouter } from "express";
import { db, capsuleReviewsTable, usersTable, creditTransactionsTable, ledgerTable, capsulesTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;
const DAILY_CREDIT_CAP = 5;

router.post("/capsules/:id/review", async (req, res): Promise<void> => {
  const capsuleId = parseInt(req.params.id);
  const { review, rating = 5 } = req.body as { review: string; rating?: number };
  if (!review || review.trim().length < 10) { res.status(400).json({ error: "Review too short" }); return; }

  const wordCount = review.trim().split(/\s+/).length;
  if (wordCount < 50) {
    res.status(400).json({ error: `Review needs at least 50 words. Yours has ${wordCount}. Tell us more about what you learned!`, wordCount });
    return;
  }

  const existing = await db.select().from(capsuleReviewsTable).where(and(eq(capsuleReviewsTable.capsuleId, capsuleId), eq(capsuleReviewsTable.userId, DEMO_USER_ID)));
  if (existing.length > 0) { res.status(400).json({ error: "You already reviewed this capsule" }); return; }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayReviews = await db.select().from(capsuleReviewsTable).where(and(eq(capsuleReviewsTable.userId, DEMO_USER_ID), gte(capsuleReviewsTable.createdAt, todayStart)));
  const todayCredits = todayReviews.reduce((s, r) => s + r.creditAwarded, 0);
  const creditAwarded = todayCredits >= DAILY_CREDIT_CAP ? 0 : 1;

  const [reviewRecord] = await db.insert(capsuleReviewsTable).values({ capsuleId, userId: DEMO_USER_ID, review: review.trim(), wordCount, rating, creditAwarded }).returning();

  if (creditAwarded > 0) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
    await db.update(usersTable).set({ creditBalance: user.creditBalance + 1 }).where(eq(usersTable.id, DEMO_USER_ID));
    await db.insert(creditTransactionsTable).values({ userId: DEMO_USER_ID, type: "earned", amount: 1, description: `Review reward for capsule #${capsuleId}` });
    await db.insert(ledgerTable).values({ eventType: "CREDITS_UPDATED", description: "Capsule review reward", userId: DEMO_USER_ID, metadata: { reason: "review_reward", capsuleId, amount: 1 } });
  }

  const message = creditAwarded > 0
    ? `Review submitted! You earned 1 credit. (${DAILY_CREDIT_CAP - todayCredits - 1} credits left today)`
    : `Review submitted! Daily credit limit reached — come back tomorrow.`;

  res.json({ success: true, creditAwarded, wordCount, message });
});

export default router;
