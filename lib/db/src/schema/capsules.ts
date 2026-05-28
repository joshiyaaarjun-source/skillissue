import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";

export const capsulesTable = pgTable("capsules", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  skillTag: text("skill_tag").notNull(),
  difficulty: text("difficulty").notNull().default("Beginner"),
  coverEmoji: text("cover_emoji").notNull().default("📚"),
  enrollmentCost: integer("enrollment_cost").notNull().default(3),
  creatorEarnsPerEnroll: integer("creator_earns_per_enroll").notNull().default(2),
  totalEnrollments: integer("total_enrollments").notNull().default(0),
  avgRating: real("avg_rating").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const capsuleLessonsTable = pgTable("capsule_lessons", {
  id: serial("id").primaryKey(),
  capsuleId: integer("capsule_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  order: integer("order").notNull().default(0),
  durationMinutes: integer("duration_minutes").notNull().default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const capsuleEnrollmentsTable = pgTable("capsule_enrollments", {
  id: serial("id").primaryKey(),
  capsuleId: integer("capsule_id").notNull(),
  userId: integer("user_id").notNull(),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  rating: real("rating"),
  review: text("review"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
});
