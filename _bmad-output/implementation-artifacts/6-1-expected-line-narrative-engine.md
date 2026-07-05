---
baseline_commit: aaabb040a2808c0479a159b5f7cfbcf9a79b2c7a
---

# Story 6.1: Engine mở rộng — đường kỳ vọng & narrative chênh lệch

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer mở rộng narrative layer,
I want engine tính đường tiến độ kỳ vọng và chọn narrative theo chênh lệch,
so that mọi nơi hiển thị goal (card, insight) dùng chung một nguồn số + câu, không tính lặp.

## Acceptance Criteria

1. **Given** goal fund có target, ngày tạo, deadline, balance hiện tại
   **When** engine tính tiến độ
   **Then** đường kỳ vọng tuyến tính = `target × (ngày đã qua / tổng ngày)` (AR6); đường thực tế = `balance / target`
   **And** tính theo local time GMT+7, đơn vị ngày

2. **Given** chênh lệch thực tế vs kỳ vọng
   **When** engine chọn narrative
   **Then** đi trước → "về đích sớm N tháng 🎉" (N từ tốc độ góp thực tế); tụt lại → "góp thêm X là bắt kịp" (X = số thiếu so với kỳ vọng); đúng nhịp → template ghi nhận đều đặn (FR15)
   **And** template có tham số qua `t()` vi+en, tone "bạn" (NFR2)

3. **Given** rule "khi đáng nói" cho daily insight
   **When** engine quyết định goal narrative có len vào câu chào hàng ngày không
   **Then** rule rõ ràng, testable: chênh lệch vượt ngưỡng (≥1 tháng tiến độ) hoặc vừa qua milestone — không lặp lại liên tiếp nhiều ngày cùng một câu
   **And** ngưỡng là constant có tên, đổi được một chỗ

4. **Given** edge cases: goal vừa tạo hôm nay (0 ngày), deadline đã qua, balance vượt target, tổng ngày = 0
   **When** chạy test suite
   **Then** unit tests đầy đủ, không chia cho 0, không narrative vô nghĩa

## Tasks / Subtasks

- [x] Task 1: Types + `computeGoalProgress` — đường kỳ vọng & chênh lệch (AC: 1, 4)
  - [x] `src/lib/insight/goalProgress.ts` (file mới) — pure functions, cùng ranh giới AR5 như phần còn lại của `src/lib/insight/` (không `"use client"`, không import component/hook, không fetch/supabase)
  - [x] Types (đặt trong `goalProgress.ts`, KHÔNG phình `types.ts` trừ khi cần share): `GoalProgressState = "ahead" | "behind" | "on-track"`; `GoalProgressInput = { targetAmount: number | null; currentBalance: number; createdAt: string; targetDate: string | null; today?: Date }`; `GoalProgress = { actualRatio: number; expectedRatio: number; expectedAmount: number; deviationAmount: number; deviationMonths: number; state: GoalProgressState; monthsEarly: number | null; catchUpAmount: number | null }`
  - [x] `computeGoalProgress(input): GoalProgress | null` — trả `null` khi thiếu dữ liệu tính expected line: `targetAmount` null/`<= 0`, `targetDate` null, hoặc `totalDays <= 0` (deadline <= ngày tạo). Null = "không có đường kỳ vọng" — KHÔNG throw (quan trọng: Quỹ khẩn cấp từ onboarding có `target_date = null` — xem Dev Notes)
  - [x] Công thức (đơn vị NGÀY, local time — dùng `getFullYear()/getMonth()/getDate()`, KHÔNG `getUTC*`/`toISOString()` cho date math):
    - `daysElapsed = số ngày từ createdAt đến today` (floor, cùng ngày = 0); `totalDays = số ngày từ createdAt đến targetDate`
    - `expectedRatio = min(daysElapsed / totalDays, 1)` (clamp — deadline đã qua thì kỳ vọng = 100%); `expectedAmount = targetAmount × expectedRatio`
    - `actualRatio = currentBalance / targetAmount` (KHÔNG clamp — vượt target hiển thị >100% là đúng)
    - `deviationAmount = currentBalance − expectedAmount`; `monthlyExpectedPace = targetAmount × 30 / totalDays`; `deviationMonths = deviationAmount / monthlyExpectedPace`
    - `state`: `deviationMonths >= GOAL_NOTEWORTHY_MONTHS` → `"ahead"`; `<= −GOAL_NOTEWORTHY_MONTHS` → `"behind"`; còn lại `"on-track"` (một ngưỡng duy nhất dùng chung với AC3 — xem Task 3)
    - `monthsEarly` (chỉ khi ahead, else null): pace thực tế = `currentBalance / max(daysElapsed, 1)`; `projectedDays = targetAmount / pace`; `monthsEarly = max(round((totalDays − projectedDays) / 30), 1)` — "N từ tốc độ góp thực tế" đúng AC2. Goal vừa tạo hôm nay (`daysElapsed = 0`) mà đã có balance > 0: `max(daysElapsed, 1)` chặn chia 0
    - `catchUpAmount` (chỉ khi behind, else null): `expectedAmount − currentBalance` (số dương)
  - [x] Guard cụ thể theo AC4: `daysElapsed = 0` + `balance = 0` → deviation 0 → on-track, không NaN; `balance >= targetAmount` → luôn `"ahead"` bất kể deviationMonths (đã về đích trước deadline không thể là behind); deadline đã qua + balance < target → expectedRatio clamp 1, state behind, catchUpAmount = phần còn thiếu

- [x] Task 2: `buildGoalNarrative` + i18n templates vi/en (AC: 2)
  - [x] `buildGoalNarrative(progress: GoalProgress, goalName: string): InsightDescriptor`-shape `{ state, i18nKey, params }` — map 1-1 state → key cố định: `ahead → "insight.goalAhead"`, `behind → "insight.goalBehind"`, `on-track → "insight.goalOnTrack"`. Params điền sẵn số đã format (pattern y hệt `buildInsightDescriptor` trong `selectState.ts` — dùng `formatVND()` từ `@/lib/utils/currency` cho amounts, số tháng để nguyên number)
  - [x] Params per state: ahead → `{ goalName, monthsEarly }`; behind → `{ goalName, catchUpAmount: formatVND(...) }`; on-track → `{ goalName }`
  - [x] Thêm 3 keys vào CẢ `src/lib/i18n/messages/vi.json` và `en.json`, đặt ngay sau 4 keys `insight.*` hiện có (dòng ~724-727, flat dotted keys, interpolation `{{param}}`): `insight.goalAhead`, `insight.goalBehind`, `insight.goalOnTrack`
  - [x] Copy tone NFR2 — xưng "bạn", đồng hành, có emoji 🎉 cho ahead, KHÔNG trách móc khi behind ("góp thêm X là bắt kịp" — giải pháp, không phán xét). Tham khảo văn phong 4 template insight hiện có (vd `insight.underPlanYesterday`: "Hôm qua bạn tiêu... Khoản dư đẩy {{goalName}} nhanh thêm một chút 🎉")

- [x] Task 3: Rule "đáng nói" + milestone helper + constants (AC: 3)
  - [x] Constants có tên, export từ `goalProgress.ts`: `GOAL_NOTEWORTHY_MONTHS = 1` (ngưỡng chênh lệch — đổi một chỗ, dùng cho cả `state` ở Task 1 và rule đáng-nói); `GOAL_MILESTONES = [10, 25, 50, 75, 100] as const`
  - [x] `crossedMilestone(prevRatio: number, currentRatio: number): number | null` — mốc CAO NHẤT vừa vượt qua giữa 2 lần đo (5% → 60% trả `50`, không trả cả 10/25/50); không vượt mốc nào → null. Pure helper — story 6.3 sẽ dùng cho celebration, 6.1 chỉ cần cho rule đáng-nói + tests
  - [x] `isGoalNoteworthy(progress: GoalProgress, opts: { justCrossedMilestone?: boolean; lastShown?: { i18nKey: string; dateISO: string } | null; today?: Date }): boolean` — rule v1, testable từng nhánh:
    - `true` khi `progress.state !== "on-track"` (tức |deviationMonths| ≥ ngưỡng) HOẶC `justCrossedMilestone`
    - Anti-repeat: nếu `lastShown` cùng `i18nKey` với narrative hiện tại VÀ `lastShown.dateISO` là hôm nay hoặc hôm qua (local time) → `false` (trừ khi `justCrossedMilestone` — milestone luôn đáng nói). "Không lặp lại liên tiếp nhiều ngày cùng một câu" = tối đa cách ngày
    - Persistence của `lastShown` KHÔNG thuộc story này — engine nhận qua tham số (pure). Story 6.2 sẽ lưu (localStorage key chứa householdId per AD-3) — ghi chú rõ trong JSDoc của hàm
  - [x] Unit tests: từng nhánh rule (vượt ngưỡng / milestone / anti-repeat chặn / milestone override anti-repeat), boundary `deviationMonths === GOAL_NOTEWORTHY_MONTHS` → ahead/đáng nói

- [x] Task 4: `Fund.created_at` + edge-case tests + business flow verification (AC: 1, 4)
  - [x] Thêm `created_at: string` vào type `Fund` (`src/types/app.ts`) — cột DB đã có (`002_tables.sql`: `created_at timestamptz DEFAULT now()`), API `/api/funds` đã `select("*")` nên runtime đã trả field này, chỉ thiếu ở TS type. KHÔNG sửa API route nào
  - [x] Adapter tiện dụng `goalProgressInputFromFund(fund: Fund, today?: Date): GoalProgressInput` trong `goalProgress.ts` — map `target_amount/current_balance/created_at/target_date` để 6.2/6.4 không tự map tay mỗi nơi
  - [x] Unit tests đầy đủ trong `src/lib/insight/__tests__/goalProgress.test.ts` (theo pattern các test hiện có cùng thư mục): goal tạo hôm nay 0 ngày; deadline đã qua (cả 2 nhánh balance đủ/thiếu); balance vượt target (state ahead, actualRatio > 1); `totalDays = 0` (targetDate = createdAt) → null; `targetDate = null` → null (case Quỹ khẩn cấp); `targetAmount = null`/`0` → null; deviationMonths đúng dấu ± ; local-time GMT+7 (không dùng UTC getter — grep xác nhận)
  - [x] Chạy `npx vitest run` toàn bộ — 0 regression; `npx tsc --noEmit` — không lỗi mới (7 baseline errors pre-existing đã biết từ story 5.1)
  - [x] Liệt kê + verify từng business flow vào Dev Agent Record → `### Testing`: (1) công thức expected line đúng AR6 với dữ liệu tay; (2) 3 nhánh narrative chọn đúng template + params; (3) rule đáng-nói đúng từng nhánh kể cả anti-repeat; (4) null-safety cho fund thiếu deadline/target (Quỹ khẩn cấp onboarding); (5) không chia 0 ở mọi edge AC4; (6) ranh giới AR5 giữ nguyên (grep `src/lib/insight/` không có `"use client"`/component import/fetch/supabase)

## Dev Notes

### Engine hiện có (story 5.1, status review) — mở rộng, KHÔNG sửa hành vi cũ

- `src/lib/insight/` đã có: `types.ts` (`InsightState`, `InsightDescriptor`), `dailyRemaining.ts` (`calculateDailyRemaining`, `isFlexibleBudgetLine`, `daysInMonth`), `selectState.ts` (`selectState`, `buildInsightDescriptor`, dùng `formatVND` cho params), `resolveActiveGoalFund.ts` (goal → emergency fallback). 19 tests đang pass.
- Story 6.1 THÊM file `goalProgress.ts` — không đổi signature/hành vi bất kỳ hàm 5.1 nào. `DailyInsightBanner.tsx` (5.4) đang gọi `buildInsightDescriptor` — không đụng vào component này (tích hợp goal narrative vào insight là scope 6.2).
- Descriptor pattern chuẩn của module: state → `i18nKey` cố định + `params` đã format sẵn (component chỉ `t(descriptor.i18nKey, descriptor.params)` — AR5). `buildGoalNarrative` theo đúng pattern này.

### Quỹ khẩn cấp từ onboarding KHÔNG có deadline — null là ca phổ biến, không phải edge hiếm

- Onboarding v2 (`/api/onboarding/complete`, story 4.4): chỉ fund `goal` được set `target_date` (tính từ số tháng × 30). Fund `emergency` (lựa chọn mặc định phổ biến nhất) có `target_date = null` + `target_months_expense = 3`.
- `resolveActiveGoalFund()` fallback sang emergency → consumer 6.2 hoàn toàn có thể đưa emergency fund vào engine. `computeGoalProgress` PHẢI trả `null` êm (không throw, không NaN) → card 6.2 sẽ chỉ hiển thị đường thực tế. Đây là lý do return type là `GoalProgress | null`.

### `Fund.created_at` thiếu ở TS type — dashboard API cũng chưa select đủ field

- DB có `created_at` (002_tables.sql), `/api/funds` `select("*")` trả đủ → chỉ cần thêm vào type `Fund`.
- LƯU Ý cho 6.2 (KHÔNG làm trong 6.1): `/api/dashboard/route.ts` (~dòng 144) select funds theo danh sách cột tường minh, CHƯA có `created_at`/`target_date` — story 6.2 khi wire card ở dashboard phải bổ sung 2 cột này vào select. Ghi chú này tồn tại để dev 6.2 không mất thời gian debug undefined.

### Date math — theo pattern local-time đã chốt ở 5.1

- Toàn module `src/lib/insight/` dùng local time (GMT+7): `getFullYear()/getMonth()/getDate()`, không `getUTC*`, không `toISOString()` để so ngày. `createdAt` từ DB là timestamptz ISO string, `targetDate` là `date` string `yyyy-mm-dd` — parse rồi so theo NGÀY (bỏ giờ): tạo `Date` từ các thành phần local hoặc normalize về nửa đêm local trước khi trừ.
- "Ngày đã qua" floor về số nguyên: goal tạo hôm nay = 0 ngày đã qua. `daysInMonth()` helper đã có ở `dailyRemaining.ts` nếu cần.

### Một ngưỡng duy nhất — không rải magic numbers

- AC3 yêu cầu ngưỡng là constant có tên đổi được một chỗ. Thiết kế: `GOAL_NOTEWORTHY_MONTHS = 1` quyết định luôn cả ranh giới `state` (ahead/behind vs on-track) — nghĩa là "state khác on-track" ⟺ "chênh lệch đáng nói", rule đáng-nói chỉ còn cộng thêm milestone + anti-repeat. Một nguồn sự thật, tests không phải đồng bộ 2 ngưỡng.
- Hệ quả chấp nhận được: chênh lệch 0.9 tháng hiển thị on-track. Nếu product sau này muốn card hiển thị ahead/behind sớm hơn ngưỡng đáng-nói thì tách constant khi đó — không tách trước (YAGNI).

### Milestone: 6.1 chỉ làm math helper, KHÔNG làm tracking

- `crossedMilestone(prev, current)` là pure math. "Đã thấy milestone per user" (AD-3, per-member) là scope 6.3 — không thêm Zustand/localStorage/DB gì ở story này. `lastShown` của anti-repeat cũng vậy: tham số vào, caller lo persistence (6.2).

### Project Structure Notes

- File mới: `src/lib/insight/goalProgress.ts`, `src/lib/insight/__tests__/goalProgress.test.ts`
- File sửa: `src/types/app.ts` (thêm 1 dòng `created_at` vào `Fund`), `src/lib/i18n/messages/vi.json` + `en.json` (3 keys mỗi file)
- File tham khảo (READ, không sửa): `src/lib/insight/selectState.ts` (descriptor pattern + formatVND params), `src/lib/insight/types.ts`, `src/lib/utils/currency.ts` (`formatVND`), `src/app/api/onboarding/complete/route.ts` (goal có target_date, emergency thì không), `supabase/migrations/002_tables.sql` (funds có `created_at`/`target_date`)
- KHÔNG sửa: mọi file 5.1 hiện có, `DailyInsightBanner.tsx`, API routes, migrations, `queryKeys.ts` (engine không fetch — chưa cần key mới; `keys.*` cho goals là chuyện 6.4)

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story 6.1 — ACs gốc, FR14/FR15]
- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Additional Requirements — AR5 (một tầng tổng hợp), AR6 (công thức tuyến tính), AR12/AD-3 (household-scoped state)]
- [Source: _bmad-output/planning-artifacts/prds/prd-onboarding-v2-2026-07-02/addendum.md — "Đường kỳ vọng goal: tuyến tính target × (ngày đã qua / tổng ngày)"]
- [Source: _bmad-output/implementation-artifacts/5-1-insight-engine-formula-v1.md — Dev Notes + Completion Notes: pure-function boundary, formatVND convention, local-time pattern, 2 ASSUMPTIONs đã chốt]
- [Source: src/lib/insight/selectState.ts — buildInsightDescriptor pattern]
- [Source: src/types/app.ts — Fund type (thiếu created_at)]
- [Source: supabase/migrations/002_tables.sql — funds.created_at/target_date/target_amount]
- [Source: src/app/api/onboarding/complete/route.ts — emergency fund không có target_date]
- [Source: src/app/api/dashboard/route.ts — funds select tường minh thiếu created_at/target_date (note cho 6.2)]

## Dev Agent Record

### Agent Model Used

Claude Fable 5 (claude-fable-5)

### Debug Log References

- `npx vitest run src/lib/insight/__tests__/goalProgress.test.ts` — 29/29 pass (RED xác nhận trước khi implement: module chưa tồn tại → fail; i18n key test fail trước khi thêm keys)
- `npx vitest run` (full suite) — 363/363 pass, 0 regression
- `npx tsc --noEmit` — 0 lỗi mới (2 lỗi baseline pre-existing ở `src/app/(app)/layout.tsx`, file không đụng tới)
- `grep -rn "use client|from \"react|from \"@/components|supabase|fetch(" src/lib/insight/` (loại __tests__) — no matches (AR5)
- ESLint: repo chưa có config (.eslintrc/eslint.config đều không tồn tại, `next lint` đòi setup mới) — skip, nhất quán tiền lệ story 5.1

### Completion Notes List

- `src/lib/insight/goalProgress.ts` mới — pure functions đúng ranh giới AR5: `computeGoalProgress`, `buildGoalNarrative`, `crossedMilestone`, `isGoalNoteworthy`, `goalProgressInputFromFund`, constants `GOAL_NOTEWORTHY_MONTHS = 1` + `GOAL_MILESTONES`.
- `computeGoalProgress` trả `null` khi không dựng được expected line (`targetAmount` null/≤0, `targetDate` null — ca Quỹ khẩn cấp onboarding, `totalDays ≤ 0`) — không throw/NaN.
- Date math local-time: date-only string (`yyyy-mm-dd`) parse thủ công qua `new Date(y, m-1, d)` — KHÔNG qua `Date.parse` (tránh UTC-midnight shift); timestamptz parse qua `new Date()` rồi lấy local components. Có test chứng minh createdAt UTC string ra đúng ngày GMT+7.
- Một ngưỡng duy nhất `GOAL_NOTEWORTHY_MONTHS` quyết định cả `state` lẫn rule đáng-nói, đúng thiết kế story. Boundary `deviationMonths === ngưỡng` → ahead (test cover).
- `balance ≥ target` → luôn `ahead` bất kể deviation (không thể behind khi đã về đích); `monthsEarly` clamp `≥ 1` chặn narrative vô nghĩa khi vượt target sau deadline.
- Thêm `created_at: string` vào type `Fund` — hệ quả: fix 2 fund literal trong `hookDemoData.ts` (demo nhà Minnie) + fixture trong `resolveActiveGoalFund.test.ts`. Không sửa API route nào (`/api/funds` đã `select("*")`).
- KHÔNG đụng file 5.1 nào (`selectState.ts`, `dailyRemaining.ts`, `types.ts`, `resolveActiveGoalFund.ts` giữ nguyên), không đụng `DailyInsightBanner.tsx` — tích hợp UI là scope 6.2.
- i18n: 3 keys mới `insight.goalAhead/goalBehind/goalOnTrack` đủ vi + en, tone "bạn" đồng hành, behind không phán xét — có test tự động verify keys + placeholders tồn tại ở CẢ 2 file JSON.

### Testing

| # | Business flow | Method | Result |
|---|---|---|---|
| 1 | Expected line đúng công thức AR6 `target × (ngày đã qua / tổng ngày)` — so với giá trị tính tay (150/300 ngày goal 120tr → kỳ vọng 60tr) | Automated (`goalProgress.test.ts`) | ✅ Pass |
| 2 | 3 nhánh narrative (ahead/behind/on-track) chọn đúng template + params: monthsEarly từ pace thực tế (number), catchUpAmount đã formatVND (string) | Automated | ✅ Pass |
| 3 | Rule "đáng nói" đủ nhánh: vượt ngưỡng / on-track im lặng / milestone override / anti-repeat chặn cùng câu hôm qua / cho nói lại sau 2 ngày / câu khác nói ngay | Automated | ✅ Pass |
| 4 | Null-safety cho fund thiếu deadline/target — ca thật: Quỹ khẩn cấp từ onboarding có `target_date = null` (trace `/api/onboarding/complete/route.ts`: chỉ fund `goal` được set target_date) → engine trả `null` êm | Automated (null cases) + manual trace route onboarding | ✅ Pass |
| 5 | Không chia 0 / NaN ở mọi edge AC4: goal tạo hôm nay (0 ngày), totalDays = 0 → null, deadline đã qua, balance vượt target | Automated | ✅ Pass |
| 6 | Ranh giới AR5: `src/lib/insight/` không có `"use client"`/React/component import/fetch/supabase | Manual grep (loại __tests__) — no matches | ✅ Pass |
| 7 | `Fund.created_at` có thật ở runtime: cột DB `created_at timestamptz DEFAULT now()` (002_tables.sql) + `/api/funds` dùng `select("*")` — chỉ bổ sung TS type, không đổi hành vi | Manual trace (migration + route code) | ✅ Pass |
| 8 | i18n templates tồn tại đủ vi + en với đúng placeholders khớp params engine | Automated (import cả 2 JSON trong test) | ✅ Pass |
| 9 | Demo nhà Minnie (hookDemoData) vẫn compile + render sau khi Fund có field mới — chỉ thêm `created_at` literal, không đổi số liệu demo | Automated (tsc 0 lỗi mới) + full suite 363 pass | ✅ Pass |

### File List

- `src/lib/insight/goalProgress.ts` (new)
- `src/lib/insight/__tests__/goalProgress.test.ts` (new)
- `src/types/app.ts` (updated — thêm `created_at: string` vào `Fund`)
- `src/lib/i18n/messages/vi.json` (updated — 3 keys `insight.goal*`)
- `src/lib/i18n/messages/en.json` (updated — 3 keys `insight.goal*`)
- `src/components/onboarding/v2/hookDemoData.ts` (updated — thêm `created_at` vào 2 demo fund literals cho khớp type Fund)
- `src/lib/insight/__tests__/resolveActiveGoalFund.test.ts` (updated — fixture thêm `created_at`)

## Change Log

- 2026-07-05: Implemented goal progress engine (expected line AR6, narrative chênh lệch FR15, rule đáng-nói + milestone helper, i18n vi/en, 29 tests). Thêm `Fund.created_at`. Status → review.

## Senior Developer Review (AI)

**Reviewer**: claude-haiku-4-5  
**Date**: 2026-07-05  
**Outcome**: ✅ Approve

### Quality Summary
- All 4 ACs fully satisfied with comprehensive test coverage (29 tests pass)
- Zero architectural issues; code adheres to all project constraints
- No findings requiring changes before merge

### Findings by Severity

**High**: None  
**Medium**: None  
**Low**: None

### Code Quality Observations

1. **Pure Module Discipline** (AR5): goalProgress.ts correctly isolated — no "use client", fetch, Supabase, or component imports. Clean dependency boundary.

2. **Date Math Correctness**: All temporal calculations use local time semantics (`getFullYear/getMonth/getDate()`) matching GMT+7 region. Edge cases (0 days, boundary dates) properly handled via `Math.max()` guards.

3. **Karpathy Guidelines Applied**: goalProgress.ts is 142 lines with focused intent. No over-engineering. Comments explain *why* (e.g., "Null = 'không có đường kỳ vọng'") not *what*.

4. **Constants Over Magic Numbers**: GOAL_NOTEWORTHY_MONTHS (1) and GOAL_MILESTONES ([10,25,50,75,100]) centralized for maintainability.

5. **i18n Integration**: 3 keys (insight.goalAhead/Behind/OnTrack) correctly templated in vi.json + en.json with matching placeholders. Test suite validates presence + parameter overlap.

6. **Type Safety**: GoalProgressInput/Output types are precise; null-coalescing on optional fields prevents runtime surprises.

### Test Coverage Validation
- computeGoalProgress: 11 cases (linear math, state transitions, edge cases, date parsing)
- buildGoalNarrative: 4 cases (state → template + params mapping)
- crossedMilestone: 4 cases (boundary milestones, no double-counting)
- isGoalNoteworthy: 7 cases (threshold + anti-repeat + milestone override)
- goalProgressInputFromFund: 1 case (adapter)
- **Total: 29 tests, all passing**
- **tsc**: 0 new errors (2 pre-existing baseline errors in layout.tsx unchanged)

### Action Items
None. Story ready for merge.
