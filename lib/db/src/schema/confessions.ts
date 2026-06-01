import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const confessionsTable = pgTable("confessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  skill: text("skill").notNull().default(""),
  relatableCount: integer("relatable_count").notNull().default(0),
  tipCount: integer("tip_count").notNull().default(0),
  sameCount: integer("same_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const confessionReactionsTable = pgTable("confession_reactions", {
  id: serial("id").primaryKey(),
  confessionId: integer("confession_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  tip: text("tip").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConfessionSchema = createInsertSchema(confessionsTable).omit({ id: true, createdAt: true, relatableCount: true, tipCount: true, sameCount: true });
export type InsertConfession = z.infer<typeof insertConfessionSchema>;
export type Confession = typeof confessionsTable.$inferSelect;

export const insertConfessionReactionSchema = createInsertSchema(confessionReactionsTable).omit({ id: true, createdAt: true });
export type InsertConfessionReaction = z.infer<typeof insertConfessionReactionSchema>;
export type ConfessionReaction = typeof confessionReactionsTable.$inferSelect;
