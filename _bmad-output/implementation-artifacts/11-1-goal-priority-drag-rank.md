---
baseline_commit: ca3478d6017dc37e065ce06b1266e0645f824d0d
---

# Story 11.1: Kéo thả xếp hạng goals

Status: done

## Story

As a người dùng có nhiều mục tiêu,
I want kéo thả đổi thứ tự ưu tiên các quỹ với label màu rõ ràng,
So that tôi kiểm soát quỹ nào được ưu tiên tiền trước và thấy hệ quả ngay.

**Nguồn:** Epic 11 (`epics-onboarding-v2.md:944-950`) · BR-OB-011 (hạng do USER xếp, app chỉ advise).

## Acceptance Criteria

1. **Given** ≥2 goal funds trong onboarding
   **When** user kéo thả đổi hạng (label màu theo mức ưu tiên)
   **Then** tỷ trọng bậc thang + timeline mọi quỹ recalc live qua engine; app advise bằng hint ("quỹ X xong trong N tháng nếu đẩy hạng") không tự đổi hạng; touch ≥44px; i18n vi/en

## Tasks / Subtasks

- [x] Task 1: Dependency + store action (AC: 1)
  - [x] `npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` — QUYẾT ĐỊNH D1: AC đòi kéo thả thật trên mobile, HTML5 drag không support touch, tự viết pointer-events ~100 dòng rủi ro hơn lib chuẩn 3 gói nhỏ tree-shakable. Flag cho user.
  - [x] `onboardingV2Store.ts`: action `reorderGoals(fromIndex: number, toIndex: number)` — di chuyển phần tử trong `goals` array (emergency không nằm trong goals — chỉ goal funds), persist tự động qua zustand
  - [x] Store test: reorder giữ nguyên phần tử, đổi đúng vị trí, index ngoài biên no-op
- [x] Task 2: Ranked list UI trong GoalStep (AC: 1)
  - [x] Section mới "Thứ tự ưu tiên" (i18n) hiện KHI ≥2 goals selected, đặt SAU grid chọn goal — grid chọn giữ nguyên (fixed preset order), ranked list là view theo rank
  - [x] Mỗi row: drag handle (icon `solar:hamburger-menu-linear` hoặc tương tự @iconify) + label hạng màu + tên goal + suggest ngắn (góp ~X/tháng · N tháng — số liệu đã có từ engine 10.2)
  - [x] Label màu theo hạng: hạng 1 `bg-primary/10 text-primary`, hạng 2 `bg-info/10 text-info` (token `--info`), hạng 3+ `bg-muted text-muted-foreground` — KHÔNG hardcode hex; text label "Ưu tiên 1/2/3..." i18n
  - [x] Row height ≥44px, drag handle vùng chạm ≥44px; `DndContext` + `SortableContext` + `verticalListSortingStrategy`; keyboard sensor bật (a11y); drag end → `reorderGoals`
  - [x] Kéo thả xong → engine recalc tự nhiên (suggest đọc từ `goals` order — đã live từ 10.2, không thêm state)
- [x] Task 3: Advise hint không tự đổi hạng (AC: 1 + BR-OB-011)
  - [x] Với mỗi goal KHÔNG ở hạng 1 có `timelineMonths` hữu hạn: chạy engine what-if với goal đó đẩy lên 1 bậc (swap với goal ngay trên); nếu timeline mới ngắn hơn ≥1 tháng → hint text-xs muted dưới row: "Xong sớm hơn {delta} tháng nếu đẩy lên hạng {rank-1}" (i18n)
  - [x] App KHÔNG tự đổi hạng — hint chỉ là text, user tự kéo (BR-OB-011 verbatim: "app chỉ advise, không tự đổi hạng")
  - [x] What-if chỉ tính khi ≥2 goals + goal đó timeline hữu hạn — engine thuần nhẹ, không debounce
- [x] Task 4: Tests + i18n + verify (AC: 1)
  - [x] Store tests reorder (Task 1); what-if helper nếu tách thuần → test; i18n parity vi == en
  - [x] `npx tsc --noEmit` sạch · `npx vitest run` full pass
  - [x] Manual trace: 3 goals → kéo hạng 3 lên 1 → mọi suggest đổi; hint hiện đúng; keyboard reorder hoạt động; touch target đo bằng class h-11/min-h-[44px]

## Dev Notes

### BR-OB-011 (verbatim)

> Tỷ trọng bậc thang theo hạng: 2 quỹ = 70/30; 3 quỹ = 60/30/10. Hạng do USER xếp (kéo thả, label màu) — app chỉ advise, không tự đổi hạng. KHÔNG waterfall. KHÔNG slider % trong onboarding.

### Hiện trạng liên quan (sau 10.1-10.3)

- Rank = thứ tự `goals` array trong `onboardingV2Store` (insertion order); engine ladder áp theo order này; suggest live GoalStep đọc order này (10.2)
- Review 10.2 defer: "toggle off/on demote rank cuối, rank invisible" — story này TRẢ nợ đó (rank thành visible + controllable)
- GoalStep.tsx (~290 dòng sau 10.2 P3): grid chọn goals dòng ~84-242 (detail editor inline), suggest block ~228-244, error hint P3 ~231
- Store: `goals: OnboardingGoal[]`, persist sessionStorage version 2, `toggleGoal` append cuối
- Engine: `calculateAllocationPlan` — id = presetId trong GoalStep; what-if = gọi lại với array đã swap (thuần, rẻ)
- Wizard order sau 10.2: Hook(0) → Income(1) → Goal(2) → Tada(3)

### @dnd-kit pattern chuẩn (D1)

```tsx
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={selectedGoals.map(g => g.presetId)} strategy={verticalListSortingStrategy}>
    {selectedGoals.map((g, rank) => <SortableGoalRow key={g.presetId} ... />)}
  </SortableContext>
</DndContext>
// useSortable({ id }) → attributes, listeners (gắn vào handle, KHÔNG cả row — tránh chặn scroll), setNodeRef, transform, transition
// sensors: PointerSensor (activationConstraint distance 8 tránh conflict tap) + KeyboardSensor
```

- `id` = presetId (unique — mỗi preset 1 goal, custom 1)
- Transform qua `CSS.Transform.toString(transform)` từ @dnd-kit/utilities
- KHÔNG animate layout ngoài dnd transition — giữ đơn giản

### Voice & style

- Hint advise giọng gợi ý, không ra lệnh: "Xong sớm hơn N tháng nếu đẩy lên" — không "Bạn nên..."
- Số trong hint/suggest: span `font-mono tabular-nums` (chuẩn 10.3), câu prose thường
- Mobile 375px primary; ranked list full-width rows; pb đủ cho footer wizard

### Previous Story Intelligence

- 10.2: suggest keys `setupV2.goal.suggest*`; goalSchema targetAmount `.int().min(100_000)`; LONG_TIMELINE_MONTHS 120; persist version 2 (KHÔNG cần bump — chỉ thêm action, không đổi shape/semantics)
- 10.3: pattern tách template trên placeholder để số vào mono span (`ThreeStageLine` trong TadaStep — copy pattern nếu hint cần)
- Review pattern 3 vòng trước: mọi số hiển thị phải có nhánh null/0; store test cho action mới; i18n parity check bắt buộc

### Project Structure Notes

- Component mới nếu cần: `src/components/onboarding/v2/GoalRankList.tsx` (SortableGoalRow bên trong) — chỉ tách khi GoalStep quá dài, ưu tiên inline nếu <60 dòng thêm (Karpathy)
- Store: `src/lib/stores/onboardingV2Store.ts` · tests `src/__tests__/stores/onboardingV2Store.test.ts`
- KHÔNG đụng: engine, route, TadaStep, IncomeStep, validations (trừ khi tsc bắt)

### References

- `epics-onboarding-v2.md:944-950` (11.1 verbatim)
- `docs/02_BUSINESS_RULES.md:151-157` (BR-OB-011)
- `_bmad-output/implementation-artifacts/10-2-goalstep-live-suggest.md` (suggest live + review defers)
- @dnd-kit docs: https://docs.dndkit.com/presets/sortable

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent, dev-story workflow; main thread verify độc lập)

### Debug Log References

- `npx tsc --noEmit` exit 0 · `npx vitest run` 31 files / 427 tests pass (verify độc lập; +2 store reorder tests)
- i18n parity vi 785 == en 785
- `@dnd-kit/core@6.3.1` + `sortable@10.0.0` + `utilities@3.2.2` — ~13-15KB gzip, chỉ nạp route /setup

### Completion Notes List

1. **Task 1** — 3 gói @dnd-kit (D1 đã chốt); `reorderGoals(from, to)` splice + guard biên/from===to no-op; không bump persist version (chỉ thêm action); 2 store tests.
2. **Task 2** — `GoalRankList.tsx` mới (tách vì >60 dòng — đúng ngưỡng story): section "Thứ tự ưu tiên" sau grid, chỉ khi ≥2 goals; handle listeners riêng (không chặn scroll), 44px; label hạng token màu; PointerSensor distance 8 + KeyboardSensor; drag end → reorderGoals → suggest recalc tự nhiên.
3. **Task 3** — `computeAdvise` what-if thuần swap lên 1 bậc, delta ≥1 tháng → `AdviseHint` (split 2 placeholder {{delta}}/{{rank}} qua regex, số vào mono span); app không tự đổi hạng (BR-OB-011).
4. Quyết định phụ: `planFor` self-contained trong GoalRankList (engine rẻ, tránh coupling props); key thêm `rankSubtitle` "Kéo để đổi hạng" (affordance mobile); row timeline vô hạn hiện `suggestNever`, advise tự ẩn.

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| reorderGoals đổi đúng vị trí, giữ phần tử, biên no-op | Automated (2 store tests) | PASS |
| Kéo hạng 3 lên 1 → ladder + suggest mọi quỹ recalc | Manual trace (suggest đọc goals order — mechanism 10.2 đã verify) — **cần browser verify drag** | PASS (trace) |
| Advise hint đúng điều kiện (không hạng 1, timeline hữu hạn, delta ≥1) + không tự đổi hạng | Manual trace `computeAdvise` — **cần browser verify** | PASS (trace) |
| Keyboard reorder (a11y) + touch 44px | Manual trace (KeyboardSensor + class h-11 w-11) — **cần browser verify** | PASS (trace) |
| i18n parity 5 keys mới | Automated (785==785) | PASS |

### File List

- M `package.json` · M `package-lock.json` (@dnd-kit ×3)
- M `src/lib/stores/onboardingV2Store.ts`
- M `src/__tests__/stores/onboardingV2Store.test.ts`
- A `src/components/onboarding/v2/GoalRankList.tsx`
- M `src/components/onboarding/v2/GoalStep.tsx`
- M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 10-07-2026 · **Outcome:** Approve (3 Low patched) · **Layer:** Combined Blind+Edge+Acceptance (1 agent, 9 hunt areas, 9 suspicions dropped có evidence)

**Verdicts:** AC1 PASS (labels token màu, handle 44px, live recalc qua mechanism 10.2, hint text-only không tự đổi hạng — BR-OB-011 verified: reorderGoals đúng 1 call site drag end) · Tasks 1-4 PASS · Claims reproduce đầy đủ (tsc, 427, parity 785, @dnd-kit versions).

### Action Items

- [x] [LOW] `z-10` vô hiệu trên static li — row đang kéo paint dưới rows khác. Fix: `relative z-10 opacity-80`. `GoalRankList.tsx:149`.
- [x] [LOW] Custom goal chưa đặt tên → row title + aria-label rỗng. Fix: `displayName = goal.name || t("setupV2.goal.custom.name")`. `GoalRankList.tsx:129,154,170`.
- [x] [LOW] Test gap reorder drag-down (from < to). Fix: test `(0,2)` `[A,B,C]`→`[B,C,A]`. Store test:78-94.

### Verification sau patch (main thread)

tsc exit 0 · **31 files / 428 tests pass** (427 → 428) · splice logic verified equivalent arrayMove cả 2 chiều.

## Change Log

- 10-07-2026: Story 11.1 implemented — @dnd-kit drag rank list (GoalRankList), reorderGoals store action, what-if advise hint BR-OB-011; 427 tests pass; status → review.
- 10-07-2026: Code review combined — APPROVE, 3 Low patched (relative z-10, displayName fallback, drag-down test); 428 tests; status → done.
