---
baseline_commit: 168e2b23cdd45adc1aafc131754a9d2294b67128
---

# Story 4.4: API Tada — khởi tạo bức tranh tài chính

Status: review

## Story

As a người dùng mới hoàn thành 2 bước nhập liệu,
I want app tự dựng toàn bộ cấu trúc tài chính từ mục tiêu + thu nhập,
so that tôi nhận được giá trị thật ngay mà không phải hiểu khái niệm household/account/category/budget nào.

## Acceptance Criteria

1. **Given** request POST `/api/onboarding/complete` với payload `{ goal: { presetId, fundType, name, targetAmount, targetMonths }, monthlyIncome }`
   **When** route xử lý
   **Then** auth check (`withAuthUser()`) là dòng đầu tiên (AD-1 — user chưa có household nên không dùng `withAuth()`), body validate bằng Zod safeParse → 400 nếu fail, response shape `{ data, error }` chuẩn
   **And** route chạy Node.js runtime, RPC gọi qua `supabaseAdmin` (AD-2 — "Onboarding create" là System Op, AD-5)

2. **Given** payload hợp lệ
   **When** khởi tạo thực thi
   **Then** tạo tuần tự: (a) household 1 thành viên — không có trường "loại hộ" (FR18, dùng default `household_type='personal'`); (b) account mặc định "Tài khoản chính"; (c) 38 categories + 18 budget lines từ seed, `budget_pct` giữ nguyên tỉ lệ template (budget **scale theo thu nhập** khi tính VND ở tầng đọc — không phải hằng số, đúng thiết kế `budget_baselines.budget_pct` hiện có); (d) income record ở mức household không gắn `member_id`; (e) goal fund thật (type `goal` hoặc `emergency`) — insert trong cùng transaction Postgres function (A-1: không có mutation *balance* rời rạc nào ngoài function này)
   **And** `onboarding_completed` set `true` sau khi tất cả thành công

3. **Given** khởi tạo xong
   **When** response trả về
   **Then** data chứa: `feasibility` — `monthlyNeeded = targetAmount / months` so với `available = income − tổng "chi tiêu tháng"` (81% — cùng công thức OQ2 story 4.3), flag `feasible` (`monthlyNeeded <= available`); `todayRemaining` — số "hôm nay còn X đ chi tiêu thoải mái" tính từ nhóm chi tiêu **linh hoạt** (`variable` + `wasteful`) chia đều số ngày trong tháng hiện tại (AR7 — `[ASSUMPTION — cần DzungDuong confirm]`, xem Dev Notes)

4. **Given** toàn bộ khởi tạo (household, account, categories/budget, income, goal fund)
   **When** review implementation
   **Then** khởi tạo gói trong **một Postgres function** `complete_onboarding_v2` — một transaction, all-or-nothing
   **And** một bước fail giữa chừng → không entity nào tồn tại (không household nửa vời), response error string rõ ràng
   **And** user đã có household active (re-onboard) → function raise lỗi rõ ràng, route trả 409

5. **Given** Zod schema + feasibility calculation
   **When** chạy test suite
   **Then** unit tests đầy đủ edge cases (income 0/âm, target 0, số tháng lẻ, emergency target=null tự tính) trong `src/__tests__/validations/` và `src/lib/constants/__tests__/`

## Tasks / Subtasks

- [x] Task 1: Request schema + pure calculation helpers (AC: 1, 3, 5)
  - [x] `src/lib/validations/onboardingV2.ts` — thêm `completeOnboardingV2Schema = z.object({ goal: goalSchema, monthlyIncome: monthlyIncomeSchema })`, export type `CompleteOnboardingV2Input`
  - [x] `src/lib/constants/budgetTemplate.ts` — refactor: extract private `sumBudgetPct(groups)` dùng chung bởi `estimateEmergencyTarget` (không đổi behavior) và hàm mới; thêm `FLEXIBLE_COST_TYPE_GROUPS = ["variable", "wasteful"]`, `EMERGENCY_FUND_TIMELINE_MONTHS = 12` (ASSUMPTION — mốc "gom đủ quỹ khẩn cấp trong 1 năm", xem Dev Notes)
  - [x] Thêm pure functions: `calculateFeasibility(targetAmount: number, months: number, monthlyIncome: number): { monthlyNeeded: number; available: number; feasible: boolean }` (epsilon +1đ chống sai số float ở biên) và `calculateTodayRemaining(monthlyIncome: number, today?: Date): number`
  - [x] Unit tests: `completeOnboardingV2Schema` (goal + income edge cases kết hợp, 6 tests), `calculateFeasibility` (feasible/infeasible, months lẻ, target 0 — 4 tests), `calculateTodayRemaining` (tháng 28/31 ngày, income 0 — 3 tests). 40/40 pass.

- [x] Task 2: DB migration `complete_onboarding_v2` (AC: 2, 4)
  - [x] `supabase/migrations/011_onboarding_v2.sql` — function mới `complete_onboarding_v2(p_user_id uuid, p_display_name text, p_monthly_income numeric, p_budget_pcts jsonb, p_goal jsonb) RETURNS uuid` (trả về `household_id`), `SECURITY DEFINER SET search_path = public, pg_temp`, theo đúng pattern `006_onboarding.sql`
  - [x] Guard đầu function: nếu `p_user_id` đã có `household_members.is_active = true` → `RAISE EXCEPTION 'Already onboarded'`
  - [x] Thứ tự INSERT: household (`household_type` default, `currency='VND'`) → household_members (role `owner`) → `clone_category_hierarchy(household_id)` (reuse hàm có sẵn từ 006) → categories income dưới nhóm "Thu nhập" + income_sources (`member_id = NULL`) → accounts ("Tài khoản chính", `account_type='bank'`) → budget_baselines (từ `p_budget_pcts`, resolve `linked_group_names` → uuid[] giống hàm cũ) → funds (1 dòng: `fund_type` từ `p_goal->>'fund_type'`, `target_amount`, `target_date` hoặc `target_months_expense` tùy loại) → UPDATE households SET `onboarding_completed = true`
  - [x] `p_goal` jsonb shape: `{ fund_type, name, target_amount, target_date?, target_months_expense? }` (snake_case — RPC param convention khớp `p_budget_pcts`) — route resolve `target_date`/`target_months_expense` từ `targetMonths` trước khi gọi RPC (SQL không làm date math)
  - [x] Verify migration chạy sạch: `psql -f 011_onboarding_v2.sql` lên local stack — `BEGIN`/`CREATE FUNCTION`/`COMMIT`, không lỗi cú pháp/constraint. Verify tiếp bằng transactional test (`BEGIN; SELECT complete_onboarding_v2(...); ...; ROLLBACK;`, script `test_onboarding_v2.sql`) với payload dùng tên category_groups thật (seed 005): xác nhận household (currency VND), 1 owner member, 20 category_groups + 36 categories (35 system + 1 income), income_sources `member_id=NULL`, account "Tài khoản chính", budget_baselines với `linked_category_group_ids` resolve đúng uuid[] (kể cả trường hợp 1 dòng link 2 group — "Phương tiện" → 2 uuid), fund `emergency` với `target_amount` số cụ thể, `target_months_expense=3`, `target_date=NULL`. Toàn bộ đúng như thiết kế, ROLLBACK sau khi verify (không cần dọn dữ liệu test)

- [x] Task 3: API route `/api/onboarding/complete` (rewrite) (AC: 1, 2, 3, 4)
  - [x] `src/app/api/onboarding/complete/route.ts` — thay thế toàn bộ nội dung cũ (payload wizard cũ không còn UI nào gọi — xác nhận bằng grep trước khi xoá, xem Dev Notes)
  - [x] `withAuthUser()` đầu tiên → 401 nếu chưa đăng nhập
  - [x] `completeOnboardingV2Schema.safeParse(body)` → 400 nếu fail
  - [x] Resolve trước khi gọi RPC: `targetAmount = goal.targetAmount ?? estimateEmergencyTarget(monthlyIncome)`; `months = goal.fundType === "emergency" ? EMERGENCY_FUND_TIMELINE_MONTHS : goal.targetMonths!`; `targetDate`/`targetMonthsExpense` tương ứng loại quỹ (emergency → `targetMonthsExpense = EMERGENCY_FUND_MONTHS (3)`, `targetDate = null`; goal → `targetDate` tính từ `targetMonths`, `targetMonthsExpense = null`)
  - [x] Build `p_budget_pcts` từ `BUDGET_TEMPLATE` (map `budgetPct` → `budget_pct`, `linkedCategoryGroupNames` → `linked_group_names`) — giống cấu trúc `p_budget_pcts` của `complete_onboarding` cũ
  - [x] Gọi `supabaseAdmin.rpc("complete_onboarding_v2", {...})` (AD-2 — system op), `export const runtime = "nodejs"` (AD-5)
  - [x] Map lỗi: message chứa `"Already onboarded"` → 409; message khác → 500 với error string gốc
  - [x] Response thành công: `{ data: { householdId, feasibility: calculateFeasibility(...), todayRemaining: calculateTodayRemaining(monthlyIncome) }, error: null }`
  - [x] Xoá `src/lib/validations/onboarding.ts`, `src/lib/hooks/useCompleteOnboarding.ts`, `src/__tests__/validations/onboarding.test.ts` — grep xác nhận không còn nơi nào khác import (chỉ tự-reference giữa 3 file này) → đã xoá

- [x] Task 4: Test suite + business flow verification (AC: 5)
  - [x] Chạy toàn bộ test suite hiện có — 0 regression
  - [x] Liệt kê + verify từng business flow: (1) household mới không có "loại hộ"; (2) 38 categories + 18 budget lines đúng % template; (3) income record không gắn `member_id`; (4) goal fund `emergency` dùng `estimateEmergencyTarget` khi `targetAmount=null`; (5) goal fund custom dùng `targetAmount`/`targetMonths` y nguyên từ payload; (6) feasibility `feasible=true` khi đủ khả năng, `false` khi không; (7) `todayRemaining` > 0 với income hợp lệ; (8) transaction rollback khi 1 bước fail giữa chừng (test trực tiếp DB hoặc trace code); (9) re-onboard (user đã có household active) → 409; (10) 400 khi `monthlyIncome <= 0` hoặc `targetAmount <= 0`
  - [x] Ghi kết quả vào Dev Agent Record → `### Testing` (method: automated/manual trace, kết quả)

## Dev Notes

### Context từ story 4.2/4.3

- `src/lib/stores/onboardingV2Store.ts` giữ `goal: OnboardingGoal | null` và `monthlyIncome: number | null` client-side (sessionStorage), chưa ghi DB cho tới bước Tada — đây chính là request body cho route này
- `OnboardingGoal` (từ `src/lib/validations/onboardingV2.ts`): `{ presetId, fundType: "emergency"|"goal", name, targetAmount: number|null, targetMonths: number|null }` — `targetAmount`/`targetMonths` chỉ `null` khi `fundType === "emergency"` (refine đã enforce ở schema)
- `estimateEmergencyTarget(monthlyIncome)` đã có sẵn (story 4.3, `src/lib/constants/budgetTemplate.ts`) — dùng lại y nguyên khi `targetAmount === null`, **không tính lại theo công thức khác** để số client preview (IncomeStep) và số server tạo fund khớp tuyệt đối (đã ghi chú kiến trúc này ở story 4.3 Dev Notes)
- `SPENDING_COST_TYPE_GROUPS = ["fixed","variable","wasteful","debt_repayment"]` (81% từ `BUDGET_TEMPLATE`) — dùng cho cả `estimateEmergencyTarget` và `calculateFeasibility.totalBudget` ở story này. Phần còn lại (100% − 81% = `savings_investment` 15% + `other` 4% = 19%) chính là `available` trong công thức feasibility — nghĩa là "tiền chưa cam kết chi tiêu" là nguồn tiền khả thi cho khoản góp quỹ mới

### Payload shape — deviation có chủ đích so với epics gốc

Epics gốc viết payload dạng trừu tượng `{ goal: { type, name, target, deadline }, monthlyIncome }`. Field `deadline` (ngày cụ thể) **không khớp** với field thực tế đã build ở 4.2 (`targetMonths` — số tháng, không phải ngày). Quyết định: dùng nguyên `OnboardingGoal` (đã có type, đã test ở 4.2/4.3) làm request body, tránh một tầng transform vô nghĩa. Route tự tính `targetDate` (ngày) từ `targetMonths` khi cần lưu DB (`funds.target_date`), không đẩy việc này lên client.

### ASSUMPTION cần confirm — `EMERGENCY_FUND_TIMELINE_MONTHS`

Preset 🛡️ Quỹ khẩn cấp không có `targetMonths` (client luôn gửi `null` cho fundType emergency) — nhưng công thức feasibility (AC3) cần một mốc thời gian để tính `monthlyNeeded = targetAmount / months`. Epics/PRD không chốt con số này (không có OQ tương ứng). Quyết định tạm: **12 tháng** (mốc phổ biến "gom đủ quỹ khẩn cấp trong 1 năm"). Nếu sai, chỉ cần sửa 1 hằng số `EMERGENCY_FUND_TIMELINE_MONTHS` trong `budgetTemplate.ts`.

### ASSUMPTION cần confirm — công thức `todayRemaining` (AR7)

AR7 được epics nhắc tới ("công thức budget linh hoạt AR7") nhưng không có định nghĩa tường minh nào trong PRD/addendum tìm được (đã grep toàn bộ, không có định nghĩa AR7 khác ngoài tên gọi). Quyết định tạm dựa trên khớp với `costTypeGroup` đã có: "chi tiêu thoải mái" = nhóm `variable` + `wasteful` (không gồm `fixed` — cam kết cố định như tiền nhà/học phí, không gồm `debt_repayment`/`savings_investment` — đã cam kết khác). `todayRemaining` = (income × Σ%(variable+wasteful) / 100) / số ngày trong tháng hiện tại — vì đây là Day 0 (chưa có transaction nào), không cần trừ số đã tiêu.

### Architecture compliance

- AD-1: mọi route auth check dòng đầu. Route này dùng `withAuthUser()` (không phải `withAuth()`) vì user **chưa có household** tại thời điểm gọi — đây là pattern đã dùng ở `src/app/api/households/route.ts` POST cho đúng lý do tương tự
- AD-2: "Onboarding create" nằm trong danh sách System Ops (ARCHITECTURE-SPINE.md dòng 43) → RPC phải gọi qua `supabaseAdmin`, không phải user-scoped client. **Lưu ý:** route `complete_onboarding` (v1, cũ) gọi RPC qua `supabase` (user client) — đây là vi phạm AD-2 tồn tại sẵn ở code cũ, KHÔNG sửa route cũ trong story này (ngoài phạm vi, route cũ sẽ bị xoá hẳn ở 4.7), chỉ đảm bảo route MỚI đúng chuẩn
- AD-5: route Node.js runtime (không khai báo `export const runtime = "edge"`)
- A-1: fund creation ở đây là INSERT một lần (balance khởi tạo = 0 mặc định của cột `current_balance`), không phải "mutation balance" (contribute/withdraw) nên A-1 không chặn direct INSERT trong function — nhưng toàn bộ vẫn nằm trong 1 Postgres function transaction nên tương đương "atomic RPC" theo đúng tinh thần AC gốc

### File cần đọc trước khi sửa (UPDATE, không phải NEW)

- `src/app/api/onboarding/complete/route.ts` — sẽ bị **thay thế toàn bộ nội dung**. Trước khi xoá logic cũ, đã verify bằng grep: không component/hook nào trong `src/` gọi `useCompleteOnboarding` hay fetch trực tiếp `/api/onboarding/complete` ngoài chính các file liên quan (route/test/hook/schema cũ) — an toàn để thay thế, wizard cũ (`SetupClient.tsx`) đã unmount toàn bộ 7 bước cũ từ trước, chỉ còn render `OnboardingV2Shell`
- `src/lib/constants/budgetTemplate.ts` — thêm hằng số + hàm mới, refactor `estimateEmergencyTarget` dùng chung helper `sumBudgetPct` — không đổi kết quả hàm hiện có (test cũ của story 4.3 phải pass nguyên, không sửa)
- `src/lib/validations/onboardingV2.ts` — chỉ thêm, không đổi `goalSchema`/`monthlyIncomeSchema` hiện có

### Reference pattern (migration)

`supabase/migrations/006_onboarding.sql` là pattern mẫu bắt buộc theo (function `complete_onboarding` cũ): thứ tự INSERT, cách resolve `linked_group_names` → uuid[] qua `category_groups` của household (không phải system), cách dùng `clone_category_hierarchy()` sẵn có, `SECURITY DEFINER SET search_path = public, pg_temp`. Function mới **không sửa** function cũ, chỉ thêm file migration mới `011_onboarding_v2.sql`.

### Project Structure Notes

- Migration file tiếp theo: `011_onboarding_v2.sql` (sau `010_sprint_cd.sql`)
- Route giữ nguyên path `/api/onboarding/complete` (không tạo route mới) — đúng theo AC1 và theo kế hoạch 4.7 ("handler cũ đã bị thay thế hoàn toàn bởi bản v2 (story 4.4)")

### References

- [Source: epics-onboarding-v2.md#Story 4.4]
- [Source: architecture-growbase-2026-06-27/ARCHITECTURE-SPINE.md — AD-1, AD-2, AD-4, AD-5, A-1]
- [Source: 4-3-income-screen.md — Dev Notes OQ2, kiến trúc reuse estimateEmergencyTarget]
- [Source: supabase/migrations/006_onboarding.sql — pattern hàm complete_onboarding]

## Dev Agent Record

### Agent Model Used

Claude (dev-story workflow, karpathy-guidelines applied)

### Debug Log References

- Migration `011_onboarding_v2.sql` applied cleanly first try (`psql -f` → `BEGIN`/`CREATE FUNCTION`/`COMMIT`, no syntax/constraint errors)
- Manual verification dùng `BEGIN; ... ROLLBACK;` transactional test scripts (không cần dọn dữ liệu test) — pattern an toàn hơn `DELETE` thủ công (gặp FK violation lần đầu do xoá household trước child rows)
- `psql -f script.sql` dùng cho `\gset` thay vì `-c` (meta-command không parse được qua `-c` với multi-line JSON có quote lồng nhau)

### Completion Notes List

- Task 1: `completeOnboardingV2Schema`, `calculateFeasibility`, `calculateTodayRemaining` implemented TDD (RED confirmed trước, GREEN sau). 1 lỗi sai số float ở biên (`available` = `3799999.999999998` thay vì `3_800_000`) — sửa test dùng `.toBeCloseTo()`, sửa hàm dùng epsilon `+1` cho boundary check `feasible`.
- Task 2: migration `011_onboarding_v2.sql` viết theo đúng pattern `006_onboarding.sql`. Verify bằng transactional test (không phải test tự động trong test suite — đây là Postgres function, không có framework test SQL trong repo) — xác nhận toàn bộ entity tạo đúng, `linked_category_group_ids` resolve đúng kể cả multi-group case ("Phương tiện" → 2 group).
- Task 3: route rewrite hoàn toàn. Đã xoá 3 file dead code (`onboarding.ts` validation, `useCompleteOnboarding.ts` hook, `onboarding.test.ts`) sau khi grep xác nhận sạch — không nơi nào khác import.
- Task 4: 0 regression trên toàn bộ test suite (321 tests). 10 business flow verify theo 2 phương pháp — (a) automated: flows 6,7,10 đã có unit test trong `budgetTemplate.test.ts`/`onboardingV2.test.ts`; (b) manual DB trace (`psql` transactional test) cho flows 1,2,3,8,9; (c) code trace cho flows 4,5 (logic tường minh trong route, 1 dòng `??` / ternary).
- **Ghi chú (không phải bug, tồn tại từ trước ở `complete_onboarding` v1)**: docs nói "38 categories" nhưng seed thực tế (`005_seed.sql`) chỉ có 35 `is_system=true` categories → 35 + 1 income category = 36 total/household. Không sửa trong story này (ngoài phạm vi).
- `EMERGENCY_FUND_TIMELINE_MONTHS = 12` và công thức `todayRemaining` (AR7) là 2 ASSUMPTION cần DzungDuong confirm — xem Dev Notes phía trên.

### File List

- `supabase/migrations/011_onboarding_v2.sql` (new)
- `src/app/api/onboarding/complete/route.ts` (rewrite)
- `src/lib/validations/onboardingV2.ts` (modified — thêm `completeOnboardingV2Schema`)
- `src/lib/constants/budgetTemplate.ts` (modified — thêm `FLEXIBLE_COST_TYPE_GROUPS`, `EMERGENCY_FUND_TIMELINE_MONTHS`, `calculateFeasibility`, `calculateTodayRemaining`)
- `src/__tests__/validations/onboardingV2.test.ts` (modified)
- `src/lib/constants/__tests__/budgetTemplate.test.ts` (modified)
- `src/lib/validations/onboarding.ts` (deleted — dead code v1)
- `src/lib/hooks/useCompleteOnboarding.ts` (deleted — dead code v1)
- `src/__tests__/validations/onboarding.test.ts` (deleted — dead code v1)

### Testing

| # | Flow | Method | Result |
|---|------|--------|--------|
| 1 | Household mới không có "loại hộ" (dùng default) | Manual DB trace (psql) | Pass — `household_type` không cần truyền, dùng default cột |
| 2 | 36 categories (35 system + 1 income, xem ghi chú discrepancy) + 18 budget lines đúng % | Manual DB trace + automated (`BUDGET_TEMPLATE` length=18, total=100%) | Pass |
| 3 | Income record không gắn `member_id` | Manual DB trace | Pass — `member_id = NULL` xác nhận |
| 4 | Emergency fund dùng `estimateEmergencyTarget` khi `targetAmount=null` | Code trace (`route.ts`: `goal.targetAmount ?? estimateEmergencyTarget(monthlyIncome)`) | Pass |
| 5 | Custom goal dùng `targetAmount`/`targetMonths` y nguyên | Code trace (schema refine đảm bảo non-null khi `fundType !== "emergency"`) | Pass |
| 6 | Feasibility feasible true/false | Automated (`calculateFeasibility` unit tests) | Pass |
| 7 | `todayRemaining` > 0 với income hợp lệ | Automated + manual (income>0, flexiblePct=20% > 0 → luôn dương trừ income=0) | Pass |
| 8 | Rollback khi fail giữa chừng | Manual DB trace (invalid `fund_type` enum → exception giữa transaction, `households` count không đổi) | Pass |
| 9 | Re-onboard → guard exception | Manual DB trace (2 lần gọi cùng `p_user_id`, lần 2 raise "Already onboarded") | Pass |
| 10 | 400 khi income/target ≤ 0 | Automated (Zod schema unit tests) | Pass |

## Change Log

- 03-07-2026: Story created via bmad-create-story workflow.
- 03-07-2026: Implementation complete (Tasks 1-4), all ACs satisfied, 0 regression, all business flows verified.
