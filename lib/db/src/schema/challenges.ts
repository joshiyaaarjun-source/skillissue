import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const coldStartChallengesTable = pgTable("cold_start_challenges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  prompt: text("prompt").notNull(),
  skillContext: text("skill_context").notNull().default(""),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  creditsAwarded: integer("credits_awarded").notNull().default(0),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});
