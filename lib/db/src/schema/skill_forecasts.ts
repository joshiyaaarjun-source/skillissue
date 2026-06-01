import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillForecastsTable = pgTable("skill_forecasts", {
  id: serial("id").primaryKey(),
  weekOf: text("week_of").notNull(),
  forecastData: jsonb("forecast_data").notNull().default([]),
  aiSummary: text("ai_summary").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSkillForecastSchema = createInsertSchema(skillForecastsTable).omit({ id: true, createdAt: true });
export type InsertSkillForecast = z.infer<typeof insertSkillForecastSchema>;
export type SkillForecast = typeof skillForecastsTable.$inferSelect;
