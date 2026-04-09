import { Router, type IRouter } from "express";
import { db, exchangesTable, matchesTable, usersTable, creditTransactionsTable, ledgerTable, badgesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { CreateExchangeBody, GetExchangesResponse, CreateExchangeResponse, CompleteExchangeParams, CompleteExchangeResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

async function getPartnerName(exchangeRecord: typeof exchangesTable.$inferSelect): Promise<string> {
  const partnerId = exchangeRecord.teacherId === DEMO_USER_ID ? exchangeRecord.learnerId : exchangeRecord.teacherId;
  const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
  return partner?.name ?? "Unknown";
}

async function getPartnerAvatar(exchangeRecord: typeof exchangesTable.$inferSelect): Promise<string> {
  const partnerId = exchangeRecord.teacherId === DEMO_USER_ID ? exchangeRecord.learnerId : exchangeRecord.teacherId;
  const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
  return partner?.avatar ?? "";
}

function formatExchange(e: typeof exchangesTable.$inferSelect, partnerName: string, partnerAvatar: string) {
  return {
    id: String(e.id),
    matchId: String(e.matchId),
    partnerName,
    partnerAvatar,
    teachSkill: e.teachSkill,
    learnSkill: e.learnSkill,
    creditsPerSession: e.creditsPerSession,
    status: e.status as "pending" | "active" | "completed",
    createdAt: e.createdAt.toISOString(),
  };
}

router.post("/exchange", async (req, res): Promise<void> => {
  const parsed = CreateExchangeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { matchId, teachSkill, learnSkill, creditsPerSession } = parsed.data;
  const matchIdNum = parseInt(matchId, 10);

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchIdNum));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const partnerId = match.userAId === DEMO_USER_ID ? match.userBId : match.userAId;

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!currentUser || currentUser.creditBalance < creditsPerSession) {
    res.status(400).json({ error: "Insufficient credits" });
    return;
  }

  const [exchange] = await db.insert(exchangesTable).values({
    matchId: matchIdNum,
    teacherId: DEMO_USER_ID,
    learnerId: partnerId,
    teachSkill,
    learnSkill,
    creditsPerSession,
    status: "active",
  }).returning();

  await db.update(usersTable).set({
    creditBalance: currentUser.creditBalance - creditsPerSession,
  }).where(eq(usersTable.id, DEMO_USER_ID));

  await db.insert(creditTransactionsTable).values({
    userId: DEMO_USER_ID,
    type: "spent",
    amount: creditsPerSession,
    description: `Exchange for ${learnSkill} with partner`,
  });

  const partnerName = await getPartnerName(exchange);
  const partnerAvatar = await getPartnerAvatar(exchange);

  res.json(CreateExchangeResponse.parse(formatExchange(exchange, partnerName, partnerAvatar)));
});

router.get("/exchange", async (req, res): Promise<void> => {
  const exchanges = await db.select().from(exchangesTable).where(
    or(
      eq(exchangesTable.teacherId, DEMO_USER_ID),
      eq(exchangesTable.learnerId, DEMO_USER_ID)
    )
  );

  const result = await Promise.all(exchanges.map(async e => {
    const partnerName = await getPartnerName(e);
    const partnerAvatar = await getPartnerAvatar(e);
    return formatExchange(e, partnerName, partnerAvatar);
  }));

  res.json(GetExchangesResponse.parse(result));
});

router.post("/exchange/:exchangeId/complete", async (req, res): Promise<void> => {
  const params = CompleteExchangeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const exchangeId = parseInt(params.data.exchangeId, 10);
  const [exchange] = await db.select().from(exchangesTable).where(eq(exchangesTable.id, exchangeId));
  if (!exchange) {
    res.status(404).json({ error: "Exchange not found" });
    return;
  }

  const [updated] = await db.update(exchangesTable).set({ status: "completed" }).where(eq(exchangesTable.id, exchangeId)).returning();

  const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, exchange.teacherId));
  if (teacher) {
    await db.update(usersTable).set({
      creditBalance: teacher.creditBalance + exchange.creditsPerSession,
      totalExchanges: teacher.totalExchanges + 1,
      xp: teacher.xp + 50,
    }).where(eq(usersTable.id, exchange.teacherId));

    await db.insert(creditTransactionsTable).values({
      userId: exchange.teacherId,
      type: "earned",
      amount: exchange.creditsPerSession,
      description: `Taught ${exchange.teachSkill}`,
    });
  }

  await db.insert(ledgerTable).values({
    eventType: "EXCHANGE_COMPLETED",
    description: `Exchange ${exchangeId} completed`,
    userId: DEMO_USER_ID,
    metadata: { exchangeId, teachSkill: exchange.teachSkill, learnSkill: exchange.learnSkill },
  });

  const existingBadges = await db.select().from(badgesTable).where(eq(badgesTable.userId, DEMO_USER_ID));
  const firstTaughtBadge = existingBadges.find(b => b.badgeId === "first_skill_taught");
  if (!firstTaughtBadge?.earned) {
    await db.update(badgesTable).set({ earned: true, earnedAt: new Date(), progress: 1 }).where(
      eq(badgesTable.userId, DEMO_USER_ID)
    );
  }

  const completedCount = await db.select().from(exchangesTable).where(eq(exchangesTable.teacherId, DEMO_USER_ID));
  if (completedCount.filter(e => e.status === "completed").length >= 5) {
    await db.update(badgesTable).set({ earned: true, earnedAt: new Date(), progress: 5 }).where(
      eq(badgesTable.userId, DEMO_USER_ID)
    );
  }

  const partnerName = await getPartnerName(updated);
  const partnerAvatar = await getPartnerAvatar(updated);

  res.json(CompleteExchangeResponse.parse(formatExchange(updated, partnerName, partnerAvatar)));
});

export default router;
