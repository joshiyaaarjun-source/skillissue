import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const portfolioItemsTable = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skill: text("skill").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull().default(""),
  mediaType: text("media_type").notNull().default("link"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PortfolioItem = typeof portfolioItemsTable.$inferSelect;
