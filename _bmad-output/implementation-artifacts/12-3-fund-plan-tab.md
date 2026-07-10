---
baseline_commit: 16e7bf3cf66c07f35452170ff81f9ca94483d859
---

# Story 12.3: Tab Kế hoạch fund detail

Status: done

## Story

As a người dùng xem chi tiết một quỹ,
I want một tab "Kế hoạch" kể góp trung bình, timeline, kênh gợi ý và chặng,
So that tôi thấy con đường đến mục tiêu của riêng quỹ đó, luôn cập nhật.

**Nguồn:** Epic 12 (`epics-onboarding-v2.md:1021-1040`) · BR-OB-013, BR-OB-014, BR-OB-017 · 12.1 useLivingPlan · Epic 11 compound/planDetail.

## Acceptance Criteria

1. **Given** fund detail có tab mới "Kế hoạch"
   **When** tab mở
   **Then** hiện góp trung bình/tháng + timeline (living — từ useLivingPlan, không số tĩnh); marker chặng 50% trên progress bar

2. **Given** goal dài hạn
   **When** tab render kênh gợi ý
   **Then** hiện kênh gợi ý + simulation lãi kép 3 tầng (reuse compound helpers Epic 11) + disclaimer highlight "tham khảo, không phải cam kết" (BR-OB-013); reuse planDetail patterns

3. **Given** tháng chưa góp cho quỹ
   **When** tab hiện timeline
   **Then** timeline tự giãn + message lối thoát tử tế, KHÔNG hiện như lỗi (BR-OB-017); amounts font-mono; i18n vi/en; `tsc` sạch

## Tasks / Subtasks

- [x] Task 1: Tab "Kế hoạch" trong fund detail (AC: 1)
  - [x] `src/app/(app)/funds/[id]/page.tsx` (364 dòng): Tabs hiện có `defaultValue="history"` + 2 triggers (history/info, dòng 174-362) → thêm trigger + TabsContent "plan" (đặt ĐẦU: plan | history | info; defaultValue="plan" cho goal/emergency funds, giữ "history" cho fund_type khác — quyết định D1: plan tab chỉ render cho fund_type goal + emergency; sinking/investment/freedom KHÔNG có trong allocation engine → không hiện tab plan)
  - [x] Component mới `src/components/funds/FundPlanTab.tsx` nhận `fund: Fund` — tự gọi `useLivingPlan`, tìm allocation theo `fund.id` (emergency = id "emergency" trong plan? — KIỂM TRA: useLivingPlan goals dùng fund.id thật, emergency allocation id = "emergency" — match emergency fund bằng fund_type, goals bằng id)
  - [x] Nội dung khối 1: góp trung bình `monthlyAmount` (null → không hiện số, kể lối thoát) + timeline `timelineMonths` ("~N tháng · khoảng tháng M/YYYY") — số mono, living
  - [x] Marker chặng 50%: progress bar quỹ (balance section dòng 122-147 có progress riêng — marker đặt TRONG FundPlanTab progress mới, KHÔNG đụng balance section cũ) với notch 50% + label nhỏ "chặng 1" khi timeline > LONG_TIMELINE_MONTHS (120) — nhất quán 11.2 chia chặng
- [x] Task 2: Kênh gợi ý + lãi kép (AC: 2)
  - [x] Goal dài (baseline > COMPOUND_TIERS[0].maxMonths hoặc null): reuse `pickCompoundTier` + `compoundTimelineMonths` — C = monthlyAmount (null → capacityMonthly × ladderWeights[rank], pattern planDetail/planGoalChannels); remaining target = target − current_balance
  - [x] "Qua {{channel}} (~{{rate}}%/năm): còn ~{{months}} tháng" — reuse i18n keys `setupV2.goal.channel.*` + pattern; disclaimer `funds.plan.*` hoặc reuse `setupV2.goal.compoundDisclaimer` ({{year}}) — REUSE nếu nghĩa khớp, đừng tạo key trùng
  - [x] Disclaimer highlight `bg-warning/10 text-foreground` LUÔN hiện khi có bất kỳ số compound (lesson P1 11.2); emergency fund KHÔNG có kênh (an toàn ≠ đầu tư)
- [x] Task 3: Drift kể tử tế (AC: 3)
  - [x] Xác định "tháng này chưa góp": query fund transactions tháng hiện tại có `fund_contribution`? — nguồn: `keys.fundTransactions` hook hiện có hoặc thêm field vào FundPlanTab qua transactions list đã fetch trong tab history (ĐỌC page.tsx trước — nếu history tab đã có data transactions của fund, reuse); KHÔNG thêm API mới nếu tránh được
  - [x] Chưa góp tháng này + timeline hữu hạn: 1 dòng neutral "Tháng này chưa góp — timeline hiện tại đã tính điều đó. Góp {{suggest}} để giữ nhịp." (giọng lối thoát, KHÔNG đỏ, KHÔNG icon lỗi; text-muted-foreground)
  - [x] i18n vi/en parity; số mono span (tách placeholder)
- [x] Task 4: Verify (AC: 3)
  - [x] `npx tsc --noEmit` sạch · `npx vitest run` full pass · i18n parity
  - [x] Logic thuần mới (chọn allocation/match fund, compound line điều kiện) nếu tách helper → test; UI = manual trace
  - [x] Manual trace: goal fund ngắn/dài/emergency/sinking (không tab), timeline null, chưa góp tháng này

## Dev Notes

### Hiện trạng fund detail (investigator)

- `funds/[id]/page.tsx` 364 dòng: header card (71-120), balance + progress (122-147), action buttons (149-172), Tabs history|info (174-362); hooks `useFundDetail`, `keys.fundDetail(fundId)`; modals Contribute/Withdraw/Edit/ConfirmDialog
- shadcn Tabs có sẵn `src/components/ui/tabs.tsx`
- Compound exports (`budgetTemplate.ts`): `COMPOUND_TIERS`, `COMPOUND_RATES_YEAR`, `compoundTimelineMonths(C, target, rate)`, `pickCompoundTier(baseline)`; `planDetail.ts`: `planGoalChannels(plan, goalAllocs)` — dùng cho array; fund đơn lẻ có thể inline điều kiện tương tự (đừng ép reuse nếu shape lệch — copy pattern 15 dòng OK, đã defer note 11-3 duplication chấp nhận được)
- `useLivingPlan` (12.1+12.2): `{ plan, capacityThisMonth, trailingIncome, emergencyBalance, isLoading, isError }`; `plan.allocations[0]` = emergency (id "emergency"), goals theo rank với id = fund id THẬT (route living-plan trả fund.id)
- LONG_TIMELINE_MONTHS = 120 (GoalStep 10.2)
- i18n keys reuse được: `setupV2.goal.channel.{savings,bonds,index}`, `setupV2.goal.compoundDisclaimer`, `setupV2.tada.fundTimeline`/`fundTimelineNever` — CHECK nghĩa trước khi reuse; keys mới prefix `funds.plan.*`

### Quyết định D1 (flag reviewer)

Tab "Kế hoạch" CHỈ goal + emergency funds (nằm trong allocation engine). Sinking/investment/freedom funds ngoài engine — hiện tab sẽ phải nói "không có kế hoạch" (nhiễu). Epic AC không nói rõ — chọn ẩn tab cho type ngoài engine.

### Previous Story Intelligence

- 12.2: FundsPlanStrip + currentStage helper — tab detail KHÔNG lặp lại chuyện tập hợp (strip lo rồi), chỉ kể chuyện quỹ NÀY
- Review lessons: mọi số compound → disclaimer gate (11.2 P1); error state riêng không skeleton vĩnh viễn (12.2 P3); pending → disabled; số null/0 nhánh explicit
- BR-OB-017 verbatim: "Tháng không góp = hợp lệ: timeline tự giãn + kể tử tế kèm lối thoát (không phải lỗi)"

### Project Structure Notes

- Mới: `src/components/funds/FundPlanTab.tsx` (+ helper tách nếu logic thuần cần test)
- Sửa: `funds/[id]/page.tsx` (thêm tab — diff nhỏ)
- KHÔNG đụng: engine, ContributeModal (12.4), FundsPlanStrip, RankSheet, balance section cũ

### References

- `epics-onboarding-v2.md:1021-1040` (12.3 verbatim) · BR-OB-013/014/017
- `12-1-*.md` + `12-2-*.md` (useLivingPlan shape + lessons)
- `11-2-compound-sim-milestone-optin.md` + `11-3-detailed-plan-screen.md` (compound + planDetail patterns)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent; main thread verify độc lập)

### Debug Log References

- tsc exit 0 · vitest 36 files / 477 tests (465 → 477, +12 fundPlan) — verify độc lập · i18n parity 840 == 840

### Completion Notes List

1. Task 1 — Tab plan đầu TabsList, defaultValue theo hasPlan (FUND_HAS_PLAN = goal|emergency, D1); FundPlanTab tự gọi useLivingPlan; match qua `findFundAllocation` (emergency fund_type → id "emergency", goal → fund.id); progress mới notch 50% "chặng 1" khi >120; balance section cũ nguyên.
2. Task 2 — `fundGoalChannel` tính trên REMAINING = target − current_balance (deviation có chủ đích vs planGoalChannels full-target — quỹ có số dư thật); C = monthlyAmount ?? capacity × ladder[rank]; emergency không kênh; disclaimer luôn khi có số compound.
3. Task 3 — Drift `hasContributedInMonth(history, currentMonth)` — history truyền prop từ page (reuse fetch tab history, KHÔNG API mới); message neutral + suggest mono (BR-OB-017).
4. Keys: reuse setupV2.plan.channel*/goal.channel.*/compoundDisclaimer + funds.plan.loadError; 10 keys mới funds.plan.*. Copy Interpolated/MONO/fmtRate ~25 dòng (Karpathy — tránh refactor ngoài scope). Alloc không tìm thấy → notInPlan defensive.

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| findFundAllocation match emergency/goal + không match → notInPlan | Automated (fundPlan 12 tests) | PASS |
| fundGoalChannel: remaining-based, gate >24/null, C fallback ladder, emergency null | Automated | PASS |
| hasContributedInMonth đúng tháng + type fund_contribution | Automated | PASS |
| Tab chỉ hiện goal/emergency, defaultValue đúng | Manual trace — **cần browser verify** | PASS (trace) |
| Drift message neutral khi chưa góp + timeline hữu hạn | Manual trace — **cần browser verify** | PASS (trace) |
| Disclaimer luôn kèm số compound | Manual trace gate compoundMonths — **cần browser verify** | PASS (trace) |

### File List

- A `src/components/funds/fundPlan.ts` · A `src/components/funds/FundPlanTab.tsx` · A `src/components/funds/__tests__/fundPlan.test.ts`
- M `src/app/(app)/funds/[id]/page.tsx` · M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 10-07-2026 · **Outcome:** Approve (sau 4 patches) · **Layer:** Combined (route/hook/cache trace sâu, 6 suspicions dropped, claims reproduce)

**Verdicts trước patch:** AC1 PASS caveats · AC2 PASS · AC3 PARTIAL (drift sai tháng + không clear sau CTA). Sau patch: PASS đủ.

### Action Items

- [x] [MED] Contribute/withdraw không invalidate fundDetail+livingPlan → drift/plan đơ sau góp (chính CTA của tab). **P1:** thêm 2 keys cả 2 hooks.
- [x] [MED] Drift dùng browsed month (appStore) thay tháng lịch thực VN (BR-OB-015). **P2:** todayVN, mirror route.
- [x] [MED — gap BR phát hiện qua review] Engine tự tính emergencyTarget = estimate(income), ignore `target_amount` DB user-editable (quyết định brainstorm #6 + BR: ngưỡng GĐ derive từ target) → emergency card progress 42% + "Đã đạt 🎉" mâu thuẫn. **P3:** `AllocationInput.emergencyTarget?` override (gate hasTargetOverride giữ regression byte-for-byte), route trả emergencyTargetAmount, hook truyền; stage1Threshold = target/3 khi override; +4 engine tests.
- [x] [LOW] Goal target null/0 → "Đã đạt 🎉 + 0đ/tháng" misleading. **P4:** goalTargetMissing → unknown branches.

### Deferred / Info

- [Review][Info] hasContributedInMonth check direction "in" thay transaction_type — tương đương thực tế (chỉ contribution direction in trong fund tx types).
- [Review][Info] C fallback ladder tính trên ALL goals kể cả completed — mirror pattern planGoalChannels đã chấp nhận, chỉ chạy khi timeline null, dưới disclaimer.
- [Review][Info] history cap 50 tx DESC — an toàn cho tháng thực, browsed month cũ có thể false-negative (drift giờ chỉ dùng tháng thực → moot).
- [Review][Defer] Marker chặng chỉ hiện >120 tháng (AC wording unconditional — documented deviation, khớp Task spec).

### Verification sau patch (main thread, độc lập)

tsc exit 0 · 36 files / **481 tests** (477 → 481, +4 engine override; engine tests cũ nguyên) · parity 840.

## Change Log

- 10-07-2026: Story 12.3 implemented — FundPlanTab (living numbers + chặng marker + kênh compound trên remaining + drift BR-OB-017); 477 tests; status → review.

- 10-07-2026: Code review — 4 patches (3 MED gồm engine emergencyTarget override đóng gap BR, 1 LOW), 4 info/defer; 481 tests; status → done.
