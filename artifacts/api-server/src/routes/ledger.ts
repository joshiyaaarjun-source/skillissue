import { Router, type IRouter } from "express";
import { db, ledgerTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetLedgerResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/ledger", async (req, res): Promise<void> => {
  const entries = await db.select().from(ledgerTable).where(eq(ledgerTable.userId, DEMO_USER_ID));

  res.json(GetLedgerResponse.parse(entries.map(e => ({
    id: String(e.id),
    eventType: e.eventType as "MATCH_CREATED" | "EXCHANGE_COMPLETED" | "CREDITS_UPDATED",
    description: e.description,
    userId: String(e.userId),
    metadata: e.metadata ?? {},
    createdAt: e.createdAt.toISOString(),
  }))));
});

export default router;
