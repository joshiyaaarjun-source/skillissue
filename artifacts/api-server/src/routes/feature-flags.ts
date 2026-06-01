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
  { name: "skill_reels", description: "🎬 TikTok-style short skill demo videos", enabled: true, rolloutPercent: 100 },
  { name: "skill_auctions", description: "🔨 Bid credits to win exclusive 1-on-1 sessions", enabled: true, rolloutPercent: 100 },
  { name: "study_rooms", description: "📚 Group study spaces with sprint timer & pinboard", enabled: true, rolloutPercent: 100 },
  { name: "skill_dna", description: "🧬 Radar chart skill fingerprint profile", enabled: true, rolloutPercent: 100 },
  { name: "cold_start_challenges", description: "🚀 Daily onboarding challenges for new users", enabled: true, rolloutPercent: 100 },
  { name: "async_voice_notes", description: "🎙️ Async voice note messages in chat", enabled: true, rolloutPercent: 100 },
  { name: "skill_capsules", description: "💊 3–5 lesson mini-courses from top teachers", enabled: true, rolloutPercent: 100 },
  { name: "reputation_staking", description: "🛡️ Peer vouches with credits at stake", enabled: true, rolloutPercent: 100 },
  { name: "live_drops", description: "🔴 Unplanned live sessions announced in real time", enabled: true, rolloutPercent: 100 },
  { name: "skill_wrapped", description: "✨ Monthly AI-narrated skill stats story", enabled: true, rolloutPercent: 100 },
  { name: "skill_roast", description: "🔥 AI skill roast mode — opt-in brutal feedback", enabled: true, rolloutPercent: 100 },
  { name: "mentorship_tiers", description: "🎓 Formal skill mentorship with weekly credits", enabled: true, rolloutPercent: 100 },
  { name: "skill_forecast", description: "📈 Weekly AI skill market forecast", enabled: true, rolloutPercent: 100 },
  { name: "anon_feedback", description: "🎭 Anonymous session feedback mode", enabled: true, rolloutPercent: 100 },
  { name: "challenges_marketplace", description: "🏆 Post real skill challenges with credit bounties", enabled: true, rolloutPercent: 100 },
  { name: "focus_sprints", description: "⏱️ Pomodoro-style focus sprints in sessions", enabled: true, rolloutPercent: 100 },
  { name: "skill_twin", description: "🧬 AI-matched skill twin finder", enabled: true, rolloutPercent: 100 },
  { name: "earn_by_reviewing", description: "💰 Earn credits by reviewing skill capsules", enabled: true, rolloutPercent: 100 },
  { name: "skill_confessions", description: "🤫 Anonymous skill confession board", enabled: true, rolloutPercent: 100 },
  { name: "partner_streaks", description: "❤️‍🔥 Shared session streaks with frequent partners", enabled: true, rolloutPercent: 100 },
  { name: "skill_stories", description: "✨ 24-hour expiring skill story posts", enabled: true, rolloutPercent: 100 },
  { name: "skill_passport", description: "🛂 Verifiable skill passport — exportable as PDF", enabled: true, rolloutPercent: 100 },
];

async function seedFlagsIfEmpty() {
  const existing = await db.select().from(featureFlagsTable);
  if (existing.length === 0) {
    await db.insert(featureFlagsTable).values(DEFAULT_FLAGS);
    return;
  }
  const existingNames = new Set(existing.map(f => f.name));
  const missing = DEFAULT_FLAGS.filter(f => !existingNames.has(f.name));
  if (missing.length > 0) {
    await db.insert(featureFlagsTable).values(missing);
  }
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
