---
story_id: "14.1"
story_key: "14-1-pnpm-monorepo-shared-package"
epic: "Epic 14 — Foundation & Monorepo (mobile)"
status: done
created: 2026-07-15
baseline_revision: 6b396f0ad5c81b2547c101d8d45a932a985f13b2
final_revision: a7cc911bf30f80fdc10646916254630dca9e8877
followup_review_recommended: false
inputs:
  - _bmad-output/planning-artifacts/epics-growbase-mobile.md
  - _bmad-output/specs/spec-growbase-mobile/SPEC.md
  - _bmad-output/planning-artifacts/architecture/architecture-growbase-mobile-2026-07-15/ARCHITECTURE-SPINE.md
---

# Story 14.1: Chuyển sang pnpm monorepo + shared package

## Story

As a developer,
I want repo là pnpm workspace với `packages/shared`,
So that web và mobile dùng chung types/Zod/rules/`keys.*` không duplicate (spine AD-M5, NFR-6).

## Acceptance Criteria

**AC1 — Workspace**
**Given** repo hiện là single-package npm (`package-lock.json`, name `growbase`)
**When** migrate sang pnpm workspace
**Then** root có `pnpm-workspace.yaml` khai báo `apps/*` + `packages/*`, dùng pnpm (bỏ npm lock)
**And** `pnpm install` chạy sạch từ root.

**AC2 — Web di chuyển vào apps/web**
**Given** Next.js app hiện ở root (`src/`, `next.config.mjs`, `tailwind.config.ts`, v.v.)
**When** move vào `apps/web`
**Then** web build (`pnpm --filter web build`) + test (`vitest`) pass **y như trước migration**
**And** dev server chạy được, mọi route + `/api/*` hoạt động như cũ.

**AC3 — packages/shared**
**Then** `packages/shared` export: TypeScript types (từ `src/types`), Zod schemas (từ `src/lib/validations`), pure business rules (logic thuần không phụ thuộc React/DOM), query-key factory `keys.*` (từ `src/lib/queries/queryKeys.ts`)
**And** package name `@growbase/shared`, có `package.json` + `tsconfig` build được, không import React/Next/DOM.

**AC4 — Web consume shared**
**Then** `apps/web` import các thứ trên từ `@growbase/shared` (không còn path nội bộ tới bản đã move)
**And** không còn định nghĩa trùng lặp (single source of truth ở shared)
**And** typecheck + test + build pass.

## Developer Context — ĐỌC KỸ TRƯỚC KHI CODE

### Trạng thái hiện tại (repo thật)
- **Package manager:** npm (`package-lock.json`), single package `growbase`. Chưa có workspace.
- **App:** Next.js 14 App Router ở **root** (`src/app`, `src/middleware.ts`, `next.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `components.json`, `postcss.config.mjs`).
- **Cấu trúc `src/lib`:** `constants`, `design-tokens.ts`, `hooks`, `i18n`, `insight`, `queries` (`queryKeys.ts`), `stores` (Zustand), `supabase` (`auth-check.ts`, `admin.ts`...), `utils`, `validations`.
- **Types:** `src/types`. **Tests:** `src/__tests__` + vitest.
- ⚠️ Có nhiều `src/_workspace*` (workspace tạm của agent trước) — **không** đưa vào shared, xác nhận có nên giữ không.

### Cái story này ĐỔI
1. Root → pnpm workspace (`pnpm-workspace.yaml`, chuyển lock npm→pnpm).
2. Toàn bộ Next.js app → `apps/web/` (giữ nguyên cấu trúc bên trong `apps/web/src/...`).
3. Tạo `packages/shared/` chứa **4 nhóm dùng chung**, extract từ:
   - types ← `src/types`
   - Zod schemas ← `src/lib/validations`
   - query-key factory ← `src/lib/queries/queryKeys.ts` (giữ tên `keys.*` — A-4)
   - pure business rules ← tách phần logic thuần từ `src/lib/insight`, `src/lib/utils` (chỉ phần KHÔNG phụ thuộc React/DOM/Next).
4. `apps/web` đổi import sang `@growbase/shared`.

### Cái PHẢI GIỮ (không được vỡ)
- Mọi `/api/*` route + `withAuth()` + `supabaseAdmin` hành vi y hệt (đừng đụng logic — chỉ đổi import path).
- Middleware auth/onboarding gates (`src/middleware.ts` → `apps/web/src/middleware.ts`).
- Alias `@/` của web phải tiếp tục trỏ đúng sau khi move (cập nhật `tsconfig.json` paths + `next.config`/vitest alias).
- i18n `t()` (A-5), design tokens, Tailwind config — giữ ở `apps/web` (UI-specific, KHÔNG vào shared).
- Test suite hiện có phải xanh sau migration (đây là bằng chứng không regression).

## Architecture Compliance (guardrails)
- **AD-M5:** shared package là single source cho types/Zod/rules/keys — **cấm duplicate** giữa apps.
- **AD-M6:** query keys qua `keys.*` factory (A-4) — shared sở hữu factory này; cả web+mobile import.
- **Không cho vào shared:** UI components, React hooks, Supabase client instances (server-only `admin.ts`), Next-specific code. Shared phải **framework-agnostic** để Metro (mobile, story M1.2) bundle được.
- Inherited A-1/A-3/A-6/AD-1/AD-2 không bị ảnh hưởng (chỉ refactor cấu trúc, không đổi backend logic).

## Library / Framework Requirements
- **pnpm** workspaces (`pnpm-workspace.yaml`). Turborepo **optional** — không bắt buộc story này.
- Node types shared: TypeScript strict, `composite`/project references hợp lý để `apps/web` build incremental.
- ⚠️ **Chuẩn bị cho M1.2 (Expo/Metro):** shared KHÔNG được dùng API Node-only hay import nặng — Metro sẽ bundle nó cho RN. Giữ shared thuần TS + Zod.

## File Structure (mục tiêu)
```
growbase/
├── pnpm-workspace.yaml        # NEW: apps/* + packages/*
├── package.json               # UPDATE: root workspace, scripts delegate
├── apps/
│   └── web/                   # MOVE: toàn bộ Next.js app hiện tại
│       ├── src/ app/ components/ lib/ middleware.ts ...
│       ├── next.config.mjs · tailwind.config.ts · vitest.config.ts · tsconfig.json
└── packages/
    └── shared/                # NEW
        ├── package.json       # name @growbase/shared
        ├── tsconfig.json
        └── src/
            ├── types/         # ← src/types
            ├── schemas/       # ← src/lib/validations (Zod)
            ├── rules/         # ← pure logic tách từ insight/utils
            └── queryKeys.ts   # ← src/lib/queries/queryKeys.ts (keys.*)
```

## Testing Requirements
- **Regression gate:** vitest suite hiện có phải pass sau migration (chạy `pnpm --filter web test`). Đây là AC cứng.
- Thêm smoke test cho `@growbase/shared`: import `keys.*` + 1 Zod schema + 1 rule, assert build/type ok.
- Build gate: `pnpm --filter web build` thành công.
- Không thêm test mobile ở story này (chưa có app mobile — đó là M1.2).

## Latest Tech Info
- pnpm workspace + Next.js 14: hỗ trợ tốt. Đặt `apps/web` với `transpilePackages: ["@growbase/shared"]` trong `next.config.mjs` để Next transpile shared package.
- Metro monorepo (dùng ở M1.2) cần symlink config — không thuộc story này nhưng shared phải "Metro-friendly" (thuần TS).

## Project Context Reference
- Design tokens + business rules: `CLAUDE.md`, `docs/` (01–06).
- Non-negotiable rules (fund atomic RPC, behavior_type trigger, is_system immutable, auth-first, keys from factory) — giữ nguyên.

## Completion Status
Status: **done**. Migration implemented, reviewed (2 adversarial passes), all gates green.

## Questions for PM (giải quyết sau, không chặn)
1. `src/_workspace*` folders (workspace tạm agent cũ) — xóa hay giữ ngoài shared? Đề xuất: không đưa vào apps/web/shared, dọn riêng.
2. Có muốn thêm Turborepo caching ngay hay để sau? Đề xuất: sau (không cần cho migration).
3. Sprint-status.yaml hiện scope web — có muốn thêm mobile epics vào cùng file hay tách file sprint mobile? (ảnh hưởng tracking, không chặn dev).

## Review Triage Log

### 2026-07-16 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 0
- defer: 0
- reject: 6: (low 6)
- addressed_findings:
  - none

Both adversarial passes (Blind Hunter `bmad-review-adversarial-general`, Edge Case Hunter `bmad-review-edge-case-hunter`) found **zero correctness defects**. Full mechanical scan of all rename+edit hunks: no accidental logic change, dropped export, or wrong import target. All 6 findings were latent/low resolution-surface edges with no current consumer that triggers them, so all rejected as noise for this migration:
- shared package has no own `lint`/`test` script (all shared tests live in web, coverage intact) — low, not AC-required.
- shared publishes raw TS — works for every current consumer (Next `transpilePackages`, vitest, tsc `bundler`); not a defect.
- `exports "./*": "./src/*.ts"` does not map directory-subpath imports (`@growbase/shared/schemas`) — no consumer imports dir subpaths; all 37 imports are file-level.
- wildcard matches only `.ts` (not `.json`/`.tsx`) — no such consumer.
- no RN/Metro export condition — explicitly scoped to future story M1.2 (this story's AC3 only requires no React/Next/DOM imports, verified clean).
- vitest has no explicit `@growbase/shared` inline guard — incidental-pass via in-repo symlink; no failure.

## Auto Run Result

Status: done

### Summary
Converted the single-package npm repo into a pnpm workspace: moved the entire Next.js 14 app into `apps/web/`, and extracted a framework-agnostic `packages/shared` (`@growbase/shared`) holding types, Zod schemas, pure business rules, shared constants, and the `keys.*` query-key factory. `apps/web` now consumes these from `@growbase/shared` (single source of truth); no duplicate definitions remain. Runtime behavior is unchanged.

### Files changed (grouped; ~483 path entries, mostly `git mv` renames)
- **Root**: `pnpm-workspace.yaml` (new), `pnpm-lock.yaml` (new), `package.json` (workspace root, scripts delegate to `pnpm --filter web`), `package-lock.json` removed.
- **apps/web/**: entire Next.js app moved here (`src/`, `next.config.mjs` + `transpilePackages: ["@growbase/shared"]`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `tsconfig.json`, `components.json`, `public/`, `package.json` with `@growbase/shared: workspace:*`). ~39 files renamed + import-rewritten (`@/...` → `@growbase/shared/...`); `vi.mock()` specifiers updated to match.
- **packages/shared/**: new `@growbase/shared` — `package.json`, `tsconfig.json`, `src/{index.ts, queryKeys.ts, types/, schemas/, constants/, rules/}`.
- **apps/web/src/__tests__/shared-smoke.test.ts**: new smoke test for `@growbase/shared`.
- Kept at root untouched: `supabase/`, `docs/`, `CLAUDE.md`.

### Verification
- `pnpm install` — clean; `pnpm-lock.yaml` generated, `@growbase/shared` symlinked into `apps/web`.
- `pnpm --filter @growbase/shared type-check` — PASS (independently re-run).
- `pnpm --filter web exec tsc --noEmit` — PASS, EXIT=0 (independently re-run).
- `pnpm --filter web exec vitest run` — PASS, 532 tests / 39 files (incl. new smoke test).
- `pnpm --filter web build` — PASS (all routes + `/api/*` compiled; needed a gitignored placeholder `.env.local` only to run the gate — pre-existing env absence, not migration-caused, not committed).
- Guardrails verified: `@growbase/shared` imports no React/Next/DOM/Node APIs (grep clean); `keys.*` factory shape preserved (A-4); `@/` alias + vitest alias resolve; auth (`withAuth`, `supabaseAdmin`, middleware) logic unchanged.

### Residual risks
- `@growbase/shared` ships raw TS via a `./*` → `./src/*.ts` wildcard export; safe for all current consumers (transpiled), but a future RN/Metro consumer (story M1.2) will need react-native export conditions / Metro package-exports — out of scope here.
- Directory-subpath and `.json/.tsx` imports from `@growbase/shared` are not covered by the exports map; no current consumer uses them.
