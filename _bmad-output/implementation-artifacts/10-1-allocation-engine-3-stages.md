---
baseline_commit: ca3478d6017dc37e065ce06b1266e0645f824d0d
---

# Story 10.1: Allocation engine thuần 3 giai đoạn

Status: done

## Story

As a hệ thống,
I want một engine thuần duy nhất tính phân bổ góp/tháng cho mọi quỹ theo Hybrid 3 giai đoạn,
So that mọi màn hình (GoalStep, Tada, route, dashboard) đọc cùng một nguồn số.

**Nguồn:** Epic 10 — Money Model v2 (`epics-onboarding-v2.md` §Story 10.1) · Sprint Change Proposal 09-07-2026 · BR-OB-009 → BR-OB-011.

## Acceptance Criteria

1. **Given** income + danh sách goals (đã xếp hạng) + trạng thái emergency
   **When** engine chạy
   **Then** trả phân bổ/tháng từng quỹ theo BR-OB-010 (GĐ1 100% emergency đến 1 tháng chi tiêu; GĐ2 70/30; GĐ3 100% goals) + bậc thang hạng BR-OB-011 (70/30; 60/30/10) + timeline hoàn thành từng quỹ

2. **Given** capacity = savings_investment 15% (BR-OB-009)
   **When** story done
   **Then** `calculateFeasibility`/`calculateAggregateFeasibility` cũ bị thay bằng engine, "other" không còn trong capacity, route + TadaStep tiêu thụ engine, không còn công thức available 19%

3. **Given** boundary cases
   **When** chạy tests
   **Then** pass: income 15tr/40tr/100tr · 0-6 goals · timeline 1-600 tháng · emergency đã đầy một phần · `tsc` + vitest sạch

## Tasks / Subtasks

- [x] Task 1: Engine thuần `calculateAllocationPlan` trong `src/lib/constants/budgetTemplate.ts` (AC: 1, 2)
  - [x] Định nghĩa input/output types (xem Dev Notes §Engine Spec)
  - [x] Capacity = `sumBudgetPct(["savings_investment"])` — derive từ BUDGET_TEMPLATE (15%), KHÔNG hardcode số 15
  - [x] Simulation tháng-theo-tháng 3 giai đoạn + bậc thang hạng + spill-over trong tháng (xem §Engine Spec)
  - [x] Xóa `calculateFeasibility`, `calculateAggregateFeasibility`, `FeasibilityResult` (sau khi consumers đã swap — không để dead export)
- [x] Task 2: Tests boundary trong `src/lib/constants/__tests__/budgetTemplate.test.ts` (AC: 3)
  - [x] Thay 2 describe blocks cũ (`calculateFeasibility` lines 114-138, `calculateAggregateFeasibility` lines 165-188) bằng describe `calculateAllocationPlan`
  - [x] Ma trận boundary: income 15tr/40tr/100tr × 0-6 goals × timeline 1-600 tháng × emergency 0%/50%/100% đầy — chọn cases đại diện, không cần full cross-product
  - [x] Invariant tests: tổng phân bổ mỗi tháng = capacity (khép 100%); timeline > 600 tháng → `null`; goal xong → phần của nó redistribute
- [x] Task 3: `src/app/api/onboarding/complete/route.ts` tiêu thụ engine (AC: 2)
  - [x] Bỏ import + mọi call `calculateFeasibility`/`calculateAggregateFeasibility`
  - [x] Gọi engine 1 lần với emergency + goals (hạng = thứ tự trong `goals` array — thứ tự user thêm quỹ)
  - [x] Response shape mới (xem §Response Shape) — giữ `todayRemaining` (calculateTodayRemaining KHÔNG đổi)
  - [x] `p_goals[].target_date` = `addMonthsIso(timeline engine của quỹ đó)`; timeline null → `target_date: null`
- [x] Task 4: `src/components/onboarding/v2/TadaStep.tsx` + `src/lib/hooks/useCompleteOnboardingV2.ts` tiêu thụ engine (AC: 2)
  - [x] Update response types trong useCompleteOnboardingV2.ts (bỏ import `FeasibilityResult`)
  - [x] Per-fund số góp/tháng + tổng + timeline đọc từ engine result — GIỮ NGUYÊN layout 4 stage (redesign kể chuyện = story 10.3)
  - [x] Adjust flow: user chỉnh `targetAmount` → re-run engine client-side với target mới, hiển thị timeline mới; input `months` bỏ (model mới: timeline là OUTPUT, không phải input) — thay bằng dòng hiển thị timeline engine
  - [x] Card cảnh báo "infeasible" cũ: model mới không có khái niệm infeasible (capacity cố định, timeline giãn) — bỏ nhánh warning, stage "feasibility" hiển thị tổng góp/tháng = capacity + nói rõ nguồn 15%
  - [x] i18n vi/en cho keys mới/đổi — parity check bắt buộc
- [x] Task 5: Verification (AC: 2, 3)
  - [x] `grep -rn "calculateFeasibility\|calculateAggregateFeasibility" src/` → 0 kết quả
  - [x] `npx tsc --noEmit` sạch · `npx vitest run` pass toàn bộ
  - [x] i18n parity: số keys `setupV2.*` vi == en
  - [x] Manual trace: onboarding flow end-to-end (GoalStep → Tada reveal 4 stage → adjust 1 quỹ → confirm)

## Dev Notes

### Business Rules (verbatim — docs/02_BUSINESS_RULES.md:134-157)

**BR-OB-009 — Capacity:**
> Tổng góp/tháng của MỌI fund = bucket savings_investment (15% thu nhập ròng). Không fund nào được gợi ý vượt tổng này. Nhóm "other" thuộc chi linh hoạt, KHÔNG tính vào capacity (hết đếm trùng available 19% cũ).

**BR-OB-010 — Hybrid 3 giai đoạn:**
> GĐ1: 100% capacity → emergency, đến 1 THÁNG chi tiêu thiết yếu
> GĐ2: 70% emergency / 30% goals, đến khi emergency = 3 tháng chi tiêu
> GĐ3: 100% goals (+ nhánh đầu tư cho quỹ dài hạn)
> Emergency target = 3 × chi tiêu thiết yếu tháng (KHÔNG phải income)

**BR-OB-011 — Bậc thang theo hạng:**
> Tỷ trọng bậc thang theo hạng: 2 quỹ = 70/30; 3 quỹ = 60/30/10. Hạng do USER xếp (kéo thả, label màu) — app chỉ advise, không tự đổi hạng. KHÔNG waterfall. KHÔNG slider % trong onboarding.

(BR-OB-012 lối thoát + BR-OB-013 lãi kép = scope Epic 10.2/10.3/11 — engine 10.1 KHÔNG cần simulate lãi kép.)

### Hiện trạng code (đọc kỹ trước khi sửa)

**`src/lib/constants/budgetTemplate.ts` (266 dòng) — file bị sửa chính:**
- `SPENDING_COST_TYPE_GROUPS` = fixed+variable+wasteful+debt_repayment = 81% (dòng ~35) — GIỮ
- `FLEXIBLE_COST_TYPE_GROUPS` = variable+wasteful = 20% — GIỮ (calculateTodayRemaining dùng)
- `EMERGENCY_FUND_MONTHS = 3` — GIỮ
- `EMERGENCY_FUND_TIMELINE_MONTHS = 18` (D2 story 9.1) — XÓA sau khi route bỏ dùng: model mới timeline emergency là output engine, không còn hằng số giãn 18 tháng. Verify không còn import nào khác trước khi xóa.
- `sumBudgetPct(groups)` helper — GIỮ, engine dùng lại
- `estimateEmergencyTarget(income)` = 3 × income × 81%, floor 100k — GIỮ NGUYÊN (IncomeStep.tsx:8 + hookDemoData.ts:15 đang dùng; định nghĩa khớp BR-OB-010 "3 × chi tiêu thiết yếu")
- `calculateFeasibility` (dòng ~66-78): `available = income − 81% = 19%` — ĐÂY là công thức sai phải XÓA
- `calculateAggregateFeasibility` (dòng ~82-88) — XÓA
- `calculateTodayRemaining` — GIỮ NGUYÊN, không thuộc scope
- `BUDGET_TEMPLATE` 18 dòng, savings_investment = "Tiết kiệm & Quỹ" 8% + "Đầu tư" 7% = 15% — GIỮ

**"Chi tiêu thiết yếu tháng" định nghĩa (quyết định D1):** dùng `income × sumBudgetPct(SPENDING_COST_TYPE_GROUPS)/100` (81%) — nhất quán với `estimateEmergencyTarget` hiện có và comment "Chi tiêu tháng cho quỹ khẩn cấp (OQ2)". BR nhấn mạnh "KHÔNG phải income", không đổi định nghĩa spending. Ngưỡng GĐ1 = 1 × số này; emergency target = `estimateEmergencyTarget(income)` (đã ×3 + floor 100k).

**`src/app/api/onboarding/complete/route.ts` (143 dòng):**
- Gọi `calculateFeasibility` per-fund (dòng 51, 59), `calculateAggregateFeasibility` (dòng 128-131) — thay bằng 1 call engine
- Contract migration 016: `p_goals[0]` LUÔN là emergency — GIỮ contract này
- `p_goals[].target_date` hiện = `addMonthsIso(g.targetMonths!)` (dòng 84) — đổi sang engine timeline
- Validate RPC result shape (dòng 112-122) — GIỮ (patch từ review 9.1)
- `funds` array trong response map `fund_ids` theo index (dòng 125) — GIỮ pattern
- Zod schema `completeOnboardingV2Schema` vẫn nhận `targetMonths` từ client (GoalStep chưa đổi — 10.2 mới sửa GoalStep). Route BỎ QUA targetMonths trong tính toán, không xóa field khỏi schema (backward-compat trong epic).

**`src/components/onboarding/v2/TadaStep.tsx`:**
- Import budgetTemplate: dòng 25-30 (`BUDGET_TEMPLATE`, `FLEXIBLE_COST_TYPE_GROUPS`, `calculateAggregateFeasibility`, types)
- 4-stage reveal: "budget" (166) → "goal" (170) → "feasibility" (200-207) → "todayRemaining" (268-285), STAGE_DELAY_MS 550, reduced-motion render ngay (84-87) — GIỮ NGUYÊN cấu trúc animation
- `fundMonthly` helper (144-145): adjustFund dùng `(adjustedTargetAmount ?? f.targetAmount) / (adjustedMonths ?? f.months)` — thay bằng engine re-run
- Aggregate recalc khi adjust (157-160) — thay bằng engine re-run
- Adjust flow: match fund by id, KHÔNG cho adjust emergency — GIỮ 2 guard này
- Months input clamp `Math.max(1, ...)` (240-243) — input này bị bỏ theo Task 4
- i18n keys hiện có: `setupV2.tada.fundMonthly`, `totalMonthly`, `feasibleTitle`, `totalMonthlyNeeded`, `noAdjustHint` — keys warning/infeasible sẽ bỏ hoặc đổi nghĩa; cập nhật cả vi.json + en.json

**`src/lib/hooks/useCompleteOnboardingV2.ts`:** import type `FeasibilityResult` (dòng 7) — đổi sang types engine mới.

**`src/components/onboarding/v2/hookDemoData.ts` (demo "Nhà Minh"):** chỉ dùng `calculateTodayRemaining` + `estimateEmergencyTarget` + `FLEXIBLE_COST_TYPE_GROUPS` — nếu demo có số góp/tháng hardcode thì cập nhật cho khớp engine, còn không thì KHÔNG đụng.

**KHÔNG đụng:** `BudgetClient.tsx`, `BudgetGroupRow.tsx`, `BudgetVsActualTab.tsx`, `dailyRemaining.ts`, `IncomeStep.tsx` — chỉ dùng BUDGET_TEMPLATE/labels/todayRemaining/estimateEmergencyTarget, không dùng feasibility.

### Engine Spec (đề xuất — dev được chỉnh tên/chi tiết, GIỮ semantics)

Vị trí: `src/lib/constants/budgetTemplate.ts` (theo Sprint Change Proposal §2 "engine thuần mới trong budgetTemplate.ts"). Pure function, không I/O, không Date.now().

```typescript
export interface AllocationGoalInput {
  id: string              // fund id hoặc index-key client-side
  targetAmount: number
  initialBalance?: number // default 0
}

export interface AllocationInput {
  monthlyIncome: number
  goals: AllocationGoalInput[]  // thứ tự = hạng (index 0 = hạng cao nhất)
  emergencyBalance?: number     // default 0 — "emergency đã đầy một phần"
}

export interface FundAllocation {
  id: string                    // "emergency" cho quỹ khẩn cấp
  monthlyAmount: number         // phân bổ tháng ĐẦU TIÊN (số user thấy "góp X/tháng")
  timelineMonths: number | null // tháng hoàn thành (1-based); null nếu > 600 tháng
}

export interface AllocationPlan {
  capacityMonthly: number       // income × 15%
  emergencyTarget: number       // = estimateEmergencyTarget(income)
  stage1EndMonth: number | null // tháng emergency đạt 1× chi tiêu thiết yếu
  stage2EndMonth: number | null // tháng emergency đạt target 3×
  allocations: FundAllocation[] // emergency đầu tiên, rồi goals theo hạng
}

export function calculateAllocationPlan(input: AllocationInput): AllocationPlan
```

**Thuật toán simulation (tháng-theo-tháng, cap 600):**
1. `capacity = income × sumBudgetPct(["savings_investment"]) / 100`
2. Mỗi tháng, xác định giai đoạn theo emergencyBalance HIỆN TẠI:
   - GĐ1 (`emergency < 1× essential`): 100% capacity → emergency
   - GĐ2 (`< emergencyTarget`): 70% emergency / 30% goals
   - GĐ3: 100% goals
3. **Spill-over trong tháng:** phần góp vượt ngưỡng (emergency đầy giữa tháng, goal đạt target giữa tháng) chảy tiếp sang bucket kế tiếp NGAY trong tháng đó — khép 100% capacity, không mất tiền
4. **Bậc thang goals:** phần goals chia theo ladder trên các goals CHƯA xong: 1 quỹ [100] · 2 quỹ [70,30] · 3 quỹ [60,30,10] · N≥4: hạng 1-2 giữ [60,30], các hạng 3..N chia đều 10% (quyết định D2 — BR-OB-011 chỉ định nghĩa đến 3 quỹ, schema onboardingV2 cho tối đa 5 goal funds `.max(5)` + emergency = 6 quỹ; flag cho reviewer)
5. Goal xong → loại khỏi ladder, các quỹ còn lại re-rank giữ thứ tự, ladder renormalize theo số quỹ còn lại
6. `monthlyAmount` = phân bổ tháng 1 (snapshot hiện tại — số hiển thị UI); `timelineMonths` = tháng balance đạt target
7. 0 goals: engine vẫn chạy (chỉ emergency, GĐ2 70% → emergency, 30% goals không có nơi nhận → 100% emergency luôn ở GĐ2; sau target → allocations kết thúc)
8. `capacity ≤ 0` (income 0): mọi timeline null, monthlyAmount 0 — không chia cho 0, không loop vô hạn
9. Làm tròn: giữ float trong simulation, `Math.floor` khi xuất `monthlyAmount` (VND nguyên đồng); so sánh ngưỡng dùng epsilon +1đ như convention hiện có

### Response Shape mới (route → client, đề xuất)

```typescript
data: {
  householdId: string,
  funds: Array<{ id, name, fundType, presetId, targetAmount,
                 monthlyAmount, timelineMonths }>,  // từ engine
  plan: { capacityMonthly, emergencyTarget, stage1EndMonth, stage2EndMonth },
  todayRemaining: number,  // không đổi
}
```

### Previous Story Intelligence (9.1 — tada-transparent-numbers)

- Duplication route/TadaStep đã gom về `calculateAggregateFeasibility` (deferred [8-1] đã trả) — giờ cả 2 call site swap sang engine, đúng 1 nguồn số
- Regression guards từ review 9.1 PHẢI GIỮ: adjust match by id · không adjust emergency · RPC result validation · 409 CTA resetOnboarding · localize error 500
- Lesson 9.1: bug là LABEL sai chứ không phải math — khi đổi số hiển thị, kiểm tra từng i18n key mang đúng semantic (per-fund vs tổng)
- Vitest hiện 414 tests pass — sau story chạy full suite, không chỉ file budgetTemplate
- Style: `font-mono tabular-nums` cho amounts, `formatVND`, không hardcode màu, giữ animation 4 stage + reduced-motion

### Git Intelligence

- `ca3478d` docs money model v2 (BR + epics + proposal — đã apply, không cần sửa docs thêm)
- `39cf3ae`/`da0671f` Epic 9: pattern review-fix 2 vòng; icon flow + fund editing không liên quan engine — đừng đụng `fundIcons.ts`, `GoalEditSheet`

### Project Structure Notes

- Engine ở `budgetTemplate.ts` cùng constants — KHÔNG tạo file/module mới (Karpathy: proposal chốt vị trí, 1 file giữ single source of truth capacity + template)
- Tests ở `src/lib/constants/__tests__/budgetTemplate.test.ts` (vitest, describe/it/expect)
- Không migration DB (proposal §2: schema đủ). Không đụng RPC `complete_onboarding_v2`.
- Tuân `_bmad-output/project-context.md`: strict TS không `any` · i18n qua `t()` · API response `{ data, error }` · `withAuthUser()` giữ nguyên đầu route

### References

- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-07-09.md` (approach + success criteria)
- `docs/02_BUSINESS_RULES.md:134-172` (BR-OB-009..013)
- `_bmad-output/planning-artifacts/prds/prd-onboarding-v2-2026-07-02/addendum.md:37-47` (Money Model v2)
- `_bmad-output/brainstorming/brainstorm-money-model-fund-engine-2026-07-09/` (brainstorm-intent, research-frameworks)
- `_bmad-output/implementation-artifacts/9-1-tada-transparent-numbers.md` (learnings + review patches)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent, dev-story workflow; main thread verify độc lập)

### Debug Log References

- `npx tsc --noEmit` → exit 0, sạch (verify độc lập bởi main thread)
- `npx vitest run` → Test Files 31 passed (31) · Tests 425 passed (425) — baseline 414 → 425
- `grep calculateFeasibility|calculateAggregateFeasibility|EMERGENCY_FUND_TIMELINE_MONTHS|FeasibilityResult src/` → 0 kết quả
- i18n parity: setupV2 vi 86 == en 86 · tổng vi 772 == en 772, symmetric diff rỗng

### Completion Notes List

1. **Task 1** — `calculateAllocationPlan` pure function trong `budgetTemplate.ts`: simulation tháng-theo-tháng cap 600, epsilon 1đ. Capacity derive `sumBudgetPct(["savings_investment"])`. `distributeMonth()` 3 giai đoạn với spill-over khép 100% capacity (goals đầy hết ở GĐ2 → dồn ngược emergency); `pourGoals()` ladder + redistribute renormalized khi goal đầy giữa chừng. `capacity ≤ 1đ` short-circuit chống loop vô hạn. Xóa `calculateFeasibility`, `calculateAggregateFeasibility`, `FeasibilityResult`, `EMERGENCY_FUND_TIMELINE_MONTHS`.
2. **Task 2** — 15 test mới thay 2 describe cũ: boundary income 15tr/40tr/100tr, 0-6 quỹ, ladder 1/2/3/4 quỹ, invariant tổng = capacity, spill-over redistribute, emergency partial/full, timeline >600 → null, income 0.
3. **Task 3** — route.ts: engine chạy 1 lần, `p_goals[0]` vẫn emergency (contract migration 016), goal `target_date = addMonthsIso(timeline)` hoặc null, schema Zod giữ `targetMonths` (backward-compat, không dùng khi tính). Response shape mới `{ householdId, funds, plan, todayRemaining }`.
4. **Task 4** — TadaStep + useCompleteOnboardingV2: types mới (`OnboardingFundResult{monthlyAmount,timelineMonths}`, `AllocationPlanSummary`), giữ nguyên 4-stage reveal/animation/reduced-motion/guards (match by id, không adjust emergency, 409 CTA, RPC validation). Adjust flow: chỉ chỉnh targetAmount → re-run engine client-side; bỏ months input; bỏ nhánh infeasible warning; stage "feasibility" = tổng góp capacity + dòng nguồn 15%.
5. **Quyết định ngoài spec (flag cho reviewer):**
   - Quỹ được adjust = goal hạng cao nhất (không còn trigger infeasible để tự chọn); UX picker đa-quỹ → 10.3.
   - `feasibleTitle` đổi text (tổng góp = capacity); keys mới `capacitySource`, `fundTimeline`, `fundTimelineNever`; xóa `infeasibleTitle`, `infeasibleDesc`, `adjustMonthsLabel`, `totalMonthlyNeeded`.
   - Ladder N≥4 = [60, 30, 10/(N-2) mỗi hạng] (quyết định D2 trong story — BR-OB-011 chỉ định nghĩa đến 3 quỹ).
   - Engine goals id do caller cấp: route dùng `String(index)`, TadaStep dùng fund id thật; emergency luôn `id:"emergency"`.
   - `hookDemoData.ts` không đụng (không dùng feasibility, không hardcode số góp/tháng).

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| Engine GĐ1→GĐ2→GĐ3 đúng ngưỡng (1× essential, 3× target) + ladder 70/30 · 60/30/10 | Automated (15 tests `calculateAllocationPlan`) | PASS |
| Invariant: tổng phân bổ mỗi tháng = capacity 15%, khép 100%, spill-over không mất tiền | Automated | PASS |
| Boundary: income 15tr/40tr/100tr · 0-6 quỹ · emergency partial/full · timeline >600 → null · income 0 không loop | Automated | PASS |
| Route onboarding/complete: engine 1 lần, `p_goals[0]`=emergency, target_date từ engine timeline, RPC validation giữ | Manual trace code (route không có test file — pattern hiện tại của project) | PASS |
| Tada 4-stage reveal hiển thị số engine (per-fund monthly, tổng = capacity, timeline) | Manual trace code — **cần browser verify** | PASS (trace) |
| Adjust flow: chỉnh target → engine re-run → timeline mới; không adjust emergency; match by id | Manual trace code — **cần browser verify** | PASS (trace) |
| i18n parity vi/en sau thêm/xóa keys | Automated check (86==86 setupV2, 772==772 tổng) | PASS |
| Không còn đường code nào dùng công thức available 19% | Automated (grep 0 kết quả + tsc sạch) | PASS |

### File List

- M `src/lib/constants/budgetTemplate.ts`
- M `src/lib/constants/__tests__/budgetTemplate.test.ts`
- M `src/app/api/onboarding/complete/route.ts`
- M `src/lib/hooks/useCompleteOnboardingV2.ts`
- M `src/components/onboarding/v2/TadaStep.tsx`
- M `src/lib/i18n/messages/vi.json`
- M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 10-07-2026 · **Outcome:** Approve (sau khi apply 7 patches) · **Layers:** Blind Hunter + Edge Case Hunter + Acceptance Auditor (3 subagents song song, cả 3 hoàn tất)

**AC verdicts:** AC1 PASS · AC2 PASS (grep 0 symbol chết, capacity derive, verify độc lập) · AC3 PASS sau P6 (trước đó PARTIAL: thiếu test 40tr/5-goals/biên 600).

### Action Items

- [x] [HIGH][blind+edge] `monthlyAmount` snapshot tháng 1 luôn 0đ cho mọi goal (GĐ1 nuốt 100% capacity) — UI "Góp 0đ/tháng" cạnh "xong N tháng". **P1:** đổi semantic → góp trung bình `(target − initial)/timeline`, `number | null`, null khi timeline null. `budgetTemplate.ts:73,90,202`.
- [x] [MED][blind+edge] Adjust rank-1 re-time mọi quỹ trên màn hình nhưng chỉ persist quỹ adjust → dashboard mâu thuẫn Tada. **P2:** TadaFinishButton PATCH tuần tự MỌI goal fund theo livePlan (adjust = target_amount+target_date, còn lại target_date). `TadaStep.tsx`.
- [x] [MED][blind+edge+audit] Timeline finite→null sau adjust để stale `target_date` (spread-omit). **P2:** explicit `target_date: null`; schema updateFund đã nullable sẵn.
- [x] [MED][edge] Adjust input bypass cap 100 tỷ×1000 (fund.ts không max). **P3:** clamp `Math.min(v, 1e14)` tại onChange.
- [x] [LOW][blind] `pourGoals` guard 12 mất tiền silent nếu >12 goals cap cùng tháng (future caller). **P4:** guard → `goals.length + 2`. `budgetTemplate.ts:132`.
- [x] [LOW][blind] en "1 months" + hardcode "600" trong copy 2 locale. **P5:** "Done in {{months}} mo" + interpolate `{{max}}` từ `MAX_ALLOCATION_MONTHS` (export mới `budgetTemplate.ts:97`).
- [x] [AC3][audit] Thiếu test income 40tr (AC verbatim) + 6 quỹ/ladder N=5 + biên đúng 600. **P6:** 3 test mới + update assertions theo P1; ladder N=5 test qua `ladderWeights()` trực tiếp = [0.6, 0.3, 0.1/3 ×3].
- [x] [i18n] **P7:** vi "Góp trung bình ~{{amount}}/tháng" / en "Save ~{{amount}}/month on average", parity 86==86, 772==772.

### Deferred (→ deferred-work.md)

- [Review][Defer] Target 1đ auto-complete qua epsilon (timeline 0, addMonthsIso(0)=hôm nay) — theoretical, CurrencyInput integer + Zod positive.
- [Review][Defer] `monthlyIncome` schema thiếu `.max()`/`.int()` — overflow >1e16 mất precision đồng (pre-existing Epic 4).
- [Review][Defer] `addMonthsIso` dùng server TZ thay `todayVN()` — target_date lệch 1 ngày window 00:00-07:00 VN (pre-existing class).
- [Review][Defer] Engine không guard income <41k (emergencyTarget floor 0 → stage state mâu thuẫn) — unreachable qua schema min 100k.
- [Review][Defer] `targetMonths` user nhập bị discard (GoalStep vẫn thu, engine không dùng) — **story 10.2 xử lý theo plan** (GoalStep live suggest).
- [Review][Defer] Response `plan`/`funds[].monthlyAmount` server-side chưa consumer nào đọc (TadaStep tự recompute) — **10.3 tiêu thụ cho storytelling**; drift risk chấp nhận trong epic.

### Verification sau patch (main thread, độc lập)

`npx tsc --noEmit` exit 0 · `npx vitest run` **31 files / 426 tests pass** (425 → 426) · i18n parity giữ.

## Change Log

- 10-07-2026: Story 10.1 implemented — engine `calculateAllocationPlan` 3 giai đoạn thay feasibility 19%; route + TadaStep tiêu thụ engine; 425 tests pass (baseline 414); status → review.
- 10-07-2026: Code review (3 adversarial layers) — 8 action items resolved (1 HIGH semantic `monthlyAmount`, 3 MED persist/clamp, AC3 test gaps), 6 items deferred có chủ đích; 426 tests pass; status → done.
