import { Router, type IRouter } from "express";
import { db, confessionsTable, confessionReactionsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const CONFESSION_TEXTS = [
  { content: "I've been teaching React for 2 years but I still google how to use useReducer every single time.", skill: "React" },
  { content: "I listed Figma as a skill but I only know how to make rectangles and paste screenshots.", skill: "Figma" },
  { content: "My Python 'scripts' are just copy-pasted Stack Overflow answers held together by prayers and print statements.", skill: "Python" },
  { content: "I told my mentee I 'know' TypeScript. I know the error messages. That's it.", skill: "TypeScript" },
  { content: "I've completed 20 exchanges teaching UI design but my own portfolio still looks like it was made in 2009.", skill: "UI Design" },
];

router.get("/confessions", async (_req, res): Promise<void> => {
  let confessions = await db.select().from(confessionsTable).orderBy(desc(confessionsTable.createdAt)).limit(30);
  if (confessions.length === 0) {
    const allUsers = await db.select().from(usersTable);
    const others = allUsers.filter(u => u.id !== DEMO_USER_ID).slice(0, 5);
    const seeds = others.map((u, i) => ({ userId: u.id, ...CONFESSION_TEXTS[i % CONFESSION_TEXTS.length] }));
    if (seeds.length > 0) await db.insert(confessionsTable).values(seeds);
    confessions = await db.select().from(confessionsTable).orderBy(desc(confessionsTable.createdAt)).limit(30);
  }
  const users = await db.select().from(usersTable);
  const reactions = await db.select().from(confessionReactionsTable);

  const result = confessions.map(c => {
    const author = users.find(u => u.id === c.userId);
    const myReaction = reactions.find(r => r.confessionId === c.id && r.userId === DEMO_USER_ID);
    return {
      ...c,
      authorName: c.userId === DEMO_USER_ID ? "You" : (author?.name?.split(" ")[0] ?? "Anonymous"),
      authorInitial: author?.name?.[0] ?? "?",
      isOwn: c.userId === DEMO_USER_ID,
      createdAt: c.createdAt.toISOString(),
      myReaction: myReaction?.type ?? null,
    };
  });
  res.json(result);
});

router.post("/confessions", async (req, res): Promise<void> => {
  const { content, skill = "" } = req.body as { content: string; skill?: string };
  if (!content || content.trim().length < 10) { res.status(400).json({ error: "Confession too short" }); return; }

  const [confession] = await db.insert(confessionsTable).values({ userId: DEMO_USER_ID, content: content.trim(), skill }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  res.json({ ...confession, authorName: "You", authorInitial: user?.name?.[0] ?? "?", isOwn: true, createdAt: confession.createdAt.toISOString(), myReaction: null });
});

router.post("/confessions/:id/react", async (req, res): Promise<void> => {
  const confessionId = parseInt(req.params.id);
  const { type, tip = "" } = req.body as { type: string; tip?: string };
  const valid = ["relatable", "tip", "same"];
  if (!valid.includes(type)) { res.status(400).json({ error: "Invalid reaction type" }); return; }

  const existing = await db.select().from(confessionReactionsTable).where(and(eq(confessionReactionsTable.confessionId, confessionId), eq(confessionReactionsTable.userId, DEMO_USER_ID)));
  if (existing.length > 0) {
    await db.update(confessionReactionsTable).set({ type, tip }).where(eq(confessionReactionsTable.id, existing[0].id));
  } else {
    await db.insert(confessionReactionsTable).values({ confessionId, userId: DEMO_USER_ID, type, tip });
  }

  const [c] = await db.select().from(confessionsTable).where(eq(confessionsTable.id, confessionId));
  if (c) {
    const allR = await db.select().from(confessionReactionsTable).where(eq(confessionReactionsTable.confessionId, confessionId));
    await db.update(confessionsTable).set({
      relatableCount: allR.filter(r => r.type === "relatable").length,
      tipCount: allR.filter(r => r.type === "tip").length,
      sameCount: allR.filter(r => r.type === "same").length,
    }).where(eq(confessionsTable.id, confessionId));
  }
  res.json({ success: true });
});

export default router;
