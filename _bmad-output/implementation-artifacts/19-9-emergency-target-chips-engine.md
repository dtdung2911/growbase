# Story 19.9: Chips target quỹ khẩn cấp + engine đọc target từ fund + UI quỹ không target

Status: done

## Story

As a người dùng,
I want chỉnh nhanh mục tiêu quỹ khẩn cấp theo số tháng và thấy quỹ không target hiển thị đúng bản chất tích lũy,
so that kế hoạch phân bổ phản ánh đúng lựa chọn của mình.

## Acceptance Criteria

1. Trang chi tiết quỹ khẩn cấp: chips 3·4·5·6 tháng; chọn chip → PATCH fund `target_amount = estimateEmergencyTarget(trailingIncome, months)` + `target_months_expense = months` (useUpdateFund, toast); chip active theo target_months_expense hiện tại.
2. Engine `calculateAllocationPlan`: thêm `emergencyTargetMonths?: number`; khi có override target + months → `stage1Threshold = emergencyTarget / months` (bỏ giả định cứng /3); không months → giữ /3 (backward compat); không override → estimate cũ. Test engine bổ sung, không regression.
3. `/api/living-plan` trả thêm `emergencyTargetMonths` (từ fund.target_months_expense); useLivingPlan truyền vào engine.
4. `monthsToStage` (stageEvent.ts) nhận optional `stage1Threshold` thay giả định /3 — caller nào có plan thì truyền.
5. Quỹ không target (target_amount NULL — vd Quỹ đầu tư): card + detail KHÔNG progress bar %, hiển thị tích lũy (số dư, font-mono).
6. i18n vi/en.

## Tasks / Subtasks

- [ ] Task 1: Engine (AC: #2) — AllocationInput + threshold logic + test cases mới trong budgetTemplate.test.ts
- [ ] Task 2: living-plan route + useLivingPlan (AC: #3)
- [ ] Task 3: stageEvent.monthsToStage optional threshold (AC: #4)
- [ ] Task 4: Chips UI ở funds/[id]/page.tsx cho fund_type=emergency (AC: #1)
- [ ] Task 5: FundCard + detail: target NULL → ẩn progress %, hiện tích lũy (AC: #5)
- [ ] Task 6: tsc + vitest (cả engine tests) + build

## Dev Notes

- Engine hiện tại (budgetTemplate.ts ~117-125): `hasTargetOverride ? emergencyTarget / 3 : income × spending%` — "/3" là giả định target luôn 3 tháng; sau 19.8 target mặc định 6 tháng → threshold sai gấp đôi nếu không sửa.
- useLivingPlan.ts:48-60 đã truyền emergencyTarget từ DB — chỉ cần thêm months.
- living-plan route: `emergencyTargetAmount` dòng ~70; thêm `emergencyTargetMonths` từ cùng fund record; response type LivingPlanData (tìm type trong shared/types hoặc route).
- stageEvent.ts:37: `toStage === 2 ? emergencyTarget : emergencyTarget / 3`.
- Chips: cần trailingIncome — useLivingPlan đã return `trailingIncome` (dòng 72). Target = estimateEmergencyTarget(trailingIncome, months) (làm tròn 100k sẵn trong helper).
- FundCard/detail progress: tìm chỗ render % (GoalDualProgress/FundCard) — guard `fund.target_amount == null`.
- Cẩn thận test cũ: budgetTemplate.test.ts nhiều case dựa trên /3 và estimate — thêm case mới, không sửa case cũ (backward compat giữ nguyên hành vi khi không truyền months).

### Project Structure Notes

- Files: budgetTemplate.ts (+test), stageEvent.ts, living-plan/route.ts, useLivingPlan.ts, funds/[id]/page.tsx, FundCard.tsx (nếu cần), messages vi/en.

### References

- [Source: epics-fund-transaction-sync.md#Story 19.9, FR-7/8]
- [Source: memory project_money_model_v2 — insight stage1 hằng số]

## Dev Agent Record

### Agent Model Used

claude-fable-5[1m]

### Debug Log References

- tsc clean web+mobile; vitest web 534 pass (2 test engine mới), mobile 158 pass; next build compiled

### Testing

- Engine: test mới — months=6 với target 97.2tr → stage1Threshold 16.2tr (= 1 tháng chi phí); không months + target 48.6tr → 16.2tr (/3 backward compat). Toàn bộ test cũ không đổi, không regression (534/534).
- Chuỗi data: fund.target_months_expense → living-plan route (select + response) → useLivingPlan → engine input. Onboarding 19.8 đã set months=6 cho quỹ mới → threshold đúng ngay.
- monthsToRefill nhận stage1Threshold từ plan (StageEventCard truyền) — hết giả định /3 khi có plan.
- Chips 3·4·5·6: chỉ emergency + trailingIncome > 0; active theo target_months_expense; PATCH target_amount + target_months_expense qua useUpdateFund (đã invalidate livingPlan từ 19.1 → plan tự tính lại).
- Quỹ không target: FundCard + detail hiện dòng "Tích lũy theo thời gian", không progress % (progress đã null sẵn khi target null — chỉ thêm dòng thay thế).

### Completion Notes List

- stage1Threshold expose optional trên AllocationPlan (fixtures test cũ không phải sửa).
- Không dùng ConfirmDialog cho chips (thiết kế chốt: chỉ toast) — đổi target không destructive.
- Backward compat giữ nguyên mọi hành vi khi caller không truyền months.

### File List

- packages/shared/src/constants/budgetTemplate.ts (modified — emergencyTargetMonths, stage1Threshold expose)
- packages/shared/src/rules/stageEvent.ts (modified — stage1Threshold param)
- apps/web/src/components/dashboard/StageEventCard.tsx (modified)
- apps/web/src/app/api/living-plan/route.ts (modified)
- apps/web/src/lib/hooks/useLivingPlan.ts (modified)
- apps/web/src/app/(app)/funds/[id]/page.tsx (modified — chips + open accumulation)
- apps/web/src/components/funds/FundCard.tsx (modified)
- apps/web/src/lib/constants/__tests__/budgetTemplate.test.ts (modified — 2 tests mới)
- apps/web/src/lib/i18n/messages/vi.json, en.json (modified)
