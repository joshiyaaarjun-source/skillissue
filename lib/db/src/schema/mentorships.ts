import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mentorApplicationsTable = pgTable("mentor_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skill: text("skill").notNull(),
  status: text("status").notNull().default("pending"),
  avgRating: real("avg_rating").notNull().default(0),
  sessionCount: integer("session_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mentorshipsTable = pgTable("mentorships", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull(),
  menteeId: integer("mentee_id").notNull(),
  skill: text("skill").notNull(),
  status: text("status").notNull().default("active"),
  weeklyCredits: integer("weekly_credits").notNull().default(3),
  progressNotes: text("progress_notes").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  lastBilledAt: timestamp("last_billed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMentorApplicationSchema = createInsertSchema(mentorApplicationsTable).omit({ id: true, createdAt: true });
export type InsertMentorApplication = z.infer<typeof insertMentorApplicationSchema>;
export type MentorApplication = typeof mentorApplicationsTable.$inferSelect;

export const insertMentorshipSchema = createInsertSchema(mentorshipsTable).omit({ id: true, startedAt: true, lastBilledAt: true });
export type InsertMentorship = z.infer<typeof insertMentorshipSchema>;
export type Mentorship = typeof mentorshipsTable.$inferSelect;
