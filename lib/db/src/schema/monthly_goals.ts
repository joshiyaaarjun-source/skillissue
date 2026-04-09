import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const monthlyGoalsTable = pgTable("monthly_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  progress: real("progress").notNull().default(0),
  target: real("target").notNull().default(10),
  month: text("month").notNull(), // e.g. "2026-04"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMonthlyGoalSchema = createInsertSchema(monthlyGoalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMonthlyGoal = z.infer<typeof insertMonthlyGoalSchema>;
export type MonthlyGoal = typeof monthlyGoalsTable.$inferSelect;
