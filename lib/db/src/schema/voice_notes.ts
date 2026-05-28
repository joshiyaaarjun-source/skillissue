import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const voiceNotesTable = pgTable("voice_notes", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  senderId: integer("sender_id").notNull(),
  audioData: text("audio_data").notNull(),
  duration: integer("duration").notNull().default(0),
  transcript: text("transcript").notNull().default(""),
  transcriptStatus: text("transcript_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
