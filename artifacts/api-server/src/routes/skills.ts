import { Router, type IRouter } from "express";
import { db, exchangesTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

// GET /skills/demand
// Computes demand level for all skills based on exchange frequency
router.get("/skills/demand", async (req, res): Promise<void> => {
  // Count skill appearances across all exchanges (teach + learn columns)
  const allExchanges = await db.select({
    teachSkill: exchangesTable.teachSkill,
    learnSkill: exchangesTable.learnSkill,
  }).from(exchangesTable);

  // Count frequency of each skill across all exchanges
  const freq: Record<string, number> = {};
  for (const ex of allExchanges) {
    if (ex.teachSkill) freq[ex.teachSkill] = (freq[ex.teachSkill] ?? 0) + 1;
    if (ex.learnSkill) freq[ex.learnSkill] = (freq[ex.learnSkill] ?? 0) + 1;
  }

  // Also collect skills from user profiles (teachSkills / learnSkills arrays)
  const allUsers = await db.select({
    skillsOffered: usersTable.skillsOffered,
    skillsWanted: usersTable.skillsWanted,
  }).from(usersTable);

  const interestFreq: Record<string, number> = {};
  for (const user of allUsers) {
    const allSkills = [...(user.skillsOffered ?? []), ...(user.skillsWanted ?? [])];
    for (const skill of allSkills) {
      interestFreq[skill] = (interestFreq[skill] ?? 0) + 1;
    }
  }

  // Combine: exchange count is weighted 3x, interest count 1x
  const allSkillNames = new Set([...Object.keys(freq), ...Object.keys(interestFreq)]);
  const combined: Record<string, number> = {};
  for (const skill of allSkillNames) {
    combined[skill] = (freq[skill] ?? 0) * 3 + (interestFreq[skill] ?? 0);
  }

  // Sort by frequency to determine thresholds dynamically
  const sorted = Object.entries(combined).sort((a, b) => b[1] - a[1]);
  const total = sorted.length;

  const result = sorted.map(([skill, count], idx) => {
    let level: "high" | "rising" | "low";
    if (idx < total * 0.25) level = "high";
    else if (idx < total * 0.6) level = "rising";
    else level = "low";
    return { skill, level, count };
  });

  res.json(result);
});

export default router;
