import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const badgesTable = pgTable("badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: text("badge_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  earned: boolean("earned").notNull().default(false),
  progress: real("progress").notNull().default(0),
  target: real("target").notNull().default(1),
  earnedAt: timestamp("earned_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBadgeSchema = createInsertSchema(badgesTable).omit({ id: true, createdAt: true });
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badgesTable.$inferSelect;
