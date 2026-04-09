import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const swipesTable = pgTable("swipes", {
  id: serial("id").primaryKey(),
  swiperId: integer("swiper_id").notNull(),
  targetId: integer("target_id").notNull(),
  direction: text("direction").notNull(), // 'left' or 'right'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSwipeSchema = createInsertSchema(swipesTable).omit({ id: true, createdAt: true });
export type InsertSwipe = z.infer<typeof insertSwipeSchema>;
export type Swipe = typeof swipesTable.$inferSelect;
