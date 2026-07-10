---
baseline_commit: ca3478d6017dc37e065ce06b1266e0645f824d0d
---

# Story 11.3: Màn "Kế hoạch chi tiết" hậu Tada

Status: done

## Story

As a user bấm "Xem kế hoạch chi tiết" từ Tada,
I want một màn đầy đủ %, tỷ trọng, timeline, 3 giai đoạn và kênh gợi ý,
So that tôi hiểu trọn phương pháp mà Tada chính vẫn gọn như một câu chuyện.

**Nguồn:** Epic 11 (`epics-onboarding-v2.md:957-961`) · BR-OB-009..013 · PRD addendum "chi tiết %, tỷ trọng, công thức → màn kế hoạch chi tiết".

## Acceptance Criteria

1. **Given** user bấm "Xem kế hoạch chi tiết" từ Tada
   **When** màn mở
   **Then** hiện %, tỷ trọng theo hạng, timeline từng quỹ, 3 giai đoạn đầy đủ, kênh gợi ý tham khảo cho quỹ dài hạn; amounts font-mono; không lộ công thức ở Tada chính (giữ câu-1 gọn)

## Tasks / Subtasks

- [x] Task 1: Component `PlanDetailSheet` (AC: 1)
  - [x] `src/components/onboarding/v2/PlanDetailSheet.tsx` mới — shadcn Sheet (side="bottom" mobile full-height hoặc Dialog full — dùng Sheet pattern có sẵn trong project, check `src/components/ui/sheet.tsx`)
  - [x] Trigger: nút secondary "Xem kế hoạch chi tiết" trong TadaStep, hiện cùng lúc attribution (sau đủ 4 stage reveal), KHÔNG thay đổi CTA chính
  - [x] Props: `plan: AllocationPlan` (livePlan) + `funds` + `monthlyIncome` — data đã có sẵn trong TadaStep, không fetch mới
- [x] Task 2: Nội dung sheet — 4 section (AC: 1)
  - [x] **Ngân sách %**: 4 bucket 53/24/15/8 (derive BUDGET_TEMPLATE qua sumBudgetPct — reuse `BUDGET_SEGMENTS` nếu export được) + capacity 15% = tiền góp quỹ
  - [x] **Tỷ trọng theo hạng**: bảng goals theo rank với % ladder (`ladderWeights(n)` — hiển thị 70/30 hoặc 60/30/10...), label hạng màu token (pattern GoalRankList), emergency ghi riêng "ưu tiên nền tảng — nhận trước theo giai đoạn"
  - [x] **3 giai đoạn đầy đủ**: GĐ1 100% → emergency đến 1 tháng chi tiêu (mốc tháng `stage1EndMonth`); GĐ2 70/30 đến 3 tháng (mốc `stage2EndMonth` — TIÊU THỤ field đang dead sau 10.3); GĐ3 100% goals. Mỗi GĐ 1 dòng + mốc tháng mono
  - [x] **Kênh gợi ý quỹ dài hạn**: per goal timeline hữu hạn >24 tháng hoặc null: kênh từ `pickCompoundTier` + rate % (5/6,5/8%) + timeline compound nếu ngắn hơn (reuse helpers 11.2); disclaimer BR-OB-013 highlight cuối section (pattern `bg-warning/10 text-foreground` sau patch 11.2)
  - [x] Amounts/số/%: `font-mono tabular-nums`; timeline từng quỹ từ livePlan
- [x] Task 3: Tada chính giữ gọn (AC: 1)
  - [x] KHÔNG thêm %, công thức, tỷ trọng vào Tada chính — chỉ thêm 1 nút trigger; verify diff TadaStep chỉ có nút + sheet mount
  - [x] Sheet đóng → về Tada nguyên trạng (không reset reveal)
- [x] Task 4: Tests + i18n + verify (AC: 1)
  - [x] Logic thuần mới (nếu có — VD format % ladder) → test; i18n keys mới prefix `setupV2.plan.*` parity vi == en
  - [x] `npx tsc --noEmit` sạch · `npx vitest run` full pass
  - [x] Manual trace: Tada reveal đủ → nút hiện → mở sheet đủ 4 section → đóng → CTA chính vẫn hoạt động; mobile 375px scroll trong sheet

## Dev Notes

### Hiện trạng (sau 10.1-11.2 + review patches)

- TadaStep: 4-stage reveal + `livePlan` (`calculateAllocationPlan`) + attribution + minTargetHint + adjust flow (goalFundUpdates PATCH mọi goal) — nút mới đặt cạnh attribution, cả 2 gate `revealed.length === 4`
- `stage2EndMonth` trong `AllocationPlan` — hiện 0 consumer (info review 10.3) — story này tiêu thụ
- Engine helpers export sẵn: `calculateAllocationPlan`, `ladderWeights`, `sumBudgetPct`, `MAX_ALLOCATION_MONTHS`, `COMPOUND_TIERS`, `COMPOUND_RATES_YEAR`, `compoundTimelineMonths`, `pickCompoundTier`, `estimateEmergencyTarget`
- `BUDGET_SEGMENTS` trong TadaStep (local?) — nếu local thì export hoặc dựng lại trong sheet từ sumBudgetPct (đừng duplicate logic — export từ 1 chỗ)
- Disclaimer pattern sau patch 11.2: `bg-warning/10 text-foreground rounded px-2 py-1 text-xs`
- Sheet UI: check `src/components/ui/sheet.tsx` tồn tại (shadcn) — nếu project chưa có sheet, dùng Dialog hiện có (check `src/components/ui/dialog.tsx`); KHÔNG cài lib mới
- i18n: `setupV2.plan.*` mới; số/%/amounts mono qua pattern tách placeholder

### Voice

- Sheet = "mở nắp máy" cho người muốn hiểu — giọng giải thích bình tĩnh, mỗi section 1 câu dẫn ngắn
- BR-OB-012 vẫn áp: timeline dài trong sheet luôn cạnh kênh gợi ý/compound (lối thoát) — layout tự thỏa (section kênh ngay dưới timeline)

### Previous Story Intelligence

- 11.2: compound helpers + tier keys i18n (`channelSavings/Bonds/Index` hoặc tương tự — check keys thật trong vi.json trước khi tạo mới, REUSE nếu khớp nghĩa)
- Review patterns: gate mọi số compound bằng disclaimer (P1 11.2); token màu tồn tại thật (check tailwind.config trước khi dùng); pure logic extract + test; dead key xóa
- 10.3: pickThreeStageKey trong `tadaReveal.ts` — sheet dùng text 3 GĐ RIÊNG (đầy đủ hơn 1 dòng), không reuse key đó

### Project Structure Notes

- Component mới: `src/components/onboarding/v2/PlanDetailSheet.tsx`; KHÔNG route mới, KHÔNG đụng dashboard
- KHÔNG đụng: engine (chỉ import), GoalStep/GoalRankList, route, store, validations
- KHÔNG migration DB

### References

- `epics-onboarding-v2.md:957-961` (11.3 verbatim)
- `docs/02_BUSINESS_RULES.md:134-172` (BR-OB-009..013)
- `_bmad-output/implementation-artifacts/11-2-compound-sim-milestone-optin.md` (compound helpers + disclaimer pattern)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent, dev-story workflow; main thread verify độc lập)

### Debug Log References

- `npx tsc --noEmit` exit 0 · `npx vitest run` **32 files / 445 tests pass** (439 → 445, +6 planDetail tests; +1 test file) — verify độc lập
- i18n parity setupV2 vi 129 == en 129, full parity; +23 keys `setupV2.plan.*`, reuse 5 nhóm keys 11.2 (channel.*, compoundDisclaimer, rankLabel, budgetLegend.*, perMonth)

### Completion Notes List

1. **Task 1** — `PlanDetailSheet` (Sheet side bottom, max-h-90vh scroll nội bộ); trigger tự đóng gói SheetTrigger + Button outline, gate `revealed === 4 stages`, Radix quản open state (TadaStep không thêm useState).
2. **Task 2** — 4 section: (a) BUDGET_SEGMENTS reuse (export từ TadaStep) + capacityNote; (b) bảng hạng + `ladderWeights` % + màu token pattern GoalRankList + emergency riêng; (c) 3 GĐ đầy đủ, **tiêu thụ `stage2EndMonth`** (dead field từ 10.3), `milestoneNode` xử lý N/0/null; (d) `planGoalChannels` helper thuần (mirror D2/D3 GoalStep) + disclaimer BR-OB-013 khi anyCompound.
3. **Task 3** — TadaStep diff = 3 dòng (export const, import, mount) — Tada chính không lộ công thức; sheet đóng → nguyên trạng.
4. **Quyết định (flag reviewer):** export BUDGET_SEGMENTS in-place → circular import TadaStep↔PlanDetailSheet (an toàn: chỉ đọc trong render body, tsc+tests xác nhận); funds prop map target hiệu dụng theo adjust (`targetFor`) để sheet khớp livePlan; fmtRate locale (6,5 vi / 6.5 en).

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| `planGoalChannels` đúng điều kiện tier/compound/C-fallback | Automated (6 tests) | PASS |
| Sheet 4 section đủ nội dung AC (%, hạng, 3 GĐ + stage2End, kênh + disclaimer) | Manual trace — **cần browser verify** | PASS (trace) |
| Tada chính không lộ công thức (diff chỉ nút + mount) | git diff xác nhận | PASS |
| Sheet đóng không reset reveal; CTA chính nguyên | Manual trace (Radix state nội bộ) — **cần browser verify** | PASS (trace) |
| i18n parity +23 keys, reuse keys 11.2 | Automated (129==129) | PASS |

### File List

- A `src/components/onboarding/v2/PlanDetailSheet.tsx`
- A `src/components/onboarding/v2/planDetail.ts`
- A `src/components/onboarding/v2/__tests__/planDetail.test.ts`
- M `src/components/onboarding/v2/TadaStep.tsx`
- M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 10-07-2026 · **Outcome:** Approve (sau 4 patches) · **Layer:** Combined (next build prod verify cycle, i18n placeholder đối chiếu từng key, fmtRate float node-verified)

**Verdicts trước patch:** AC1 PASS có điều kiện — thiếu "timeline từng quỹ" trong sheet (F1). Sau P1: PASS đầy đủ. Claims reproduce đủ (tsc, 445, parity, build).

### Action Items

- [x] [MED][AC gap] Sheet thiếu timeline per fund (goal ngắn + emergency không có dòng nào). **P1:** section (b) thêm timeline mỗi row + emergency từ `plan.allocations`, reuse keys Tada.
- [x] [LOW] Circular import TadaStep↔PlanDetailSheet (latent TDZ). **P2:** `BUDGET_SEGMENTS` + `sumBudgetPct` → export từ `budgetTemplate.ts`, hết cycle + hết duplicate.
- [x] [LOW] Ladder 5 goals hiển thị 99% (round). **P3:** phần tử cuối = 100 − tổng trước → luôn 100.
- [x] [nit] tierKey comment thừa "savings" + thiếu boundary tests. **P4:** narrow comment + tests 24/25.

### Deferred

- [Review][Defer] `planGoalChannels` (planDetail.ts) mirror `goalCalcs` (GoalStep) — không drift hiện tại, 2×~15 dòng có test; extract chung nếu tier logic đổi (cập nhật COMPOUND_RATES_YEAR hằng năm chỉ đổi constant).
- [Review][Defer] Card kênh gợi ý có thể rỗng gợi ý (compound không cải thiện ≥2 tháng) dưới heading hứa "kênh sinh lời" — UX nit, cân nhắc ẩn card khi không có channel line.

### Verification sau patch (main thread, độc lập)

tsc exit 0 · **32 files / 447 tests pass** · `npx next build` pass (prod, không cycle warning) · i18n 815 == 815.

## Change Log

- 10-07-2026: Story 11.3 implemented — PlanDetailSheet 4 section (tiêu thụ stage2EndMonth), planGoalChannels helper + tests, Tada chính giữ gọn; 445 tests pass; status → review.
- 10-07-2026: Code review — 4 patches (MED timeline per fund, cycle cleanup, 100% rounding, boundary tests), 2 defer; 447 tests + build prod pass; status → done.
