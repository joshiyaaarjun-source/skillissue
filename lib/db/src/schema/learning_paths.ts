import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export interface LearningPathStepData {
  id: string;
  title: string;
  description: string;
  xp: number;
  status: "locked" | "available" | "completed";
  order: number;
  resources: string[];
}

export const learningPathsTable = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  goal: text("goal").notNull(),
  steps: jsonb("steps").$type<LearningPathStepData[]>().notNull().default([]),
  totalXp: integer("total_xp").notNull().default(0),
  completedSteps: integer("completed_steps").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
