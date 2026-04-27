import { Router, type IRouter } from "express";
import { db, usersTable, reportsTable } from "@workspace/db";
import { eq, or, and, count } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const REPORT_REASONS = [
  "Harassment or threatening behavior",
  "Inappropriate content",
  "Spam or fake profile",
  "No-show / ghosting after agreement",
  "Skill misrepresentation",
  "Other",
];

router.get("/safety/reasons", (_req, res) => {
  res.json({ reasons: REPORT_REASONS });
});

router.get("/safety/status", async (_req, res): Promise<void> => {
  const [reportsAgainstMe] = await db
    .select({ count: count() })
    .from(reportsTable)
    .where(eq(reportsTable.reportedUserId, DEMO_USER_ID));

  const flagCount = reportsAgainstMe?.count ?? 0;
  let status = "clear";
  let badge = "✅ Trusted Member";
  let message = "No safety concerns on your account.";

  if (flagCount >= 5) {
    status = "flagged";
    badge = "🚨 Under Review";
    message = "Your account has multiple reports and is under review.";
  } else if (flagCount >= 2) {
    status = "warned";
    badge = "⚠️ Warning Issued";
    message = "You've received reports. Please review our community guidelines.";
  }

  res.json({ status, badge, message, flagCount });
});

router.post("/safety/report", async (req, res): Promise<void> => {
  const { reportedUserId, reason, details } = req.body as {
    reportedUserId?: number;
    reason?: string;
    details?: string;
  };

  if (!reportedUserId || !reason) {
    res.status(400).json({ error: "reportedUserId and reason required" });
    return;
  }

  if (reportedUserId === DEMO_USER_ID) {
    res.status(400).json({ error: "You cannot report yourself" });
    return;
  }

  const existing = await db.select().from(reportsTable).where(
    and(
      eq(reportsTable.reporterId, DEMO_USER_ID),
      eq(reportsTable.reportedUserId, reportedUserId)
    )
  );

  if (existing.length > 0) {
    res.status(409).json({ error: "You have already reported this user" });
    return;
  }

  const [report] = await db.insert(reportsTable).values({
    reporterId: DEMO_USER_ID,
    reportedUserId,
    reason,
    details: details ?? "",
    status: "pending",
  }).returning();

  const [reportCount] = await db.select({ cnt: count() }).from(reportsTable).where(eq(reportsTable.reportedUserId, reportedUserId));
  await db.update(usersTable).set({
    ghostingWarnings: reportCount?.cnt ?? 0,
  }).where(eq(usersTable.id, reportedUserId));

  res.json({ success: true, reportId: report.id, message: "Report submitted. Our team will review it within 24 hours." });
});

export default router;
