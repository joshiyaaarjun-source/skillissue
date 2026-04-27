import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  userId: integer("user_id").notNull(),
  partnerId: integer("partner_id").notNull(),
  partnerName: text("partner_name").notNull().default(""),
  partnerAvatar: text("partner_avatar").notNull().default(""),
  exchangeId: integer("exchange_id"),
  status: text("status").notNull().default("active"),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  creditsEarned: real("credits_earned").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const sessionFeedbackTable = pgTable("session_feedback", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  rating: integer("rating").notNull(),
  review: text("review").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
