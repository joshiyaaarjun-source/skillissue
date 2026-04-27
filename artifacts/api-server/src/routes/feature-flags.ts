import { Router, type IRouter } from "express";
import { db, featureFlagsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_FLAGS = [
  { name: "skill_battles", description: "⚔️ AI-powered skill battles arena", enabled: true, rolloutPercent: 100 },
  { name: "micro_lessons", description: "📚 5-minute AI micro-lesson feed", enabled: true, rolloutPercent: 100 },
  { name: "instant_match", description: "⚡ Instant match mode on Explore", enabled: true, rolloutPercent: 100 },
  { name: "portfolio_mode", description: "🗂️ User portfolio showcase on profile", enabled: true, rolloutPercent: 100 },
  { name: "mood_matching", description: "🎭 Mood-based skill matching filter", enabled: true, rolloutPercent: 80 },
  { name: "skill_combos", description: "🔗 Skill combo recommendations on Explore", enabled: true, rolloutPercent: 75 },
  { name: "elite_badge", description: "👑 Elite badge for power users", enabled: true, rolloutPercent: 100 },
  { name: "skill_timeline", description: "📅 Personal skill progress timeline", enabled: true, rolloutPercent: 100 },
  { name: "referral_system", description: "🎁 Refer-a-friend credits program", enabled: true, rolloutPercent: 100 },
  { name: "anti_ghosting", description: "👻 Anti-ghosting nudge system", enabled: true, rolloutPercent: 100 },
  { name: "trust_safety", description: "🛡️ Trust & safety report system", enabled: true, rolloutPercent: 100 },
  { name: "ai_learning_paths", description: "🗺️ AI-generated personalized learning paths", enabled: true, rolloutPercent: 100 },
];

async function seedFlagsIfEmpty() {
  const existing = await db.select().from(featureFlagsTable);
  if (existing.length > 0) return;
  await db.insert(featureFlagsTable).values(DEFAULT_FLAGS);
}

router.get("/flags", async (_req, res): Promise<void> => {
  await seedFlagsIfEmpty();
  const flags = await db.select().from(featureFlagsTable).orderBy(featureFlagsTable.name);
  res.json({ flags });
});

router.patch("/flags/:name", async (req, res): Promise<void> => {
  const { name } = req.params;
  const { enabled, rolloutPercent } = req.body as { enabled?: boolean; rolloutPercent?: number };

  const updates: Partial<typeof featureFlagsTable.$inferInsert> = {};
  if (enabled !== undefined) updates.enabled = enabled;
  if (rolloutPercent !== undefined) updates.rolloutPercent = rolloutPercent;

  const [updated] = await db.update(featureFlagsTable).set(updates).where(eq(featureFlagsTable.name, name)).returning();
  if (!updated) {
    const [inserted] = await db.insert(featureFlagsTable).values({
      name,
      description: req.body.description ?? "",
      enabled: enabled ?? true,
      rolloutPercent: rolloutPercent ?? 100,
    }).returning();
    res.json({ flag: inserted });
    return;
  }
  res.json({ flag: updated });
});

export default router;
