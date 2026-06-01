import { pgTable, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillTwinsTable = pgTable("skill_twins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  twinId: integer("twin_id").notNull(),
  similarity: real("similarity").notNull().default(0),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSkillTwinSchema = createInsertSchema(skillTwinsTable).omit({ id: true, computedAt: true });
export type InsertSkillTwin = z.infer<typeof insertSkillTwinSchema>;
export type SkillTwin = typeof skillTwinsTable.$inferSelect;
