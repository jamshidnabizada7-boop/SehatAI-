# Regression Test Baseline - 2026-10-08

## Overview
This document records the results of the complete regression suite executed on the `production-activation` branch in `D:\SehatAI-UNIFIED`.

**🚨 CRITICAL FAILURE 🚨: The production build failed due to a TypeScript error in `test-storage.ts`, contradicting the previously reported passing status.**

---

## 1. TypeScript Check
**Command:** `bun run typecheck`
**Exit Code:** 0
**Result:** 0 TS errors.
**Status:** ✅ PASS
**Matches Previous:** Yes (Reported 0 TS errors)
**Output:**
```
$ tsc --noEmit
```

## 2. Lint
**Command:** `bun run lint`
**Exit Code:** 0
**Result:** 0 lint errors.
**Status:** ✅ PASS
**Matches Previous:** Yes (Reported 0 lint errors)
**Output:**
```
$ eslint .
[BABEL] Note: The code generator has deoptimised the styling of D:\SehatAI-UNIFIED\src\data\corpus.ts as it exceeds the max of 500KB.
```

## 3. Prisma Validate + Generate
**Command:** `npx prisma validate` then `npx prisma generate`
*(Executed sequentially due to PowerShell syntax limitations with `&&`)*
**Exit Code:** 0
**Status:** ✅ PASS
**Matches Previous:** Yes
**Output:**
```
npm notice run prisma validate
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
The schema at prisma\schema.prisma is valid 🚀

npm notice run prisma generate
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client (v6.19.2) to .\node_modules\@prisma\client in 493ms
```

## 4. Safety Tests
**Command:** `bun test tests/tests/safety/`
**Exit Code:** 0
**Result:** 565 pass / 0 fail
**Status:** ✅ PASS
**Matches Previous:** Yes (Reported 565/565 safety)

## 5. Care Connect Tests
**Command:** `bun test tests/care/`
**Exit Code:** 0
**Result:** 66 pass / 0 fail
**Status:** ✅ PASS
**Matches Previous:** Yes (Reported 66/66 care)

## 6. Security Red-Team Tests
**Command:** `bun test tests/security/`
**Exit Code:** 0
**Result:** 18 pass / 0 fail
**Status:** ✅ PASS
**Matches Previous:** Yes (Reported 18/18 security)

## 7. Care Smoke Test
**Command:** `npx tsx tests/care/care-smoke.ts`
**Exit Code:** 0
**Status:** ✅ PASS
**Matches Previous:** Yes

## 8. Production Build
**Command:** `$env:DOCKER_BUILD="1"; bun run build`
**Exit Code:** 1
**Status:** 🚨 **FAIL**
**Matches Previous:** ❌ **NO (Previously reported 94/94 build routes passing)**
**Error Output:**
```
Failed to compile.

./test-storage.ts:9:32
Type error: Expected 3 arguments, but got 2.

   7 |   // Test put/get
   8 |   const data = Buffer.from('hello world');
>  9 |   const stored = await storage.put('test/safe-key.txt', data);
     |                                ^
  10 |   console.log('Stored key:', stored.storageKey);
  11 |
  12 |   const getBack = await storage.get(stored.storageKey);
Next.js build worker exited with code: 1 and signal: null
error: script "build" exited with code 1
```
