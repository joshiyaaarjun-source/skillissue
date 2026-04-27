import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const featureFlagsTable = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull().default(""),
  enabled: boolean("enabled").notNull().default(true),
  rolloutPercent: integer("rollout_percent").notNull().default(100),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type FeatureFlag = typeof featureFlagsTable.$inferSelect;
