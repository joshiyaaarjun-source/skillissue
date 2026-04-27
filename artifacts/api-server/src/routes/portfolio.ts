import { Router, type IRouter } from "express";
import { db, portfolioItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/portfolio", async (_req, res): Promise<void> => {
  const items = await db.select().from(portfolioItemsTable).where(eq(portfolioItemsTable.userId, DEMO_USER_ID));
  res.json({ items });
});

router.get("/portfolio/user/:userId", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }
  const items = await db.select().from(portfolioItemsTable).where(eq(portfolioItemsTable.userId, userId));
  res.json({ items });
});

router.post("/portfolio", async (req, res): Promise<void> => {
  const { skill, title, description, url, mediaType } = req.body as {
    skill?: string;
    title?: string;
    description?: string;
    url?: string;
    mediaType?: string;
  };

  if (!skill || !title) {
    res.status(400).json({ error: "skill and title required" });
    return;
  }

  const [item] = await db.insert(portfolioItemsTable).values({
    userId: DEMO_USER_ID,
    skill,
    title,
    description: description ?? "",
    url: url ?? "",
    mediaType: mediaType ?? "link",
  }).returning();

  res.json({ item });
});

router.delete("/portfolio/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  await db.delete(portfolioItemsTable).where(
    and(eq(portfolioItemsTable.id, id), eq(portfolioItemsTable.userId, DEMO_USER_ID))
  );

  res.json({ success: true });
});

export default router;
