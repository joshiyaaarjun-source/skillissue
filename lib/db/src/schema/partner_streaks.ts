import { pgTable, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partnerStreaksTable = pgTable("partner_streaks", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().unique(),
  userId1: integer("user_id_1").notNull(),
  userId2: integer("user_id_2").notNull(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastSessionAt: timestamp("last_session_at", { withTimezone: true }),
  gracePeriodUntil: timestamp("grace_period_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPartnerStreakSchema = createInsertSchema(partnerStreaksTable).omit({ id: true, createdAt: true });
export type InsertPartnerStreak = z.infer<typeof insertPartnerStreakSchema>;
export type PartnerStreak = typeof partnerStreaksTable.$inferSelect;
