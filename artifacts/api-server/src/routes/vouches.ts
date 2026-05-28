import { Router, type IRouter } from "express";
import { db, vouchesTable, usersTable, creditTransactionsTable, ledgerTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/vouches/user/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const vouches = await db.select().from(vouchesTable).where(and(eq(vouchesTable.vouchedUserId, userId), eq(vouchesTable.status, "active"))).orderBy(desc(vouchesTable.createdAt));
  const voucherIds = vouches.map(v => v.voucherId);
  const users = await db.select().from(usersTable);

  const result = vouches.map(v => {
    const voucher = users.find(u => u.id === v.voucherId);
    return { ...v, voucherName: voucher?.name ?? "Unknown", voucherAvatar: voucher?.avatar ?? "" };
  });
  res.json(result);
});

router.post("/vouches", async (req, res) => {
  const { vouchedUserId, skill } = req.body as { vouchedUserId: number; skill: string };
  const STAKE = 5;

  if (vouchedUserId === DEMO_USER_ID) return res.status(400).json({ error: "Cannot vouch for yourself" });

  const existing = await db.select().from(vouchesTable).where(
    and(eq(vouchesTable.voucherId, DEMO_USER_ID), eq(vouchesTable.vouchedUserId, vouchedUserId), eq(vouchesTable.skill, skill))
  );
  if (existing.length > 0) return res.status(400).json({ error: "Already vouched for this skill" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (user.creditBalance < STAKE) return res.status(400).json({ error: "Need 5 credits to stake" });

  await db.update(usersTable).set({ creditBalance: user.creditBalance - STAKE }).where(eq(usersTable.id, DEMO_USER_ID));
  await db.insert(vouchesTable).values({ voucherId: DEMO_USER_ID, vouchedUserId, skill, stakeAmount: STAKE });

  await db.insert(creditTransactionsTable).values({ userId: DEMO_USER_ID, type: "spent", amount: STAKE, description: `Staked vouch for ${skill}` });
  await db.insert(ledgerTable).values({ eventType: "CREDITS_UPDATED", description: `Vouch stake for ${skill}`, userId: DEMO_USER_ID, metadata: { reason: "vouch_stake", skill, amount: -STAKE } });

  return res.json({ success: true, stakeAmount: STAKE });
});

export default router;
