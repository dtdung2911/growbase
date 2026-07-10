---
baseline_commit: 16e7bf3cf66c07f35452170ff81f9ca94483d859
---

# Story 13.4: Tada tươi cho member mới

Status: done

## Story

As a member vừa gia nhập hộ (flow 7-3),
I want xem reveal 4 giai đoạn bằng số hôm nay,
So that tôi hiểu bức tranh tài chính chung ngay khi vào.

**Nguồn:** Epic 13 (`epics-onboarding-v2.md:1119-1135`) · BR-OB-014 · quyết định brainstorm #11 (Tada tươi ≠ replay).

## Acceptance Criteria

1. **Given** member mới join household
   **When** offer "Xem bức tranh" hiện
   **Then** reveal 4-stage chạy bằng useLivingPlan với SỐ HÔM NAY, KHÔNG replay snapshot onboarding cũ (BR-OB-014)

2. **Given** reveal render
   **When** hiển thị
   **Then** reuse TadaStep parts (không dựng lại UI); số per-fund + tổng + GĐ hiện tại từ engine; skip được; i18n vi/en; mobile 375px; vitest pass

## Tasks / Subtasks

- [x] Task 1: Route `/welcome` + offer flow (AC: 1)
  - [x] `src/app/(app)/welcome/page.tsx` thin wrapper → `<WelcomeRevealClient />`; guard: householdId null → redirect /dashboard
  - [x] `InviteClient.tsx:76`: post-accept `router.push("/dashboard")` → `router.push("/welcome")` (member mới duy nhất đi qua đây — offer tự nhiên, không cần localStorage seen-flag; vào lại /welcome bằng tay = xem lại bức tranh, vô hại)
  - [x] Skip: link "Bỏ qua" → /dashboard ngay (44px)
- [x] Task 2: `WelcomeRevealClient` — reveal 4 stage số hôm nay (AC: 1, 2)
  - [x] Data: `useLivingPlan` + `useFunds` (tên/icon quỹ) — KHÔNG gọi onboarding API, KHÔNG đọc onboarding store
  - [x] 4 stage reuse pattern TadaStep (STAGE_DELAY_MS 550 + reduced-motion render ngay — copy constant/pattern, TADA_REVEAL_STAGES từ `tadaReveal.ts` nếu export):
    1. "budget" — CSP bar: `BUDGET_SEGMENTS` (đã export từ budgetTemplate 11.3 P2) + legend keys `setupV2.tada.budgetLegend.*` reuse
    2. "goal" — fund list: tên + icon + "Góp trung bình ~X/tháng" + timeline từ `plan.allocations` match fund id (emergency fund_type match) — reuse keys `setupV2.tada.fundMonthly/fundTimeline/fundTimelineNever`
    3. "feasibility" — tổng `capacityThisMonth`/capacity + `ThreeStageLine` số hôm nay: GĐ HIỆN TẠI từ `currentStage` — thêm dòng "Nhà mình đang ở GĐ{n}" (khác onboarding: member vào giữa hành trình; key mới `welcome.currentStage`)
    4. "todayRemaining" — reuse `calculateTodayRemaining(trailingIncome)`? — QUYẾT ĐỊNH D1: dùng trailingIncome (income thực) thay income khai — comment WHY
  - [x] TadaStep KHÔNG import trực tiếp (coupled mutation/adjust/store) — reuse qua: constants export, `pickThreeStageKey`, i18n keys, copy pattern JSX block nhỏ (<30 dòng/stage, chấp nhận duplication như 11.3/12.3 note)
  - [x] CTA cuối: "Vào dashboard" (44px) sau đủ 4 stage; attribution line reuse `setupV2.tada.attribution`
- [x] Task 3: Tests + i18n + verify (AC: 2)
  - [x] Logic thuần mới (nếu có) → test; reuse tests hiện có không vỡ
  - [x] i18n `welcome.*` keys mới (title, currentStage, skip, cta) parity vi == en
  - [x] `npx tsc --noEmit` · `npx vitest run` full · manual trace: join flow → /welcome reveal → skip giữa chừng → dashboard; hộ GĐ2 thấy đúng GĐ hôm nay

## Dev Notes

### Nguyên tắc (BR-OB-014 + brainstorm #11)

Tada tươi = cùng cấu trúc reveal, SỐ HÔM NAY (balance thật, GĐ thật, income thực). KHÔNG replay onboarding snapshot (user đã bác — "Tada 3 tháng trước lệch hiện tại"). Đây là "lần đầu thấy bức tranh HIỆN TẠI".

### Hiện trạng reuse

- `InviteClient.tsx:76` — post-accept redirect duy nhất
- `TadaStep.tsx`: 4-stage reveal + STAGE_DELAY_MS 550 + reduced-motion (84-87) + TadaBudgetBar + ThreeStageLine (tách template mono) — coupled mutation/adjust/goalFundUpdates/onboarding store → KHÔNG import component lớn; export nhỏ nếu cần (TadaBudgetBar nếu là function riêng trong file — check export được không, else copy)
- `tadaReveal.ts`: `TADA_REVEAL_STAGES` + `pickThreeStageKey` (exported, tests sẵn)
- `BUDGET_SEGMENTS` exported từ `budgetTemplate.ts` (11.3 P2); `calculateTodayRemaining`; `currentStage` helper
- `useLivingPlan`: plan (emergencyTarget DB thật), capacityThisMonth, trailingIncome, emergencyBalance, contributedLastMonth
- i18n reuse: `setupV2.tada.*` (budgetLegend, fundMonthly, fundTimeline{,Never}, totalMonthly, capacitySource, attribution, threeStage.*) — check nghĩa từng key, key nào onboarding-specific ("kế hoạch của bạn đã sẵn sàng") thì key mới `welcome.*`

### Previous Story Intelligence

- 10.3: pickThreeStageKey 6 nhánh tested; stage reveal gating `revealed.length` pattern; attribution gate đủ stage
- 13.1: stageBadgeContent — GĐ hiện tại text pattern; 13.2: StageEventCard đọc cùng useLivingPlan (member mới vào /welcome trước dashboard → baseline stage localStorage sẽ ghi lần đầu ở dashboard — không conflict)
- Duplication chấp nhận: copy JSX block nhỏ hơn là export component coupled (lesson 11.3/12.3)
- Mobile 375px, số mono span, token màu, skeleton khi loading (useLivingPlan isLoading → skeleton thay reveal)

### Project Structure Notes

- Mới: `src/app/(app)/welcome/page.tsx` + `src/components/welcome/WelcomeRevealClient.tsx`
- Sửa: `InviteClient.tsx` (1 dòng), có thể `TadaStep.tsx` (export TadaBudgetBar — CHỈ export, không đổi logic), i18n
- KHÔNG đụng: onboarding flow/store, engine, StageEventCard/stageEvent, WithdrawModal (13.3 song song)

### References

- `epics-onboarding-v2.md:1119-1135` (13.4 verbatim) · BR-OB-014
- `10-3-tada-three-stage-story.md` (reveal patterns) · brainstorm-intent quyết định #11

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer; main thread verify độc lập)

### Debug Log References

- tsc exit 0 · vitest 38 files / 529 tests — verify độc lập (cả sau review patches) · parity 861 == 861

### Completion Notes List

1. Route /welcome thin + WelcomeRevealClient: 4-stage reveal số HÔM NAY (useLivingPlan + useFunds, không đụng onboarding store/API); STAGE_DELAY 550 + reduced-motion; skeleton; skip 44px; CTA + attribution sau đủ stage; dòng "đang ở GĐ{n}" key welcome.currentStage.
2. Reuse import: BUDGET_SEGMENTS, TADA_REVEAL_STAGES, pickThreeStageKey, calculateTodayRemaining, currentStage + 13 keys setupV2.tada.*; COPY BudgetBar/ThreeStageLine (<30 dòng — tránh bundle coupling TadaStep, deviation có lý do); omit hookCallback (onboarding-specific).
3. D1: todayRemaining dùng trailingIncome (income thực) — comment WHY.
4. InviteClient: 1 dòng push /welcome + (review F2) setHouseholdId trước push.

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| Reveal 4 stage số hôm nay, không replay snapshot | Trace data flow (useLivingPlan only) — **cần browser verify** | PASS (trace) |
| Member mới RLS query được ngay sau accept | Trace (RPC insert trước push, layout re-query) | PASS |
| Skip giữa chừng → dashboard; CTA sau đủ 4 stage | Manual trace — **cần browser verify** | PASS (trace) |
| Hộ GĐ2 thấy đúng GĐ hôm nay | Trace currentStage + pickThreeStageKey (tests sẵn) | PASS |
| i18n welcome.* parity | Automated (861==861) | PASS |

### File List

- A `src/app/(app)/welcome/page.tsx` · A `src/components/welcome/WelcomeRevealClient.tsx`
- M `src/app/invite/[token]/InviteClient.tsx` · M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 11-07-2026 · **Outcome:** Approve (sau 2 patches) · **Layer:** Combined (trace RLS/race/reveal gate — 4 hunt items cleared)

### Action Items

- [x] [MED-HIGH] feasibleTitle dùng capacityThisMonth (income tháng này, hộ mới = 0) → "Tổng góp mỗi tháng: 0đ" tự mâu thuẫn card, đúng case điển hình member mới. Fix: plan.capacityMonthly (khớp TadaStep + per-fund).
- [x] [LOW] User đa hộ join hộ mới thấy bức tranh hộ CŨ (store giữ id cũ). Fix: setHouseholdId(result.household_id) trước push.

### Deferred

- [Review][Defer] withAuth() server-side chọn membership joined_at ASC đầu tiên — user đa hộ API vẫn trả hộ cũ bất kể store (systemic, ngoài scope 13.4).
- [Review][Note] Copy BudgetBar/ThreeStageLine verbatim — nếu 10.3 keys/logic đổi phải nhớ sửa /welcome.

## Change Log

- 11-07-2026: Story 13.4 implemented + reviewed — /welcome fresh Tada (BR-OB-014, không replay), 2 patches (capacityMonthly total, setHouseholdId); 529 tests; status → done.
