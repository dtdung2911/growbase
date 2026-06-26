## Sprint S0 Done

### Files created

#### DB Migrations
- `supabase/migrations/001_enums.sql` — 14 enums (behavior_type + 'income')
- `supabase/migrations/002_tables.sql` — 17 tables, FK order, CHECK constraints, indexes, GENERATED column
- `supabase/migrations/003_functions.sql` — 9 SECURITY DEFINER functions + 3 triggers
- `supabase/migrations/004_rls.sql` — RLS enable + policies toàn bộ 17 tables
- `supabase/migrations/005_seed.sql` — cost_types, system category_groups, system categories

#### App Scaffold
- `package.json` — Next.js 14, @supabase/ssr, TanStack Query v5, Zustand, shadcn deps
- `tsconfig.json` — strict, paths @/* → src/*
- `next.config.mjs`
- `tailwind.config.ts` — zinc theme tokens
- `postcss.config.mjs`
- `components.json` — shadcn zinc, CSS variables
- `.env.example` — 3 biến Supabase
- `.gitignore`
- `vitest.config.ts` — node env, globals, @ alias
- `src/app/globals.css` — Tailwind + zinc CSS vars (light/dark)
- `src/app/providers.tsx` — QueryClientProvider + Toaster
- `src/app/layout.tsx` — lang vi, viewport maximumScale 1
- `src/app/page.tsx` — placeholder
- `src/lib/supabase/client.ts` — createBrowserClient
- `src/lib/supabase/server.ts` — createServerClient + cookies adapter
- `src/lib/stores/appStore.ts` — Zustand (householdId, currentMonth, user)
- `src/lib/queries/queryKeys.ts` — keys factory
- `src/lib/constants/budgetTemplate.ts` — 16 BudgetTemplateLine, total 100%
- `src/lib/utils/cn.ts`
- `src/lib/utils/date.ts` — monthRange, toYearMonth, firstDayOfMonth
- `src/lib/utils/currency.ts` — formatVND
- `src/lib/utils/budget.ts` — getBudgetStatus
- `src/types/api.ts` — ApiResponse<T>
- `src/types/app.ts` — User re-export
- `src/types/database.ts` — placeholder
- `src/lib/hooks/.gitkeep`
- `src/lib/validations/.gitkeep`

#### Tests
- `src/lib/utils/__tests__/currency.test.ts` — 8 tests
- `src/lib/utils/__tests__/date.test.ts` — 14 tests
- `src/lib/utils/__tests__/budget.test.ts` — 10 tests
- `src/lib/utils/__tests__/cn.test.ts` — 9 tests
- `src/lib/constants/__tests__/budgetTemplate.test.ts` — 11 tests

### Files modified
- `CLAUDE.md` — thêm harness change history
- `.claude/agents/growbase-analyst.md` — nâng cấp
- `.claude/agents/growbase-builder.md` → senior-developer
- `.claude/agents/growbase-qa.md` — cross-boundary checks
- `.claude/skills/growbase-sprint/SKILL.md` — 9-phase pipeline

### Files created (harness)
- `.claude/agents/growbase-business-review.md`
- `.claude/agents/growbase-architect.md`
- `.claude/agents/growbase-migration.md`
- `.claude/agents/growbase-code-reviewer.md`
- `.claude/agents/growbase-fixer.md`
- `.claude/agents/growbase-tester.md`
- `.claude/skills/growbase-orchestrator/SKILL.md`
- `.claude/skills/growbase-conventions/SKILL.md`

### Pipeline summary
- ✓ Analyst: 2 stories, 15 tasks (5 DB + 10 app), 10 risks flagged
- ✓ Business Review: NEEDS_REVISION → 4 BLOCKERs resolved by Architect
- ✓ Architect: 4 BLOCKERs chốt (CHECK constraint, behavior_type enum, budgetTemplate constant, RLS policies)
- ✓ Migration: 5 migration files, 9 RPC functions, 17 tables với RLS
- ✓ Senior Developer: 27 app/config files, tsc clean, build pass
- ✓ Code Review: 0 critical, 5 warnings, 5 minor
- ✓ Fixer: 5 warnings fixed (search_path, membership guard, accept_invitation fallback, double-count comment, table count comment)
- ✓ Tester: 5 test files, 52 tests, 52/52 pass
- ✓ QA: PASS — tsc exit 0, vitest 52/52, DB chain nhất quán, fixer compliance đầy đủ

### Deviations from spec
1. **`behavior_type` enum thêm `'income'`** — spec không có, cần thiết vì income categories phải có NOT NULL default_behavior_type. S3 reports phải filter `direction='out'` trước khi group behavior_type.
2. **`funds.updated_at` column** — spec 2.5 không define nhưng fund RPCs gọi `UPDATE funds SET updated_at = now()`. Thêm column + trigger.
3. **Budget template = TypeScript constant** — spec không xác định storage. Dùng constant vì budget_baselines.household_id NOT NULL FK.
4. **`@supabase/ssr` thay `@supabase/auth-helpers-nextjs`** — auth-helpers deprecated. Đổi để tránh rework S1.
5. **`CookieToSet` type alias trong server.ts** — database.ts là placeholder, strict mode cần explicit type. TODO xóa khi gen database.ts thật.

### Known issues (deferred có chủ ý)
1. **Threshold 0.8 duplicate** — hardcode ở `budget.ts` (TS) lẫn `003_functions.sql` SQL. Defer S4.
2. **`recalculate_debt_budget` match by name string** — UPDATE budget_baselines WHERE name='Chi trả nợ'. Fragile. Defer S1 onboarding (thêm is_auto_calculated + auto_calculated_source flag).
3. **`get_budget_with_actuals` double-count risk** — GROUP BY có thể double-count nếu category thuộc nhiều budget line. Comment warning đã thêm. Fix kỹ S4.
4. **Service-role trigger issue** — `recalculate_debt_budget()` membership guard RAISE EXCEPTION nếu cron/service-role job mutate debt_entries ngoài user session (auth.uid() = NULL). Defer S5.
5. **`getBudgetStatus` strict `>` boundary** — tại biên budget*0.8 và budget chính xác → rơi vào nhánh thấp hơn. Behavior documented trong tests. Đối chiếu BA ở S4 nếu cần inclusive.

### Pre-S1 decisions cần user xác nhận
1. Danh sách system categories đầy đủ per group (S0 seed 1 category/group làm baseline)
2. Mapping budget line name → category_group names cho onboarding wizard (S1 US-2.02)

### Next: Sprint S1 ready to start
S1 scope: Auth + Onboarding (US-1.01, US-1.02, US-2.01, US-2.02, US-9.01 full deploy)
