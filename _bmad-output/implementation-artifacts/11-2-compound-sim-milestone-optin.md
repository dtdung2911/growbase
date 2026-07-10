---
baseline_commit: ca3478d6017dc37e065ce06b1266e0645f824d0d
---

# Story 11.2: Simulation lãi kép + nắn chặng opt-in

Status: done

## Story

As a người dùng có mục tiêu xa,
I want thấy lãi kép rút ngắn hành trình bao nhiêu và được gợi ý chia chặng khi mục tiêu quá xa,
So that số dài hạn không làm tôi nản — luôn có lối thoát.

**Nguồn:** Epic 11 (`epics-onboarding-v2.md:951-956`) · BR-OB-012, BR-OB-013.

## Acceptance Criteria

1. **Given** quỹ có timeline dài
   **When** render gợi ý
   **Then** simulation 3 tầng 5/6,5/8%/năm (config theo năm T-1) hiện "còn [ngắn hơn] nếu góp qua kênh [tầng]" + disclaimer highlight "tham khảo, không phải cam kết" (BR-OB-013); timeline >10 năm → card "chia chặng?" opt-in 1 chạm (BR-OB-012), user không tap = giữ full target

## Tasks / Subtasks

- [x] Task 1: Compound engine thuần (AC: 1)
  - [x] `src/lib/constants/budgetTemplate.ts` (cùng nhà engine): `COMPOUND_TIERS` config theo năm T-1 = 2025: `[{ maxMonths: 24, annualRate: 0.05, key: "savings" }, { maxMonths: 60, annualRate: 0.065, key: "bonds" }, { maxMonths: Infinity, annualRate: 0.08, key: "index" }]` + `COMPOUND_RATES_YEAR = 2025` — comment WHY: BR-OB-013, cập nhật tay mỗi năm
  - [x] `compoundTimelineMonths(monthlyContribution, targetAmount, annualRate): number | null` — solve nhỏ nhất n: FV annuity `C×(((1+i)^n − 1)/i) ≥ target`, i = annualRate/12; loop tăng dần cap 600 (nhất quán MAX_ALLOCATION_MONTHS); C ≤ 0 hoặc không đạt trong 600 → null; target ≤ 0 → 0
  - [x] `pickCompoundTier(baselineTimelineMonths: number | null): tier` — null coi như tầng index (>60); chọn tier đầu tiên có `baselineTimeline ≤ maxMonths`
  - [x] Tests: FV đúng công thức (case tay: 10tr/tháng, 8%/năm, target 500tr); rate cao → n nhỏ hơn (monotonic); C=0 → null; target 0 → 0; cap 600 → null; tier selection 3 biên (23/24/60/61)
- [x] Task 2: Enrich suggest GoalStep với lãi kép (AC: 1)
  - [x] Trong suggest block GoalStep (per goal, sau dòng suggest hiện có): khi timeline hữu hạn > 24 tháng HOẶC timeline null — tính `compoundTimelineMonths(monthlyAmount_avg, remaining_target, tier.rate)` với tier từ `pickCompoundTier(timeline)`; nếu kết quả hữu hạn VÀ ngắn hơn baseline ≥ 2 tháng (hoặc baseline null → mọi kết quả hữu hạn đều đáng hiện) → dòng i18n "Còn ~{{months}} tháng nếu góp qua {{channel}}" (channel = kênh tiết kiệm/quỹ trái phiếu/DCA chỉ số — i18n theo tier key), số + kênh trong span mono/medium
  - [x] Case đắt nhất: goal `suggestNever` (>600 tháng) mà compound 8% kéo về hữu hạn → đây là "lối thoát" thật thay dòng escape tĩnh 10.2 (GIỮ dòng escape khi cả compound cũng null)
  - [x] monthlyAmount null (timeline null) → dùng avg giả định = phần goals của capacity × ladder weight của goal đó? KHÔNG — quá phức tạp: dùng `capacityMonthly × ladderWeights(n)[rank]` làm C cho sim khi monthlyAmount null (GĐ3 steady-state — comment WHY). Đơn giản, sai số chấp nhận được dưới disclaimer
  - [x] Disclaimer BR-OB-013 (BẮT BUỘC khi có bất kỳ dòng compound nào hiện): 1 dòng highlight `bg-warning/10 text-warning-foreground rounded px-2 py-1 text-xs` (token, không hardcode): "Lãi suất tham chiếu {{year}} — gợi ý tham khảo, không phải cam kết hay tư vấn đầu tư" — 1 lần cuối suggest block (không lặp per goal)
- [x] Task 3: Card "chia chặng?" opt-in (AC: 1 + BR-OB-012)
  - [x] Per goal timeline > 120 tháng (LONG_TIMELINE_MONTHS đã có): card nhỏ 1 chạm "Chia chặng cho dễ thở?" — tap → hiển thị chặng 1 = 50% target: "Chặng 1: {{amount}} — ~{{months}} tháng" (timeline chặng = engine/compound với 50% target); tap lại (toggle) → về full view
  - [x] DISPLAY-ONLY (quyết định D1): không đổi target DB, không đổi store goals — state local component (per presetId, mất khi rời step, chấp nhận); user không tap = nguyên trạng (BR-OB-012 verbatim "user không tap = giữ nguyên full target")
  - [x] Touch ≥44px, giọng gợi ý không ép
- [x] Task 4: Tests + i18n + verify (AC: 1)
  - [x] Tests Task 1 đủ boundary; i18n parity vi == en; `npx tsc --noEmit` sạch; `npx vitest run` full pass
  - [x] Manual trace: goal 2 tỷ income 40tr (timeline dài) → thấy compound line + disclaimer; goal >10 năm → card chia chặng toggle được; goal ngắn (<24 tháng) → KHÔNG hiện compound

## Dev Notes

### BR verbatim

**BR-OB-013:** "3 tầng theo timeline: <2 năm = 5%/năm (tiết kiệm) · 2-5 năm = 6,5% (quỹ trái phiếu) · >5 năm = 8% (DCA index/vàng). % cập nhật theo năm T-1. LUÔN kèm disclaimer highlight 'tham khảo, không phải cam kết'. Mode gợi ý tham khảo — KHÔNG phải tư vấn đầu tư."

**BR-OB-012:** "...Nắn chặng = OPT-IN 1 chạm, chỉ gợi ý khi timeline > 10 năm; user không tap = giữ nguyên full target."

### Quyết định thiết kế (flag reviewer)

- **D1 chia chặng display-only:** epic không spec cơ chế lưu; schema funds không có milestone; đổi target DB vi phạm "giữ nguyên full target". Chặng 1 = 50% target là mốc tâm lý nửa đường — đơn giản nhất có nghĩa. Local state đủ cho onboarding (11.3 màn chi tiết có thể kế thừa).
- **D2 sim dùng avg monthly làm C:** contribution thực varies theo stage (GĐ1/2/3) — avg là xấp xỉ; disclaimer cover. Khi avg null (timeline >600): C = `capacityMonthly × ladderWeights(n)[rank]` (steady-state GĐ3).
- **D3 ngưỡng hiện compound:** timeline > 24 tháng (tier ≥ 6,5% — kênh mới đáng nói) hoặc null. Goal <24 tháng kênh tiết kiệm 5% không tạo khác biệt đáng kể → không hiện (tránh nhiễu).

### Engine/UI hiện trạng liên quan

- `budgetTemplate.ts`: `calculateAllocationPlan`, `ladderWeights(n)` (exported), `MAX_ALLOCATION_MONTHS = 600`, `sumBudgetPct`; monthlyAmount = avg (null khi timeline null)
- GoalStep suggest block (10.2 + P3 10.2): dòng suggest + escape hint (`suggestNever`/`suggestEscape` khi >120 hoặc null) + invalidHint; `LONG_TIMELINE_MONTHS = 120`
- GoalRankList (11.1): KHÔNG đụng — compound chỉ ở suggest block detail editor (rank list giữ gọn)
- Pattern số-trong-mono: tách template trên placeholder (ThreeStageLine TadaStep / AdviseHint GoalRankList — AdviseHint đã handle 2 placeholder qua regex, copy nếu cần)
- i18n prefix `setupV2.goal.*`; parity bắt buộc; token warning có sẵn trong theme (`--warning`)

### Previous Story Intelligence

- Review 10.1-11.1 patterns lặp: mọi số mới → nhánh null/0 explicit; label semantic rõ (avg vs tổng); pure logic → extract helper + tests (đừng để inline bị review bắt); i18n key chết → xóa ngay
- 10.3 insight: stage1End luôn 6 tháng — compound sim KHÔNG áp cho emergency (chỉ goals, emergency là an toàn không phải đầu tư)
- Persist version 2 — KHÔNG bump (không đổi shape store; chia chặng là local state)

### Project Structure Notes

- Compound helpers + config vào `budgetTemplate.ts` (cùng nhà engine — 1 nguồn số); tests vào `budgetTemplate.test.ts`
- UI: GoalStep.tsx suggest block; component tách chỉ khi >60 dòng thêm
- KHÔNG đụng: route, TadaStep (11.3 sẽ làm), GoalRankList, store shape, validations

### References

- `epics-onboarding-v2.md:951-956` (11.2 verbatim)
- `docs/02_BUSINESS_RULES.md:159-172` (BR-OB-012, BR-OB-013)
- `_bmad-output/implementation-artifacts/10-2-goalstep-live-suggest.md` + `11-1-goal-priority-drag-rank.md` (suggest block + mono pattern)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent, dev-story workflow; main thread verify độc lập)

### Debug Log References

- `npx tsc --noEmit` exit 0 · `npx vitest run` 31 files / 439 tests pass (428 → 439, +11 compound tests) — verify độc lập
- i18n parity setupV2 vi 106 == en 106, 0 orphan

### Completion Notes List

1. **Task 1** — `COMPOUND_RATES_YEAR=2025`, `COMPOUND_TIERS` [24→5%, 60→6.5%, ∞→8%], `compoundTimelineMonths` (FV annuity góp cuối kỳ, cap 600, epsilon dùng chung), `pickCompoundTier` (null → index). 11 tests boundary (case tay 44 tháng, monotonic, C≤0/target≤0, cap, tier biên 23/24/60/61/null).
2. **Task 2** — `goalCalcs` parent (lọc emergency); C = avg, null → `capacityMonthly × ladderWeights(n)[rank]` (D2); compound line khi (baseline >24 || null) && (null→hữu hạn / ngắn hơn ≥2 tháng); `CompoundLine` số mono; disclaimer BR-OB-013 `bg-warning/10 text-warning` 1 lần cuối block khi `anyCompound`; escape tĩnh giữ khi compound cũng null.
3. **Task 3** — Card "Chia chặng?" khi tooLong (>120/null): toggle local `Record<presetId,bool>` (D1 display-only, không DB/store); chặng 1 = 50% target, timeline = `ceil(baseline/2)` (engine tuyến tính — deviation 3) hoặc compound cho baseline null; 44px.
4. **Deviations (flag reviewer):** `text-warning` thay `warning-foreground` (token không tồn tại — check tailwind.config); channel name `font-medium` không mono (prose tiếng Việt, số vẫn mono); chặng timeline = ceil(baseline/2) thay re-run engine (tuyến tính từ balance 0, display-only + disclaimer cover).

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| FV annuity đúng công thức + monotonic rate + biên C/target/cap | Automated (11 tests) | PASS |
| Tier selection 3 biên + null → index | Automated | PASS |
| Compound line chỉ hiện đúng điều kiện (>24/null + cải thiện ≥2 tháng); emergency không áp | Manual trace `goalCalcs` — **cần browser verify** | PASS (trace) |
| Disclaimer LUÔN kèm khi có compound line (BR-OB-013) | Manual trace gate `anyCompound` — **cần browser verify** | PASS (trace) |
| Chia chặng: chỉ >120/null, opt-in toggle, không đổi DB/store (BR-OB-012) | Manual trace local state — **cần browser verify** | PASS (trace) |
| i18n parity 7 keys mới | Automated (106==106) | PASS |

### File List

- M `src/lib/constants/budgetTemplate.ts`
- M `src/lib/constants/__tests__/budgetTemplate.test.ts`
- M `src/components/onboarding/v2/GoalStep.tsx`
- M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 10-07-2026 · **Outcome:** Approve (sau 4 patches) · **Layer:** Combined (FV math verify độc lập bằng công thức đóng: 44/46 tháng khớp; 9 suspicions dropped)

**Verdicts trước patch:** AC1 compound 3 tầng PASS · BR-OB-013 FAIL edge (F1) · BR-OB-012 PASS · Tests không weakened, claims reproduce đủ.

### Action Items

- [x] [MED][BR-OB-013] SplitLine baseline-null dùng compound 8% (case goal 15 tỷ/income 10tr → "Chặng 1 ~533 tháng") KHÔNG disclaimer. **P1:** `anyCompound` bao cả `baseline===null && stage1Months!==null`; chặng baseline hữu hạn = ceil/2 linear → đúng bản chất không kích disclaimer. `GoalStep.tsx`.
- [x] [MED][a11y] Disclaimer `text-warning` contrast ≈1.8:1 light mode (--warning 33 100% 62%). **P2:** `text-foreground` trên `bg-warning/10`.
- [x] [LOW] `splitOpen` stale sau deselect→reselect (mất opt-in 1 chạm). **P3:** prune key khi toggle OFF + reset khi clear/skip.
- [x] [nit] Gate `>24` hardcode. **P4:** `COMPOUND_TIERS[0].maxMonths`.

### Deferred

- [Review][Defer] `t().replace` chỉ thay occurrence đầu (`TranslationProvider.tsx:46`) — an toàn hiện tại (mọi placeholder 1 lần/template), fragile nếu template lặp placeholder. Ngoài scope story (provider global).

### Verification sau patch (main thread, độc lập)

tsc exit 0 · 31 files / 439 tests pass · FV math verified closed-form.

## Change Log

- 10-07-2026: Story 11.2 implemented — compound engine 3 tầng T-1 2025, suggest enrichment + disclaimer BR-OB-013, card chia chặng opt-in display-only BR-OB-012; 439 tests pass; status → review.
- 10-07-2026: Code review — 4 patches (2 MED: disclaimer gate split-compound, contrast; 1 LOW prune state; 1 nit tier const), 1 defer; 439 tests; status → done.
