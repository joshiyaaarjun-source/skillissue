import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar").notNull().default(""),
  bio: text("bio").notNull().default(""),
  skillsOffered: text("skills_offered").array().notNull().default([]),
  skillsWanted: text("skills_wanted").array().notNull().default([]),
  skillTBR: text("skill_tbr").array().notNull().default([]),
  creditBalance: real("credit_balance").notNull().default(20),
  credibilityScore: real("credibility_score").notNull().default(4.0),
  totalExchanges: integer("total_exchanges").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  onboarded: boolean("onboarded").notNull().default(false),
  availability: text("availability").notNull().default("Flexible"),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  exchangeCount: integer("exchange_count").notNull().default(0),
  isNew: boolean("is_new").notNull().default(false),
  domains: text("domains").array().notNull().default([]),
  linkedIn: text("linked_in").notNull().default(""),
  referralCode: text("referral_code").notNull().default(""),
  referralCount: integer("referral_count").notNull().default(0),
  referralCredits: real("referral_credits").notNull().default(0),
  ghostingWarnings: integer("ghosting_warnings").notNull().default(0),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
