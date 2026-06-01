import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roastsTable = pgTable("roasts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  roastText: text("roast_text").notNull(),
  weakestSkill: text("weakest_skill").notNull().default(""),
  optedIn: boolean("opted_in").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoastSchema = createInsertSchema(roastsTable).omit({ id: true, createdAt: true });
export type InsertRoast = z.infer<typeof insertRoastSchema>;
export type Roast = typeof roastsTable.$inferSelect;
