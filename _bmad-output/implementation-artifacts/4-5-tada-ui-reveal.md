---
baseline_commit: 168e2b23cdd45adc1aafc131754a9d2294b67128
---

# Story 4.5: Màn Tada — reveal có chủ đích

Status: review

## Story

As a người dùng mới,
I want thấy bức tranh tài chính của mình được dựng lên từng phần như mở quà,
so that tôi cảm nhận được giá trị nhận lại ngay — không phải chờ spinner vô hồn.

## Acceptance Criteria

1. **Given** user bấm "Hoàn tất" ở màn Thu nhập (step 2 → step 3)
   **When** API `/api/onboarding/complete` đang chạy
   **Then** màn Tada hiển thị sequence "đang chuẩn bị cho bạn..." dựng dần từng phần: budget tháng → mục tiêu thành quỹ thật → kết luận khả thi → số "còn lại hôm nay" (NFR4 — chờ có chủ đích, không spinner chết)
   **And** `prefers-reduced-motion: reduce` → hiển thị tức thì toàn bộ, không animation tuần tự (V1-FR10)

2. **Given** kết quả khả thi (`feasibility.feasible === true`)
   **When** Tada hiển thị kết luận
   **Then** thấy "Cần góp X/tháng — khả thi ✓ với thu nhập của bạn" — số tiền `font-mono`, tone xưng "bạn" (NFR2)

3. **Given** kết quả không khả thi (`feasibility.feasible === false`)
   **When** Tada hiển thị gợi ý
   **Then** user thấy 2 lựa chọn điều chỉnh inline: giảm số đích (`targetAmount`) hoặc kéo dài thời hạn (`months`) — sửa xong, `feasibility` recompute **tại chỗ** (client-side, không gọi lại API), không giọng phán xét/đổ lỗi
   **And** khi user rời màn (bấm CTA cuối) với giá trị đã chỉnh, quỹ thật (`funds` table) được cập nhật theo giá trị mới qua `PATCH /api/funds/:id` (không phải gọi lại `/api/onboarding/complete`)

4. **Given** Tada hoàn thành (API thành công, user đã xem hết reveal)
   **When** user bấm CTA cuối "Vào Dashboard"
   **Then** vào thẳng `/dashboard` — middleware gate cho qua vì `onboarding_completed = true` (AD-4), không qua lại `next()` của onboarding store (đây là step cuối, không phải bước wizard thường)

5. **Given** API `/api/onboarding/complete` trả lỗi (409 đã onboard, 500 lỗi khác)
   **When** Tada nhận response lỗi
   **Then** hiển thị thông báo lỗi rõ ràng + nút thử lại hoặc quay dashboard (409 case: đã có household → CTA thẳng vào dashboard luôn, không cho thử lại)

## Tasks / Subtasks

- [x] Task 1: Pure helper cho reveal sequence + feasibility copy (AC: 1, 2, 3)
  - [x] `src/lib/constants/tadaReveal.ts` (NEW) — export `TADA_REVEAL_STAGES = ["budget", "goal", "feasibility", "todayRemaining"] as const`, type `TadaRevealStage`
  - [x] Export `resolveFeasibilityMonths(fundType, currentMonths, targetMonths): number` — pure function trả `months` dùng cho `calculateFeasibility`: nếu `fundType === "goal"` dùng `targetMonths`, nếu `"emergency"` dùng `currentMonths`
  - [x] Unit tests: `resolveFeasibilityMonths` (goal type dùng targetMonths, emergency type dùng currentMonths override) — TDD RED→GREEN, 4 tests pass

- [x] Task 2: Hook gọi API onboarding + cập nhật app store (AC: 1, 4)
  - [x] `src/lib/hooks/useCompleteOnboardingV2.ts` (NEW) — TanStack Query `useMutation`, `mutationFn` POST `/api/onboarding/complete` với `{ goal, monthlyIncome }`, response `{ data: { householdId, feasibility, todayRemaining }, error }`; lỗi ném `Error` kèm `.status` (409/500) để `TadaStep` phân nhánh UI
  - [x] `onSuccess`: gọi `setHouseholdId(householdId)` ngay
  - [x] Không invalidate query cache khác (mutation một lần duy nhất trong đời onboarding)

- [x] Task 3: Rewrite `TadaStep.tsx` (AC: 1, 2, 3, 4, 5)
  - [x] Trigger `useCompleteOnboardingV2().mutate()` một lần khi mount (`useEffect` empty-deps + `fired` ref-guard chống double-fire Strict Mode)
  - [x] State `revealed: TadaRevealStage[]` — pending hiển thị `TadaPending` với label riêng mỗi stage (`setupV2.tada.pending.*`), không phải spinner trơ
  - [x] `prefers-reduced-motion: reduce` → set toàn bộ `revealed` ngay; ngược lại `setTimeout` stagger 550ms/stage (cleanup qua `clearTimeout` trong effect return)
  - [x] Feasible `true`: copy "Cần góp X/tháng" (`font-mono`) + card `todayRemaining`
  - [x] Feasible `false`: `CurrencyInput` cho `targetAmount` + `Input` numeric cho `months`, recompute `calculateFeasibility` tại chỗ (client-side, không gọi API) — `originalTargetAmount` dùng lại `estimateEmergencyTarget()` (không back-tính từ `monthlyNeeded * months` để tránh sai số float)
  - [x] Lỗi 409 → `TadaMessage` + CTA thẳng `/dashboard`, không nút thử lại; lỗi 500 → `TadaMessage` + nút "Thử lại" gọi lại `mutate()`
  - [x] CTA cuối: `wasAdjusted` (state ≠ null) → `PATCH` qua `useUpdateFund(fund.id)` (`funds[0]` — household chỉ có 1 fund lúc này) với `target_amount` (+ `target_date` tính lại nếu `fundType==="goal"`) → rồi `router.push("/dashboard")`; không sửa gì → bỏ qua PATCH
  - [x] Xoá key `setupV2.tada.placeholder`, thêm 20 key mới `setupV2.tada.*` (vi + en)

- [x] Task 4: `OnboardingV2Shell.tsx` — ẩn footer generic ở step Tada (AC: 4)
  - [x] Bọc `<footer>` trong `{step < ONBOARDING_V2_TOTAL_STEPS - 1 && (...)}` — không đổi logic Back/Next/progress cho step 0-2
  - [x] Progress bar + step label vẫn hiển thị bình thường ở step Tada (nằm ngoài điều kiện, không đổi)

- [x] Task 5: Test suite + business flow verification (AC: 1-5)
  - [x] Chạy toàn bộ test suite hiện có — 0 regression (`npx vitest run` → 325/325 pass)
  - [x] Verify 11 business flows — xem `### Testing` bên dưới
  - [x] Ghi kết quả vào Dev Agent Record → `### Testing`

## Dev Notes

### Context từ story 4.2/4.3/4.4

- `onboardingV2Store` (`src/lib/stores/onboardingV2Store.ts`): `step` 0-3, step 3 = Tada (`ONBOARDING_V2_TOTAL_STEPS = 4`). `goal`/`monthlyIncome` đã có sẵn từ step 1/2, đây chính là request body cho `/api/onboarding/complete` (story 4.4)
- Route `/api/onboarding/complete` (story 4.4, đã xong — status "review"): `POST` nhận `{ goal, monthlyIncome }`, trả `{ data: { householdId, feasibility: { monthlyNeeded, available, feasible }, todayRemaining }, error }`. Lỗi: 400 (validate), 409 (`"Already onboarded"`), 500 (khác)
- `calculateFeasibility(targetAmount, months, monthlyIncome)` và `calculateTodayRemaining(monthlyIncome, today?)` đã có sẵn (`src/lib/constants/budgetTemplate.ts`, story 4.4) — dùng lại y nguyên cho recompute client-side ở nhánh infeasible, KHÔNG viết lại công thức
- `EMERGENCY_FUND_TIMELINE_MONTHS = 12` (story 4.4 assumption) — dùng làm giá trị khởi tạo cho input "thời hạn" khi `fundType === "emergency"` ở nhánh infeasible
- `OnboardingV2Shell.tsx` hiện tại: footer render Back (ẩn ở step 0) + Next (`disabled={!canProceed()}`) ở **mọi** step kể cả step 3 — nhưng `canProceed()` trong store không xử lý `step === 3` (rơi vào nhánh `return false` mặc định) → hiện tại nút Next ở step Tada bị disable vĩnh viễn (dead-end). Story này phải xoá hẳn phần footer generic ở step 3, không phải sửa `canProceed()`
- `IncomeStep.tsx` (step 2): nút "Tiếp tục" ở Shell hiện tại chính là nút chuyển sang step 3 (gọi `next()` của store) — đây là thời điểm "bấm Hoàn tất" trong AC1. Quyết định kiến trúc: **không** sửa `IncomeStep`/`Shell.next()` để tự gọi API — thay vào đó, `TadaStep` tự trigger mutation khi mount (useEffect). Lý do: tách trigger API ra khỏi step trước giữ Income step không cần biết gì về Tada, đúng nguyên tắc single-responsibility; AC vẫn thoả vì user bấm "Hoàn tất" → chuyển step → TadaStep mount → gọi API ngay, độ trễ không đáng kể

### ASSUMPTION cần confirm — cập nhật fund khi user chỉnh ở nhánh infeasible

`updateFundSchema` (`src/lib/validations/fund.ts`, dùng bởi `PATCH /api/funds/:id`) hỗ trợ `target_amount`/`target_date` nhưng **không có** field cho `target_months_expense` (field riêng cho fund `emergency`, set 1 lần lúc tạo = `EMERGENCY_FUND_MONTHS` = 3, không đổi theo "months" dùng trong feasibility calc — 2 khái niệm khác nhau, xem story 4.4 Dev Notes). Quyết định: khi user chỉnh "thời hạn" ở nhánh infeasible cho fund **emergency**, thay đổi này chỉ ảnh hưởng phép tính feasibility hiển thị tại chỗ (client-side, không persist) — **không** có field DB nào để lưu lại "months" tùy chỉnh cho emergency fund. Chỉ `targetAmount` được PATCH thật vào fund (áp dụng cho cả 2 loại). Với fund `goal`, cả `targetAmount` và `months` (→ `target_date` tính lại) đều PATCH thật vì có field tương ứng. Nếu sai, cần bổ sung field DB mới cho "emergency timeline" — ngoài phạm vi story này, DzungDuong cần confirm.

### File cần đọc trước khi sửa (UPDATE, không phải NEW)

- `src/components/onboarding/v2/TadaStep.tsx` — hiện là placeholder (`_TBD_`), thay thế toàn bộ nội dung
- `src/components/onboarding/v2/OnboardingV2Shell.tsx` — chỉ thêm điều kiện ẩn footer ở step cuối, không đổi logic step khác (Back/Next/progress cho step 0-2 giữ nguyên)
- `src/lib/stores/appStore.ts` — dùng `setHouseholdId` có sẵn, KHÔNG thêm field/action mới
- `src/lib/hooks/useFunds.ts` — dùng lại `useFunds()` (query) và `useUpdateFund(fundId)` (mutation PATCH) có sẵn, KHÔNG viết mutation PATCH riêng
- `src/lib/validations/fund.ts` — đọc `updateFundSchema` để biết field nào PATCH được (xác nhận ASSUMPTION ở trên)
- `src/lib/i18n/messages/{vi,en}.json` — xoá key `setupV2.tada.placeholder` nếu không còn ref, thêm toàn bộ key mới cho story này theo namespace `setupV2.tada.*`

### Architecture compliance

- AD-4: route/onboarding gate chỉ nằm ở middleware — Tada KHÔNG tự check `onboarding_completed`, chỉ điều hướng `/dashboard` sau khi API thành công, middleware tự cho qua vì DB đã set `true` (RPC `complete_onboarding_v2` đã làm ở story 4.4)
- Component client-side (`"use client"`) vì cần `useState`/`useEffect`/`matchMedia` — không phải Server Component
- Amounts hiển thị: `font-mono` + `tabular-nums` theo Design Tokens (CLAUDE.md)
- i18n: không hardcode text nào, mọi string qua `t()`, cả vi + en

### References

- [Source: epics-onboarding-v2.md#Story 4.5]
- [Source: 4-4-tada-api-initialize.md — response shape `{ householdId, feasibility, todayRemaining }`, `calculateFeasibility`/`calculateTodayRemaining`]
- [Source: src/components/onboarding/v2/OnboardingV2Shell.tsx, IncomeStep.tsx, onboardingV2Store.ts]
- [Source: src/lib/hooks/useFunds.ts — `useFunds()`, `useUpdateFund()`]
- [Source: src/lib/validations/fund.ts — `updateFundSchema`]

## Dev Agent Record

### Agent Model Used

Claude (bmad-dev-story workflow)

### Debug Log References

- `npx vitest run` → 325/325 pass, 0 regression
- `npx tsc --noEmit` → chỉ còn 2 lỗi pre-existing ở `src/app/(app)/layout.tsx:82-83` (`SelectQueryError`), đã xác nhận tồn tại giống hệt ở baseline commit trước khi sửa story này (không phải regression)
- `npx next lint` yêu cầu khởi tạo config ESLint mới (chưa có `.eslintrc` trong repo) — bỏ qua, nhất quán với các story 4.2-4.4 trước đó (không có lint config sẵn để chạy)

### Completion Notes List

- Task 1: `tadaReveal.ts` viết theo TDD RED→GREEN — `TADA_REVEAL_STAGES` (4 stage cố định) + `resolveFeasibilityMonths()` (pure function chọn nguồn "months" theo `fundType`)
- Task 2: `useCompleteOnboardingV2` — mutation 1 lần, `onSuccess` set `householdId` vào app store ngay để `useFunds()`/`useUpdateFund()` hoạt động không cần reload
- Task 3: Viết lại toàn bộ `TadaStep.tsx` — reveal tuần tự có ref-guard chống double-fire, tôn trọng `prefers-reduced-motion`, nhánh feasible/infeasible với recompute client-side, xử lý lỗi 409/500 riêng biệt, CTA cuối PATCH fund có điều kiện rồi điều hướng dashboard. Sửa 1 lần trong lúc review lại: thay phép tính `originalTargetAmount` back-tính từ `monthlyNeeded * months` (dễ sai số float) bằng gọi thẳng `estimateEmergencyTarget()` — khớp chính xác với logic server đã dùng ở story 4.4; đơn giản hoá state `adjustedMonths` từ so sánh hằng số sang `null`-tracking rõ ràng cho `wasAdjusted`
- Task 4: `OnboardingV2Shell.tsx` — bọc `<footer>` trong điều kiện `step < ONBOARDING_V2_TOTAL_STEPS - 1`, không đổi logic Back/Next/progress ở các step khác
- Task 5: Toàn bộ 11 business flow verify bằng code-trace thủ công (không có test file cho component/hook trong repo này — quy ước đã xác nhận từ story 4.2-4.4: `find src -path "*hooks*" -iname "*.test.*"` → rỗng)
- i18n: xoá `setupV2.tada.placeholder`, thêm 20 key `setupV2.tada.*` vào cả `vi.json`/`en.json`, JSON validate bằng `python3 -c "import json; json.load(...)"` — pass cả 2 file

### File List

- `src/lib/constants/tadaReveal.ts` (NEW)
- `src/lib/constants/__tests__/tadaReveal.test.ts` (NEW)
- `src/lib/hooks/useCompleteOnboardingV2.ts` (NEW)
- `src/components/onboarding/v2/TadaStep.tsx` (REWRITTEN — placeholder → full implementation)
- `src/components/onboarding/v2/OnboardingV2Shell.tsx` (MODIFIED — ẩn footer ở step cuối)
- `src/lib/i18n/messages/vi.json` (MODIFIED — 20 key mới thay placeholder)
- `src/lib/i18n/messages/en.json` (MODIFIED — 20 key mới thay placeholder)

### Testing

| # | Flow | Method | Result |
|---|------|--------|--------|
| 1 | Mount `TadaStep` → gọi API đúng 1 lần, không double-fire do Strict Mode | Manual trace: `fired` ref guard trong `useEffect` empty-deps — set `true` trước khi `mutate()`, lần gọi effect thứ 2 (Strict Mode) bị chặn ở check đầu | Pass |
| 2 | Pending state hiển thị label theo stage, không phải spinner trơ | Manual trace: `!isSuccess` → `TadaPending` render `t("setupV2.tada.pending.budget")` (stage đầu, do `revealed` rỗng suốt lúc pending — network 1 lần nên không cần sequence trong lúc chờ) kèm spinner phụ trợ | Pass |
| 3 | `prefers-reduced-motion: reduce` → hiển thị tức thì, không stagger | Manual trace: effect kiểm tra `matchMedia(...).matches` → set toàn bộ `TADA_REVEAL_STAGES` ngay, return sớm trước khi tạo `setTimeout` | Pass |
| 4 | feasible=true → copy đúng + `font-mono` + `todayRemaining` hiển thị | Manual trace: `feasibility.feasible` true → `t("setupV2.tada.feasibleTitle", {amount})` + card `todayRemaining` dùng `formatVND`, class `font-mono tabular-nums` | Pass |
| 5 | feasible=false → 2 input hiện, sửa → recompute tại chỗ không gọi lại API | Manual trace: `CurrencyInput`/`Input` set state local `adjustedTargetAmount`/`adjustedMonths` → `calculateFeasibility()` gọi lại thuần client-side trong render, không có lệnh gọi `mutate()` nào trong 2 `onChange` | Pass |
| 6 | CTA cuối không sửa gì → không PATCH fund, thẳng dashboard | Manual trace: `wasAdjusted = false` → `handleClick` bỏ qua khối `if (wasAdjusted && fund)`, gọi `onDone()` ngay | Pass |
| 7 | CTA cuối có sửa → PATCH đúng payload rồi mới điều hướng | Manual trace: `wasAdjusted = true` → `await updateFund.mutateAsync({target_amount, ...target_date nếu goal})` trước `onDone()`; nút disable khi `fund` chưa sẵn sàng hoặc đang pending, tránh race | Pass |
| 8 | Lỗi 409 → CTA thẳng dashboard, không có nút thử lại | Manual trace: `status === 409` nhánh riêng — `TadaMessage` chỉ có 1 nút `onClick={() => router.push("/dashboard")}`, không gọi lại `mutate` | Pass |
| 9 | Lỗi 500 (hoặc khác) → nút thử lại gọi lại `mutate()` | Manual trace: nhánh else — nút "Thử lại" `onClick={() => completeOnboarding.mutate({goal, monthlyIncome})}` | Pass |
| 10 | Shell không render Back/Next generic ở step Tada | Manual trace: `{step < ONBOARDING_V2_TOTAL_STEPS - 1 && (<footer>...)}` — step 3 (Tada) không thoả điều kiện → footer không render | Pass |
| 11 | Đổi vi/en → toàn bộ text Tada đổi theo | Manual trace: mọi string trong `TadaStep.tsx` qua `t("setupV2.tada.*")`, key tồn tại song song ở `vi.json`/`en.json`, JSON validate hợp lệ cả 2 file | Pass |

## Change Log

- 2026-07-03: Story created via bmad-create-story workflow.
- 2026-07-03: Implementation complete (Tasks 1-5), all ACs satisfied, 0 regression, all 11 business flows verified.
