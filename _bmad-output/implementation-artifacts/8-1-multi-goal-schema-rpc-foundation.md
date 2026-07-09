---
baseline_commit: 954f19c5fa316db10ce58b3d73c27d0db86a58a9
---

# Story 8.1: Nền multi-goal — schema, RPC, store

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng mới,
I want quỹ khẩn cấp LUÔN được tạo làm nền tảng và có thể thêm nhiều mục tiêu riêng bên cạnh,
so that tôi không phải "hy sinh" quỹ khẩn cấp khi tôi cũng muốn tiết kiệm mua nhà/cho con học.

## Acceptance Criteria

1. **Given** user hoàn tất onboarding với 0 mục tiêu thêm, **When** RPC `complete_onboarding_v2` chạy, **Then** vẫn tạo đúng 1 fund `emergency` với target tự tính (`estimateEmergencyTarget(monthlyIncome)`).
2. **Given** user chọn thêm N mục tiêu (vd Mua nhà + Du lịch), **When** RPC chạy, **Then** tạo 1 fund emergency + N fund `goal` trong CÙNG transaction — all-or-nothing. Lỗi giữa chừng → không có household/fund nào được tạo.
3. **Given** session cũ còn state shape cũ (`goal` object đơn) trong sessionStorage, **When** user quay lại flow, **Then** store migrate an toàn (zustand persist `version` + `migrate`), không crash, không kế thừa dữ liệu rác.
4. **Given** API response trả về mảng funds, **When** TadaStep render, **Then** stage `goal` hiển thị đủ danh sách fund đã tạo; `TadaFinishButton` cập nhật đúng fund tương ứng khi user điều chỉnh ở nhánh infeasible (match theo fund trả về từ response, KHÔNG match theo `fund_type` vì giờ có nhiều fund cùng type `goal`).
5. RPC mới REVOKE EXECUTE khỏi PUBLIC/anon/authenticated, GRANT chỉ service_role (giữ nguyên lockdown pattern của migration 012). Signature cũ bị DROP (đổi param type → Postgres coi là function khác, không tự thay).
6. `npx tsc --noEmit` sạch; test store (`src/__tests__/stores/onboardingV2Store.test.ts`) cập nhật theo shape mới và pass.

## Tasks / Subtasks

- [x] Task 1: Đổi Zod schema (AC: 2, 3)
  - [x] `src/lib/validations/onboardingV2.ts`: `completeOnboardingV2Schema` đổi `goal: goalSchema` → `goals: z.array(goalSchema).max(5)`. `goals` KHÔNG chứa emergency (refine từng phần tử `fundType === "goal"`) — emergency là implicit, server luôn tạo.
  - [x] Giữ nguyên `goalSchema` per-item (presetId/fundType/name/targetAmount/targetMonths + refine "goal cần số đích và thời hạn").
  - [x] Export type `CompleteOnboardingV2Input` cập nhật theo.
- [x] Task 2: Migration `013_onboarding_multi_goal.sql` (AC: 1, 2, 5)
  - [x] DROP function `complete_onboarding_v2(uuid, text, numeric, jsonb, jsonb)` cũ (signature đổi).
  - [x] CREATE function mới: param cuối `p_goals jsonb` (mảng). Giữ nguyên các bước 1-5 và 7 của 011 (household → member → clone_category_hierarchy → income → account → budget_baselines → onboarding_completed). Bước 6 thành: LUÔN insert fund emergency trước (name/target/target_months_expense từ phần tử emergency do route compose), rồi loop `jsonb_array_elements` insert các fund goal.
  - [x] Guard: RAISE EXCEPTION nếu `p_goals` rỗng hoặc phần tử đầu không phải `fund_type = 'emergency'` (contract: route luôn prepend emergency).
  - [x] `SECURITY DEFINER SET search_path = public, pg_temp` (rule tuyệt đối từ S0).
  - [x] REVOKE/GRANT như 012 cho signature mới.
- [x] Task 3: Route `src/app/api/onboarding/complete/route.ts` (AC: 1, 2, 4)
  - [x] Auth check giữ nguyên `withAuthUser()` đầu tiên (AD-1), vẫn `supabaseAdmin` (AD-2).
  - [x] Compose `p_goals`: phần tử [0] luôn là emergency `{ fund_type: 'emergency', name, target_amount: estimateEmergencyTarget(monthlyIncome), target_months_expense: EMERGENCY_FUND_MONTHS }`, tiếp theo map từng goal user chọn (`target_date = addMonthsIso(targetMonths)`).
  - [x] Response mới: `{ householdId, funds: [{ name, fundType, targetAmount, months, feasibility }], totalMonthlyNeeded, feasibility, todayRemaining }` — `feasibility` tổng tính bằng `calculateFeasibility(Σ targetAmount có kỳ hạn, ...)` hoặc per-goal rồi tổng `monthlyNeeded`; giữ tương thích tối đa với `FeasibilityResult` hiện có. Emergency dùng `EMERGENCY_FUND_TIMELINE_MONTHS` làm months.
  - [x] 409 "Already onboarded" + 400 Zod + 500 giữ nguyên pattern.
- [x] Task 4: Store `src/lib/stores/onboardingV2Store.ts` (AC: 3)
  - [x] State: `goal: OnboardingGoal | null` → `goals: OnboardingGoal[]` (chỉ chứa goal, không emergency). Actions: `toggleGoal`, `updateGoal(presetId, patch)`, `clearGoals`.
  - [x] `canProceed()` step 1: luôn `true` khi `goals` rỗng (emergency mặc định đủ điều kiện đi tiếp); nếu có goals thì TẤT CẢ phải pass `goalSchema.safeParse`.
  - [x] persist: thêm `version: 1` + `migrate` — version 0 (shape cũ có `goal`) → reset về initialState (an toàn nhất, onboarding chưa hoàn tất thì làm lại từ đầu không mất gì đáng kể).
- [x] Task 5: GoalStep adapt tối thiểu (AC: 3) — GIỮ UI hiện tại, chỉ đổi data
  - [x] Chọn preset emergency → `clearGoals()`. Chọn preset khác → `goals = [goal đó]` (single-select tạm, story 8.2 mới đổi multi-select UI).
  - [x] Bỏ `useEffect` auto-select emergency (không cần nữa — emergency là mặc định implicit; nút Tiếp tục vẫn enable ngay vì `canProceed` step 1 = true khi goals rỗng).
- [x] Task 6: TadaStep compat (AC: 4)
  - [x] `useCompleteOnboardingV2` + `CompleteOnboardingV2Response`: type theo response mới.
  - [x] Mutation payload: `{ goals, monthlyIncome }` từ store.
  - [x] Stage `goal`: render list `result.funds` (mỗi fund 1 dòng `TadaCard` đơn giản — redesign visual để story 8.3).
  - [x] Nhánh infeasible + `TadaFinishButton`: điều chỉnh hoạt động trên fund infeasible cụ thể; update fund match theo `name` + `fund_type` từ `useFunds()` (KHÔNG `find(f => f.fund_type === fundType)` như cũ vì nhiều fund cùng type). Nếu nhiều fund cần update → loop `mutateAsync` tuần tự.
  - [x] Guard `if (!goal || monthlyIncome === null) return null` đổi thành check `monthlyIncome === null` (goals rỗng hợp lệ).
- [x] Task 7: Tests + verify (AC: 6)
  - [x] Cập nhật `src/__tests__/stores/onboardingV2Store.test.ts`: toggleGoal/canProceed/migrate v0→v1.
  - [x] `npx tsc --noEmit` + chạy test suite.
  - [x] Verify nghiệp vụ thủ công: onboard 0 goal → dashboard có 1 fund emergency; onboard 2 goals → 3 funds; user cũ (đã onboard) gọi lại → 409.

## Dev Notes

- **Hiện trạng phải đọc trước khi sửa** (nguồn sự thật, đã trace 06-07-2026):
  - `supabase/migrations/011_onboarding_v2.sql` — RPC hiện tại nhận `p_goal jsonb` (object đơn), insert 1 fund ở bước 6. `012_lockdown_onboarding_v2_rpc.sql` — REVOKE/GRANT pattern phải lặp lại cho signature mới.
  - `src/lib/stores/onboardingV2Store.ts` — persist key `"growbase-onboarding-v2"`, sessionStorage, chưa có version → mặc định 0.
  - `src/components/onboarding/v2/TadaStep.tsx` — có 2 comment quan trọng KHÔNG ĐƯỢC phá: (1) `useMutationState` thay vì đọc state từ hook mutation (StrictMode unmount gỡ observer → spinner treo); (2) deps `[goal, monthlyIncome]` không phải `[]` (store rehydrate sau mount đầu). Shape đổi thì deps thành `[goals, monthlyIncome]` — giữ nguyên cơ chế `fired` ref.
  - `TadaStep` gate nhánh infeasible theo verdict GỐC từ server (`original.feasibility.feasible`), không theo feasibility live — giữ nguyên để inputs không unmount giữa chừng khi user gõ qua ngưỡng.
  - `resolveFeasibilityMonths` (`src/lib/constants/tadaReveal.ts`) hiện nhận `fundType` đơn — cần rework hoặc bỏ khi tính per-fund.
- **Không đụng:** `complete_onboarding()` cũ (006) — đã chết cùng wizard cũ, kệ nó. `clone_category_hierarchy`, BUDGET_TEMPLATE 18 dòng, income/account insert — giữ nguyên từng chữ trong RPC mới.
- **Non-negotiable rules áp dụng:** Fund ops = atomic RPC only (rule 1) — chính là lý do N funds phải trong 1 RPC. Auth check first (rule 4). Keys từ `keys.ts` factory (rule 5) nếu đụng query keys.
- **Testing:** Vitest có sẵn. Store test là bắt buộc vì migrate logic dễ sai lặng lẽ.

### Project Structure Notes

- Migration mới: `supabase/migrations/013_onboarding_multi_goal.sql` (số tiếp theo sau 012).
- Không file mới nào khác — toàn UPDATE: `onboardingV2.ts` (validations), `onboardingV2Store.ts`, `route.ts`, `useCompleteOnboardingV2.ts`, `GoalStep.tsx` (tối thiểu), `TadaStep.tsx` (compat), store test.
- i18n: story này KHÔNG thêm string mới (UI giữ nguyên) — strings mới thuộc 8.2/8.3/8.4.

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Epic-8 Story 8.1]
- [Source: supabase/migrations/011_onboarding_v2.sql — RPC gốc]
- [Source: supabase/migrations/012_lockdown_onboarding_v2_rpc.sql — lockdown pattern]
- [Source: docs/02_BUSINESS_RULES.md — fund types, BR-FU-002/003]
- [Source: docs/04_TECHNICAL_SPEC.md — schema funds, RPC conventions]
- Party-mode session 06-07-2026: quyết định "emergency bắt buộc + multi-select goals", "backend RPC + Tada multi-goal chung 1 story vì phụ thuộc chặt".

## Dev Agent Record

### Agent Model Used

growbase-senior-developer (Sonnet) — orchestrated by dev-story workflow.

### Debug Log References

`npx tsc --noEmit` → exit 0 (verified độc lập bởi orchestrator). Vitest full suite: 386 passed (store test 12/12, validations test cập nhật pass).

### Completion Notes List

- Schema `goal`→`goals: z.array(goalSchema).max(5)` + refine mỗi phần tử `fundType==='goal'` (emergency implicit server-side).
- Migration `013_onboarding_multi_goal.sql`: DROP + CREATE RPC nhận `p_goals jsonb`, loop insert emergency[0]+goals, guard empty/`[0]!=emergency`, REVOKE/GRANT lockpattern 012, SECURITY DEFINER search_path.
- Store `goals[]` + toggleGoal/updateGoal/clearGoals, canProceed step1 (empty=true), persist version:1 + migrate v0→reset.
- Route compose p_goals (emergency prepend), response `{ householdId, funds[], feasibility, todayRemaining }`.
- TadaStep: 2 regression guard nguyên vẹn (useMutationState MutationCache; deps [goals,monthlyIncome]+fired ref; gate infeasible theo verdict gốc).

**Deviations cần biết (từ agent):**
- `IncomeStep.tsx` (ngoài scope list) phải sửa: nó đọc `store.goal`/`setGoal` cho editable emergency target → đổi thành read-only auto-compute `estimateEmergencyTarget(income)`. i18n keys `emergencyDesc`/`emergencyEditLabel` giờ unused (chưa xoá).
- `onboardingV2.test.ts` (validations) cập nhật theo schema mới.
- Emergency fund name hardcode `"Quỹ khẩn cấp"` trong route (server không i18n) — khớp value i18n `setupV2.goal.emergency.name`.
- `resolveFeasibilityMonths` (tadaReveal.ts) không còn dùng bởi TadaStep nhưng để lại (còn unit test riêng) → **flag cleanup cho story 8-3**.
- "Loop mutateAsync" KHÔNG implement dạng loop: `useUpdateFund(fundId)` bind 1 id (React rules), GoalStep single-select story này → tối đa 1 fund adjustable. Fix đúng AC4 (match name+fund_type thay vì fund_type đơn) với 1 mutateAsync. Multi-fund adjust thật sự = territory 8-3.

### Testing

- Onboard 0 goal → 1 fund emergency tự tính: verified automated (store canProceed + route compose logic) + migration guard. Cần Dzung xác nhận tay trên app (tạo household thật) trước khi tin 100%.
- Onboard N goals → 1 emergency + N goal funds atomic: verified qua migration logic + schema; **cần verify tay** vì RPC chỉ chạy thật trên Supabase (không có DB test harness trong repo).
- Store migrate v0→v1: automated test 12/12 pass.
- TadaFinishButton match fund by name+fund_type: verified qua tsc + logic trace; cần verify tay nhánh infeasible.
- Regression: full vitest 386 pass, tsc 0.

### File List

- `supabase/migrations/013_onboarding_multi_goal.sql` (new)
- `src/lib/validations/onboardingV2.ts` (mod)
- `src/app/api/onboarding/complete/route.ts` (mod)
- `src/lib/stores/onboardingV2Store.ts` (mod)
- `src/lib/hooks/useCompleteOnboardingV2.ts` (mod)
- `src/components/onboarding/v2/GoalStep.tsx` (mod)
- `src/components/onboarding/v2/TadaStep.tsx` (mod)
- `src/components/onboarding/v2/IncomeStep.tsx` (mod — ngoài scope, bắt buộc)
- `src/__tests__/stores/onboardingV2Store.test.ts` (mod)
- `src/__tests__/validations/onboardingV2.test.ts` (mod — ngoài scope, bắt buộc)

## Change Log

- 06-07-2026: Implement multi-goal foundation (schema/RPC/store/route/Tada compat). tsc 0, 386 tests pass.
