import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";

export const skillWrappedTable = pgTable("skill_wrapped", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  month: text("month").notNull(),
  topSkillTaught: text("top_skill_taught").notNull().default(""),
  topSkillLearned: text("top_skill_learned").notNull().default(""),
  creditsEarned: real("credits_earned").notNull().default(0),
  creditsSpent: real("credits_spent").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  newBadges: integer("new_badges").notNull().default(0),
  totalExchanges: integer("total_exchanges").notNull().default(0),
  aiCopy: text("ai_copy").notNull().default(""),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});
