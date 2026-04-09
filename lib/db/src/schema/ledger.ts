import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ledgerTable = pgTable("ledger", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // MATCH_CREATED, EXCHANGE_COMPLETED, CREDITS_UPDATED
  description: text("description").notNull(),
  userId: integer("user_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLedgerSchema = createInsertSchema(ledgerTable).omit({ id: true, createdAt: true });
export type InsertLedger = z.infer<typeof insertLedgerSchema>;
export type Ledger = typeof ledgerTable.$inferSelect;
