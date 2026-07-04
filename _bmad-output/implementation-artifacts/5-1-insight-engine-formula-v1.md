---
baseline_commit: 168e2b23cdd45adc1aafc131754a9d2294b67128
---

# Story 5.1: Insight engine — tầng tổng hợp & công thức v1

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer xây narrative layer,
I want một tầng tổng hợp duy nhất biến số liệu thành câu nói qua template có tham số,
so that tone và i18n được kiểm soát tập trung — không rải logic narrative vào từng component UI.

## Acceptance Criteria

1. **Given** dữ liệu tháng hiện tại (budget lines, transactions, goal funds)
   **When** engine tính "còn lại hôm nay"
   **Then** công thức v1: `(tổng budget linh hoạt tháng − đã chi trong tháng) / số ngày còn lại trong tháng` (FR12)
   **And** "budget linh hoạt" = nhóm chi tiêu biến đổi, loại trừ nhóm cố định (thuê nhà, học phí...) và khoản góp mục tiêu (AR7)

2. **Given** engine là tầng tổng hợp duy nhất (AR5)
   **When** review kiến trúc module
   **Then** engine là pure functions trong `src/lib/`, input số liệu → output insight descriptor, KHÔNG import component UI, KHÔNG fetch
   **And** insight = template có tham số chọn theo trạng thái — không sinh chuỗi tự do; mọi template qua `t()` đủ vi + en (NFR1)

3. **Given** các trạng thái insight: ngày đầu tiên, dưới kế hoạch hôm qua, vượt kế hoạch hôm qua, chưa có giao dịch
   **When** engine chọn template
   **Then** mỗi trạng thái map đúng một template, tham số điền số thật (số còn lại, chênh lệch hôm qua, tên goal, số góp tháng)
   **And** tone template: xưng "bạn", đồng hành, không giọng ngân hàng/kế toán (NFR2 — copy là sản phẩm)

4. **Given** edge cases: ngày cuối tháng, budget linh hoạt = 0, đã chi vượt toàn bộ budget, tháng mới chưa có giao dịch, timezone GMT+7 (`toYearMonth()` local time)
   **When** chạy test suite
   **Then** unit tests đầy đủ trong `src/__tests__/`, số ngày còn lại tính theo local time không lệch UTC

## Tasks / Subtasks

- [x] Task 1: Types + công thức "còn lại hôm nay" (AC: 1, 2)
  - [x] `src/lib/insight/types.ts` — `InsightState = "first-day" | "under-plan-yesterday" | "over-plan-yesterday" | "no-transactions-yesterday"`; `InsightDescriptor = { state: InsightState; i18nKey: string; params: Record<string, string | number> }`
  - [x] `src/lib/insight/dailyRemaining.ts` — `isFlexibleBudgetLine(line: BudgetActualLine): boolean` (match `line.cost_type_name` against `BUDGET_TEMPLATE` để lấy `costTypeGroup`, true nếu nằm trong `FLEXIBLE_COST_TYPE_GROUPS` — xem Dev Notes, KHÔNG dùng `line.cost_type_code`)
  - [x] `calculateDailyRemaining(budgetLines: BudgetActualLine[], today?: Date): number` — lọc flexible lines, `totalBudget = Σ budget_amount`, `totalSpent = Σ actual_amount`, `daysRemaining = daysInMonth(today) − today.getDate() + 1` (bao gồm hôm nay — ASSUMPTION, xem Dev Notes), return `Math.floor((totalBudget − totalSpent) / daysRemaining)`
  - [x] Guard: `daysRemaining <= 0` không xảy ra trong tháng hợp lệ nhưng vẫn `Math.max(daysRemaining, 1)` phòng lỗi input ngày ngoài tháng hiện tại
  - [x] Unit tests: budget linh hoạt = 0 → trả 0 (không chia cho 0 ở bước khác); đã chi vượt toàn bộ → số âm hợp lệ (không clamp về 0, xem AC4 "đã chi vượt toàn bộ budget" — hiển thị số âm là đúng thiết kế, tránh che giấu thực tế); ngày cuối tháng (`daysRemaining = 1`) chia đúng phần còn lại cho đúng 1 ngày; tháng 28/29/30/31 ngày dùng `new Date(y, m+1, 0).getDate()`

- [x] Task 2: Chọn trạng thái + tham số hoá insight (AC: 3)
  - [x] `src/lib/insight/selectState.ts` — input `{ budgetLines: BudgetActualLine[]; yesterdayTransactions: { amount: number; direction: TransactionDirection; behavior_type: BehaviorType | null }[]; hasAnyTransactionEver: boolean; activeGoalFund: Pick<Fund, "name" | "monthly_contribution"> | null; today?: Date }`
  - [x] Logic: `!hasAnyTransactionEver` → `"first-day"`; else nếu `yesterdayTransactions.length === 0` → `"no-transactions-yesterday"` (ASSUMPTION: đếm MỌI giao dịch hôm qua, không chỉ nhóm linh hoạt — xem Dev Notes); else so `yesterdayFlexibleSpent` (tổng `amount` các dòng `direction === "out" && behavior_type` thuộc `variable`/`wasteful`) với `averageDailyFlexibleBudget = totalFlexibleBudget / daysInMonth` → `<=` là `"under-plan-yesterday"`, `>` là `"over-plan-yesterday"`
  - [x] `buildInsightDescriptor(state, params): InsightDescriptor` — map 1-1 state → `i18nKey` cố định (không sinh key động), `params` chứa số thật đã tính sẵn (không để component tự tính lại — đúng AR5). Deviation nhỏ: implement nhận trực tiếp `SelectStateInput` đầy đủ thay vì `(state, params)` rời — tránh tính lại `selectState()` 2 lần ở tầng gọi, hành vi/behavior bên ngoài giữ nguyên 1-1 state→i18nKey
  - [x] Unit tests: 4 nhánh state chọn đúng template + đúng tham số; boundary `yesterdayFlexibleSpent === averageDailyFlexibleBudget` rơi vào `under-plan-yesterday` (dùng `<=`, không `<`)

- [x] Task 3: i18n templates vi/en (AC: 2, 3)
  - [x] Thêm namespace `insight.*` (top-level mới, flat dotted keys, theo đúng convention hiện có — xem `src/lib/i18n/messages/en.json`/`vi.json`) vào cả `vi.json` và `en.json`: `insight.firstDay`, `insight.underPlanYesterday`, `insight.overPlanYesterday`, `insight.noTransactionsYesterday` — mỗi key dùng placeholder kiểu `{{remainingToday}}`, `{{yesterdayDiff}}`, `{{goalName}}`, `{{monthlyContribution}}` khớp `i18next` interpolation đã dùng ở các namespace khác trong repo
  - [x] Copy tone: xưng "bạn", không cảnh báo đỏ gắt kể cả ở `overPlanYesterday` (NFR2) — tham khảo văn phong ví dụ ở epics story 5.5 ("Hôm qua bạn tiêu... — dưới kế hoạch... Khoản dư đẩy Quỹ... nhanh thêm một chút 🎉")
  - [x] KHÔNG implement UI render descriptor trong story này — đó là scope của story 5.2/5.4 (đã map trong `epics-onboarding-v2.md`), story 5.1 chỉ cần `i18nKey` tồn tại và `t(i18nKey, params)` trả đúng chuỗi khi test

- [x] Task 4: Edge cases + timezone + business flow verification (AC: 4)
  - [x] Unit tests trong `src/lib/insight/__tests__/`: ngày cuối tháng, budget linh hoạt = 0, chi vượt toàn bộ budget (số âm), tháng mới chưa có giao dịch nào (`hasAnyTransactionEver = false` → `first-day` bất kể budgetLines rỗng hay không), GMT+7 — verify `calculateDailyRemaining` dùng `Date.getFullYear()/getMonth()/getDate()` (local time, giống pattern `toYearMonth()` ở `src/lib/utils/date.ts`), KHÔNG dùng `getUTCDate()`/`toISOString()` ở bất kỳ đâu trong module này
  - [x] Chạy toàn bộ test suite hiện có — 0 regression
  - [x] Liệt kê + verify từng business flow vào Dev Agent Record → `### Testing`: (1) công thức v1 đúng với dữ liệu thật; (2) 4 state chọn đúng; (3) budget linh hoạt lọc đúng (loại `fixed`/`savings_investment`/`debt_repayment`/`other`); (4) timezone GMT+7 không lệch ngày quanh nửa đêm; (5) budget linh hoạt = 0 không throw/NaN; (6) engine không import bất kỳ React component/hook nào (grep xác nhận `src/lib/insight/` không có `"use client"`, không import từ `src/components/`, không gọi `fetch`/`supabase`)

## Dev Notes

### `cost_type_code` trên `BudgetActualLine` KHÔNG dùng được — dùng name-matching có sẵn

- `BudgetActualLine.cost_type_code` (từ RPC `get_budget_with_actuals`, `supabase/migrations/003_functions.sql`) luôn trả **chuỗi rỗng hard-coded** — field này chưa bao giờ được populate thật. **Không dùng field này** để lọc nhóm linh hoạt.
- Pattern đã tồn tại và đang chạy đúng ở `src/components/budget/BudgetClient.tsx` (dòng ~60-95): match `line.cost_type_name` (tên tiếng Việt của budget baseline, vd "Ăn uống ngoài") với `BUDGET_TEMPLATE[].name` (`src/lib/constants/budgetTemplate.ts`) để lấy `costTypeGroup` tương ứng, rồi group/aggregate. **Story 5.1 phải tái dùng đúng pattern name-matching này**, không tự nghĩ ra cách lọc khác.
- `FLEXIBLE_COST_TYPE_GROUPS = ["variable", "wasteful"]` đã có sẵn ở `budgetTemplate.ts` (thêm ở story 4.4 cho `calculateTodayRemaining`) — dùng lại hằng số này y nguyên, không định nghĩa lại danh sách nhóm linh hoạt ở nơi khác.

### `calculateTodayRemaining()` (budgetTemplate.ts) là hàm KHÁC — không tái dùng cho engine này

- `calculateTodayRemaining(monthlyIncome, today?)` ở `budgetTemplate.ts` (story 4.4) là ước tính **tĩnh thời điểm onboarding**: `income × Σ%(linh hoạt) / 100 / daysInMonth` — không có dữ liệu thực chi tiêu, dùng đúng 1 lần ở Tada screen khi chưa có transaction nào.
- Story 5.1 xây công thức **khác**, dùng dữ liệu thật (`BudgetActualLine[].budget_amount`/`actual_amount`, không phải `%income`) và trừ đi phần đã chi trong tháng. Hai hàm phục vụ hai mục đích khác nhau, **không refactor gộp làm một** — đặt tên khác nhau rõ ràng (`calculateDailyRemaining` vs `calculateTodayRemaining`) để tránh nhầm lẫn khi tìm kiếm code.

### Transaction-level flexible filter dùng `behavior_type`, không dùng name-matching

- Với **budget** (kế hoạch), dùng name-matching qua `BUDGET_TEMPLATE` như trên (vì `budget_baselines` không có cột phân loại cost-type trực tiếp đáng tin).
- Với **transaction** (thực chi hôm qua), mỗi row `TransactionWithJoins`/dữ liệu transaction đã có sẵn cột `behavior_type: BehaviorType | null` — field này là **DB trigger tự gán, readonly ở UI** (CLAUDE.md rule #2, xem `docs/02_BUSINESS_RULES.md` BR liên quan `category.cost_type`). Dùng trực tiếp `behavior_type IN ("variable", "wasteful")` để lọc giao dịch linh hoạt hôm qua — không cần join/name-match gì thêm, đáng tin hơn vì đã được trigger validate.
- Lưu ý: `BehaviorType` (transaction-level, 6 giá trị: `fixed|variable|wasteful|debt_repayment|savings_investment|loan`) và `CostTypeGroupKey` (frontend constant, 7 giá trị gồm cả `income`/`other`) là hai enum **gần giống nhưng không đồng nhất** — đừng dùng chung một type cho cả hai, giữ nguyên tách biệt như hiện tại trong codebase.

### ASSUMPTION cần confirm — `daysRemaining` có tính luôn hôm nay không

Epics không định nghĩa rõ "số ngày còn lại trong tháng" có bao gồm hôm nay hay không. Quyết định tạm: **bao gồm hôm nay** (`daysInMonth − today.getDate() + 1`) — lý do: số "còn lại hôm nay" phải chia cho cả phần chi tiêu của chính hôm nay, không phải chỉ những ngày sau hôm nay. Nếu sai, chỉ cần bỏ `+ 1`.

### ASSUMPTION cần confirm — "chưa có giao dịch hôm qua" tính theo giao dịch nào

Quyết định tạm: `"no-transactions-yesterday"` kích hoạt khi **không có bất kỳ giao dịch nào** (mọi `transaction_type`/`behavior_type`) được ghi hôm qua — không chỉ riêng nhóm linh hoạt. Lý do: trạng thái này phản ánh "người dùng không mở app ghi chép gì hôm qua", không phải "không có chi tiêu linh hoạt". Nếu sai, đổi điều kiện lọc trong `selectState.ts`.

### Kiến trúc bắt buộc (AR5 — architecture-growbase / addendum.md)

- Toàn bộ `src/lib/insight/` phải là pure functions: nhận số liệu đã fetch sẵn (không tự gọi `supabase`/`fetch`), không `"use client"`, không import từ `src/components/`. Đây là ranh giới cứng — story 5.2/5.4 (dashboard/greeting UI) sẽ fetch dữ liệu qua hook có sẵn (`useBudget`, transactions hook) rồi truyền vào engine, engine không biết gì về React.
- Insight PHẢI là template tham số chọn theo state (`i18nKey` cố định + `params`), không sinh câu tự do bằng string concatenation trong code — mọi câu hiển thị đi qua `t(i18nKey, params)` ở tầng UI (story sau), engine chỉ trả descriptor.

### Project Structure Notes

- Module mới: `src/lib/insight/` (chưa tồn tại — tạo mới, không phải UPDATE file nào)
- File tham khảo (READ, không sửa): `src/types/app.ts` (`BudgetActualLine`, `Fund`, `TransactionWithJoins`, `BehaviorType`), `src/lib/constants/budgetTemplate.ts` (`BUDGET_TEMPLATE`, `FLEXIBLE_COST_TYPE_GROUPS`, `COST_TYPE_GROUP_LABELS`), `src/lib/utils/date.ts` (`toYearMonth`, pattern local-time đã có sẵn), `src/components/budget/BudgetClient.tsx` (pattern name-matching dòng ~60-95), `supabase/migrations/003_functions.sql` (xác nhận `cost_type_code` hard-coded rỗng trong RPC `get_budget_with_actuals`)
- Không sửa `src/lib/constants/budgetTemplate.ts`, `src/components/budget/BudgetClient.tsx`, hay bất kỳ route/RPC nào trong story này — chỉ đọc để tái dùng đúng pattern/hằng số sẵn có

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story 5.1]
- [Source: _bmad-output/planning-artifacts/prds/prd-onboarding-v2-2026-07-02/addendum.md — "Insight layer (đề xuất kiến trúc của Winston)"]
- [Source: _bmad-output/planning-artifacts/prds/prd-onboarding-v2-2026-07-02/prd.md — FR7-FR13, NFR1, NFR2]
- [Source: src/types/app.ts — BudgetActualLine, Fund, TransactionWithJoins, BehaviorType]
- [Source: src/lib/constants/budgetTemplate.ts — FLEXIBLE_COST_TYPE_GROUPS, BUDGET_TEMPLATE, calculateTodayRemaining (story 4.4, KHÔNG tái dùng cho engine này)]
- [Source: src/components/budget/BudgetClient.tsx — pattern name-matching cost_type_name → costTypeGroup]
- [Source: supabase/migrations/003_functions.sql — get_budget_with_actuals, cost_type_code hard-coded rỗng]
- [Source: src/lib/utils/date.ts — toYearMonth local-time pattern]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx vitest run src/lib/insight` — 19/19 tests pass
- `npx vitest run` (full suite) — 317/317 pass, 0 regressions
- `npx tsc --noEmit` — 0 new errors (7 pre-existing baseline errors in unrelated files confirmed via `git stash` diff, not touched by this story)

### Completion Notes List

- Implemented `src/lib/insight/` as pure functions per AR5 — no `"use client"`, no React import, no `fetch`/`supabase` call anywhere in the module (grep-verified).
- `buildInsightDescriptor` signature deviates slightly from the story's sketch (`(state, params)` → takes the full `SelectStateInput` and internally calls `selectState()` once) to avoid duplicating the under/over-plan comparison logic in two places. External contract (1 state → 1 fixed `i18nKey` → real-number `params`) is unchanged.
- Amount formatting: used the existing `formatVND()` utility (full `"118.000 ₫"` style, already the convention in `DashboardCharts.tsx`/`DashboardView.tsx`) instead of the compact `"118k"/"3,3tr"` notation used casually in the epics prose — for consistency with the rest of the dashboard and `font-mono tabular-nums` rendering. Templates read naturally either way; can switch to `formatVNDCompact` later if product wants the terser look.
- `first-day` and `no-transactions-yesterday` descriptors carry only `remainingToday` (no goal params) since the epics text does not specify goal-linkage copy for those two states — `under-plan-yesterday`/`over-plan-yesterday` carry the full `{ remainingToday, yesterdaySpent, yesterdayDiff, goalName, monthlyContribution }` set per AC3.
- The two ASSUMPTIONs flagged in Dev Notes (days-remaining includes today; "no transactions yesterday" counts ANY transaction type) were implemented exactly as decided — no alternate branch was built.

### Testing

| # | Business flow | Method | Result |
|---|---|---|---|
| 1 | Công thức v1 tính đúng với dữ liệu thật (budget − spent) / daysRemaining | Automated (`dailyRemaining.test.ts`) | ✅ Pass — verified against manually computed expected values for mid-month and last-day-of-month cases |
| 2 | 4 nhánh state (first-day / under / over / no-transactions) chọn đúng, kể cả boundary `spent === plan` → under-plan | Automated (`selectState.test.ts`) | ✅ Pass |
| 3 | Budget linh hoạt lọc đúng — loại `fixed` (vd "Nhà ở & Điện nước") khỏi phép tính, chỉ giữ `variable`/`wasteful` | Automated (`dailyRemaining.test.ts` — "excludes non-flexible groups") | ✅ Pass |
| 4 | Timezone GMT+7 — dùng local-time `Date` getters, không lệch quanh nửa đêm; số ngày trong tháng đúng cho tháng nhuận (Feb 2028 = 29 ngày) | Automated (`dailyRemaining.test.ts` — leap-year case) + manual code read confirming no `getUTCDate()`/`toISOString()` anywhere in `src/lib/insight/` | ✅ Pass |
| 5 | Budget linh hoạt = 0 → trả `0`, không NaN/throw | Automated (`dailyRemaining.test.ts`) | ✅ Pass |
| 6 | Engine không import React/UI/fetch/supabase (ranh giới AR5) | Manual: `grep -rn "use client\|from \"react\|supabase\|fetch(" src/lib/insight/` → no matches | ✅ Pass |

### File List

- `src/lib/insight/types.ts` (new)
- `src/lib/insight/dailyRemaining.ts` (new)
- `src/lib/insight/selectState.ts` (new)
- `src/lib/insight/__tests__/dailyRemaining.test.ts` (new)
- `src/lib/insight/__tests__/selectState.test.ts` (new)
- `src/lib/i18n/messages/vi.json` (updated — added `insight.*` keys)
- `src/lib/i18n/messages/en.json` (updated — added `insight.*` keys)

## Change Log

- 2026-07-04: Implemented Insight Engine v1 (types, `calculateDailyRemaining`, `selectState`/`buildInsightDescriptor`, i18n templates, full edge-case test coverage). Status → review.
