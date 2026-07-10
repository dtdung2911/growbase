---
baseline_commit: ca3478d6017dc37e065ce06b1266e0645f824d0d
---

# Story 10.2: GoalStep gợi ý khả thi live

Status: done

## Story

As a người dùng nhập mục tiêu,
I want thấy ngay "góp X/tháng · xong khoảng [thời điểm]" khi vừa nhập số tiền,
So that mục tiêu hiện hữu và khả thi ngay lúc mơ.

**Nguồn:** Epic 10 — Money Model v2 (`epics-onboarding-v2.md` §Story 10.2) · BR-OB-011, BR-OB-012.

## Acceptance Criteria

1. **Given** user nhập target quỹ (preset hoặc custom)
   **When** giá trị thay đổi
   **Then** hiện gợi ý live từ engine 10.1 (hạng tạm = thứ tự thêm quỹ); số tụt mood không đứng một mình (BR-OB-012 — kèm ghi chú lối thoát sẽ có ở Tada/Epic 11); i18n vi/en; `tsc` sạch

## Tasks / Subtasks

- [x] Task 1: Reorder wizard — Income trước Goal (AC: 1 — điều kiện tiên quyết, xem Dev Notes §Quyết định D1)
  - [x] `SetupClient.tsx` steps array (dòng 31-34): Hook(0) → Income(1) → Goal(2) → Tada(3)
  - [x] `onboardingV2Store.ts` `canProceed()` (dòng 46-53): swap logic step 1 ↔ step 2 (step 1 = income valid, step 2 = goals valid)
  - [x] Kiểm tra mọi chỗ hardcode step index (grep `step === ` trong v2 components + store) và copy/hint text nhắc thứ tự bước
  - [x] sessionStorage persist (`growbase-onboarding-v2`): user đang dở flow cũ có step index trỏ sai bước — chấp nhận (mid-flow session hiếm, store validate canProceed chặn tiến); KHÔNG build migration
- [x] Task 2: Xóa `targetMonths` khỏi data model (AC: 1 — trả deferred item 10-1)
  - [x] `onboardingV2.ts`: xóa field `targetMonths` khỏi `goalSchema` (dòng 15-20); refine (dòng 24-26) chỉ còn yêu cầu `targetAmount !== null` cho fundType goal
  - [x] Xóa `targetMonths` khỏi type `OnboardingGoal` + store + `completeOnboardingV2Schema`
  - [x] `GoalStep.tsx`: xóa months input (dòng 219-230) + duration label helper (dòng 234) nếu không còn dùng
  - [x] Grep toàn repo `targetMonths` → 0 kết quả sau khi xong
- [x] Task 3: Live suggest trong GoalStep (AC: 1)
  - [x] Đọc `monthlyIncome` từ `useOnboardingV2Store` (đã có sau Task 1)
  - [x] Chạy `calculateAllocationPlan` với: emergency (`estimateEmergencyTarget(income)`, balance 0) + TẤT CẢ goals đã chọn có targetAmount hợp lệ, hạng = thứ tự trong `goals` array (thứ tự user thêm — AC "hạng tạm")
  - [x] Dưới CurrencyInput mỗi goal đã chọn: dòng suggest "Góp trung bình ~{amount}/tháng · xong khoảng {timeline}" từ `monthlyAmount`/`timelineMonths` của fund đó
  - [x] `timelineMonths` null (>600 tháng) HOẶC > 120 tháng (>10 năm — ngưỡng BR-OB-012): kèm dòng lối thoát nhẹ (i18n): "Đừng lo — sẽ có cách rút ngắn ở bước kế hoạch" (lối thoát thật = Tada/Epic 11 theo AC)
  - [x] Số render `font-mono tabular-nums` + `formatVND`; suggest recompute mỗi keystroke (engine thuần, ≤600 vòng × ≤6 quỹ — không cần debounce/useMemo, Karpathy)
- [x] Task 4: Tests + i18n (AC: 1)
  - [x] Update tests store `canProceed` theo thứ tự bước mới (tìm test store hiện có trong `src/__tests__/stores/`)
  - [x] Update tests validation: goalSchema không còn targetMonths, refine mới
  - [x] i18n keys mới `setupV2.goal.*` cả vi + en, parity check
- [x] Task 5: Verification (AC: 1)
  - [x] `npx tsc --noEmit` sạch · `npx vitest run` full suite pass
  - [x] `grep -rn "targetMonths" src/` → 0
  - [x] i18n parity vi == en
  - [x] Manual trace: Hook → Income (nhập 40tr) → Goal (chọn 2 goals, nhập tiền, thấy suggest đổi live) → Tada reveal + adjust vẫn hoạt động

## Dev Notes

### Quyết định D1 — Reorder wizard (flag cho reviewer)

Epic không nói đổi thứ tự bước, nhưng hiện trạng GoalStep = step 1, IncomeStep = step 2 (`SetupClient.tsx:31-34`), `monthlyIncome` null tại lúc nhập goal → engine không chạy được. AC đòi "thấy ngay khi vừa nhập số tiền" → cách duy nhất thỏa là Income trước Goal. Alternative bị loại: hiện suggest chỉ khi back-navigate (vô nghĩa forward flow chính). IncomeStep có emergency preview độc lập (chỉ cần income) — đứng trước Goal vẫn đúng.

### Business Rules áp dụng

- **BR-OB-011:** hạng do user xếp — onboarding dùng hạng tạm = thứ tự thêm quỹ (kéo thả thật = story 11.1). KHÔNG slider.
- **BR-OB-012 (verbatim):** "Số timeline gây tụt mood KHÔNG BAO GIỜ render một mình — luôn kèm ≥1 lối thoát... Nắn chặng = OPT-IN 1 chạm, chỉ gợi ý khi timeline > 10 năm". Cho 10.2: lối thoát = ghi chú text (AC cho phép "lối thoát sẽ có ở Tada/Epic 11"); nắn chặng opt-in thật = Epic 11.2.

### Engine 10.1 — API thực tế (sau review patches, KHÁC spec gốc)

```typescript
// src/lib/constants/budgetTemplate.ts — đã tồn tại, KHÔNG sửa engine
calculateAllocationPlan({ monthlyIncome, goals: AllocationGoalInput[], emergencyBalance? }): AllocationPlan
// AllocationGoalInput = { id: string, targetAmount: number, initialBalance?: number }
// FundAllocation = { id, monthlyAmount: number | null, timelineMonths: number | null }
//   monthlyAmount = góp TRUNG BÌNH (target − initial)/timeline (review P1) — null khi timeline null
//   timelineMonths null khi > MAX_ALLOCATION_MONTHS (600, exported)
// AllocationPlan = { capacityMonthly, emergencyTarget, stage1EndMonth, stage2EndMonth, allocations }
//   allocations[0] = emergency (id "emergency"), sau đó goals theo thứ tự input
```

- Emergency KHÔNG nằm trong `goals` input — engine tự thêm từ `estimateEmergencyTarget`? KHÔNG — kiểm tra chữ ký thật: engine nhận `monthlyIncome` và tự tính emergency target nội bộ (xem `budgetTemplate.ts:97-208`). Đọc file trước khi gọi — TadaStep.tsx:139-151 (`livePlan`) là ví dụ call site chuẩn để copy pattern.
- Ladder: [100] / [70,30] / [60,30,10] / N≥4: [60,30,10/(N-2)…] — `ladderWeights()` exported.

### Hiện trạng code (từ phân tích + story 10-1)

**`src/app/setup/SetupClient.tsx`:** steps array dòng 31-34 `[HookStep, GoalStep, IncomeStep, TadaStep]` → đổi thành `[HookStep, IncomeStep, GoalStep, TadaStep]`.

**`src/lib/stores/onboardingV2Store.ts`:** `goals: OnboardingGoal[]`, `monthlyIncome: number | null`, `canProceed()` dòng 46-53 (step 1 = goals valid, step 2 = income valid — SWAP), persist sessionStorage key `growbase-onboarding-v2` dòng 57, `next()`/`prev()` dòng 42-44.

**`src/components/onboarding/v2/GoalStep.tsx` (255 dòng):**
- Tier 1 emergency cố định: dòng 60-73 (giữ nguyên)
- Tier 2 multi-select grid ≤5 goals: dòng 84-242, toggle dòng 105
- Detail editor khi selected: dòng 139-238 — name (142-157, chỉ custom), icon grid (161-200), CurrencyInput targetAmount (201-214), months input (215-237, XÓA)
- i18n prefix `setupV2.goal.*`
- Suggest line chèn sau CurrencyInput block (~dòng 214)

**`src/lib/validations/onboardingV2.ts`:** goalSchema dòng 5-26 (targetAmount 10-14 GIỮ, targetMonths 15-20 XÓA, refine 24-26 SỬA); monthlyIncomeSchema min 100k dòng 31-33 (GIỮ)

**`src/components/onboarding/v2/IncomeStep.tsx` (58 dòng):** không sửa nội dung — chỉ đổi vị trí trong steps array. Emergency preview dùng `estimateEmergencyTarget` độc lập, hợp lệ trước Goal.

**KHÔNG đụng:** engine `budgetTemplate.ts` (10.1 đã review xong) · `route.ts` (`completeOnboardingV2Schema` xóa targetMonths là ở validations, route không đọc field này) · TadaStep (đã bỏ months ở 10.1 review P2) · HookStep.

### Previous Story Intelligence (10.1 + review)

- **P1 semantic:** `monthlyAmount` = góp trung bình, `null` khi timeline null — suggest hiển thị theo semantic này, key i18n tham khảo: `setupV2.tada.fundMonthly` = "Góp trung bình ~{{amount}}/tháng", `fundTimeline` = "Xong trong {{months}} tháng", `fundTimelineNever` (interpolate `{{max}}`). GoalStep dùng keys riêng `setupV2.goal.*` nhưng cùng văn phong.
- Engine đã có 17 tests boundary (income 15/40/100tr, 0-6 quỹ, biên 600) — KHÔNG cần test lại engine, chỉ test store/schema/UI logic mới.
- Review 10-1 defer note: "`targetMonths` user nhập bị discard — story 10-2 xử lý theo plan" → Task 2 trả nợ này.
- Lesson 9.1: khi đổi số hiển thị, verify từng i18n key mang đúng semantic per-fund vs tổng.
- Style: mobile 375px primary, touch 44px, input 16px font; suggest line `text-xs text-muted-foreground`.

### Git Intelligence

Working tree đang có diff chưa commit của story 10-1 (7 files) — story 10-2 sửa files khác (SetupClient, GoalStep, store, validations) trừ i18n jsons (chung). Không conflict logic.

### Project Structure Notes

- Tuân `_bmad-output/project-context.md`: strict TS, i18n `t()`, Zustand selector pattern, không hardcode màu
- Store tests: `src/__tests__/stores/` (nếu có test onboardingV2Store thì update, không thì thêm case canProceed)
- Validation tests: `src/__tests__/validations/` hoặc cạnh schema — tìm file test onboardingV2 hiện có

### References

- `epics-onboarding-v2.md:913-925` (story 10.2 verbatim)
- `docs/02_BUSINESS_RULES.md:151-164` (BR-OB-011, BR-OB-012)
- `_bmad-output/implementation-artifacts/10-1-allocation-engine-3-stages.md` (engine API + review patches)
- `_bmad-output/implementation-artifacts/deferred-work.md` §story 10-1 (targetMonths item)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent, dev-story workflow; main thread verify độc lập)

### Debug Log References

- `npx tsc --noEmit` → exit 0 (verify độc lập main thread)
- `npx vitest run` → Test Files 31 passed (31) · Tests 421 passed (421) — 426 → 421 do xóa 5 tests targetMonths validation
- `grep targetMonths` scope onboarding v2 (validations/store/components/setup) → 0 (verify độc lập)
- i18n parity: vi 772 == en 772 · setupV2 86 == 86

### Completion Notes List

1. **Task 1** — Wizard reorder [Hook, Income, Goal, Tada] (`SetupClient.tsx`); `canProceed` swap step 1 = income, step 2 = goals; grep step index — chỉ Shell `step===0` (Hook, không đổi). Không migration sessionStorage.
2. **Task 2** — Xóa `targetMonths` toàn bộ surface onboarding v2: goalSchema field + refine (chỉ còn targetAmount cho goal), OnboardingGoal type, store, GoalStep months input + duration helper, i18n keys chết (`years`, `months`, `editor.monthsLabel`).
3. **Task 3** — Live suggest dưới CurrencyInput mỗi goal selected: `calculateAllocationPlan` với income từ store + mọi goal targetAmount hợp lệ, id = presetId, hạng = thứ tự thêm; "Góp trung bình ~X/tháng · xong khoảng N tháng"; timeline null → `suggestNever` (không hiện số góp vì monthlyAmount null); timeline >120 tháng (`LONG_TIMELINE_MONTHS`) hoặc null → dòng lối thoát BR-OB-012. Không debounce/useMemo.
4. **Task 4** — Tests store canProceed reorder + validation schema mới; i18n parity tuyệt đối.
5. **Deviation (flag reviewer):** grep `targetMonths` toàn repo ≠ 0 — còn 10 match thuộc feature **funds** (`FundForm`, `FundEditSheet`, `goalPresets.ts`, key `funds.targetMonths`): field cùng tên nhưng nghĩa khác (months-of-expenses cho emergency fund), ngoài scope, xóa sẽ vỡ funds. Grep = 0 đạt trong scope onboarding v2.
6. Quyết định phụ: engine goal id = presetId (unique trong onboarding); sửa `setupV2.goal.custom.desc` bỏ nhắc "thời hạn".

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| Wizard flow mới Hook → Income → Goal → Tada, canProceed chặn đúng từng bước | Automated (store tests) + manual trace SetupClient | PASS |
| Goal không cần targetMonths vẫn proceed (refine mới); goal thiếu targetAmount bị chặn | Automated (validation tests) | PASS |
| Live suggest đổi theo keystroke targetAmount, hạng = thứ tự thêm, khớp engine 10.1 | Manual trace code (engine đã có 17 tests riêng) — **cần browser verify** | PASS (trace) |
| Timeline >120 tháng hoặc >600 (null) → luôn kèm dòng lối thoát (BR-OB-012) | Manual trace code — **cần browser verify** | PASS (trace) |
| Route onboarding/complete vẫn hoạt động không có targetMonths trong payload | Manual trace (route đã ignore field từ 10.1) + tsc | PASS |
| i18n parity sau xóa/thêm keys | Automated (772==772, 86==86) | PASS |

### File List

- M `src/app/setup/SetupClient.tsx`
- M `src/lib/stores/onboardingV2Store.ts`
- M `src/lib/validations/onboardingV2.ts`
- M `src/components/onboarding/v2/GoalStep.tsx`
- M `src/lib/i18n/messages/vi.json`
- M `src/lib/i18n/messages/en.json`
- M `src/__tests__/stores/onboardingV2Store.test.ts`
- M `src/__tests__/validations/onboardingV2.test.ts`

## Senior Developer Review (AI)

**Date:** 10-07-2026 · **Outcome:** Approve (sau 3 patches) · **Layers:** Blind Hunter + Edge Case Hunter + Acceptance Auditor (song song, cả 3 xong)

**Verdicts:** AC1 PASS (Auditor verify độc lập: tsc 0, tests pass, parity, BR-OB-012 threshold >120 + null đúng, hạng = thứ tự thêm) · Tasks 1-5 PASS · Dev Agent Record truthful (mọi số liệu reproduce được).

### Action Items

- [x] [HIGH][blind] Persist version không bump sau reorder step semantics (v1 cũ: 1=Goal, 2=Income) — session cũ rehydrate step 2 + income null → skip Income → kẹt vĩnh viễn ở Tada (mutation early-return, không nav). **P1:** `version: 2`, migrate reset < 2. `onboardingV2Store.ts:58-63`.
- [x] [MED][edge] Target 1đ qua `.positive()` → engine epsilon → "Góp ~0đ/tháng · xong 0 tháng". **P2:** targetAmount `.int().min(100_000)` + test case mới (đồng thời diệt case float 0.5 defer từ 10-1). `onboardingV2.ts:11-16`.
- [x] [LOW][edge] Goal invalid (custom name trống / amount null) → Continue disabled câm, không feedback. **P3:** hint `text-destructive` khi goalSchema fail, key `setupV2.goal.editor.invalidHint` vi/en. `GoalStep.tsx:~231`.

### Deferred

- [Review][Defer] Suggest line font-mono cả câu (spec: chỉ số) — cosmetic, 10.3 thêm text mới sẽ làm đúng chuẩn (prose thường + span mono cho số).
- [Review][Defer] Toggle goal off/on mất edits + demote rank cuối (rank vô hình, không control) — by design "hạng tạm"; story 11.1 (kéo thả xếp hạng) giải quyết đúng tầng.
- [Review][Defer] Emergency tier-1 card không hiện suggest dù engine tính (GĐ1/GĐ2 làm timeline goals dài hơn user expect, không giải thích on-screen) — 10.3 Tada kể chuyện 3 giai đoạn giải quyết narrative; cân nhắc thêm suggest emergency ở GoalStep nếu 10.3 chưa đủ.
- [Review][Note] `goalPresets.ts` targetMonths = timeline preset target dates cho FundForm (không phải months-of-expenses như completion note ghi) — chỉ sai wording justification, giữ nguyên code đúng.

### Verification sau patch (main thread, độc lập)

`npx tsc --noEmit` exit 0 · `npx vitest run` **31 files / 422 tests pass** (421 → 422, +1 test P2) · i18n parity 773 == 773.

## Change Log

- 10-07-2026: Story 10.2 implemented — wizard reorder Income trước Goal (D1), xóa targetMonths khỏi onboarding v2, live suggest từ engine 10.1 với lối thoát BR-OB-012; 421 tests pass; status → review.
- 10-07-2026: Code review (3 layers) — 3 action items resolved (HIGH persist version, MED target min, LOW error hint), 4 deferred có chủ đích; 422 tests pass; status → done.
