import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";

export const sessionNotesTable = pgTable("session_notes", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  textNotes: text("text_notes").notNull().default(""),
  strokes: jsonb("strokes").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
