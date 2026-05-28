import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const liveDropsTable = pgTable("live_drops", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skillTag: text("skill_tag").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  startsInMinutes: integer("starts_in_minutes").notNull().default(10),
  status: text("status").notNull().default("announced"),
  announcedAt: timestamp("announced_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});
