import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  reportedUserId: integer("reported_user_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Report = typeof reportsTable.$inferSelect;
