---
baseline_commit: 16e7bf3cf66c07f35452170ff81f9ca94483d859
---

# Story 12.1: Rank persistent + Living Plan engine vận hành

Status: done

## Story

As a hệ thống,
I want hạng quỹ sống trong DB và một hook duy nhất tính kế hoạch từ số thật (income thực, balance thật, rank thật),
So that mọi màn hình vận hành đọc cùng một kế hoạch luôn tươi (BR-OB-014).

**Nguồn:** Epic 12 (`epics-onboarding-v2.md` §12.1) · BR-OB-014, BR-OB-015, BR-OB-016 · brainstorm-intent 10-07-2026.

## Acceptance Criteria

1. **Given** funds hiện có (goal funds tạo từ onboarding, sort theo thứ tự tạo)
   **When** migration chạy
   **Then** cột `priority_rank` tồn tại (int, null cho non-goal funds), backfill goal funds = 1,2,3… theo `created_at`; RPC `complete_onboarding_v2` ghi rank theo thứ tự p_goals; goal fund tạo mới sau này nhận rank cuối (max+1)

2. **Given** household có transactions income thực + funds có balance
   **When** `useLivingPlan` chạy
   **Then** trả `AllocationPlan` từ engine 10.1 với input thật: goals theo `priority_rank`, `emergencyBalance` = current_balance quỹ emergency, income = trailing average 3 tháng thu nhập thực hộ gộp (tháng chưa có income nào → fallback income onboarding); capacity THÁNG hiện tại = 15% × income thực tháng này (expose riêng, BR-OB-015)

3. **Given** boundary cases
   **When** chạy tests
   **Then** pass: income 3 tháng [40tr, 0, 20tr] → trailing 20tr · 0 income mọi tháng → fallback · goal mới chen rank cuối recompute · emergency đầy một phần từ balance thật · `tsc` + vitest sạch

## Tasks / Subtasks

- [x] Task 1: Migration `018_priority_rank.sql` (AC: 1)
  - [x] `ALTER TABLE funds ADD COLUMN priority_rank int` (nullable — chỉ goal funds có rank)
  - [x] Backfill: goal funds mỗi household đánh 1,2,3… theo `created_at` (window function ROW_NUMBER PARTITION BY household_id WHERE fund_type='goal')
  - [x] `CREATE OR REPLACE complete_onboarding_v2` (copy từ 016): trong loop p_goals, goal fund INSERT thêm `priority_rank` = index trong array (emergency = NULL)
  - [x] QUYẾT ĐỊNH D1 (flag reviewer): KHÔNG reuse cột `priority`/`sort_order` có sẵn — 2 cột đó đang là nghĩa UI sort chung mọi fund (`/api/funds` order by), default 5/0 không phản ánh rank ladder; cột mới đúng BR-OB-016, tránh đổi nghĩa ngầm
- [x] Task 2: Types + API (AC: 1, 2)
  - [x] `Fund` type (`types/app.ts`) += `priority_rank: number | null`
  - [x] API funds POST (tạo fund mới): fund_type goal → tự gán rank = max(priority_rank)+1 trong household (server-side, route hoặc trigger — chọn route cho đơn giản, comment WHY)
  - [x] API PATCH nhận `priority_rank` (cho sheet Đổi hạng 12.2 dùng sau) — validate int ≥ 1
- [x] Task 3: Nguồn income thực (AC: 2)
  - [x] Helper thuần `trailingHouseholdIncome(monthlyTotals: number[], fallback: number): number` — average các tháng > 0 trong 3 tháng gần nhất; TẤT CẢ = 0 → fallback (income onboarding lưu ở đâu? households table có monthly_income? — kiểm chứng; nếu không có thì fallback = income_sources sum). Comment WHY từng nhánh
  - [x] API route `/api/living-plan` GET: trả `{ trailingIncome, currentMonthIncome, emergencyBalance, goals: [{id, name, targetAmount, currentBalance, priorityRank}] }` — 1 query funds + 1 query income 3 tháng (direction='in', type='income'), `withAuth()` đầu route
- [x] Task 4: Hook `useLivingPlan` (AC: 2)
  - [x] `src/lib/hooks/useLivingPlan.ts`: useQuery key mới `keys.livingPlan(hid)` (thêm factory) → fetch `/api/living-plan` → client compute `calculateAllocationPlan({ monthlyIncome: trailingIncome, goals: sortByRank, emergencyBalance })` + `capacityThisMonth = currentMonthIncome × 15%` (derive sumBudgetPct, không hardcode)
  - [x] Goals input engine: `initialBalance` = currentBalance từng goal fund (engine đã hỗ trợ — lần đầu dùng thật)
  - [x] Return shape: `{ plan, capacityThisMonth, trailingIncome, isLoading }` — 12.2/12.3/12.4/13.x đều đọc hook này
- [x] Task 5: Tests + verify (AC: 3)
  - [x] Tests helper trailing (boundary AC3) + engine input mapping (rank sort, initialBalance)
  - [x] `npx tsc --noEmit` sạch · `npx vitest run` full pass
  - [x] Manual trace: household seed hiện có → GET /api/living-plan trả đúng shape; SQL migration idempotent-check (chạy 2 lần không vỡ — hoặc note chạy 1 lần)

## Dev Notes

### BR verbatim (docs/02_BUSINESS_RULES.md:174-218)

- **BR-OB-014:** kế hoạch không lưu tĩnh — mọi màn tính lại từ engine với state thật (rank DB + income thực + emergency balance). Tada = snapshot đầu.
- **BR-OB-015:** capacity tháng = 15% × tổng thu nhập THỰC cả hộ tháng đó (ví chung mọi member); timeline dùng trailing 3 tháng; income onboarding chỉ để estimate ban đầu.
- **BR-OB-016:** hạng sống ở `priority_rank`, USER xếp, app advise; goal mới chen → recompute không hỏi.

### Hiện trạng kỹ thuật (investigator 10-07)

- Migrations: cao nhất `017_event_budgets.sql` → dùng **018**. Funds schema (`002_tables.sql:125-142`): `current_balance numeric(15,0)`, `priority int DEFAULT 5`, `sort_order int DEFAULT 0`, `created_at` — CHƯA có priority_rank.
- RPC 016 (`016_onboarding_rpc_hardening.sql:118-131`): loop p_goals INSERT funds theo thứ tự array, KHÔNG ghi sort/rank → backfill theo created_at là đúng thứ tự hạng onboarding (emergency là phần tử [0] — skip, fund_type='emergency').
- Transactions: `direction ENUM('in','out')` + `transaction_type ENUM(... 'income' ...)` (`001_enums.sql:33-37`). Income tháng: pattern `dashboard/route.ts:74-77` (`dir === "in"` → cẩn thận: fund_withdrawal cũng có thể direction in? — CHECK enum mapping thực tế, chỉ đếm `type='income'` cho chắc, comment WHY).
- `useFunds.ts:20-22`: keys.funds(hid) → GET /api/funds trả Fund[]; route order `.order("priority").order("sort_order")` — KHÔNG đụng order này (UI sort chung).
- queryKeys: chưa có `livingPlan` — thêm `keys.livingPlan(hid)`.
- Fallback income onboarding: households/income_sources — investigator chưa xác định chỗ lưu; dev PHẢI grep (`monthly_income` trong migrations + route onboarding) trước khi viết fallback.
- Engine 10.1: `calculateAllocationPlan` nhận `emergencyBalance` + `AllocationGoalInput.initialBalance` — đã hỗ trợ sẵn, tests hiện có cover partial emergency. KHÔNG sửa engine.

### Previous Story Intelligence (Epic 10/11)

- Engine exports đầy đủ (`ladderWeights`, `sumBudgetPct`, `MAX_ALLOCATION_MONTHS`, compound helpers) — chỉ import.
- Pattern review lặp: pure logic → helper + tests TRƯỚC khi UI đụng; mọi số null/0 có nhánh; i18n parity (story này không UI — ít i18n); token màu check tồn tại.
- RPC thay đổi: LUÔN `CREATE OR REPLACE` trong migration mới, không sửa file migration cũ (016 là bài học hardening).
- `withAuth()` đầu route; response `{ data, error }`; supabase server client cho user-scoped read.

### Project Structure Notes

- Migration: `supabase/migrations/018_priority_rank.sql`
- Helper thuần: cạnh chỗ hợp lý (`src/lib/utils/` hoặc budgetTemplate.ts nếu dính engine semantics — helper trailing KHÔNG thuộc engine, để `src/lib/utils/income.ts` mới chỉ khi >1 helper, else inline trong route + export test được... quyết: `src/lib/utils/trailingIncome.ts` nhỏ, testable)
- Hook: `src/lib/hooks/useLivingPlan.ts` · key factory `src/lib/queries/queryKeys.ts`
- KHÔNG đụng: engine budgetTemplate (trừ import), onboarding flow, TadaStep, GoalStep

### References

- `epics-onboarding-v2.md:963-1010` (12.1 verbatim) · `docs/02_BUSINESS_RULES.md:174-218` (BR-OB-014..016)
- `sprint-change-proposal-2026-07-10.md` + `brainstorm-intent.md` (quyết định nền)
- `supabase/migrations/002_tables.sql` + `016_onboarding_rpc_hardening.sql` (schema + RPC hiện tại)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent, dev-story workflow; main thread verify độc lập)

### Debug Log References

- `npx tsc --noEmit` exit 0 · `npx vitest run` **34 files / 461 tests pass** (447 → 461: +6 trailing, +5 livingPlanEngine, +3 fund validation) — verify độc lập
- `supabase migration up --local`: 018 apply sạch + re-run idempotent; DB verify cột nullable + RPC 8-arg SECURITY DEFINER giữ nguyên

### Completion Notes List

1. **Task 1** — `018_priority_rank.sql`: ADD COLUMN IF NOT EXISTS + backfill ROW_NUMBER theo created_at (goal funds, chỉ khi NULL) + CREATE OR REPLACE `complete_onboarding_v2` copy 016 nguyên vẹn (advisory lock, validate, contract), loop WITH ORDINALITY ghi rank = index (emergency NULL). D1 comment trong file.
2. **Task 2** — Fund/FundRow types += priority_rank; POST goal fund auto rank max+1 route-side; PATCH nhận priority_rank (Zod int ≥1 optional).
3. **Task 3** — `trailingIncome.ts` helper thuần; route `/api/living-plan` (withAuth, income CHỈ `transaction_type='income'` — fund_withdrawal cũng direction 'in'); fallback income = `income_sources.monthly_amount WHERE is_current` (grep xác nhận, KHÔNG có households.monthly_income); lazy query fallback.
4. **Task 4** — `keys.livingPlan(hid)` + `useLivingPlan`: engine với emergencyBalance + initialBalance THẬT (lần đầu dùng), capacityThisMonth derive sumBudgetPct.
5. **Xử lý mâu thuẫn spec (flag reviewer):** Task 3 ghi "average tháng >0" vs AC3 `[40,0,20]→20` (sum/3) — implement theo AC3 (authoritative): sum/window; ">0" chỉ là điều kiện fallback. Comment WHY.
6. Deviations: 3 queries nhánh fallback (lazy); "tháng này" = todayVN thực (key hid-only); type change lan 5 file fixtures (tsc bắt).

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| Migration backfill đúng thứ tự created_at + RPC ghi rank theo p_goals index | supabase local: migration up + re-run idempotent + DB inspect | PASS |
| Trailing income [40,0,20]→20 · all-0→fallback · fallback từ income_sources | Automated (6 tests) | PASS |
| Engine nhận balance thật (emergency partial + goal initialBalance) qua useLivingPlan mapping | Automated (5 tests) | PASS |
| Goal fund mới POST → rank max+1 | Manual trace route — **cần browser/API verify** | PASS (trace) |
| /api/living-plan shape + auth | Manual trace (withAuth + shape) — **cần API verify** | PASS (trace) |

### File List

- A `supabase/migrations/018_priority_rank.sql` · A `src/lib/utils/trailingIncome.ts` · A `src/app/api/living-plan/route.ts` · A `src/lib/hooks/useLivingPlan.ts` · A `src/__tests__/utils/trailingIncome.test.ts` · A `src/__tests__/lib/livingPlanEngine.test.ts`
- M `src/types/app.ts` · M `src/types/database.ts` · M `src/lib/validations/fund.ts` · M `src/app/api/funds/route.ts` · M `src/lib/queries/queryKeys.ts` · M `src/components/onboarding/v2/hookDemoData.ts` + 3 insight test fixtures · M `src/__tests__/validations/fund.test.ts`

## Senior Developer Review (AI)

**Date:** 10-07-2026 · **Outcome:** Approve (sau 6 patches) · **Layer:** Combined, SQL-focused (diff RPC từng dòng vs 016/017, ordinality math verify, 8 suspicions dropped)

**Verdicts trước patch:** AC1 FAIL (F1 icon revert + F2 backfill non-deterministic) · AC2 PASS (caveat trailing window) · AC3 PASS (461 reproduce). Sau patch: AC1 PASS.

### Action Items

- [x] [HIGH] 018 copy RPC từ 016 làm mất `icon` (017 cũng đã replace RPC — LỖI SPEC STORY "copy từ 016", dev làm đúng spec sai). **P1:** re-base 017, diff chỉ khác priority_rank, db reset verify icon còn. Bài học: RPC replace phải base bản MỚI NHẤT.
- [x] [HIGH] Backfill ROW_NUMBER thiếu tie-breaker — created_at identical trong transaction → thứ tự không deterministic. **P2:** `ORDER BY created_at, id` + comment limitation (thứ tự thật không khôi phục được khi tie; user re-rank 12.2).
- [x] [MED] Route goals sort thiếu tie-breaker → duplicate rank cho order ngẫu nhiên giữa 2 fetch (vi phạm BR-OB-014). **P3:** sort 3 cấp rank→created_at→id.
- [x] [MED — design call] Trailing window gồm tháng đang dở → underestimate systematic (lương chưa về). **P4:** trailing = m-3..m-1 (3 tháng đủ); capacity vẫn tháng hiện tại.
- [x] [LOW] POST max-rank query error bị nuốt → rank 1 duplicate. **P5:** surface 500.
- [x] [LOW] PATCH priority_rank không gate fund_type. **P6:** 400 nếu không phải goal.

### Deferred

- [Review][Defer] Ghost ranks khi soft-delete (is_active=false giữ rank, max+1 đếm cả fund chết → gaps 1,3,7) — 12.2 rank display không được assume contiguous.
- [Review][Defer] 2 emergency funds → `.find()` chọn arbitrary — cân nhắc chặn tạo emergency thứ 2 hoặc sum.
- [Review][Defer] `monthRange` util parse UTC + format local — pre-existing, lệch 1 tháng nếu server TZ tây UTC (Vercel UTC = an toàn).
- [Review][Defer] POST max+1 race 2 request đồng thời → duplicate rank (hiếm; 12.2 reorder sheet là chỗ dedup tự nhiên).
- [Review][Note] Tests engine-proxy — route sort/bucketing/fallback chưa có integration test trực tiếp (manual trace).

### Verification sau patch (main thread, độc lập)

tsc exit 0 · 34 files / 461 tests pass · migration `supabase db reset --local` sạch, RPC live có `icon` + `priority_rank`.

## Change Log

- 10-07-2026: Story 12.1 implemented — migration 018 priority_rank + RPC ordinality, trailingIncome helper, /api/living-plan, useLivingPlan hook (engine với số thật); 461 tests pass; status → review.
- 10-07-2026: Code review SQL-focused — 6 patches (2 HIGH: icon revert từ lỗi spec, backfill tie-breaker; 2 MED; 2 LOW), 5 defer; db reset verify; status → done.
