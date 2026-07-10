---
baseline_commit: 16e7bf3cf66c07f35452170ff81f9ca94483d859
---

# Story 12.4: Pre-fill dialog góp quỹ

Status: done

## Story

As a người dùng góp vào một quỹ,
I want dialog góp gợi ý sẵn số nên góp tháng này,
So that tôi góp nhanh theo kế hoạch nhưng vẫn tự quyết con số.

**Nguồn:** Epic 12 (`epics-onboarding-v2.md:1041-1074`) · BR-OB-015, BR-OB-017 · useLivingPlan (12.1-12.3).

## Acceptance Criteria

1. **Given** user mở dialog "Nạp quỹ" cho một fund
   **When** dialog render
   **Then** pre-fill số engine gợi ý tháng này = capacity tháng × ladder của quỹ, TRỪ phần đã góp vào quỹ đó trong tháng hiện tại (không double-count); nguồn useLivingPlan (BR-OB-017)

2. **Given** số pre-fill hiện sẵn
   **When** user tương tác
   **Then** sửa được (tự nhập số khác) hoặc bỏ qua (đóng không góp) — engine advise không act; KHÔNG auto-allocate

3. **Given** user xác nhận góp
   **When** contribute hoàn tất (RPC fund_contribute atomic)
   **Then** strip mini-Tada + timeline fund detail + dashboard cập nhật ở render kế (living recompute); toast.success 2s; touch ≥44px; i18n vi/en

## Tasks / Subtasks

- [x] Task 1: Helper số gợi ý tháng này (AC: 1)
  - [x] Helper thuần `suggestedContribution({ fund, plan, capacityThisMonth, contributedThisMonth }): number | null` trong `src/components/funds/fundPlan.ts` (cùng nhà 12.3):
    - Emergency: GĐ1 → 100% capacityThisMonth; GĐ2 → 70%; GĐ3 → 0 (không gợi ý; user vẫn tự nhập)
    - Goal: phần goals của capacity tháng (GĐ1 = 0, GĐ2 = 30%, GĐ3 = 100%) × ladderWeights theo rank quỹ đó
    - TRỪ `contributedThisMonth` (đã góp tháng này) — floor 0; capacity 0 hoặc fund ngoài engine → null
    - GĐ hiện tại từ `currentStage(emergencyBalance, plan.emergencyTarget)` (12.2 helper)
  - [x] Tests: 3 GĐ × emergency/goal, trừ đã góp, floor 0, null cases
- [x] Task 2: contributedThisMonth (AC: 1)
  - [x] Nguồn: fund detail page đã có history (50 tx gần nhất) — tính sum contributions tháng lịch THỰC (không phải browsed month — lesson 12.3 P2); NHƯNG ContributeModal cũng mở từ FundCard trang Funds (không có history) → fallback: khi thiếu history, không trừ (pre-fill = phần ladder đầy đủ) + note trong story record. KHÔNG thêm API mới (Karpathy — sai số nhỏ, user tự quyết)
- [x] Task 3: ContributeModal pre-fill (AC: 1, 2)
  - [x] `ContributeModal.tsx` (265 dòng): props += optional `suggestedAmount?: number | null`; defaultValues.amount = `suggestedAmount ?? monthly` (giữ fallback monthly_contribution cũ cho fund ngoài engine)
  - [x] Dòng caption nhỏ dưới CurrencyInput khi có suggest: "Kế hoạch tháng này: {{amount}}" (i18n, mono span) — user thấy nguồn số; KHÔNG khóa input (advise-not-act)
  - [x] Callers truyền suggestedAmount: fund detail page (có useLivingPlan qua FundPlanTab? — page-level gọi 1 lần truyền xuống) + FundList/FundCard (trang Funds có useLivingPlan từ strip — truyền qua onContribute path). Đọc cả 2 call sites trước, giữ diff nhỏ
- [x] Task 4: Verify invalidation + UX (AC: 3)
  - [x] Contribute onSuccess đã invalidate funds/fundDetail/livingPlan (12.3 P1) → strip + tab tự tươi; VERIFY bằng trace, KHÔNG sửa thêm nếu 12.3 P1 đã đủ
  - [x] toast.success 2s giữ nguyên; presets 50%/1x/2x cũ giữ (base theo suggest khi có? — KHÔNG, giữ base monthly cũ, tránh đổi behavior ngầm; chỉ defaultValue đổi)
  - [x] `npx tsc --noEmit` · `npx vitest run` full · i18n parity · manual trace: mở dialog từ 2 entry points, sửa số, bỏ qua, góp xong strip đổi

## Dev Notes

### Hiện trạng ContributeModal (investigator)

- `ContributeModal.tsx` 265 dòng: props `{fund, open, onClose}`; `ContributeForm` defaultValues.amount = `monthly` (= fund.monthly_contribution); presets 50%/1x/2x monthly (86-90); CurrencyInput text-2xl (132); submit `useFundContribute(fundId)` (92-98), disabled amount=0
- Call sites: fund detail page (`funds/[id]/page.tsx` action buttons 149-172) + FundCard trang Funds (`onContribute(fund)` prop → FundList quản modal?) — ĐỌC cả 2 xác định chỗ luồn suggestedAmount
- useLivingPlan sau 12.3 P3: `{ plan, capacityThisMonth, trailingIncome, emergencyBalance, isLoading, isError }` + plan.emergencyTarget = target thật DB
- `currentStage` helper (12.2): `(emergencyBalance, emergencyTarget) → 1|2|3`
- Ladder: `ladderWeights(n)` — rank quỹ từ vị trí trong plan.allocations goals (sau emergency), nhất quán fundPlan.ts 12.3

### Phân bổ theo GĐ (BR-OB-010 vận hành — logic suggest)

- GĐ1: 100% capacity → emergency; goals 0
- GĐ2: 70% emergency / 30% goals (chia ladder)
- GĐ3: 0 emergency / 100% goals (chia ladder)
- Đây là RATE tháng hiện tại (khác monthlyAmount avg trọn đời của tab Kế hoạch — 2 số khác semantics, caption phải nói "tháng này")

### Previous Story Intelligence

- 12.3 P1: invalidation fundDetail+livingPlan đã vào contribute/withdraw — Task 4 chỉ verify
- 12.3 P2 lesson: tháng THỰC cho mọi logic "tháng này", không browsed month
- 12.3 P3: plan.emergencyTarget = DB target — suggest emergency dùng ngưỡng này qua currentStage
- Review lessons: pending → disabled (đã có); số null nhánh; i18n parity; mono span caption

### Project Structure Notes

- Helper vào `fundPlan.ts` (cùng file 12.3) + tests cùng file test
- Sửa: `ContributeModal.tsx`, 2 call sites, i18n
- KHÔNG đụng: engine, RPC, WithdrawModal, presets logic

### References

- `epics-onboarding-v2.md:1041-1074` (12.4 verbatim) · BR-OB-015/017
- `12-3-fund-plan-tab.md` (fundPlan.ts + review patches P1-P3)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent, resumed sau session-limit cut; main thread verify độc lập)

### Debug Log References

- tsc exit 0 · vitest 36 files / 494 tests (481 → 494, +13 fundPlan suggest tests) — verify độc lập · parity 841 == 841

### Completion Notes List

1. `suggestedContribution` + `sumContributedInMonth` trong fundPlan.ts: GĐ qua currentStage(emergencyBalance, plan.emergencyTarget); emergency 100/70/null; goal null/30%/100% × ladder rank (khớp fundGoalChannel); trừ đã góp floor 0; ngoài engine → null. 13 tests ma trận.
2. ContributeModal: prop suggestedAmount optional, defaultValues = suggestedAmount ?? monthly (fallback cũ), caption label-only + mono span (mirror currentBalance caption — minimal), KHÔNG khóa input, presets giữ base monthly.
3. Call sites: detail page trừ chính xác qua history tháng THỰC (todayVN); FundList/FundCard fallback contributedThisMonth=0 (không API mới — sai số chấp nhận advise-not-act, note inline).
4. Task 4 trace-only: invalidation 12.3 P1 đủ (funds+fundDetail+livingPlan = 3 nguồn suggest).
5. Deviation tự giải quyết: helper thêm param `emergencyBalance` (spec Task 1 thiếu nhưng Dev Notes yêu cầu currentStage cần nó — không có trong AllocationPlan).

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| Suggest ma trận GĐ1/2/3 × emergency/goal + ladder rank + trừ đã góp + floor 0 + null cases | Automated (13 tests) | PASS |
| sumContributedInMonth đúng tháng + direction | Automated | PASS |
| Pre-fill hiển thị + caption + sửa được + đóng không góp | Manual trace — **cần browser verify** | PASS (trace) |
| Sau góp: strip/tab/dashboard tươi (invalidation 12.3 P1) | Trace 3 keys khớp 3 nguồn | PASS |
| FundList entry: suggest không trừ đã góp (fallback 0) | Documented limitation | NOTE |

### File List

- M `src/components/funds/fundPlan.ts` · M `src/components/funds/ContributeModal.tsx` · M `src/app/(app)/funds/[id]/page.tsx` · M `src/components/funds/FundList.tsx` · M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json` · M `src/components/funds/__tests__/fundPlan.test.ts`

## Senior Developer Review (AI)

**Date:** 11-07-2026 · **Outcome:** Approve (sau 2 patches) · **Layer:** Combined (2 defects reproduce bằng executable tests vs engine thật)

**Verdicts:** AC1 PARTIAL → PASS sau P1/P2 · AC2 PASS (advise-not-act, grep sạch auto-allocate) · AC3 PASS (invalidation 12.3 P1 đủ 3 nguồn).

### Action Items

- [x] [MED] Suggest emergency GĐ2 flat 70% không cap remaining — balance 29.5tr/target 30tr → suggest 7tr (engine 500k). **P1:** cap mọi share tại room quỹ.
- [x] [MED] Ladder trên ALL goals — goal đã đạt vẫn suggest 7tr (engine 0), goal active under-suggest. **P2:** incomplete-only re-ladder (mirror pourGoals) + room ≤ 0 → null + GĐ2 hết goal dở → emergency 100%. +6 tests.

### Deferred / Info

- [Review][F3 documented] FundList entry không trừ đã-góp (contributedThisMonth=0, không API mới — spec-sanctioned).
- [Review][F4] History cap 50 tx — tháng >50 tx under-count → over-suggest (marginal).
- [Review][F5] Plan về sau khi modal mở → caption suggest hiện nhưng input vẫn monthly (transient).

### Verification sau patch (main thread, độc lập)

tsc exit 0 · 36 files / **500 tests** (494 → 500) · parity 841.

## Change Log

- 11-07-2026: Story 12.4 implemented — suggestedContribution GĐ-based prefill, caption mono, 2 call sites minimal; 494 tests; status → review.

- 11-07-2026: Code review — 2 MED patches (cap room + incomplete re-ladder, mirror engine), 3 info; 500 tests; status → done.
