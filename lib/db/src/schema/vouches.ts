import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";

export const vouchesTable = pgTable("vouches", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucher_id").notNull(),
  vouchedUserId: integer("vouched_user_id").notNull(),
  skill: text("skill").notNull(),
  stakeAmount: real("stake_amount").notNull().default(5),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});
