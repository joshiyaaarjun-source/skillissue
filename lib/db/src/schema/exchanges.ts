import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exchangesTable = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  learnerId: integer("learner_id").notNull(),
  teachSkill: text("teach_skill").notNull(),
  learnSkill: text("learn_skill").notNull(),
  creditsPerSession: real("credits_per_session").notNull(),
  status: text("status").notNull().default("pending"), // pending, active, completed
  rating: real("rating"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertExchangeSchema = createInsertSchema(exchangesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExchange = z.infer<typeof insertExchangeSchema>;
export type Exchange = typeof exchangesTable.$inferSelect;
