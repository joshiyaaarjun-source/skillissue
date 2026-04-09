import { Router, type IRouter } from "express";
import { db, usersTable, creditTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetCreditBalanceResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/credits", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const transactions = await db.select().from(creditTransactionsTable).where(eq(creditTransactionsTable.userId, DEMO_USER_ID));

  const totalEarned = transactions.filter(t => t.type === "earned").reduce((sum, t) => sum + t.amount, 0);
  const totalSpent = transactions.filter(t => t.type === "spent").reduce((sum, t) => sum + t.amount, 0);

  res.json(GetCreditBalanceResponse.parse({
    balance: user.creditBalance,
    totalEarned,
    totalSpent,
    transactions: transactions.map(t => ({
      id: String(t.id),
      type: t.type as "earned" | "spent",
      amount: t.amount,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    })),
  }));
});

export default router;
