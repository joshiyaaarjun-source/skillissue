---
name: Zod barrel duplicate exports fix
description: After codegen, api-zod barrel must only export from one source to avoid TS2308
---

**Rule:** `lib/api-zod/src/index.ts` must only contain `export * from "./generated/api";` — do NOT also export `./generated/types`.

**Why:** Orval codegen produces both `generated/api.ts` (Zod schemas) and `generated/types.ts` (TS types). Both export the same names, so re-exporting both from the barrel causes `TS2308: has already exported a member named X`. This blocks `pnpm run typecheck:libs`.

**How to apply:** After any codegen run, if typecheck:libs fails with TS2308, check lib/api-zod/src/index.ts and remove the `./generated/types` export line.
