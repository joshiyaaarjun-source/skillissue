import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillProgressTable = pgTable("skill_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skill: text("skill").notNull(),
  status: text("status").notNull().default("to_start"), // completed, in_progress, to_start
  progress: real("progress").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSkillProgressSchema = createInsertSchema(skillProgressTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSkillProgress = z.infer<typeof insertSkillProgressSchema>;
export type SkillProgress = typeof skillProgressTable.$inferSelect;
