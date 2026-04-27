import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";

export const skillBattlesTable = pgTable("skill_battles", {
  id: serial("id").primaryKey(),
  challengerId: integer("challenger_id").notNull(),
  opponentName: text("opponent_name").notNull().default("AI Challenger"),
  opponentAvatar: text("opponent_avatar").notNull().default(""),
  skill: text("skill").notNull(),
  status: text("status").notNull().default("active"),
  questions: jsonb("questions").notNull().default([]),
  challengerAnswers: jsonb("challenger_answers").notNull().default([]),
  challengerScore: integer("challenger_score").notNull().default(0),
  opponentScore: integer("opponent_score").notNull().default(0),
  votesForChallenger: integer("votes_for_challenger").notNull().default(0),
  votesForOpponent: integer("votes_for_opponent").notNull().default(0),
  timeLimitSeconds: integer("time_limit_seconds").notNull().default(60),
  creditsAwarded: real("credits_awarded").notNull().default(0),
  badgeAwarded: text("badge_awarded"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});
