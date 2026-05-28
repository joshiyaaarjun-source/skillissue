import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";

export const skillDnaTable = pgTable("skill_dna", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  depth: real("depth").notNull().default(0),
  breadth: real("breadth").notNull().default(0),
  teaching: real("teaching").notNull().default(0),
  speed: real("speed").notNull().default(0),
  curiosity: real("curiosity").notNull().default(0),
  computedAt: timestamp("computed_at").notNull().defaultNow(),
});
