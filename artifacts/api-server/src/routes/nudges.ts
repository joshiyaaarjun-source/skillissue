import { Router, type IRouter } from "express";
import { db, usersTable, matchesTable, exchangesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { GetNudgesResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/nudges", async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (!user) {
    res.json([]);
    return;
  }

  const nudges: Array<{
    id: string;
    type: string;
    message: string;
    actionLabel?: string;
    actionRoute?: string;
    priority: string;
  }> = [];

  if (user.creditBalance > 10) {
    nudges.push({
      id: "nudge-credits",
      type: "unused_credits",
      message: `You have ${Math.floor(user.creditBalance)} credits sitting unused. Put them to work — learn something new today.`,
      actionLabel: "Explore skills",
      actionRoute: "/explore",
      priority: "high",
    });
  }

  const matches = await db.select().from(matchesTable).where(
    or(eq(matchesTable.userAId, DEMO_USER_ID), eq(matchesTable.userBId, DEMO_USER_ID))
  );

  if (matches.length > 0) {
    const partnerId = matches[0].userAId === DEMO_USER_ID ? matches[0].userBId : matches[0].userAId;
    const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
    if (partner) {
      const overlap = user.skillsWanted.filter(s => partner.skillsOffered.includes(s));
      if (overlap.length > 0) {
        nudges.push({
          id: "nudge-match",
          type: "skill_match",
          message: `You and ${partner.name} both match on ${overlap[0]} — why not start an exchange?`,
          actionLabel: "See matches",
          actionRoute: "/matches",
          priority: "high",
        });
      }
    }
  }

  if (user.streakDays === 0) {
    nudges.push({
      id: "nudge-streak",
      type: "streak_reminder",
      message: "Start your learning streak today — even one session counts. Day 1 is always the hardest.",
      actionLabel: "Start learning",
      actionRoute: "/explore",
      priority: "medium",
    });
  } else if (user.streakDays >= 3) {
    nudges.push({
      id: "nudge-streak-keep",
      type: "streak_reminder",
      message: `${user.streakDays}-day streak! Don't let it die now — you are just getting started.`,
      actionLabel: "Keep going",
      actionRoute: "/explore",
      priority: "medium",
    });
  }

  nudges.push({
    id: "nudge-goal",
    type: "goal_progress",
    message: "You are 60% of the way to your monthly learning goal. One more exchange gets you there.",
    actionLabel: "View goals",
    actionRoute: "/dashboard",
    priority: "low",
  });

  res.json(GetNudgesResponse.parse(nudges.slice(0, 3)));
});

export default router;
