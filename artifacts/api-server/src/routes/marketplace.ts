import { Router, type IRouter } from "express";
import { db, skillMarketplaceChallengesTable, marketplaceSubmissionsTable, usersTable, creditTransactionsTable, ledgerTable } from "@workspace/db";
import { eq, desc, and, gte } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const CHALLENGE_SEEDS = [
  { title: "Debug my React useEffect loop", description: "I have an infinite re-render in my component. The effect fires every render. Here's the code — spot the bug and explain the fix.", skill: "React", bounty: 15 },
  { title: "Review my Figma landing page", description: "Created a SaaS landing page in Figma. Need honest UX feedback — hierarchy, CTA placement, colour contrast. Drop your review as a comment list.", skill: "Figma", bounty: 20 },
  { title: "Write a Python list comprehension", description: "Convert this nested for-loop to a clean list comprehension. Bonus points for explaining the logic step by step.", skill: "Python", bounty: 10 },
  { title: "Fix my TypeScript generics error", description: "Getting TS2322 on a generic function. Paste my code and tell me exactly what's wrong and how to type it correctly.", skill: "TypeScript", bounty: 12 },
];

router.get("/marketplace", async (_req, res): Promise<void> => {
  let challenges = await db.select().from(skillMarketplaceChallengesTable).where(eq(skillMarketplaceChallengesTable.status, "open")).orderBy(desc(skillMarketplaceChallengesTable.createdAt));
  if (challenges.length === 0) {
    const allUsers = await db.select().from(usersTable);
    const others = allUsers.filter(u => u.id !== DEMO_USER_ID).slice(0, 4);
    const now = new Date();
    const exp = new Date(now.getTime() + 72 * 3600 * 1000);
    const seeds = others.map((u, i) => ({ posterId: u.id, ...CHALLENGE_SEEDS[i % CHALLENGE_SEEDS.length], expiresAt: exp }));
    if (seeds.length > 0) await db.insert(skillMarketplaceChallengesTable).values(seeds as (typeof skillMarketplaceChallengesTable.$inferInsert)[]);
    challenges = await db.select().from(skillMarketplaceChallengesTable).where(eq(skillMarketplaceChallengesTable.status, "open"));
  }

  const users = await db.select().from(usersTable);
  const submissions = await db.select().from(marketplaceSubmissionsTable);

  const result = challenges.map(c => {
    const poster = users.find(u => u.id === c.posterId);
    const subs = submissions.filter(s => s.challengeId === c.id);
    const mine = subs.find(s => s.submitterId === DEMO_USER_ID);
    return {
      ...c,
      posterName: poster?.name ?? "Unknown",
      posterAvatar: poster?.avatar ?? "",
      submissionCount: subs.length,
      expiresAt: c.expiresAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      mySubmission: mine?.solution ?? null,
    };
  });
  res.json(result);
});

router.post("/marketplace", async (req, res): Promise<void> => {
  const { title, description, skill, bounty } = req.body as { title: string; description: string; skill: string; bounty: number };
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user || user.creditBalance < bounty) { res.status(400).json({ error: "Insufficient credits for bounty escrow" }); return; }

  const expiresAt = new Date(Date.now() + 72 * 3600 * 1000);
  await db.update(usersTable).set({ creditBalance: user.creditBalance - bounty }).where(eq(usersTable.id, DEMO_USER_ID));
  await db.insert(creditTransactionsTable).values({ userId: DEMO_USER_ID, type: "spent", amount: bounty, description: `Challenge escrow: ${title}` });

  const [challenge] = await db.insert(skillMarketplaceChallengesTable).values({ posterId: DEMO_USER_ID, title, description, skill, bounty, expiresAt }).returning();
  res.json({ ...challenge, posterName: user.name, posterAvatar: user.avatar, submissionCount: 0, expiresAt: challenge.expiresAt.toISOString(), createdAt: challenge.createdAt.toISOString(), mySubmission: null });
});

router.post("/marketplace/:id/submit", async (req, res): Promise<void> => {
  const challengeId = parseInt(req.params.id);
  const { solution } = req.body as { solution: string };
  const [challenge] = await db.select().from(skillMarketplaceChallengesTable).where(eq(skillMarketplaceChallengesTable.id, challengeId));
  if (!challenge || challenge.status !== "open") { res.status(404).json({ error: "Challenge not found or closed" }); return; }
  if (challenge.posterId === DEMO_USER_ID) { res.status(400).json({ error: "Cannot submit to your own challenge" }); return; }

  const existing = await db.select().from(marketplaceSubmissionsTable).where(and(eq(marketplaceSubmissionsTable.challengeId, challengeId), eq(marketplaceSubmissionsTable.submitterId, DEMO_USER_ID)));
  if (existing.length > 0) {
    await db.update(marketplaceSubmissionsTable).set({ solution }).where(eq(marketplaceSubmissionsTable.id, existing[0].id));
  } else {
    await db.insert(marketplaceSubmissionsTable).values({ challengeId, submitterId: DEMO_USER_ID, solution });
  }
  res.json({ success: true });
});

router.post("/marketplace/:id/pick-winner", async (req, res): Promise<void> => {
  const challengeId = parseInt(req.params.id);
  const { submissionId } = req.body as { submissionId: number };
  const [challenge] = await db.select().from(skillMarketplaceChallengesTable).where(eq(skillMarketplaceChallengesTable.id, challengeId));
  if (!challenge || challenge.posterId !== DEMO_USER_ID) { res.status(403).json({ error: "Not your challenge" }); return; }
  const [sub] = await db.select().from(marketplaceSubmissionsTable).where(eq(marketplaceSubmissionsTable.id, submissionId));
  if (!sub) { res.status(404).json({ error: "Submission not found" }); return; }

  await db.update(skillMarketplaceChallengesTable).set({ status: "closed", winnerId: sub.submitterId }).where(eq(skillMarketplaceChallengesTable.id, challengeId));
  const [winner] = await db.select().from(usersTable).where(eq(usersTable.id, sub.submitterId));
  if (winner) {
    await db.update(usersTable).set({ creditBalance: winner.creditBalance + challenge.bounty }).where(eq(usersTable.id, sub.submitterId));
    await db.insert(creditTransactionsTable).values({ userId: sub.submitterId, type: "earned", amount: challenge.bounty, description: `Challenge bounty: ${challenge.title}` });
    await db.insert(ledgerTable).values({ eventType: "CREDITS_UPDATED", description: `Challenge bounty awarded`, userId: sub.submitterId, metadata: { reason: "challenge_bounty", challengeId, amount: challenge.bounty } });
  }
  res.json({ success: true });
});

export default router;
