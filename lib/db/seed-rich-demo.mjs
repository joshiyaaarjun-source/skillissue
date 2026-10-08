import pg from "pg";

const { Pool } = pg;
const SEED_EMAIL_DOMAIN = "skillissu-demo.example.com";
const DAY_MS = 24 * 60 * 60 * 1000;

const profiles = [
  {
    name: "Ananya Bose",
    bio: "Portrait photographer and weekend trekker. I love helping people feel natural in front of a camera.",
    offered: ["Photography", "Lightroom", "Visual Storytelling"],
    wanted: ["Public Speaking", "finance", "Video Editing"],
    availability: "Weekday Evenings",
    verification: "fully_verified",
  },
  {
    name: "Dev Malhotra",
    bio: "Product manager who makes complicated money decisions feel simple. Always happy to share a spreadsheet.",
    offered: ["finance", "Budgeting", "Excel"],
    wanted: ["Photography", "Public Speaking", "Data Visualization"],
    availability: "Weekends",
    verification: "quiz_passed",
  },
  {
    name: "Sana Merchant",
    bio: "Facilitator and podcast host helping thoughtful people find their voice in a room.",
    offered: ["Public Speaking", "Facilitation", "Storytelling"],
    wanted: ["Photography", "finance", "Presentation Design"],
    availability: "Flexible",
    verification: "fully_verified",
  },
  {
    name: "Ishan Rao",
    bio: "Travel photographer learning to turn a creative practice into a sustainable business.",
    offered: ["Photography", "Mobile Photography", "Lightroom"],
    wanted: ["finance", "Public Speaking", "Copywriting"],
    availability: "Weekday Mornings",
    verification: "quiz_passed",
  },
  {
    name: "Leila Haddad",
    bio: "Personal finance educator and patient Excel tutor. I make budgeting feel less intimidating.",
    offered: ["finance", "Excel", "Personal Budgeting"],
    wanted: ["Photography", "Public Speaking", "Graphic Design"],
    availability: "Weekday Evenings",
    verification: "fully_verified",
  },
  {
    name: "Omar Khan",
    bio: "Community storyteller and debate coach. I can help you shape a clear, confident talk.",
    offered: ["Public Speaking", "Debate", "Storytelling"],
    wanted: ["Photography", "finance", "Video Editing"],
    availability: "Weekends",
    verification: "quiz_passed",
  },
  {
    name: "Maya Chen",
    bio: "Food photographer and recipe developer with a soft spot for natural light and practical lessons.",
    offered: ["Photography", "Food Photography", "Lightroom"],
    wanted: ["Public Speaking", "finance", "Content Writing"],
    availability: "Flexible",
    verification: "fully_verified",
  },
  {
    name: "Noah Williams",
    bio: "Startup operations lead who teaches simple financial planning for freelancers and first-time founders.",
    offered: ["finance", "Bookkeeping", "Excel"],
    wanted: ["Photography", "Public Speaking", "UI Design"],
    availability: "Weekday Evenings",
    verification: "unverified",
  },
  {
    name: "Diya Kapoor",
    bio: "Visual artist documenting city life. I teach phone photography without expensive gear.",
    offered: ["Photography", "Composition", "Visual Storytelling"],
    wanted: ["Public Speaking", "finance", "Illustration"],
    availability: "Weekends",
    verification: "quiz_passed",
  },
  {
    name: "Ethan Brooks",
    bio: "Workshop host and communication coach who believes clear speaking is a learnable skill.",
    offered: ["Public Speaking", "Interview Practice", "Facilitation"],
    wanted: ["Photography", "finance", "Product Management"],
    availability: "Weekday Mornings",
    verification: "fully_verified",
  },
  {
    name: "Zara Ali",
    bio: "Wedding photographer building a more balanced creative business. Let's trade practical skills.",
    offered: ["Photography", "Portrait Lighting", "Lightroom"],
    wanted: ["Public Speaking", "finance", "Marketing"],
    availability: "Flexible",
    verification: "quiz_passed",
  },
  {
    name: "Luca Moretti",
    bio: "Financial analyst by day, amateur street photographer after work. I enjoy teaching both sides.",
    offered: ["finance", "Financial Modeling", "Excel"],
    wanted: ["Photography", "Public Speaking", "Italian"],
    availability: "Weekday Evenings",
    verification: "fully_verified",
  },
  {
    name: "Nisha Verma",
    bio: "Toastmasters regular and nonprofit organizer helping teams tell stories that move people.",
    offered: ["Public Speaking", "Storytelling", "Presentation Design"],
    wanted: ["Photography", "finance", "Figma"],
    availability: "Weekends",
    verification: "quiz_passed",
  },
  {
    name: "Aria Thompson",
    bio: "Nature photographer who loves breaking down camera settings into small, approachable steps.",
    offered: ["Photography", "Nature Photography", "Lightroom"],
    wanted: ["Public Speaking", "finance", "Data Analysis"],
    availability: "Flexible",
    verification: "fully_verified",
  },
  {
    name: "Kabir Shah",
    bio: "Independent consultant teaching personal budgeting, cash flow, and useful spreadsheet habits.",
    offered: ["finance", "Budgeting", "Google Sheets"],
    wanted: ["Photography", "Public Speaking", "Photography Editing"],
    availability: "Weekday Evenings",
    verification: "quiz_passed",
  },
  {
    name: "Priya Menon",
    bio: "Voice and presentation coach. I help people sound like themselves, only more prepared.",
    offered: ["Public Speaking", "Voice Coaching", "Storytelling"],
    wanted: ["Photography", "finance", "Web Design"],
    availability: "Weekday Mornings",
    verification: "fully_verified",
  },
  {
    name: "Samir Qureshi",
    bio: "Documentary photographer and visual journalist interested in honest, human-centered stories.",
    offered: ["Photography", "Photo Editing", "Visual Storytelling"],
    wanted: ["Public Speaking", "finance", "Writing"],
    availability: "Weekends",
    verification: "quiz_passed",
  },
  {
    name: "Grace Kim",
    bio: "Small-business advisor who helps makers understand pricing, budgets, and healthy cash flow.",
    offered: ["finance", "Pricing Strategy", "Excel"],
    wanted: ["Photography", "Public Speaking", "Social Media"],
    availability: "Flexible",
    verification: "fully_verified",
  },
  {
    name: "Ayaan Siddiqui",
    bio: "Debate club mentor and product designer. I make practice sessions relaxed and useful.",
    offered: ["Public Speaking", "Debate", "Product Design"],
    wanted: ["Photography", "finance", "Video Editing"],
    availability: "Weekday Evenings",
    verification: "unverified",
  },
  {
    name: "Elena Rossi",
    bio: "Travel and architecture photographer sharing editing workflows and composition feedback.",
    offered: ["Photography", "Architecture Photography", "Lightroom"],
    wanted: ["Public Speaking", "finance", "Brand Strategy"],
    availability: "Weekends",
    verification: "fully_verified",
  },
  {
    name: "Vikram Sethi",
    bio: "Finance mentor for early-career professionals. I enjoy building simple plans people can stick to.",
    offered: ["finance", "Investing Basics", "Excel"],
    wanted: ["Photography", "Public Speaking", "Podcasting"],
    availability: "Weekday Mornings",
    verification: "quiz_passed",
  },
  {
    name: "Sophia Martinez",
    bio: "Public speaking trainer and community event host. Let's make your next presentation feel easy.",
    offered: ["Public Speaking", "Facilitation", "Interview Practice"],
    wanted: ["Photography", "finance", "Illustration"],
    availability: "Flexible",
    verification: "fully_verified",
  },
  {
    name: "Farah Rahman",
    bio: "Street photographer and visual storyteller collecting little moments from everyday life.",
    offered: ["Photography", "Street Photography", "Mobile Photography"],
    wanted: ["Public Speaking", "finance", "Copywriting"],
    availability: "Weekends",
    verification: "quiz_passed",
  },
  {
    name: "Rhea Desai",
    bio: "Small-business owner sharing practical money systems and learning portrait photography.",
    offered: ["finance", "Small Business Finance", "Bookkeeping"],
    wanted: ["Photography", "Public Speaking", "Branding"],
    availability: "Weekday Evenings",
    verification: "unverified",
  },
];

function profileEmail(index) {
  return `community-${String(index + 1).padStart(2, "0")}@${SEED_EMAIL_DOMAIN}`;
}

function dayAt(anchor, daysAgo, hour = 12) {
  const date = new Date(anchor.getTime() - daysAgo * DAY_MS);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function pickStatus(index) {
  if (index < 14) return "completed";
  if (index < 21) return "active";
  return "pending";
}

async function getOrCreateMatch(client, userAId, userBId, status, createdAt) {
  const [lowerId, higherId] = [userAId, userBId].sort((a, b) => a - b);
  const existing = await client.query(
    `SELECT id, status
       FROM matches
      WHERE (user_a_id = $1 AND user_b_id = $2)
         OR (user_a_id = $2 AND user_b_id = $1)
      LIMIT 1`,
    [userAId, userBId],
  );
  if (existing.rows[0]) return { ...existing.rows[0], inserted: false };

  const inserted = await client.query(
    `INSERT INTO matches (user_a_id, user_b_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $4)
     RETURNING id, status`,
    [lowerId, higherId, status, createdAt],
  );
  return { ...inserted.rows[0], inserted: true };
}

async function getOrCreateExchange(client, match, teacherId, learnerId, teachSkill, learnSkill, status, credits, createdAt) {
  const existing = await client.query(
    `SELECT id, status, teacher_id, learner_id, teach_skill, learn_skill, credits_per_session
       FROM exchanges
      WHERE match_id = $1
      ORDER BY id
      LIMIT 1`,
    [match.id],
  );
  if (existing.rows[0]) return { ...existing.rows[0], inserted: false };

  const inserted = await client.query(
    `INSERT INTO exchanges
       (match_id, teacher_id, learner_id, teach_skill, learn_skill, credits_per_session, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
     RETURNING id, status, teacher_id, learner_id, teach_skill, learn_skill, credits_per_session`,
    [match.id, teacherId, learnerId, teachSkill, learnSkill, credits, status, createdAt],
  );
  return { ...inserted.rows[0], inserted: true };
}

async function addMessage(client, matchId, senderId, text, createdAt) {
  const existing = await client.query(
    `SELECT id FROM messages WHERE match_id = $1 AND sender_id = $2 AND text = $3 LIMIT 1`,
    [matchId, senderId, text],
  );
  if (existing.rows[0]) return false;
  await client.query(
    `INSERT INTO messages (match_id, sender_id, text, created_at) VALUES ($1, $2, $3, $4)`,
    [matchId, senderId, text, createdAt],
  );
  return true;
}

async function addMeeting(client, match, exchange, userId, partner, startedAt, durationSeconds, note) {
  const existing = await client.query(
    `SELECT id FROM sessions
      WHERE match_id = $1 AND user_id = $2 AND partner_id = $3 AND started_at = $4
      LIMIT 1`,
    [match.id, userId, partner.id, startedAt],
  );
  if (existing.rows[0]) return false;

  const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);
  const inserted = await client.query(
    `INSERT INTO sessions
       (match_id, user_id, partner_id, partner_name, partner_avatar, exchange_id, status,
        duration_seconds, credits_earned, started_at, ended_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, $8, $9, $10)
     RETURNING id`,
    [
      match.id,
      userId,
      partner.id,
      partner.name,
      partner.avatar,
      exchange.id,
      durationSeconds,
      userId === exchange.teacher_id ? exchange.credits_per_session : 0,
      startedAt,
      endedAt,
    ],
  );

  const sessionId = inserted.rows[0].id;
  const feedbackText = [
    `Clear, practical examples for ${exchange.teach_skill}.`,
    `A relaxed session with useful next steps for ${exchange.learn_skill}.`,
    `Great pacing and thoughtful feedback throughout.`,
    `I left with a skill I can put to use right away.`,
    `Patient, encouraging, and easy to learn with.`,
  ][(sessionId + userId) % 5];
  const rating = 4 + ((sessionId + userId) % 2);

  await client.query(
    `INSERT INTO session_feedback (session_id, from_user_id, to_user_id, rating, review, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, userId, partner.id, rating, feedbackText, endedAt],
  );

  if (note) {
    const noteText = [
      `Session recap: ${exchange.teach_skill} fundamentals`,
      `Partner notes: ${exchange.learn_skill} practice plan`,
      `Next steps: repeat the exercise and share a short example`,
    ].join("\n");
    await client.query(
      `INSERT INTO session_notes (session_id, user_id, text_notes, strokes, updated_at)
       VALUES ($1, $2, $3, '[]'::jsonb, $4)
       ON CONFLICT (session_id) DO NOTHING`,
      [sessionId, userId, noteText, endedAt],
    );
  }
  return true;
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set before seeding demo data.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  const counts = { profiles: 0, matches: 0, exchanges: 0, messages: 0, meetings: 0 };

  try {
    await client.query("BEGIN");

    const insertedProfiles = [];
    for (const [index, profile] of profiles.entries()) {
      const email = profileEmail(index);
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name)}`;
      const inserted = await client.query(
        `INSERT INTO users
           (name, email, avatar, bio, skills_offered, skills_wanted, skill_tbr, credit_balance,
            credibility_score, total_exchanges, streak_days, longest_streak, xp, level, onboarded,
            availability, verification_status, exchange_count, is_new, last_active_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, $15, $16, $10, $17, NOW())
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [
          profile.name,
          email,
          avatar,
          profile.bio,
          profile.offered,
          profile.wanted,
          ["Data Visualization", "Video Editing", "Illustration"].slice(0, 1 + (index % 3)),
          20 + ((index * 13) % 76),
          Number((4.1 + ((index * 7) % 9) / 10).toFixed(1)),
          4 + ((index * 5) % 25),
          index % 15,
          7 + ((index * 3) % 30),
          180 + ((index * 137) % 2600),
          2 + ((index * 3) % 18),
          profile.availability,
          profile.verification,
          index >= 20,
        ],
      );
      const existing = inserted.rows[0]
        ? inserted.rows[0]
        : (await client.query("SELECT id FROM users WHERE email = $1", [email])).rows[0];
      if (!existing) throw new Error(`Could not find the seeded profile ${email}.`);
      counts.profiles += inserted.rowCount ?? 0;
      insertedProfiles.push({ ...profile, id: existing.id, email, avatar });
    }

    const demoUserResult = await client.query(
      `SELECT id, name, skills_offered, skills_wanted, created_at
         FROM users
        WHERE id = 1
        LIMIT 1`,
    );
    const demoUser = demoUserResult.rows[0];
    if (!demoUser) throw new Error("Expected Skillissu demo profile ID 1 to exist.");

    const anchorResult = await client.query(
      `SELECT MIN(created_at) AS created_at FROM users WHERE email = ANY($1::text[])`,
      [profiles.map((_, index) => profileEmail(index))],
    );
    const anchor = new Date(anchorResult.rows[0].created_at);
    anchor.setUTCHours(0, 0, 0, 0);

    const demoMatches = [];
    for (const [index, profile] of insertedProfiles.entries()) {
      const createdAt = dayAt(anchor, 1 + (index % 24), 13);
      const status = pickStatus(index);
      const match = await getOrCreateMatch(client, demoUser.id, profile.id, status, createdAt);
      if (match.inserted) counts.matches += 1;
      demoMatches.push({ profile, match, index, status });
    }

    const communityMatches = [];
    for (let index = 0; index < insertedProfiles.length; index += 2) {
      const first = insertedProfiles[index];
      const second = insertedProfiles[index + 1];
      if (!second) continue;
      const createdAt = dayAt(anchor, 2 + (index % 18), 15);
      const match = await getOrCreateMatch(client, first.id, second.id, index % 4 === 0 ? "active" : "completed", createdAt);
      if (match.inserted) counts.matches += 1;
      communityMatches.push({ match, first, second, index });
    }

    const demoExchanges = [];
    for (const { profile, match, index, status } of demoMatches) {
      const teachSkill = demoUser.skills_offered[index % Math.max(1, demoUser.skills_offered.length)] ?? "Public Speaking";
      const learnSkill = profile.offered[index % profile.offered.length] ?? profile.offered[0];
      const exchangeStatus = status;
      const createdAt = dayAt(anchor, 1 + (index % 24), 13);
      const exchange = await getOrCreateExchange(
        client,
        match,
        demoUser.id,
        profile.id,
        teachSkill,
        learnSkill,
        exchangeStatus,
        5 + (index % 3) * 5,
        createdAt,
      );
      if (exchange.inserted) counts.exchanges += 1;
      demoExchanges.push({ profile, match, exchange, index });
    }

    for (const { match, first, second, index } of communityMatches) {
      const teacher = index % 4 === 0 ? second : first;
      const learner = teacher.id === first.id ? second : first;
      const createdAt = dayAt(anchor, 2 + (index % 18), 15);
      const exchange = await getOrCreateExchange(
        client,
        match,
        teacher.id,
        learner.id,
        teacher.offered[0],
        learner.offered[0],
        index % 4 === 0 ? "active" : "completed",
        5 + ((index + 1) % 3) * 5,
        createdAt,
      );
      if (exchange.inserted) counts.exchanges += 1;
    }

    const conversationLines = (profile, index) => [
      { senderId: profile.id, text: `Hi! I'd love to learn ${demoUser.skills_offered[index % demoUser.skills_offered.length]}—could we start with a few basics?` },
      { senderId: demoUser.id, text: `Absolutely, ${profile.name.split(" ")[0]}. I can put together a short practice session.` },
      { senderId: profile.id, text: `That sounds great. I can also show you my approach to ${profile.offered[index % profile.offered.length]}.` },
      { senderId: demoUser.id, text: "Perfect. Let's make it a proper skill swap and compare notes afterward." },
    ];

    for (const { profile, match, index } of demoMatches) {
      const lines = conversationLines(profile, index);
      for (const [lineIndex, line] of lines.entries()) {
        const sentAt = dayAt(anchor, 1 + (index % 20), 9 + lineIndex);
        if (await addMessage(client, match.id, line.senderId, line.text, sentAt)) counts.messages += 1;
      }
    }

    let demoMeetingIndex = 0;
    for (const { profile, match, exchange, index } of demoExchanges) {
      if (exchange.status !== "completed") continue;
      const repeats = index < 8 ? 2 : 1;
      for (let round = 0; round < repeats; round += 1) {
        const startedAt = dayAt(anchor, 1 + (demoMeetingIndex * 2) + (round * 23), 10 + (round % 3));
        const durationSeconds = 35 * 60 + ((index * 11 + round * 17) % 56) * 60;
        if (await addMeeting(
          client,
          match,
          exchange,
          demoUser.id,
          profile,
          startedAt,
          durationSeconds,
          (demoMeetingIndex + round) % 2 === 0,
        )) {
          counts.meetings += 1;
        }
      }
      demoMeetingIndex += 1;
    }

    for (const { match, first, second, index } of communityMatches) {
      if (index % 4 === 0) continue;
      const exchangeResult = await client.query(
        `SELECT id, teacher_id, learner_id, teach_skill, learn_skill, credits_per_session
           FROM exchanges
          WHERE match_id = $1
          LIMIT 1`,
        [match.id],
      );
      const exchange = exchangeResult.rows[0];
      if (!exchange) continue;
      const teacher = exchange.teacher_id === first.id ? first : second;
      const learner = teacher.id === first.id ? second : first;
      const startedAt = dayAt(anchor, 2 + index * 2, 16);
      if (await addMeeting(client, match, exchange, teacher.id, learner, startedAt, 45 * 60, index % 4 === 2)) {
        counts.meetings += 1;
      }
    }

    await client.query("COMMIT");
    console.log(
      `Demo dataset ready: ${profiles.length} community profiles; ${counts.matches} new matches; ` +
      `${counts.exchanges} new exchanges; ${counts.meetings} new completed meetings; ${counts.messages} new chat messages.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Demo dataset seeding failed:", error);
  process.exitCode = 1;
});
