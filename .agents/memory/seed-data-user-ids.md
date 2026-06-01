---
name: Seed data user IDs
description: Demo user is ID 1; other users in DB have high IDs (19+) not 2-5
---

**Rule:** Never hardcode user IDs 2, 3, 4, 5 in seed data. Query the actual usersTable and pick `others.filter(u => u.id !== DEMO_USER_ID).slice(0, N)`.

**Why:** Users are created by the app with auto-increment IDs. In this project, the demo user is always ID 1, but secondary demo users end up with IDs 19+ because other tables insert rows before users. Hardcoded IDs 2-5 cause "Unknown" to appear in any UI that looks up a user by ID.

**How to apply:** Any route that seeds demo content with other-user attribution must first query `db.select().from(usersTable)`, filter out DEMO_USER_ID, and use the resulting IDs dynamically.
