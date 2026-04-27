import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

function generateCode(userId: number, name: string): string {
  const prefix = name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "").slice(0, 5);
  const suffix = userId.toString(36).padStart(3, "0");
  return `${prefix}-${suffix}`;
}

router.get("/referral", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const code = user.referralCode || generateCode(user.id, user.name);

  if (!user.referralCode) {
    await db.update(usersTable).set({ referralCode: code }).where(eq(usersTable.id, DEMO_USER_ID));
  }

  const inviteLink = `https://skillissu.app/join/${code}`;

  res.json({
    code,
    inviteLink,
    referralCount: user.referralCount,
    creditsEarned: user.referralCredits,
    rewardPerReferral: 15,
    message: "Invite a friend — you both earn 15 credits when they complete onboarding.",
  });
});

router.post("/referral/redeem", async (req, res): Promise<void> => {
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "Code required" }); return; }

  const [referrer] = await db.select().from(usersTable).where(eq(usersTable.referralCode, code));
  if (!referrer) { res.status(404).json({ error: "Invalid referral code" }); return; }
  if (referrer.id === DEMO_USER_ID) { res.status(400).json({ error: "You can't use your own code" }); return; }

  await db.update(usersTable).set({
    referralCount: referrer.referralCount + 1,
    referralCredits: referrer.referralCredits + 15,
    creditBalance: referrer.creditBalance + 15,
  }).where(eq(usersTable.id, referrer.id));

  const [self] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  await db.update(usersTable).set({
    creditBalance: (self?.creditBalance ?? 0) + 15,
  }).where(eq(usersTable.id, DEMO_USER_ID));

  res.json({ success: true, message: "Code redeemed! You and your friend each earned 15 credits." });
});

export default router;
