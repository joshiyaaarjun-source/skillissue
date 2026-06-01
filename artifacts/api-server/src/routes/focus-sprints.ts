import { Router, type IRouter } from "express";
import { db, focusSprintsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/focus-sprints", async (req, res): Promise<void> => {
  const { roomId, matchId } = req.query as { roomId?: string; matchId?: string };
  let sprint = null;

  if (roomId) {
    const sprints = await db.select().from(focusSprintsTable).where(and(eq(focusSprintsTable.roomId, parseInt(roomId)), eq(focusSprintsTable.status, "active")));
    sprint = sprints[0] ?? null;
  } else if (matchId) {
    const sprints = await db.select().from(focusSprintsTable).where(and(eq(focusSprintsTable.matchId, parseInt(matchId)), eq(focusSprintsTable.status, "active")));
    sprint = sprints[0] ?? null;
  }

  if (!sprint) { res.json({ id: 0, startedBy: 0, durationMinutes: 25, breakMinutes: 5, status: "idle", accomplishment: "", startedAt: new Date().toISOString(), completedAt: null, elapsedSeconds: 0, roomId: null, matchId: null }); return; }

  const elapsed = Math.floor((Date.now() - sprint.startedAt.getTime()) / 1000);
  res.json({ ...sprint, startedAt: sprint.startedAt.toISOString(), completedAt: sprint.completedAt?.toISOString() ?? null, elapsedSeconds: elapsed });
});

router.post("/focus-sprints", async (req, res): Promise<void> => {
  const { roomId, matchId, durationMinutes = 25 } = req.body as { roomId?: number; matchId?: number; durationMinutes?: number };
  const [sprint] = await db.insert(focusSprintsTable).values({
    roomId: roomId ?? null,
    matchId: matchId ?? null,
    startedBy: DEMO_USER_ID,
    durationMinutes,
    breakMinutes: 5,
    status: "active",
  }).returning();
  res.json({ ...sprint, startedAt: sprint.startedAt.toISOString(), completedAt: null, elapsedSeconds: 0 });
});

router.post("/focus-sprints/:id/complete", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { accomplishment } = req.body as { accomplishment: string };
  await db.update(focusSprintsTable).set({ status: "completed", accomplishment, completedAt: new Date() }).where(eq(focusSprintsTable.id, id));
  res.json({ success: true });
});

export default router;
