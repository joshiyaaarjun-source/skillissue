import { Router, type IRouter } from "express";
import { db, mentorApplicationsTable, mentorshipsTable, usersTable, exchangesTable } from "@workspace/db";
import { eq, and, or, ne } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/mentors", async (_req, res): Promise<void> => {
  const approved = await db.select().from(mentorApplicationsTable).where(eq(mentorApplicationsTable.status, "approved"));
  const users = await db.select().from(usersTable);
  const mentorships = await db.select().from(mentorshipsTable).where(eq(mentorshipsTable.isActive, true));

  const result = approved.map(app => {
    const user = users.find(u => u.id === app.userId);
    const menteeCount = mentorships.filter(m => m.mentorId === app.userId && m.status === "active").length;
    return {
      id: app.userId,
      name: user?.name ?? "Unknown",
      avatar: user?.avatar ?? "",
      bio: user?.bio ?? "",
      skill: app.skill,
      avgRating: app.avgRating,
      sessionCount: app.sessionCount,
      menteeCount,
    };
  });
  res.json(result);
});

router.post("/mentors/apply", async (req, res): Promise<void> => {
  const { skill } = req.body as { skill: string };
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const existing = await db.select().from(mentorApplicationsTable).where(and(eq(mentorApplicationsTable.userId, DEMO_USER_ID), eq(mentorApplicationsTable.skill, skill)));
  if (existing.length > 0) { res.json({ success: true, status: existing[0].status, message: `Your application for ${skill} is ${existing[0].status}.` }); return; }

  const exchanges = await db.select().from(exchangesTable).where(and(eq(exchangesTable.teacherId, DEMO_USER_ID), eq(exchangesTable.status, "completed")));
  const sessionCount = exchanges.length;
  const avgRating = user.credibilityScore;

  const meetsRequirements = sessionCount >= 10 && avgRating >= 4.2;
  const status = meetsRequirements ? "approved" : "pending";

  await db.insert(mentorApplicationsTable).values({ userId: DEMO_USER_ID, skill, status, avgRating, sessionCount });
  const message = meetsRequirements
    ? `Congratulations! You qualify as a ${skill} mentor. You now appear at the top of swipe cards.`
    : `Application received. You need 10+ sessions (you have ${sessionCount}) and 4.2+ rating (you have ${avgRating.toFixed(1)}).`;
  res.json({ success: true, status, message });
});

router.get("/mentorships", async (_req, res): Promise<void> => {
  const mine = await db.select().from(mentorshipsTable).where(or(eq(mentorshipsTable.mentorId, DEMO_USER_ID), eq(mentorshipsTable.menteeId, DEMO_USER_ID)));
  const users = await db.select().from(usersTable);

  const result = mine.map(m => {
    const mentor = users.find(u => u.id === m.mentorId);
    const mentee = users.find(u => u.id === m.menteeId);
    return { ...m, mentorName: mentor?.name ?? "Unknown", mentorAvatar: mentor?.avatar ?? "", menteeName: mentee?.name ?? "Unknown", menteeAvatar: mentee?.avatar ?? "" };
  });
  res.json(result);
});

router.post("/mentorships", async (req, res): Promise<void> => {
  const { mentorId, skill } = req.body as { mentorId: number; skill: string };
  const existing = await db.select().from(mentorshipsTable).where(and(eq(mentorshipsTable.mentorId, mentorId), eq(mentorshipsTable.menteeId, DEMO_USER_ID)));
  if (existing.length > 0) { res.status(400).json({ error: "Mentorship already exists" }); return; }

  const activeMentees = await db.select().from(mentorshipsTable).where(and(eq(mentorshipsTable.mentorId, mentorId), eq(mentorshipsTable.status, "active")));
  if (activeMentees.length >= 3) { res.status(400).json({ error: "This mentor has reached their limit of 3 mentees" }); return; }

  const [mentorship] = await db.insert(mentorshipsTable).values({ mentorId, menteeId: DEMO_USER_ID, skill, weeklyCredits: 3 }).returning();
  const users = await db.select().from(usersTable);
  const mentor = users.find(u => u.id === mentorId);
  const mentee = users.find(u => u.id === DEMO_USER_ID);
  res.json({ ...mentorship, mentorName: mentor?.name ?? "Unknown", mentorAvatar: mentor?.avatar ?? "", menteeName: mentee?.name ?? "Unknown", menteeAvatar: mentee?.avatar ?? "" });
});

export default router;
