import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillVerificationsTable = pgTable("skill_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skill: text("skill").notNull(),
  quizPassed: boolean("quiz_passed").notNull().default(false),
  docUploaded: boolean("doc_uploaded").notNull().default(false),
  status: text("status").notNull().default("unverified"), // unverified, quiz_passed, fully_verified
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const verificationDocsTable = pgTable("verification_docs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skill: text("skill").notNull(),
  docName: text("doc_name").notNull(),
  docType: text("doc_type").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSkillVerificationSchema = createInsertSchema(skillVerificationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSkillVerification = z.infer<typeof insertSkillVerificationSchema>;
export type SkillVerification = typeof skillVerificationsTable.$inferSelect;

export const insertVerificationDocSchema = createInsertSchema(verificationDocsTable).omit({ id: true, uploadedAt: true });
export type InsertVerificationDoc = z.infer<typeof insertVerificationDocSchema>;
export type VerificationDoc = typeof verificationDocsTable.$inferSelect;
