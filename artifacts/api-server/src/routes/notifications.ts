import { Router, type IRouter } from "express";
import { GetNotificationsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const MOCK_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "match" as const,
    tone: "hype" as const,
    message: "You matched with Maya! She teaches Python and wants to learn React — that is literally you. Get in there!",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "notif-2",
    type: "credit_earned" as const,
    tone: "soft" as const,
    message: "You earned 5 credits for teaching JavaScript fundamentals. Every session builds your reputation.",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "notif-3",
    type: "inactivity" as const,
    tone: "roast" as const,
    message: "You have had 50 credits sitting there for 3 days. Are you collecting or learning? Pick one.",
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: "notif-4",
    type: "goal_progress" as const,
    tone: "hype" as const,
    message: "You are on a 5-day streak! Keep the momentum — legends do not stop here!",
    read: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: "notif-5",
    type: "credit_spent" as const,
    tone: "soft" as const,
    message: "You spent 3 credits to learn UI Design from Priya. Knowledge well spent.",
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: "notif-6",
    type: "match" as const,
    tone: "soft" as const,
    message: "Someone nearby is learning React. You could teach that — and earn credits doing it.",
    read: false,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
];

router.get("/notifications", async (req, res): Promise<void> => {
  res.json(GetNotificationsResponse.parse(MOCK_NOTIFICATIONS));
});

export default router;
