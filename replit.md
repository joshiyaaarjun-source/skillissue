# Skillissu

## Overview

A peer-to-peer skill exchange platform where users trade skills using a credit-based system with Tinder-style swipe matching.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/skillissu) — served at /
- **API framework**: Express 5 (artifacts/api-server) — served at /api
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Animations**: framer-motion
- **Charts**: recharts

## Features

### AI Nudges System
- Rule-based nudge engine in `artifacts/api-server/src/routes/nudges.ts`
- Triggers: unused_credits, skill_match, streak_reminder, goal_progress, new_match
- Returns 1-3 relevant nudges based on user state

### Push Notifications (3 Tones)
- **Soft tease**: gentle, informative messages
- **Playful roast**: witty, slightly sarcastic
- **Encouraging hype**: high energy motivation
- For: match, credit_earned, credit_spent, inactivity, goal_progress
- Route: `GET /api/notifications`

### Gamification
- Streak system (daily tracking)
- Badges: First Skill Taught, 5 Exchanges Completed, 7-Day Streak, Credit Collector, Skill Master
- XP system: earn 50 XP per completed exchange
- Level = floor(XP / 100) + 1
- Route: `GET /api/gamification/me`

### Analytics
- Total exchanges, credits earned/spent, skills learned/taught
- Monthly exchange counts (bar chart)
- Top skills leaderboard
- Route: `GET /api/analytics/me`

### Demo Magic Features
- "It's a match" full-screen overlay animation on mutual right-swipe
- Animated credit counter (counts from 0 to balance on dashboard mount)
- Skill overlap highlighting (glowing tags in explore cards)
- Fake real-time notification banner (appears after 3s, auto-dismisses)
- Smooth swipe card animations with framer-motion

## Colour Scheme
- Primary: #4d0011 (deep crimson)
- Light accent: #ffd9d9 (blush pink)
- Notifications: #102b1f (deep forest green)
- Secondary: #bd7880 (muted rose)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/skillissu run dev` — run frontend locally

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/healthz | Health check |
| GET | /api/users/me | Current user profile |
| GET | /api/users/explore | Users to swipe through |
| GET | /api/users/:userId | User by ID |
| POST | /api/swipe | Record swipe, detect match |
| GET | /api/matches | All matches |
| POST | /api/exchange | Create skill exchange |
| GET | /api/exchange | Recent exchanges |
| POST | /api/exchange/:id/complete | Complete exchange |
| GET | /api/credits | Credit balance + history |
| GET | /api/gamification/me | Streaks, badges, XP |
| GET | /api/nudges | AI nudge suggestions |
| GET | /api/notifications | Push notifications |
| GET | /api/analytics/me | Usage analytics |
| GET | /api/ledger | Immutable exchange ledger |

## Database Tables

- `users` — user profiles with skills, credits, streaks, XP
- `swipes` — swipe history (prevents duplicates, triggers matches)
- `matches` — mutual right-swipe pairs
- `exchanges` — skill exchange sessions
- `credit_transactions` — immutable credit ledger
- `badges` — per-user badge progress
- `ledger` — event log (MATCH_CREATED, EXCHANGE_COMPLETED, CREDITS_UPDATED)
- `monthly_goals` — user monthly learning goals
- `skill_progress` — per-skill progress tracking

## Demo User

User ID 1: Alex Rivera (alex@skillissu.app)
- Offers: React, TypeScript, Node.js, GraphQL
- Wants: UI Design, Figma, Python
- Pre-matched with: Maya Patel (#2), Priya Sharma (#5)
