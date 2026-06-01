import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillMarketplaceChallengesTable = pgTable("skill_marketplace_challenges", {
  id: serial("id").primaryKey(),
  posterId: integer("poster_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skill: text("skill").notNull(),
  bounty: integer("bounty").notNull().default(10),
  status: text("status").notNull().default("open"),
  winnerId: integer("winner_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const marketplaceSubmissionsTable = pgTable("marketplace_submissions", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull(),
  submitterId: integer("submitter_id").notNull(),
  solution: text("solution").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMarketplaceChallengeSchema = createInsertSchema(skillMarketplaceChallengesTable).omit({ id: true, createdAt: true });
export type InsertMarketplaceChallenge = z.infer<typeof insertMarketplaceChallengeSchema>;
export type MarketplaceChallenge = typeof skillMarketplaceChallengesTable.$inferSelect;

export const insertMarketplaceSubmissionSchema = createInsertSchema(marketplaceSubmissionsTable).omit({ id: true, submittedAt: true });
export type InsertMarketplaceSubmission = z.infer<typeof insertMarketplaceSubmissionSchema>;
export type MarketplaceSubmission = typeof marketplaceSubmissionsTable.$inferSelect;
