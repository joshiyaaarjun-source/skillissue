import { Router, type IRouter } from "express";
import { db, voiceNotesTable, usersTable, messagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

async function transcribeAudio(mockContext: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Simulate a realistic voice note transcript for a skill exchange app. The note is about: "${mockContext}". Write 1-3 natural sentences as if spoken aloud. Keep it casual and authentic.`
      }]
    });
    return (msg.content[0] as { type: string; text: string }).text.trim();
  } catch {
    return "Voice note transcript unavailable.";
  }
}

router.get("/voice-notes/:chatId", async (req, res) => {
  const chatId = parseInt(req.params.chatId);
  const notes = await db.select().from(voiceNotesTable).where(eq(voiceNotesTable.chatId, chatId)).orderBy(desc(voiceNotesTable.createdAt));
  const users = await db.select().from(usersTable);
  const result = notes.map(n => {
    const sender = users.find(u => u.id === n.senderId);
    return { ...n, senderName: sender?.name ?? "Unknown", senderAvatar: sender?.avatar ?? "" };
  });
  res.json(result);
});

router.post("/voice-notes/:chatId", async (req, res) => {
  const chatId = parseInt(req.params.chatId);
  const { audioData, duration, context } = req.body as { audioData: string; duration: number; context?: string };

  const [note] = await db.insert(voiceNotesTable).values({
    chatId, senderId: DEMO_USER_ID,
    audioData: audioData ?? "",
    duration: duration ?? 0,
    transcriptStatus: "processing",
  }).returning();

  const transcript = await transcribeAudio(context ?? "skill exchange conversation");
  await db.update(voiceNotesTable).set({ transcript, transcriptStatus: "done" }).where(eq(voiceNotesTable.id, note.id));

  res.json({ ...note, transcript, transcriptStatus: "done" });
});

export default router;
