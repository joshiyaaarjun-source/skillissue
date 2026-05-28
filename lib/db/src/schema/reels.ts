import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";

export const reelsTable = pgTable("reels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skillTag: text("skill_tag").notNull(),
  title: text("title").notNull(),
  videoUrl: text("video_url").notNull().default(""),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  duration: integer("duration").notNull().default(60),
  reelScore: real("reel_score").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reelReactionsTable = pgTable("reel_reactions", {
  id: serial("id").primaryKey(),
  reelId: integer("reel_id").notNull(),
  userId: integer("user_id").notNull(),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
