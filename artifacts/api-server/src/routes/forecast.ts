import { Router, type IRouter } from "express";
import { db, skillForecastsTable, exchangesTable, usersTable } from "@workspace/db";
import { eq, gte } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

const anthropic = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

function getWeekOf(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

async function buildForecast(user: { skillsOffered: string[]; skillsWanted: string[] }) {
  const SKILLS = ["React", "TypeScript", "Python", "Figma", "Node.js", "GraphQL", "UI Design", "Data Science", "Vue", "Swift"];
  const forecasts = SKILLS.map(skill => ({
    skill,
    trend: Math.random() > 0.5 ? "rising" : "falling",
    changePercent: Math.round((Math.random() * 30 - 10) * 10) / 10,
    volume: Math.floor(Math.random() * 50) + 10,
  }));

  const relevant = [...user.skillsOffered, ...user.skillsWanted];
  const sorted = [...forecasts].sort((a, b) => {
    const aRel = relevant.some(s => a.skill.toLowerCase().includes(s.toLowerCase())) ? 1 : 0;
    const bRel = relevant.some(s => b.skill.toLowerCase().includes(s.toLowerCase())) ? 1 : 0;
    return bRel - aRel || Math.abs(b.changePercent) - Math.abs(a.changePercent);
  });

  let aiSummary = "";
  try {
    const rising = sorted.filter(f => f.trend === "rising").slice(0, 3).map(f => f.skill).join(", ");
    const falling = sorted.filter(f => f.trend === "falling").slice(0, 2).map(f => f.skill).join(", ");
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 100,
      messages: [{ role: "user", content: `Write a 1-sentence witty "skill market forecast" summary. Rising: ${rising}. Cooling: ${falling}. Max 25 words.` }]
    });
    aiSummary = (msg.content[0] as { type: string; text: string }).text.trim();
  } catch {
    aiSummary = "React and TypeScript continue their dominance while UI Design heats up for the week ahead.";
  }

  return { forecasts: sorted.slice(0, 8), aiSummary };
}

router.get("/forecast", async (_req, res): Promise<void> => {
  const weekOf = getWeekOf();
  const existing = await db.select().from(skillForecastsTable).where(eq(skillForecastsTable.weekOf, weekOf));
  if (existing.length > 0) {
    const data = existing[0];
    res.json({ weekOf: data.weekOf, aiSummary: data.aiSummary, forecasts: data.forecastData as unknown[] });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  const { forecasts, aiSummary } = await buildForecast(user ?? { skillsOffered: [], skillsWanted: [] });

  const [saved] = await db.insert(skillForecastsTable).values({ weekOf, forecastData: forecasts, aiSummary }).returning();
  res.json({ weekOf: saved.weekOf, aiSummary: saved.aiSummary, forecasts: saved.forecastData as unknown[] });
});

export default router;
