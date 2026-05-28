import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const studyRoomsTable = pgTable("study_rooms", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull(),
  name: text("name").notNull(),
  topic: text("topic").notNull(),
  tags: text("tags").array().notNull().default([]),
  maxMembers: integer("max_members").notNull().default(6),
  sprintDuration: integer("sprint_duration").notNull().default(25),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const studyRoomMembersTable = pgTable("study_room_members", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  isPresent: boolean("is_present").notNull().default(false),
});

export const studyRoomPinsTable = pgTable("study_room_pins", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  pinType: text("pin_type").notNull().default("text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
