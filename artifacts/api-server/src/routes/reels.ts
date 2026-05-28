import { Router, type IRouter } from "express";
import { db, reelsTable, reelReactionsTable, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const MOCK_REELS = [
  { userId: 2, skillTag: "Python", title: "3 list comprehensions you didn't know", thumbnailUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=maya", duration: 58 },
  { userId: 3, skillTag: "UI Design", title: "The 8px grid system in 60 seconds", thumbnailUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=priya", duration: 55 },
  { userId: 4, skillTag: "React", title: "useCallback vs useMemo — for real this time", thumbnailUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=jordan", duration: 60 },
  { userId: 5, skillTag: "Figma", title: "Auto-layout trick that saved my life", thumbnailUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex", duration: 47 },
  { userId: 6, skillTag: "Node.js", title: "Streaming responses — zero libraries", thumbnailUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sam", duration: 52 },
];

async function seedReels() {
  const existing = await db.select().from(reelsTable).limit(1);
  if (existing.length > 0) return;
  for (const r of MOCK_REELS) {
    await db.insert(reelsTable).values(r);
  }
}
seedReels();

router.get("/reels", async (req, res) => {
  const reels = await db.select().from(reelsTable).orderBy(desc(reelsTable.createdAt));
  const users = await db.select().from(usersTable);
  const reactions = await db.select().from(reelReactionsTable);

  const result = reels.map(r => {
    const author = users.find(u => u.id === r.userId);
    const reelReactions = reactions.filter(rx => rx.reelId === r.id);
    const counts = { "🔥": 0, "🤔": 0, "👏": 0 };
    reelReactions.forEach(rx => { if (rx.reaction in counts) (counts as Record<string, number>)[rx.reaction]++; });
    const myReaction = reelReactions.find(rx => rx.userId === DEMO_USER_ID)?.reaction ?? null;
    return { ...r, authorName: author?.name ?? "Unknown", authorAvatar: author?.avatar ?? "", reactionCounts: counts, myReaction };
  });

  res.json(result);
});

router.post("/reels", async (req, res) => {
  const { skillTag, title, duration } = req.body as { skillTag: string; title: string; duration?: number };
  const user = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID)).limit(1);
  if (!user[0]) return res.status(404).json({ error: "User not found" });
  const [reel] = await db.insert(reelsTable).values({
    userId: DEMO_USER_ID,
    skillTag,
    title,
    thumbnailUrl: user[0].avatar,
    duration: duration ?? 60,
  }).returning();
  return res.json(reel);
});

router.post("/reels/:id/react", async (req, res) => {
  const reelId = parseInt(req.params.id);
  const { reaction } = req.body as { reaction: string };
  const valid = ["🔥", "🤔", "👏"];
  if (!valid.includes(reaction)) return res.status(400).json({ error: "Invalid reaction" });

  const existing = await db.select().from(reelReactionsTable)
    .where(eq(reelReactionsTable.reelId, reelId)).limit(100);
  const mine = existing.find(r => r.userId === DEMO_USER_ID);

  if (mine) {
    if (mine.reaction === reaction) {
      await db.delete(reelReactionsTable).where(eq(reelReactionsTable.id, mine.id));
    } else {
      await db.update(reelReactionsTable).set({ reaction }).where(eq(reelReactionsTable.id, mine.id));
    }
  } else {
    await db.insert(reelReactionsTable).values({ reelId, userId: DEMO_USER_ID, reaction });
  }

  const allReactions = await db.select().from(reelReactionsTable).where(eq(reelReactionsTable.reelId, reelId));
  const score = allReactions.length * 10 + allReactions.filter(r => r.reaction === "🔥").length * 5;
  await db.update(reelsTable).set({ reelScore: score }).where(eq(reelsTable.id, reelId));

  return res.json({ success: true });
});

export default router;
