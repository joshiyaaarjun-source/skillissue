import { Router, type IRouter } from "express";
import { db, messagesTable, matchesTable, usersTable } from "@workspace/db";
import { eq, asc, desc, or } from "drizzle-orm";
import { GetChatMessagesParams, SendChatMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

router.get("/chat/list", async (req, res): Promise<void> => {
  const allMatches = await db.select().from(matchesTable).where(
    or(eq(matchesTable.userAId, DEMO_USER_ID), eq(matchesTable.userBId, DEMO_USER_ID))
  );

  const result = await Promise.all(allMatches.map(async (match) => {
    const partnerId = match.userAId === DEMO_USER_ID ? match.userBId : match.userAId;
    const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
    if (!partner) return null;

    const lastMsgRows = await db.select().from(messagesTable)
      .where(eq(messagesTable.matchId, match.id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);

    const lastMessage = lastMsgRows[0];

    return {
      matchId: String(match.id),
      partner: {
        id: String(partner.id),
        name: partner.name,
        avatar: partner.avatar,
        bio: partner.bio || "",
        skillsOffered: partner.skillsOffered,
        skillsWanted: partner.skillsWanted,
        credits: partner.creditBalance,
        credibilityScore: partner.credibilityScore,
        matchScore: 85,
        overlappingSkills: [],
        verificationStatus: (partner.verificationStatus as "unverified" | "partial" | "fully_verified") || "unverified",
        exchangeCount: partner.exchangeCount || 0,
        isNew: partner.isNew || false,
      },
      lastMessage: lastMessage?.text || "Start the conversation!",
      lastMessageAt: lastMessage?.createdAt?.toISOString() || new Date().toISOString(),
      unreadCount: 0,
    };
  }));

  res.json(result.filter(Boolean));
});

router.get("/chat/:matchId/messages", async (req, res): Promise<void> => {
  const params = GetChatMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const matchId = parseInt(params.data.matchId, 10);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const partnerId = match.userAId === DEMO_USER_ID ? match.userBId : match.userAId;
  const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));

  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.matchId, matchId))
    .orderBy(asc(messagesTable.createdAt));

  res.json(messages.map(m => ({
    id: String(m.id),
    matchId: String(m.matchId),
    senderId: String(m.senderId),
    senderName: m.senderId === DEMO_USER_ID ? (me?.name || "You") : (partner?.name || "Partner"),
    text: m.text,
    isMine: m.senderId === DEMO_USER_ID,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/chat/:matchId/messages", async (req, res): Promise<void> => {
  const params = GetChatMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendChatMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const matchId = parseInt(params.data.matchId, 10);
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));

  const [msg] = await db.insert(messagesTable).values({
    matchId,
    senderId: DEMO_USER_ID,
    text: body.data.text,
  }).returning();

  res.json({
    id: String(msg.id),
    matchId: String(msg.matchId),
    senderId: String(msg.senderId),
    senderName: me?.name || "You",
    text: msg.text,
    isMine: true,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
