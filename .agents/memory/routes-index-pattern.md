---
name: Routes index.ts write pattern
description: Never use bash append (>>) to add to routes/index.ts — always read + rewrite
---

**Rule:** To add new routers to `artifacts/api-server/src/routes/index.ts`, always read the file first with the read tool, then rewrite the full file. Never use `cat >>` or `echo >>` to append.

**Why:** Appending to an ES module file adds import statements and router.use() calls AFTER the `export default router;` line, which makes TypeScript see them as unreachable code and the compiled bundle won't include the new routers (silent failure — server starts but routes 404).

**How to apply:** Always read → edit/rewrite, never append to any file that has a final `export default` statement.
