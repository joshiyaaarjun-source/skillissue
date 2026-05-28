import { Router, type IRouter } from "express";
import { db, studyRoomsTable, studyRoomMembersTable, studyRoomPinsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

async function seedRooms() {
  const existing = await db.select().from(studyRoomsTable).limit(1);
  if (existing.length > 0) return;
  const rooms = await db.insert(studyRoomsTable).values([
    { creatorId: 2, name: "React Deep Dive", topic: "React", tags: ["react", "frontend", "hooks"], sprintDuration: 25 },
    { creatorId: 3, name: "Design Systems Club", topic: "UI Design", tags: ["design", "figma", "tokens"], sprintDuration: 30 },
    { creatorId: 4, name: "Python for ML", topic: "Python", tags: ["python", "ml", "data"], sprintDuration: 45 },
  ]).returning();
  for (const r of rooms) {
    await db.insert(studyRoomMembersTable).values({ roomId: r.id, userId: r.creatorId, isPresent: true });
  }
}
seedRooms();

router.get("/study-rooms", async (req, res) => {
  const rooms = await db.select().from(studyRoomsTable).where(eq(studyRoomsTable.isActive, true)).orderBy(desc(studyRoomsTable.createdAt));
  const members = await db.select().from(studyRoomMembersTable);
  const users = await db.select().from(usersTable);

  const result = rooms.map(r => {
    const roomMembers = members.filter(m => m.roomId === r.id);
    const presentMembers = roomMembers.filter(m => m.isPresent);
    const memberDetails = presentMembers.map(m => {
      const u = users.find(u => u.id === m.userId);
      return { id: m.userId, name: u?.name ?? "Unknown", avatar: u?.avatar ?? "" };
    });
    const isMember = roomMembers.some(m => m.userId === DEMO_USER_ID);
    return { ...r, memberCount: roomMembers.length, presentCount: presentMembers.length, presentMembers: memberDetails, isMember };
  });

  res.json(result);
});

router.post("/study-rooms", async (req, res) => {
  const { name, topic, tags } = req.body as { name: string; topic: string; tags?: string[] };
  const [room] = await db.insert(studyRoomsTable).values({ creatorId: DEMO_USER_ID, name, topic, tags: tags ?? [] }).returning();
  await db.insert(studyRoomMembersTable).values({ roomId: room.id, userId: DEMO_USER_ID, isPresent: true });
  res.json(room);
});

router.post("/study-rooms/:id/join", async (req, res) => {
  const roomId = parseInt(req.params.id);
  const existing = await db.select().from(studyRoomMembersTable)
    .where(and(eq(studyRoomMembersTable.roomId, roomId), eq(studyRoomMembersTable.userId, DEMO_USER_ID)));
  if (existing.length > 0) {
    await db.update(studyRoomMembersTable).set({ isPresent: true })
      .where(and(eq(studyRoomMembersTable.roomId, roomId), eq(studyRoomMembersTable.userId, DEMO_USER_ID)));
  } else {
    await db.insert(studyRoomMembersTable).values({ roomId, userId: DEMO_USER_ID, isPresent: true });
  }
  res.json({ success: true });
});

router.post("/study-rooms/:id/leave", async (req, res) => {
  const roomId = parseInt(req.params.id);
  await db.update(studyRoomMembersTable).set({ isPresent: false })
    .where(and(eq(studyRoomMembersTable.roomId, roomId), eq(studyRoomMembersTable.userId, DEMO_USER_ID)));
  res.json({ success: true });
});

router.get("/study-rooms/:id/pins", async (req, res) => {
  const roomId = parseInt(req.params.id);
  const pins = await db.select().from(studyRoomPinsTable).where(eq(studyRoomPinsTable.roomId, roomId)).orderBy(desc(studyRoomPinsTable.createdAt));
  const users = await db.select().from(usersTable);
  const result = pins.map(p => {
    const u = users.find(u => u.id === p.userId);
    return { ...p, authorName: u?.name ?? "Unknown", authorAvatar: u?.avatar ?? "" };
  });
  res.json(result);
});

router.post("/study-rooms/:id/pins", async (req, res) => {
  const roomId = parseInt(req.params.id);
  const { content, pinType } = req.body as { content: string; pinType?: string };
  const [pin] = await db.insert(studyRoomPinsTable).values({ roomId, userId: DEMO_USER_ID, content, pinType: pinType ?? "text" }).returning();
  res.json(pin);
});

export default router;
