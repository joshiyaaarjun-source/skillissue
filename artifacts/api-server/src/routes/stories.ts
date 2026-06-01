import { Router, type IRouter } from "express";
import { db, storiesTable, usersTable } from "@workspace/db";
import { eq, gte, desc } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/stories", async (_req, res): Promise<void> => {
  const now = new Date();
  let stories = await db.select().from(storiesTable).where(gte(storiesTable.expiresAt, now)).orderBy(desc(storiesTable.createdAt));

  if (stories.length === 0) {
    const exp = new Date(now.getTime() + 23 * 3600 * 1000);
    const allUsers = await db.select().from(usersTable);
    const others = allUsers.filter(u => u.id !== DEMO_USER_ID).slice(0, 3);
    const seeds = [
      { content: "Just unlocked the TypeScript generics badge after 3 months of avoiding them 🎉", skill: "TypeScript", mood: "proud" },
      { content: "Teaching Figma today reminded me why I love design — the moment when it all clicks for someone is magic ✨", skill: "Figma", mood: "inspired" },
      { content: "Python session went 2 hours over schedule. No one wanted to leave. This is why we do this 🐍", skill: "Python", mood: "energized" },
    ];
    const toInsert = others.map((u, i) => ({ userId: u.id, ...seeds[i % seeds.length], imageUrl: "", expiresAt: exp }));
    if (toInsert.length > 0) await db.insert(storiesTable).values(toInsert);
    stories = await db.select().from(storiesTable).where(gte(storiesTable.expiresAt, now));
  }

  const users = await db.select().from(usersTable);
  const result = stories.map(s => {
    const author = users.find(u => u.id === s.userId);
    const hoursLeft = Math.max(0, Math.round((s.expiresAt.getTime() - now.getTime()) / 3600000));
    return {
      ...s,
      expiresAt: s.expiresAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      authorName: author?.name ?? "Unknown",
      authorAvatar: author?.avatar ?? "",
      isOwn: s.userId === DEMO_USER_ID,
      hoursLeft,
    };
  });
  res.json(result);
});

router.post("/stories", async (req, res): Promise<void> => {
  const { content, skill = "", mood = "", imageUrl = "" } = req.body as { content: string; skill?: string; mood?: string; imageUrl?: string };
  if (!content || content.trim().length < 3) { res.status(400).json({ error: "Story too short" }); return; }
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);
  const [story] = await db.insert(storiesTable).values({ userId: DEMO_USER_ID, content: content.trim(), skill, mood, imageUrl, expiresAt }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  res.json({ ...story, expiresAt: story.expiresAt.toISOString(), createdAt: story.createdAt.toISOString(), authorName: user?.name ?? "You", authorAvatar: user?.avatar ?? "", isOwn: true, hoursLeft: 24 });
});

router.delete("/stories/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.delete(storiesTable).where(eq(storiesTable.id, id));
  res.json({ success: true });
});

export default router;
