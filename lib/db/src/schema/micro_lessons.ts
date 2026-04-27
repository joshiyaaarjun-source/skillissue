import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const microLessonsTable = pgTable("micro_lessons", {
  id: serial("id").primaryKey(),
  skill: text("skill").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  tip: text("tip").notNull().default(""),
  emoji: text("emoji").notNull().default("💡"),
  durationMinutes: integer("duration_minutes").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonProgressTable = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MicroLesson = typeof microLessonsTable.$inferSelect;
export type LessonProgress = typeof lessonProgressTable.$inferSelect;
