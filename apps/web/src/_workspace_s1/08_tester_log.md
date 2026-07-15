# Tester Log: S1 — Auth + Onboarding Wizard

## Test files created
- `src/__tests__/stores/wizardStore.test.ts` — 34 tests — canProceed() gating per step, stepOrder/totalSteps (personal vs family), totalIncome, debtPct (div-by-zero guard + multi-debt), totalBudgetPct (init=100, sum=0), setDebts auto-sync 'Chi trả nợ' (BR-BU-002) incl. rounding + restore template default + không ảnh hưởng line khác, next()/prev() navigation (skip step 2 personal, biên đầu/cuối), reset().
- `src/__tests__/validations/onboarding.test.ts` — 26 tests — incomeSourceSchema (positive amount, sourceName non-empty, memberId uuid/null), debtSchema (4 valid debt_types + reject 'other', monthlyPayment positive, totalAmount nonnegative cho M3-không-apply), budgetSetupSchema per-line [0,100], completeOnboardingSchema refine tổng <=100 + message/path + required incomes/accounts + debts optional + householdId uuid.
- `src/__tests__/stores/wizardStore.regression.test.ts` — 4 tests — debt step KHÔNG INSERT sớm (setDebts không gọi fetch, chỉ mutate store), 'Chi trả nợ' lock khớp chính xác debtPct() khi debts>0 + cập nhật khi debts thay đổi.
- `src/__tests__/setup/localStorage.ts` — setup shim (không phải test) — cung cấp `localStorage` cho test env `node` để zustand persist middleware không cảnh báo "storage unavailable". Đăng ký qua `setupFiles` trong vitest.config.ts.

## Files modified
- `vitest.config.ts` — thêm `setupFiles: ["./src/__tests__/setup/localStorage.ts"]`.

## Coverage summary
- WizardStore (state machine): 38/38 behaviors tested (34 unit + 4 regression) — toàn bộ computed selectors + actions + navigation.
- Schemas (onboarding): 5/5 schemas tested (income/account-via-complete/debt/budgetSetup/completeOnboarding). 26 cases.
- Utils: KHÔNG viết thêm — currency.test.ts (8) + budget.test.ts (10) + date.test.ts (14) + budgetTemplate.test.ts (11) đã tồn tại và đầy đủ.
- Components: 0 — theo chỉ định, KHÔNG test DOM wizard components (quá tốn, logic đã nằm ở store + validations).
- API routes: 0 — out of scope cho lần này (chỉ định tập trung store + validations).

## Total
- 64 tests mới, tất cả pass.
- Full suite: `vitest run` → **116/116 pass** (8 test files). `tsc --noEmit` → 0 errors.

## Tests skipped / không viết
- **Priority 3 (currency/budget utils)**: bỏ qua vì đã có coverage đầy đủ sẵn. Lưu ý 2 điểm khác với mô tả task:
  - `formatVND` dùng ký hiệu ICU `₫` (U+20AB), KHÔNG phải `"đ"`. Test hiện có dùng `₫` + normalize NBSP→space. Output thực: `formatVND(1000000)` = `"1.000.000 ₫"`, `formatVND(0)` = `"0 ₫"`.
  - `getBudgetStatus(actual, budget)` trả `"safe"|"warning"|"danger"` (KHÔNG phải `"over"|"good"`). Boundary `actual = budget*0.8` → `"safe"` (strict `>` đúng như conventions gotcha). budget.test.ts đã cover.
- **Component DOM tests**: skip theo chỉ định.
- **API route tests**: ngoài scope đợt này.

## Known failures
- Không có. 116/116 pass.

## Ghi chú phát hiện (không phải bug, làm rõ contract)
1. **Refine sum <=100 nằm ở `completeOnboardingSchema`, KHÔNG ở `budgetSetupSchema`.** Task mô tả `budgetSetupSchema` reject sum>100 với message "Tổng vượt 100%" — thực tế `budgetSetupSchema` chỉ validate per-line [0,100]; refine tổng + message nằm ở `completeOnboardingSchema`, message chính xác là **"Tổng ngân sách vượt 100%"** (path `["budgetPcts"]`). Test đã viết đúng theo code thực tế.
2. **M3 không apply (xác nhận từ fixer log):** `debtSchema.totalAmount` vẫn `nonnegative()` → `totalAmount: 0` HỢP LỆ. Đây là chủ ý (wizard không có UI input cho totalAmount, draft luôn = 0; nếu `.positive()` sẽ fail mọi debt → rollback onboarding). Test khẳng định behavior hiện tại (`totalAmount: 0` pass, âm fail) để khóa regression — nếu sau này thêm UI totalAmount + đổi sang `.positive()`, test này sẽ đỏ và là tín hiệu cần cập nhật.
3. **BUDGET_TEMPLATE default sum = 100** (verified) → `canProceed()` step 7 mặc định pass.
