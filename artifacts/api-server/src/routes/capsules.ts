import { Router, type IRouter } from "express";
import { db, capsulesTable, capsuleLessonsTable, capsuleEnrollmentsTable, usersTable, creditTransactionsTable, ledgerTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

async function seedCapsules() {
  const existing = await db.select().from(capsulesTable).limit(1);
  if (existing.length > 0) return;

  const capsules = await db.insert(capsulesTable).values([
    { creatorId: 2, title: "Python in 5 Lessons", description: "From zero to writing real scripts — fast.", skillTag: "Python", difficulty: "Beginner", coverEmoji: "🐍", totalEnrollments: 12, avgRating: 4.7 },
    { creatorId: 3, title: "Figma for Developers", description: "Learn just enough Figma to design your own UIs.", skillTag: "Figma", difficulty: "Beginner", coverEmoji: "🎨", totalEnrollments: 8, avgRating: 4.9 },
    { creatorId: 4, title: "React Hooks Mastery", description: "useState, useEffect, useCallback — you'll finally get it.", skillTag: "React", difficulty: "Mid", coverEmoji: "⚛️", totalEnrollments: 21, avgRating: 4.8 },
  ]).returning();

  for (const c of capsules) {
    await db.insert(capsuleLessonsTable).values([
      { capsuleId: c.id, title: "Lesson 1: The Foundation", content: "Core concepts — why this skill matters and how it fits into the bigger picture.", order: 1, durationMinutes: 5 },
      { capsuleId: c.id, title: "Lesson 2: Your First Hands-On", content: "Write your first real code/design. Copy, tweak, break things, understand why.", order: 2, durationMinutes: 7 },
      { capsuleId: c.id, title: "Lesson 3: Patterns That Matter", content: "The 20% of patterns that cover 80% of real-world use cases.", order: 3, durationMinutes: 6 },
      { capsuleId: c.id, title: "Lesson 4: Common Pitfalls", content: "The mistakes everyone makes on their first 10 projects. Skip them.", order: 4, durationMinutes: 5 },
      { capsuleId: c.id, title: "Lesson 5: Build Something Real", content: "A mini-project that proves you actually learned it.", order: 5, durationMinutes: 10 },
    ]);
  }
}
seedCapsules();

router.get("/capsules", async (req, res) => {
  const capsules = await db.select().from(capsulesTable).where(eq(capsulesTable.isPublished, true)).orderBy(desc(capsulesTable.totalEnrollments));
  const users = await db.select().from(usersTable);
  const enrollments = await db.select().from(capsuleEnrollmentsTable).where(eq(capsuleEnrollmentsTable.userId, DEMO_USER_ID));

  const result = capsules.map(c => {
    const creator = users.find(u => u.id === c.creatorId);
    const myEnrollment = enrollments.find(e => e.capsuleId === c.id);
    return { ...c, creatorName: creator?.name ?? "Unknown", creatorAvatar: creator?.avatar ?? "", enrolled: !!myEnrollment, myProgress: myEnrollment?.lessonsCompleted ?? 0 };
  });
  res.json(result);
});

router.get("/capsules/:id/lessons", async (req, res) => {
  const capsuleId = parseInt(req.params.id);
  const lessons = await db.select().from(capsuleLessonsTable).where(eq(capsuleLessonsTable.capsuleId, capsuleId)).orderBy(capsuleLessonsTable.order);
  const [enrollment] = await db.select().from(capsuleEnrollmentsTable).where(and(eq(capsuleEnrollmentsTable.capsuleId, capsuleId), eq(capsuleEnrollmentsTable.userId, DEMO_USER_ID)));
  res.json({ lessons, lessonsCompleted: enrollment?.lessonsCompleted ?? 0 });
});

router.post("/capsules/:id/enroll", async (req, res) => {
  const capsuleId = parseInt(req.params.id);
  const [capsule] = await db.select().from(capsulesTable).where(eq(capsulesTable.id, capsuleId));
  if (!capsule) return res.status(404).json({ error: "Capsule not found" });

  const existing = await db.select().from(capsuleEnrollmentsTable).where(and(eq(capsuleEnrollmentsTable.capsuleId, capsuleId), eq(capsuleEnrollmentsTable.userId, DEMO_USER_ID)));
  if (existing.length > 0) return res.status(400).json({ error: "Already enrolled" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (user.creditBalance < capsule.enrollmentCost) return res.status(400).json({ error: "Insufficient credits" });

  await db.update(usersTable).set({ creditBalance: user.creditBalance - capsule.enrollmentCost }).where(eq(usersTable.id, DEMO_USER_ID));
  const [seller] = await db.select().from(usersTable).where(eq(usersTable.id, capsule.creatorId));
  if (seller) await db.update(usersTable).set({ creditBalance: seller.creditBalance + capsule.creatorEarnsPerEnroll }).where(eq(usersTable.id, capsule.creatorId));

  await db.insert(capsuleEnrollmentsTable).values({ capsuleId, userId: DEMO_USER_ID });
  await db.update(capsulesTable).set({ totalEnrollments: capsule.totalEnrollments + 1 }).where(eq(capsulesTable.id, capsuleId));

  await db.insert(creditTransactionsTable).values({ userId: DEMO_USER_ID, type: "spent", amount: capsule.enrollmentCost, description: `Enrolled in: ${capsule.title}` });
  await db.insert(ledgerTable).values({ eventType: "CREDITS_UPDATED", userId: DEMO_USER_ID, description: `Capsule enrollment: ${capsule.title}`, metadata: { reason: 'capsule_enroll', capsuleId, amount: -capsule.enrollmentCost } });

  return res.json({ success: true });
});

router.post("/capsules/:id/lessons/:lessonId/complete", async (req, res) => {
  const capsuleId = parseInt(req.params.id);
  const [enrollment] = await db.select().from(capsuleEnrollmentsTable).where(and(eq(capsuleEnrollmentsTable.capsuleId, capsuleId), eq(capsuleEnrollmentsTable.userId, DEMO_USER_ID)));
  if (!enrollment) return res.status(400).json({ error: "Not enrolled" });
  await db.update(capsuleEnrollmentsTable).set({ lessonsCompleted: enrollment.lessonsCompleted + 1 }).where(eq(capsuleEnrollmentsTable.id, enrollment.id));
  return res.json({ success: true, lessonsCompleted: enrollment.lessonsCompleted + 1 });
});

export default router;
