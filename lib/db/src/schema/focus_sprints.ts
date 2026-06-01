import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const focusSprintsTable = pgTable("focus_sprints", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id"),
  matchId: integer("match_id"),
  startedBy: integer("started_by").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(25),
  breakMinutes: integer("break_minutes").notNull().default(5),
  status: text("status").notNull().default("active"),
  accomplishment: text("accomplishment").notNull().default(""),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertFocusSprintSchema = createInsertSchema(focusSprintsTable).omit({ id: true, startedAt: true });
export type InsertFocusSprint = z.infer<typeof insertFocusSprintSchema>;
export type FocusSprint = typeof focusSprintsTable.$inferSelect;
