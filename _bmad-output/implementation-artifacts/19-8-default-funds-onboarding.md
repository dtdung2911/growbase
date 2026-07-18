# Story 19.8: 3 quỹ mặc định khi onboarding + banner household cũ

Status: done

## Story

As a người dùng mới,
I want kết thúc onboarding có sẵn bộ quỹ nền tảng đúng phương pháp,
so that bắt đầu phân bổ tiền ngay không phải tự nghĩ cấu trúc quỹ.

## Acceptance Criteria

1. Onboarding complete tạo 3 funds mặc định: "Quỹ khẩn cấp" (emergency, target = **6 tháng** × chi phí sinh hoạt ước tính — công thức estimateEmergencyTarget từ % chi tiêu của BUDGET_TEMPLATE × thu nhập, chính là "fallback thu nhập" vì baselines lúc onboarding = template), "Quỹ dự phòng" (sinking, target gợi ý = 1 tháng chi phí), "Quỹ đầu tư" (investment, KHÔNG target).
2. Mô tả phân biệt rõ (description trên fund): khẩn cấp = chuyện không đoán được; dự phòng = khoản biết trước (Tết, bảo hiểm, bảo dưỡng xe); đầu tư = tiền đẻ ra tiền.
3. priority_rank: chỉ goal funds nhận rank; sinking/investment NULL (không lẫn vào xếp hạng Money Model).
4. Cả 3 quỹ xóa được (không is_system — funds không có cột is_system, thỏa mặc định).
5. Household hiện hữu KHÔNG backfill: màn Quỹ hiện banner "Tạo bộ quỹ cơ bản?" khi thiếu ≥1 trong 3 loại cơ bản, dismiss được (localStorage), nút tạo bổ sung các quỹ còn thiếu.
6. Quỹ tùy biến = suggestion chips khi tạo quỹ — GOAL_PRESETS chips ĐÃ có sẵn trong FundForm (education/house/travel), thỏa AC.
7. i18n vi/en (kể cả locale en cho tên/mô tả quỹ tạo từ onboarding).

## Tasks / Subtasks

- [ ] Task 1: Migration 025 CREATE OR REPLACE complete_onboarding_v2 — limit 8, investment không cần target, cột description, priority_rank chỉ goal (AC: #1,2,3)
- [ ] Task 2: packages/shared budgetTemplate.ts — `estimateEmergencyTarget(monthlyIncome, months = EMERGENCY_FUND_MONTHS)` + export `estimateMonthlyLivingCost(monthlyIncome)` (AC: #1)
- [ ] Task 3: onboarding/complete/route.ts — emergency months=6 + target_months_expense=6; append sinking + investment vào p_goals (sau goals) với name/description localize; sửa guard `fundIds.length !== p_goals.length` (AC: #1,2,7)
- [ ] Task 4: FundList banner (AC: #5) + i18n
- [ ] Task 5: Verify — psql test RPC mới (target null investment OK, guard vẫn chặn goal thiếu target), tsc, vitest, build

## Dev Notes

- complete_onboarding_v2 nhận p_goals jsonb generic (fund_type cast) → KHÔNG cần đổi shape, chỉ append items. Contract [0] = emergency giữ nguyên; sinking/investment append CUỐI (sau goals) để fund_ids mapping của response funds (emergency+goals) không đổi index.
- Route: guard hiện tại `fundIds.length !== funds.length` (dòng 122) sẽ fail vì RPC trả nhiều id hơn — đổi so sánh với p_goals.length; fundsWithId vẫn map trên funds (đầu mảng).
- EMERGENCY_FUND_MONTHS = 3 hiện tại — KHÔNG đổi hằng số (19.9 mới đụng engine); route pass months=6 explicit.
- estimateMonthlyLivingCost = monthlyIncome × sumBudgetPct(SPENDING_COST_TYPE_GROUPS)/100 — dùng cho sinking target (× 1 tháng, làm tròn 100k như estimateEmergencyTarget) và 19.9 chips.
- Banner FundList: check `funds` thiếu fund_type nào trong ['emergency','sinking','investment']; tạo tuần tự qua useCreateFund. Emergency tạo từ banner KHÔNG có target (không biết thu nhập client-side) — user chỉnh bằng chips 19.9.
- GOAL_PRESETS chips đã có trong FundForm step tên (dòng 177-196) — không thêm "car" vì đụng contract PRESET_ICON_NAMES/onboarding schema. Ghi nhận là quyết định.

### Project Structure Notes

- Files: migration 025 (new), budgetTemplate.ts, onboarding/complete/route.ts, FundList.tsx, messages vi/en.

### References

- [Source: epics-fund-transaction-sync.md#Story 19.8, FR-6/9]
- [Source: supabase/migrations/018_priority_rank.sql — bản complete_onboarding_v2 trước]

## Dev Agent Record

### Agent Model Used

claude-fable-5[1m]

### Debug Log References

- Migration 025 apply sạch; psql test complete_onboarding_v2 4 funds; tsc + 532 tests + next build pass; mobile tsc clean

### Testing

- psql (rollback): complete_onboarding_v2 với [emergency, goal, sinking, investment(target NULL)] → 4 funds đúng: goal rank=1, còn lại rank NULL, investment target NULL, description lưu đúng.
- Route: emergency target = estimateEmergencyTarget(income, 6), target_months_expense=6; sinking target = 1 tháng chi phí (làm tròn 100k); guard fundIds.length so với p_goals.length (RPC trả đủ 6 id khi 3 goals).
- Banner FundList: hiện khi thiếu ≥1 loại cơ bản active, dismiss lưu localStorage theo household, nút tạo tuần tự các quỹ thiếu qua useCreateFund (target trống — client không biết thu nhập, user chỉnh bằng chips 19.9).

### Completion Notes List

- Quyết định: sinking target gợi ý = 1 tháng chi phí (thiết kế nói 1-2 tháng — chọn mức thận trọng); EMERGENCY_FUND_MONTHS=3 giữ nguyên (19.9 mới đụng engine), route pass months=6 explicit.
- Sinking/investment append CUỐI p_goals — giữ contract [0]=emergency + index mapping response funds.
- GOAL_PRESETS chips (education/house/travel) đã có sẵn trong FundForm — thỏa AC suggestion chips; không thêm "car" vì đụng contract PRESET_ICON_NAMES/onboarding schema (ghi nhận cho user).
- PRESET_ICON_NAMES thêm sinking (umbrella) + investment (trend-up).

### File List

- supabase/migrations/025_onboarding_default_funds.sql (new)
- packages/shared/src/constants/budgetTemplate.ts (modified — estimateMonthlyLivingCost + months param)
- packages/shared/src/constants/fundIcons.ts (modified)
- apps/web/src/app/api/onboarding/complete/route.ts (modified)
- apps/web/src/components/funds/FundList.tsx (modified — banner)
- apps/web/src/lib/i18n/messages/vi.json, en.json (modified)
