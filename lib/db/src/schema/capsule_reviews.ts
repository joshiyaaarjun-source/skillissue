import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const capsuleReviewsTable = pgTable("capsule_reviews", {
  id: serial("id").primaryKey(),
  capsuleId: integer("capsule_id").notNull(),
  userId: integer("user_id").notNull(),
  review: text("review").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  rating: real("rating").notNull().default(5),
  creditAwarded: integer("credit_awarded").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCapsuleReviewSchema = createInsertSchema(capsuleReviewsTable).omit({ id: true, createdAt: true });
export type InsertCapsuleReview = z.infer<typeof insertCapsuleReviewSchema>;
export type CapsuleReview = typeof capsuleReviewsTable.$inferSelect;
