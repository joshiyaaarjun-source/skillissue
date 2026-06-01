import { Router, type IRouter } from "express";
import { db, skillTwinsTable, usersTable } from "@workspace/db";
import { eq, ne, desc } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

function computeSimilarity(a: { skillsOffered: string[]; skillsWanted: string[] }, b: { skillsOffered: string[]; skillsWanted: string[] }): number {
  const aAll = [...a.skillsOffered, ...a.skillsWanted].map(s => s.toLowerCase());
  const bAll = [...b.skillsOffered, ...b.skillsWanted].map(s => s.toLowerCase());
  const intersection = aAll.filter(s => bAll.includes(s));
  const union = [...new Set([...aAll, ...bAll])];
  return union.length === 0 ? 0 : Math.round((intersection.length / union.length) * 100);
}

router.get("/skill-twin", async (_req, res): Promise<void> => {
  const existing = await db.select().from(skillTwinsTable).where(eq(skillTwinsTable.userId, DEMO_USER_ID)).orderBy(desc(skillTwinsTable.computedAt)).limit(1);

  const allUsers = await db.select().from(usersTable);
  const me = allUsers.find(u => u.id === DEMO_USER_ID);
  if (!me) { res.json({ hasTwin: false }); return; }

  let twinRecord = existing[0];
  if (!twinRecord) {
    const others = allUsers.filter(u => u.id !== DEMO_USER_ID);
    if (others.length === 0) { res.json({ hasTwin: false }); return; }
    let best = others[0];
    let bestSim = 0;
    for (const u of others) {
      const sim = computeSimilarity(me, u);
      if (sim > bestSim) { bestSim = sim; best = u; }
    }
    const [inserted] = await db.insert(skillTwinsTable).values({ userId: DEMO_USER_ID, twinId: best.id, similarity: bestSim }).returning();
    twinRecord = inserted;
  }

  const twin = allUsers.find(u => u.id === twinRecord.twinId);
  if (!twin) { res.json({ hasTwin: false }); return; }

  const sharedSkills = [...me.skillsOffered, ...me.skillsWanted].filter(s => [...twin.skillsOffered, ...twin.skillsWanted].some(ts => ts.toLowerCase() === s.toLowerCase()));
  const chatStarter = `Hey! I saw we're ${twinRecord.similarity}% skill twins 🧬 — we both ${sharedSkills[0] ? `know ${sharedSkills[0]}` : "have similar goals"}. Want to swap skills?`;

  res.json({
    hasTwin: true,
    twin: { id: twin.id, name: twin.name, avatar: twin.avatar, similarity: twinRecord.similarity, sharedSkills, chatStarter },
    computedAt: twinRecord.computedAt.toISOString(),
  });
});

export default router;
