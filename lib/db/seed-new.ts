import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./src/schema";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const {
  usersTable,
  matchesTable,
  exchangesTable,
  badgesTable,
  monthlyGoalsTable,
  skillProgressTable,
  messagesTable,
  skillVerificationsTable,
} = schema;

async function seed() {
  console.log("Seeding database with new users and chat messages...");

  // 1. Delete all users except user 1 (Alex Rivera)
  const allUsers = await db.select().from(usersTable);
  const usersToDelete = allUsers.filter(u => u.id !== 1);
  for (const u of usersToDelete) {
    await db.delete(usersTable).where(eq(usersTable.id, u.id));
  }

  // 2. Update Alex Rivera (user 1)
  await db.update(usersTable).set({
    name: "Alex Rivera",
    email: "alex@skillissu.dev",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Full-stack dev by day, aspiring illustrator by night.",
    skillsOffered: ["React", "TypeScript", "Node.js"],
    skillsWanted: ["UI Design", "Illustration", "Figma"],
    skillTBR: ["Machine Learning", "GraphQL"],
    creditBalance: 85,
    credibilityScore: 4.8,
    totalExchanges: 12,
    streakDays: 7,
    longestStreak: 14,
    xp: 1250,
    level: 5,
    onboarded: true,
    availability: "Weekday Evenings",
    verificationStatus: "quiz_passed",
    exchangeCount: 12,
    isNew: false,
  }).where(eq(usersTable.id, 1));

  // 3. Create 6 new mock users
  const newUsersData = [
    {
      name: "Aisha Khan",
      email: "aisha@skillissu.dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha",
      bio: "UX designer who codes. I turn caffeine into Figma frames.",
      skillsOffered: ["UI Design", "Figma", "Animation"],
      skillsWanted: ["React", "TypeScript"],
      skillTBR: ["Node.js"],
      creditBalance: 60,
      credibilityScore: 4.9,
      totalExchanges: 18,
      streakDays: 14,
      longestStreak: 21,
      xp: 2100,
      level: 7,
      onboarded: true,
      availability: "Weekends",
      verificationStatus: "fully_verified",
      exchangeCount: 18,
      isNew: false,
    },
    {
      name: "Rohan Iyer",
      email: "rohan@skillissu.dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=rohan",
      bio: "ML engineer and aspiring writer. Python is my first language.",
      skillsOffered: ["Machine Learning", "Python", "Data Analysis"],
      skillsWanted: ["UI Design", "Public Speaking"],
      skillTBR: ["Figma"],
      creditBalance: 45,
      credibilityScore: 4.7,
      totalExchanges: 9,
      streakDays: 5,
      longestStreak: 12,
      xp: 890,
      level: 4,
      onboarded: true,
      availability: "Weekday Mornings",
      verificationStatus: "quiz_passed",
      exchangeCount: 9,
      isNew: false,
    },
    {
      name: "Meera Nair",
      email: "meera@skillissu.dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=meera",
      bio: "Frontend dev, ex-journalist. I write clean code and clear copy.",
      skillsOffered: ["Writing", "Copywriting", "React"],
      skillsWanted: ["Machine Learning", "GraphQL"],
      skillTBR: ["DevOps"],
      creditBalance: 75,
      credibilityScore: 4.6,
      totalExchanges: 7,
      streakDays: 3,
      longestStreak: 8,
      xp: 640,
      level: 3,
      onboarded: true,
      availability: "Flexible",
      verificationStatus: "unverified",
      exchangeCount: 7,
      isNew: false,
    },
    {
      name: "Arjun Patel",
      email: "arjun@skillissu.dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun",
      bio: "DevOps wizard who wants to level up his presentation skills.",
      skillsOffered: ["DevOps", "Node.js", "GraphQL"],
      skillsWanted: ["Public Speaking", "UI Design"],
      skillTBR: ["Mobile Dev"],
      creditBalance: 90,
      credibilityScore: 4.5,
      totalExchanges: 21,
      streakDays: 10,
      longestStreak: 28,
      xp: 2800,
      level: 9,
      onboarded: true,
      availability: "Weekday Evenings",
      verificationStatus: "fully_verified",
      exchangeCount: 21,
      isNew: false,
    },
    {
      name: "Kavya Sharma",
      email: "kavya@skillissu.dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kavya",
      bio: "Illustrator and animator bringing art to the digital age.",
      skillsOffered: ["Illustration", "Animation", "Marketing"],
      skillsWanted: ["React", "TypeScript", "Node.js"],
      skillTBR: ["Figma"],
      creditBalance: 55,
      credibilityScore: 5.0,
      totalExchanges: 3,
      streakDays: 1,
      longestStreak: 5,
      xp: 280,
      level: 2,
      onboarded: true,
      availability: "Weekends",
      verificationStatus: "unverified",
      exchangeCount: 3,
      isNew: true,
    },
    {
      name: "Daniel Joseph",
      email: "daniel@skillissu.dev",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=daniel",
      bio: "Public speaker and storyteller learning tech one step at a time.",
      skillsOffered: ["Public Speaking", "Writing", "Marketing"],
      skillsWanted: ["Python", "Data Analysis", "Machine Learning"],
      skillTBR: ["React"],
      creditBalance: 30,
      credibilityScore: 4.8,
      totalExchanges: 5,
      streakDays: 2,
      longestStreak: 7,
      xp: 420,
      level: 2,
      onboarded: true,
      availability: "Flexible",
      verificationStatus: "quiz_passed",
      exchangeCount: 5,
      isNew: true,
    },
  ];

  const insertedUsers: { id: number; name: string }[] = [];
  for (const userData of newUsersData) {
    const [u] = await db.insert(usersTable).values(userData).returning({ id: usersTable.id, name: usersTable.name });
    insertedUsers.push(u);
    console.log(`Created user: ${u.name} (id: ${u.id})`);
  }

  const aishaId = insertedUsers[0].id;
  const rohanId = insertedUsers[1].id;

  // 4. Delete old matches and create new ones
  await db.delete(matchesTable);

  const [matchAisha] = await db.insert(matchesTable).values({
    userAId: 1,
    userBId: aishaId,
    status: "active",
  }).returning();
  console.log(`Match created: Alex <> Aisha (match id: ${matchAisha.id})`);

  const [matchRohan] = await db.insert(matchesTable).values({
    userAId: 1,
    userBId: rohanId,
    status: "active",
  }).returning();
  console.log(`Match created: Alex <> Rohan (match id: ${matchRohan.id})`);

  // 5. Seed preloaded chat messages
  await db.delete(messagesTable);

  const aishaMessages = [
    { matchId: matchAisha.id, senderId: aishaId, text: "Hey Alex! Saw you teach React. I've been wanting to level up my component architecture." },
    { matchId: matchAisha.id, senderId: 1, text: "Hey Aisha! Yes! And I've been dying to improve my Figma skills. Looks like a perfect match." },
    { matchId: matchAisha.id, senderId: aishaId, text: "We swiped right... on skills. Ha, this platform got us." },
    { matchId: matchAisha.id, senderId: 1, text: "Haha exactly. Want to do an hour each? I'll teach you React hooks, you show me auto-layout?" },
    { matchId: matchAisha.id, senderId: aishaId, text: "Done! I'm free Saturday mornings. Does that work?" },
    { matchId: matchAisha.id, senderId: 1, text: "Perfect. I'll set up a Zoom link and send over some prep material." },
    { matchId: matchAisha.id, senderId: aishaId, text: "Amazing. So excited for this exchange!" },
  ];

  for (const msg of aishaMessages) {
    await db.insert(messagesTable).values(msg);
  }

  const rohanMessages = [
    { matchId: matchRohan.id, senderId: rohanId, text: "Alex! I've been meaning to get into UI Design but no idea where to start." },
    { matchId: matchRohan.id, senderId: 1, text: "Rohan! I can help with that. And honestly, your ML skills are exactly what I need right now." },
    { matchId: matchRohan.id, senderId: rohanId, text: "Deal. Let's schedule something this week?" },
  ];

  for (const msg of rohanMessages) {
    await db.insert(messagesTable).values(msg);
  }

  console.log("Chat messages seeded successfully.");

  // 6. Monthly goals for Alex
  await db.delete(monthlyGoalsTable).where(eq(monthlyGoalsTable.userId, 1));
  await db.insert(monthlyGoalsTable).values([
    { userId: 1, title: "Complete 3 React sessions", progress: 2, target: 3 },
    { userId: 1, title: "Earn 50 credits", progress: 35, target: 50 },
    { userId: 1, title: "Learn Figma basics", progress: 1, target: 4 },
  ]);

  // 7. Skill progress for Alex
  await db.delete(skillProgressTable).where(eq(skillProgressTable.userId, 1));
  await db.insert(skillProgressTable).values([
    { userId: 1, skill: "React", status: "completed", progress: 100 },
    { userId: 1, skill: "TypeScript", status: "completed", progress: 100 },
    { userId: 1, skill: "UI Design", status: "in_progress", progress: 45 },
    { userId: 1, skill: "Figma", status: "in_progress", progress: 20 },
    { userId: 1, skill: "Illustration", status: "to_start", progress: 0 },
  ]);

  // 8. Badges for Alex
  await db.delete(badgesTable).where(eq(badgesTable.userId, 1));
  await db.insert(badgesTable).values([
    { userId: 1, name: "First Exchange", description: "Completed your first skill exchange", icon: "star", earned: true, xpGained: 100 },
    { userId: 1, name: "Streak Starter", description: "Maintained a 7-day streak", icon: "flame", earned: true, xpGained: 200 },
    { userId: 1, name: "Verified Teacher", description: "Passed a skill verification quiz", icon: "award", earned: true, xpGained: 300 },
    { userId: 1, name: "Social Butterfly", description: "Matched with 5 people", icon: "users", earned: false, xpGained: 0 },
    { userId: 1, name: "Skill Master", description: "Complete 10 exchanges", icon: "trophy", earned: false, xpGained: 0 },
  ]);

  // 9. Active exchange between Alex and Aisha
  await db.delete(exchangesTable);
  await db.insert(exchangesTable).values({
    matchId: matchAisha.id,
    teacherId: 1,
    learnerId: aishaId,
    teachSkill: "React",
    learnSkill: "UI Design",
    creditsPerSession: 10,
    status: "active",
  });

  // 10. Verification for Alex
  await db.delete(skillVerificationsTable);
  await db.insert(skillVerificationsTable).values({
    userId: 1,
    skill: "React",
    quizPassed: true,
    docUploaded: false,
    status: "quiz_passed",
  });

  console.log("All data seeded successfully!");
  await pool.end();
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
