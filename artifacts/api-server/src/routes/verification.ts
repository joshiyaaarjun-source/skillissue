import { Router, type IRouter } from "express";
import { db, skillVerificationsTable, verificationDocsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { GenerateQuizBody, SubmitQuizBody, UploadVerificationDocBody } from "@workspace/api-zod";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

function getAnthropicClient() {
  return new Anthropic({
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  });
}

router.post("/verification/quiz", async (req, res): Promise<void> => {
  const body = GenerateQuizBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { skill } = body.data;

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Generate exactly 3 multiple-choice quiz questions to verify someone's skill in "${skill}". 
Each question should have 4 options (A, B, C, D) and one correct answer.
Respond ONLY with valid JSON in this exact format (no extra text before or after):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    },
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2
    },
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1
    }
  ]
}`
        }
      ]
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);

    res.json({ skill, questions: parsed.questions });
  } catch (error) {
    console.error("Quiz generation error:", error);
    res.json({
      skill,
      questions: [
        {
          question: `What is a core concept in ${skill}?`,
          options: ["Abstraction", "Memorization", "Repetition", "None of the above"],
          correctIndex: 0,
        },
        {
          question: `Which best describes a practitioner of ${skill}?`,
          options: ["Someone with theoretical knowledge only", "Someone who applies it practically", "A complete beginner", "A theorist"],
          correctIndex: 1,
        },
        {
          question: `What helps most when improving ${skill}?`,
          options: ["Reading books only", "Watching videos only", "Practicing regularly with feedback", "Avoiding mistakes"],
          correctIndex: 2,
        },
      ],
    });
  }
});

router.post("/verification/quiz/submit", async (req, res): Promise<void> => {
  const body = SubmitQuizBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { skill, answers, questions } = body.data;
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) score++;
  });

  const passed = score >= 2;

  if (passed) {
    const existing = await db.select().from(skillVerificationsTable)
      .where(and(eq(skillVerificationsTable.userId, DEMO_USER_ID), eq(skillVerificationsTable.skill, skill)));

    if (existing.length > 0) {
      await db.update(skillVerificationsTable)
        .set({ quizPassed: true, status: existing[0].docUploaded ? "fully_verified" : "quiz_passed" })
        .where(and(eq(skillVerificationsTable.userId, DEMO_USER_ID), eq(skillVerificationsTable.skill, skill)));
    } else {
      await db.insert(skillVerificationsTable).values({
        userId: DEMO_USER_ID,
        skill,
        quizPassed: true,
        docUploaded: false,
        status: "quiz_passed",
      });
    }
  }

  res.json({
    passed,
    score,
    total: questions.length,
    skill,
    message: passed
      ? `You passed! ${score}/${questions.length} correct. Your skill has been verified!`
      : `You scored ${score}/${questions.length}. You need 2/3 to pass. Try again!`,
  });
});

router.post("/verification/upload", async (req, res): Promise<void> => {
  const body = UploadVerificationDocBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { skill, docName, docType } = body.data;

  const [doc] = await db.insert(verificationDocsTable).values({
    userId: DEMO_USER_ID,
    skill,
    docName,
    docType,
    status: "pending",
  }).returning();

  const existing = await db.select().from(skillVerificationsTable)
    .where(and(eq(skillVerificationsTable.userId, DEMO_USER_ID), eq(skillVerificationsTable.skill, skill)));

  if (existing.length > 0) {
    await db.update(skillVerificationsTable)
      .set({ docUploaded: true, status: existing[0].quizPassed ? "fully_verified" : "unverified" })
      .where(and(eq(skillVerificationsTable.userId, DEMO_USER_ID), eq(skillVerificationsTable.skill, skill)));
  } else {
    await db.insert(skillVerificationsTable).values({
      userId: DEMO_USER_ID,
      skill,
      quizPassed: false,
      docUploaded: true,
      status: "unverified",
    });
  }

  res.json({
    id: String(doc.id),
    skill: doc.skill,
    docName: doc.docName,
    docType: doc.docType,
    status: doc.status,
    uploadedAt: doc.uploadedAt.toISOString(),
  });
});

router.get("/verification/status", async (req, res): Promise<void> => {
  const verifications = await db.select().from(skillVerificationsTable)
    .where(eq(skillVerificationsTable.userId, DEMO_USER_ID));

  res.json(verifications.map(v => ({
    skill: v.skill,
    quizPassed: v.quizPassed,
    docUploaded: v.docUploaded,
    status: v.status as "unverified" | "quiz_passed" | "fully_verified",
  })));
});

export default router;
