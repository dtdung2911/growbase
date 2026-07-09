---
baseline_commit: 98133d26e5d294f5fec53861bc32a23e16df9648
---

# Story 9.1: Tada số liệu minh bạch — per-fund, tổng, giải thích

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng mới vừa setup xong,
I want thấy rõ từng quỹ cần góp bao nhiêu mỗi tháng, tổng cộng bao nhiêu, và hiểu vì sao tôi được chi tiêu thoải mái X mỗi ngày,
so that tôi tin con số app đưa ra thay vì nghi nó tính sai.

## Acceptance Criteria

1. **Given** user ở Tada chỉnh quỹ 400.000.000đ về 10 tháng, **When** UI recalc, **Then** số góp/tháng của QUỸ ĐANG CHỈNH hiển thị 40.000.000đ (`targetAmount / months`); cảnh báo khả thi (nếu có) vẫn dùng tổng household nhưng label phân biệt rõ đây là "tổng tất cả quỹ" — không còn tình trạng label per-fund show số tổng (bug user report: 400tr/10 tháng ra 53.933.333đ).
2. **Given** danh sách mục tiêu render ở Tada (1 emergency + N goal funds), **When** hiển thị, **Then** mỗi quỹ hiện số góp/tháng riêng (`feasibility.monthlyNeeded` per fund, font-mono), cuối danh sách có dòng TỔNG góp toàn bộ = sum monthlyNeeded các quỹ. Khi user chỉnh fund trong adjust flow, cả số per-fund lẫn tổng cập nhật theo.
3. **Given** card "Hôm nay bạn có thể chi tiêu thoải mái", **When** render, **Then** có mô tả ngắn cách tính ngay dưới số tiền: % thu nhập nhóm chi linh hoạt ÷ số ngày trong tháng — % lấy động từ `sumBudgetPct(FLEXIBLE_COST_TYPE_GROUPS)` (hiện = 20%), KHÔNG hardcode "20%" trong string. i18n vi/en, không phá layout 4 stage.
4. **Given** công thức aggregate feasibility đang duplicate ở `route.ts` và `TadaStep.tsx` (deferred [8-1], epsilon `+ 1` magic 2 chỗ), **When** story done, **Then** logic share qua helper chung trong `budgetTemplate.ts`, cả 2 nơi dùng helper, có unit tests.
5. `npx tsc --noEmit` sạch; `npx vitest run` pass toàn bộ; i18n parity vi == en; không hardcode string/màu.

## Tasks / Subtasks

- [x] Task 1: Shared aggregate feasibility helper (AC: 4)
  - [x] Thêm `calculateAggregateFeasibility(monthlyNeededList: number[], available: number): { monthlyNeeded: number; available: number; feasible: boolean }` vào `src/lib/constants/budgetTemplate.ts` — sum list, `feasible: total <= available + 1` (giữ epsilon +1 hiện hữu, comment ngắn WHY: tránh sai số chia float khi target chia đều).
  - [x] `src/app/api/onboarding/complete/route.ts` (~113-121): thay reduce inline bằng helper.
  - [x] `src/components/onboarding/v2/TadaStep.tsx` (~134-145): thay công thức inline bằng helper (giữ nguyên hành vi: khi adjust, list = otherFunds monthlyNeeded + targetAmount/months của fund đang chỉnh).
  - [x] Unit tests trong `src/lib/constants/__tests__/budgetTemplate.test.ts` (test đã tồn tại cạnh helper): sum đúng, epsilon boundary (total == available + 1 → feasible), list rỗng, total > available+1 → infeasible.
- [x] Task 2: Per-fund monthly + dòng tổng ở danh sách mục tiêu (AC: 2)
  - [x] `TadaStep.tsx` fund list (~160-175): thêm dưới target amount mỗi quỹ dòng góp/tháng — key mới `setupV2.tada.fundMonthly` (vi: "Góp {{amount}}/tháng"). Amount = `f.feasibility.monthlyNeeded`; riêng fund đang adjust dùng `targetAmount / months` live (qua helper `fundMonthly`).
  - [x] Cuối list: dòng tổng — key `setupV2.tada.totalMonthly` (vi: "Tổng cần góp: {{amount}}/tháng"), amount = sum các quỹ qua `fundMonthly` (cùng nguồn số với helper aggregate).
  - [x] Amounts `font-mono` tabular-nums theo style guide.
- [x] Task 3: Fix label per-fund vs tổng trong adjust flow (AC: 1)
  - [x] Trong adjust UI (~226-230): số hiển thị cạnh fund đang chỉnh = `targetAmount / months` (per-fund) qua key `fundMonthly`. Key cũ `setupV2.tada.monthlyNeeded` (bind số tổng, gây bug label) đã XOÁ khỏi cả vi/en, không còn consumer (grep sạch). Cảnh báo/tổng dùng key mới `setupV2.tada.totalMonthlyNeeded` (vi: "Tổng tất cả quỹ: cần góp {{amount}}/tháng").
  - [x] Feasible title (~182-186): giữ số tổng, wording đổi thành "Khả thi! Tổng cần góp {{amount}}/tháng" (en: "Feasible! Total to save: {{amount}}/month").
- [x] Task 4: Mô tả cách tính guilt-free (AC: 3)
  - [x] Key `setupV2.tada.todayRemainingHint` — vi: "= {{percent}}% thu nhập dành cho chi tiêu linh hoạt, chia đều {{days}} ngày trong tháng" (en tương đương). `percent` = `sumBudgetPct(FLEXIBLE_COST_TYPE_GROUPS)`, `days` = số ngày tháng hiện tại (cùng cách tính `calculateTodayRemaining`).
  - [x] Render `text-xs text-muted-foreground` dưới số tiền (~236-247), không phá 4-stage layout/animation.
- [x] Task 5: Verify (AC: 5)
  - [x] `npx tsc --noEmit` sạch; `npx vitest run` pass toàn bộ (406 tests); i18n parity vi==en (85/85 keys setupV2); grep không còn key orphan `monthlyNeeded`.

## Dev Notes

### Root cause bug (đã điều tra 09-07-2026 — KHÔNG cần re-debug)

`TadaStep.tsx:134-145` — recalc khi adjust:

```ts
const otherFundsMonthly = original.funds
  .filter((f) => f !== adjustFund)
  .reduce((sum, f) => sum + f.feasibility.monthlyNeeded, 0)
const monthlyNeeded = otherFundsMonthly + targetAmount / months // TỔNG household
```

Số này render tại `~226-230` dưới key `setupV2.tada.monthlyNeeded` = "Cần góp {{amount}}/tháng" (`vi.json:734`) — user đọc như per-fund. Ví dụ user: 400tr/10 = 40tr, cộng emergency + quỹ khác 13.933.333 → hiển thị 53.933.333. **Toán đúng, label sai.** Feasibility check tổng là chủ đích (server cũng vậy `route.ts:113-121`) — GIỮ logic, chỉ tách hiển thị.

### Công thức nền (budgetTemplate.ts)

- Per-fund: `calculateFeasibility(target, months, income)` → `monthlyNeeded = target/months`, `available = income - totalBudget(SPENDING pct)`, `feasible = monthlyNeeded <= available + 1` (`:65-75`).
- Guilt-free: `calculateTodayRemaining(income)` = `floor(income × sumBudgetPct(FLEXIBLE_COST_TYPE_GROUPS)/100 / daysInMonth)` (`:77-81`). `FLEXIBLE_COST_TYPE_GROUPS = ["variable", "wasteful"]` = 20% (`:43`).

### Data có sẵn — KHÔNG cần đổi API shape

`OnboardingFundResult` (types tại `src/lib/hooks/useCompleteOnboardingV2.ts`, KHÔNG phải src/types/app.ts) đã có `feasibility.monthlyNeeded` per fund + `id`. Server trả `funds[]` + `feasibility` tổng + `todayRemaining`. Task 2 chỉ là render field sẵn có.

### Regression guards từ review 8-3 — PHẢI GIỮ, đụng vào là fail review

- `adjustFund = funds.find(f => !f.feasibility.feasible && f.fundType !== "emergency")` — KHÔNG fallback `?? funds[0]`, KHÔNG cho adjust emergency.
- `TadaFinishButton` match fund theo `id`, mutateAsync trong try/catch, KHÔNG double-toast (useUpdateFund.onError đã toast).
- Effect deps `[goals, monthlyIncome]` + fired ref (chống double-fire); MutationCache subscribe pattern.
- Fund list key = `f.id`.
- 409 already_onboarded → redirect /dashboard.

### i18n

- Flat dot-notation keys trong `src/lib/i18n/messages/vi.json` + `en.json`, dùng `t()` với params `{{amount}}`, `{{percent}}`, `{{days}}`. Parity bắt buộc (hiện 82/82 keys setupV2). Xoá key cũ nếu không còn consumer — grep trước khi xoá.
- Số tiền format qua `formatVND` như hiện tại.

### Style

- Amounts: `font-mono` tabular-nums. Text phụ: `text-xs text-muted-foreground`. Không hardcode màu. Card patterns giữ nguyên TadaStep hiện có (4 stage visual — đừng thêm section làm lệch animation stagger).

### Karpathy guardrails

- Helper aggregate CHỈ 1 function thuần trong budgetTemplate.ts — không tạo file mới, không class, không premature abstraction. Nhận list số, trả object — 2 call sites là lý do tồn tại (rule 3+ uses được miễn vì đây là dedup, không phải abstraction mới).
- Không useMemo/useCallback mới nếu không có evidence.
- Không sửa gì ngoài scope 3 FRs + deferred [8-1].

### Project Structure Notes

- UPDATE: `src/components/onboarding/v2/TadaStep.tsx`, `src/app/api/onboarding/complete/route.ts`, `src/lib/constants/budgetTemplate.ts`, `src/lib/i18n/messages/vi.json`, `src/lib/i18n/messages/en.json`, test file mới/cập nhật trong `src/__tests__/`.
- KHÔNG đụng: migrations, `useCompleteOnboardingV2.ts` types (trừ khi tsc bắt buộc), GoalStep, HookStep, OnboardingV2Shell.

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Epic-9 Story 9.1]
- [Source: _bmad-output/implementation-artifacts/8-3-tada-reveal-redesign.md — Dev Record + Review Findings (regression guards)]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — mục [8-1] duplicate aggregate formula]
- [Source: src/lib/constants/budgetTemplate.ts:43,65-81 — công thức]
- [Source: src/app/api/onboarding/complete/route.ts:113-122 — aggregate + todayRemaining server]
- [Source: src/components/onboarding/v2/TadaStep.tsx:134-145,160-175,182-186,226-247 — vùng sửa]

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer, dev-story workflow)

### Debug Log References

- `npx tsc --noEmit` — clean, không lỗi.
- `npx vitest run` — 406 tests pass (thêm 4 test cho `calculateAggregateFeasibility`).
- i18n parity — `setupV2.*` keys: vi 85 == en 85; diff key-set = rỗng (PARITY OK).
- Orphan check — `grep -rn 'tada\.monthlyNeeded' src/` → NONE (key đã xoá, không còn consumer).

### Completion Notes List

- Task 1: `calculateAggregateFeasibility(list, available)` thuần trong `budgetTemplate.ts`, sum list + epsilon `+1` (giữ nguyên WHY comment). Cả `route.ts` và `TadaStep.tsx` dùng chung — xoá 2 chỗ reduce inline duplicate (deferred [8-1]).
- Task 2: Mỗi quỹ trong fund list thêm dòng `fundMonthly` (font-mono text-xs); dòng tổng cuối list dùng sum qua helper `fundMonthly` per fund. Fund đang adjust dùng `targetAmount/months` live.
- Task 3: Bug label per-fund. Số cạnh fund đang chỉnh giờ = `targetAmount / months` (per-fund, key `fundMonthly`) — 400tr/10 = 40tr đúng. Số tổng chuyển sang key mới `totalMonthlyNeeded` label rõ "Tổng tất cả quỹ". Quyết định: XOÁ hẳn key `monthlyNeeded` (thay vì rename) vì ngữ nghĩa mới tách làm 2 (per-fund vs tổng) — không để orphan.
- Task 4: Hint `todayRemainingHint` dưới số guilt-free, `percent` động từ `sumBudgetPct(FLEXIBLE_COST_TYPE_GROUPS)` (không hardcode 20), `days` = số ngày tháng hiện tại (khớp `calculateTodayRemaining`). Render `text-xs text-muted-foreground`, chèn giữa số và hookCallback trong stage `todayRemaining` — không thêm stage mới, animation stagger giữ nguyên.
- Regression guards giữ nguyên: `adjustFund` không fallback `funds[0]`/không adjust emergency, `TadaFinishButton` match theo `id`, effect deps `[goals, monthlyIncome]` + fired ref, MutationCache subscribe, fund list key `f.id`.

### Testing

| Business flow (AC) | Method | Kết quả |
|---|---|---|
| AC1 — 400tr/10 tháng → per-fund 40tr, cảnh báo dùng tổng có label "tổng tất cả quỹ" | Manual trace `TadaStep.tsx:236-244` (per-fund `targetAmount/months` → key `fundMonthly`; tổng → key `totalMonthlyNeeded`) | PASS (cần verify browser cho render trực quan) |
| AC2 — mỗi quỹ hiện góp/tháng riêng + dòng tổng cuối list, cập nhật khi adjust | Manual trace `TadaStep.tsx:170-186` (`fundMonthly(f)` per fund + total reduce); helper `calculateAggregateFeasibility` automated (`budgetTemplate.test.ts`) | PASS (render cần verify browser) |
| AC3 — hint % động + số ngày dưới guilt-free | Manual trace `TadaStep.tsx:258-263` (`sumBudgetPct(FLEXIBLE_COST_TYPE_GROUPS)` = 20, daysInMonth) | PASS (render cần verify browser) |
| AC4 — helper share, unit tests | Automated `src/lib/constants/__tests__/budgetTemplate.test.ts` (sum, list rỗng, epsilon boundary, infeasible) — 4 tests pass | PASS |
| AC5 — tsc/vitest/parity/orphan | Automated (tsc clean, 406 vitest pass, parity 85==85, orphan grep NONE) | PASS |

Flow AC1/AC2/AC3 verify logic + i18n binding qua manual trace; render trực quan 4-stage animation cần verify browser tại `/setup` (onboarding v2) với 1 goal fund infeasible.

### File List

- M `src/lib/constants/budgetTemplate.ts`
- M `src/app/api/onboarding/complete/route.ts`
- M `src/components/onboarding/v2/TadaStep.tsx`
- M `src/lib/i18n/messages/vi.json`
- M `src/lib/i18n/messages/en.json`
- M `src/lib/constants/__tests__/budgetTemplate.test.ts`

## Change Log

- 09-07-2026: Story created từ Epic 9 (change request 5 items) — context engine + điều tra root cause sẵn. Status → ready-for-dev.
- 09-07-2026: Implement story 9.1 — helper `calculateAggregateFeasibility` share route.ts + TadaStep (dedup [8-1]); per-fund monthly + dòng tổng ở fund list; fix bug label adjust flow (per-fund vs tổng, xoá key orphan `monthlyNeeded`); hint cách tính guilt-free động (% + số ngày). tsc sạch, 406 tests pass, i18n parity 85/85.
