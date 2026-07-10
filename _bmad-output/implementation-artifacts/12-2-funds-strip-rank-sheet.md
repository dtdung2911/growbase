---
baseline_commit: 16e7bf3cf66c07f35452170ff81f9ca94483d859
---

# Story 12.2: Funds summary strip + Đổi hạng

Status: done

## Story

As a người dùng mở trang Funds,
I want thấy bức tranh tập hợp (mini-Tada) đầu trang và đổi hạng quỹ bằng kéo thả,
So that tôi hiểu kế hoạch chung và điều khiển ưu tiên mà không rời trang.

**Nguồn:** Epic 12 (`epics-onboarding-v2.md:997-1019`) · BR-OB-014, BR-OB-016 · story 12.1 (useLivingPlan).

## Acceptance Criteria

1. **Given** trang Funds render
   **When** summary strip hiện
   **Then** mini-Tada đầu trang: capacity tháng (15% income thực), GĐ hiện tại + progress 3 giai đoạn, cách chia ladder theo hạng — tất cả từ `useLivingPlan` (BR-OB-014); amounts font-mono; câu chuyện tập hợp không phân rã

2. **Given** hộ có ≥2 goal funds
   **When** user mở sheet "Đổi hạng" và kéo thả
   **Then** reuse GoalRankList; lưu thứ tự mới vào `priority_rank` (DB, persistent qua reload — BR-OB-016); mọi số strip/timeline recompute live; app advise không tự đổi hạng

3. **Given** member không có quyền sửa kế hoạch
   **When** mở Funds
   **Then** sheet Đổi hạng permission-aware — Epic 12 check OWNER trước (permission flag UI đầy đủ = deferred item J); non-owner thấy read-only

4. **Given** viewport 375px
   **When** render strip + sheet
   **Then** touch ≥44px; layout không tràn; i18n vi/en

## Tasks / Subtasks

- [x] Task 1: Refactor GoalRankList nhận props (AC: 2)
  - [x] `GoalRankList.tsx` (200 dòng, hiện đọc `useOnboardingV2Store` trực tiếp): tách contract `items: RankItem[]` + `onReorder(from, to)` + optional `readOnly` — onboarding GoalStep truyền từ store (giữ behavior y hệt), funds truyền từ Fund[]
  - [x] `RankItem` tối thiểu: `{ id, name, targetAmount, currentBalance? }` — what-if advise + suggest line hiện có giữ nguyên (engine input từ items)
  - [x] KHÔNG đổi UI/behavior onboarding — vitest + manual trace GoalStep sau refactor
- [x] Task 2: Sheet "Đổi hạng" trong Funds (AC: 2, 3)
  - [x] Component `src/components/funds/RankSheet.tsx`: shadcn Sheet, mount trong FundList khi ≥2 goal funds active; nút trigger cạnh summary strip
  - [x] Drag end → optimistic reorder local + PATCH tuần tự `priority_rank` = index+1 cho MỌI goal fund theo thứ tự mới (dedup + đóng gaps tự nhiên — trả deferred 12-1 ghost ranks); lỗi → rollback + toast error 5s
  - [x] Invalidate `keys.livingPlan(hid)` + `keys.funds(hid)` sau reorder thành công → strip/timeline recompute
  - [x] Permission: `isOwner` pattern (`settings/members/page.tsx:13` — `members.find(m => m.user_id === user?.id)?.role === "owner"`); non-owner: nút Đổi hạng ẩn, rank list trong sheet `readOnly` (hoặc không render nút — chọn đơn giản: non-owner không thấy nút, strip vẫn hiện đủ)
- [x] Task 3: Summary strip mini-Tada (AC: 1)
  - [x] Component `src/components/funds/FundsPlanStrip.tsx`, chèn trong `FundList.tsx` TRƯỚC summary cards hiện có (dòng 62-76 — giữ 3 cards cũ)
  - [x] Nội dung 3 khối gọn: (a) capacity tháng này `formatVND(capacityThisMonth)` + caption "15% thu nhập thực" (derive %, không hardcode text số); (b) GĐ hiện tại từ `plan` (badge + progress 3 chấm/segments — GĐ xác định từ emergency balance vs ngưỡng, engine đã tính stage ends; hiển thị "GĐ2 · lá chắn N%"); (c) cách chia ladder: "70/30" hoặc "60/30/10" theo số goal funds (`ladderWeights`) + tên quỹ hạng 1
  - [x] Loading: skeleton strip (không spinner); household chưa có goal fund → strip rút gọn chỉ capacity + GĐ emergency-only
  - [x] Amounts `font-mono tabular-nums`; token màu; responsive 375px (stack dọc mobile, ngang ≥md)
- [x] Task 4: Tests + i18n + verify (AC: 4)
  - [x] i18n keys mới prefix `funds.plan.*` parity vi == en; GĐ hiện tại logic nếu tách thuần → test
  - [x] `npx tsc --noEmit` sạch · `npx vitest run` full pass (onboarding tests không vỡ sau refactor Task 1)
  - [x] Manual trace: Funds mở → strip đúng số useLivingPlan; kéo hạng → PATCH + strip đổi; reload → thứ tự giữ; non-owner không thấy nút

## Dev Notes

### Hiện trạng (investigator 10-07 + story 12.1)

- `src/app/(app)/funds/page.tsx` (36 dòng): PageHeader → MonthlyBufferBanner → `<FundList funds={list}/>`; `useFunds()`
- `FundList.tsx` (150 dòng): Create button (50-59), summary cards 3-col (62-76: totalBalance/activeFunds/monthlyTotal), grouped theo fund_type (78+); i18n `funds.*`
- `FundCard.tsx` (147 dòng): KHÔNG đụng story này (12.3 mới sửa card/detail)
- `GoalRankList.tsx` (200 dòng): đọc store trực tiếp (`useOnboardingV2Store(s => s.goals)`, `reorderGoals`) — refactor props Task 1; rank badge màu token (1 primary/10, 2 info/10, 3+ muted); AdviseHint 2-placeholder; PointerSensor distance 8 + KeyboardSensor
- `useLivingPlan` (12.1): `{ plan: AllocationPlan, capacityThisMonth, trailingIncome, isLoading }` — plan có `stage1EndMonth/stage2EndMonth/allocations` (emergency đầu, goals theo rank), engine nhận balance thật
- GĐ HIỆN TẠI xác định: `emergencyBalance >= emergencyTarget` → GĐ3; `>= stage1Threshold (target/3)` → GĐ2; else GĐ1 — engine `plan` không expose trực tiếp "current stage" → tính từ `plan.stage1EndMonth === 0` (đã qua GĐ1 nếu 0? — kiểm tra semantics: stageEnd = 0 nghĩa "đã đạt từ đầu") HOẶC derive từ emergencyBalance vs emergencyTarget/3 — chọn cách sau (rõ ràng), helper thuần `currentStage(emergencyBalance, emergencyTarget): 1|2|3` + test
- Permission: `HouseholdMemberRow.role: "owner"|"member"|"viewer"`; pattern isOwner `settings/members/page.tsx:13`; members từ hook nào — grep `useMembers`/household members hook trước khi dùng
- PATCH funds route đã nhận `priority_rank` (12.1 P6: chỉ goal, 400 nếu khác)
- Deferred 12-1 liên quan: ghost ranks (Task 2 reorder ghi lại 1..n = tự dọn), race max+1 (reorder sheet là chỗ dedup)

### Style & voice

- Strip = "mini-Tada": 1 dòng chuyện + số, KHÔNG đổ bảng (chi tiết = 12.3 tab Kế hoạch)
- Cards data `rounded-[13px] border border-border/40 bg-card shadow-card`; stat `rounded-[18px]` (style guide)
- Skeleton loading cho strip; mutation isPending → disabled

### Previous Story Intelligence

- 11.1 review: drag row cần `relative z-10` khi dragging; displayName fallback custom; listeners CHỈ trên handle
- 12.1 review: route sort 3 cấp rank→created_at→id (client cũng sort vậy khi nhận Fund[]); RPC base mới nhất; mọi pure logic → helper + test trước
- Pattern optimistic + rollback: MutationCache pattern hiện có (story 9.1 note); toast error 5s giữ form
- i18n parity check bắt buộc; số trong span mono (tách placeholder)

### Project Structure Notes

- Mới: `src/components/funds/FundsPlanStrip.tsx`, `src/components/funds/RankSheet.tsx`; helper `currentStage` để trong `budgetTemplate.ts`? KHÔNG — không phải engine core; để `src/lib/utils/` hoặc cạnh strip; testable
- Sửa: `GoalRankList.tsx` (props refactor), `GoalStep.tsx` (caller update), `FundList.tsx` (mount strip + sheet)
- KHÔNG đụng: engine, route living-plan, migration, TadaStep

### References

- `epics-onboarding-v2.md:997-1019` (12.2 verbatim) · BR-OB-014/016
- `12-1-rank-persistent-living-engine.md` (useLivingPlan + deferred)
- `11-1-goal-priority-drag-rank.md` (GoalRankList + review)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer subagent; main thread verify độc lập)

### Debug Log References

- tsc exit 0 · vitest 35 files / 465 tests pass (461 → 465, +4 currentStage) — verify độc lập
- i18n parity vi 829 == en 829; funds.plan.* = 14 keys

### Completion Notes List

1. Task 1 — GoalRankList props-based `{items, monthlyIncome, onReorder, readOnly?}`; currentBalance → engine initialBalance (onboarding 0, behavior y hệt); fallback tên custom chuyển caller GoalStep.
2. Task 2 — RankSheet: trigger isOwner && ≥2 goal funds; optimistic arrayMove + PATCH tuần tự rank=index+1 mọi goal fund (tự dọn gaps/dedup — trả deferred 12-1); rollback + toast 5s; invalidate funds/livingPlan/dashboard; invalidate cả onError (PATCH dở → hoà lại server state).
3. Task 3 — FundsPlanStrip trước 3 summary cards: capacity + caption pct derive; GĐ qua helper thuần `currentStage` (target/3) + segments + lá chắn %; ladder derive ladderWeights + tên hạng 1; skeleton; 0 goals rút gọn; useLivingPlan expose thêm emergencyBalance.
4. Quyết định: monthlyIncome prop thêm (suggest/advise cần income household); SheetHeader sr-only (tránh trùng heading, giữ a11y Radix); readOnly wrap DndContext sensors-disabled (tránh useSortable ngoài provider).

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| currentStage ngưỡng target/3 và target (1/2/3) | Automated (4 tests) | PASS |
| Reorder → PATCH mọi goal fund 1..n, reload giữ thứ tự | Manual trace + optimistic/rollback logic — **cần browser verify** | PASS (trace) |
| Onboarding GoalStep sau refactor GoalRankList behavior y hệt | Automated (suite xanh) + manual trace caller | PASS |
| Strip đọc đúng useLivingPlan (capacity/GĐ/ladder), 0-goals rút gọn | Manual trace — **cần browser verify** | PASS (trace) |
| Non-owner không thấy nút Đổi hạng | Manual trace isOwner gate — **cần browser verify 2 account** | PASS (trace) |
| i18n parity 14 keys mới | Automated (829==829) | PASS |

### File List

- A `src/lib/utils/currentStage.ts` · A `src/lib/utils/__tests__/currentStage.test.ts` · A `src/components/funds/FundsPlanStrip.tsx` · A `src/components/funds/RankSheet.tsx`
- M `src/components/onboarding/v2/GoalRankList.tsx` · M `src/components/onboarding/v2/GoalStep.tsx` · M `src/components/funds/FundList.tsx` · M `src/lib/hooks/useFunds.ts` · M `src/lib/hooks/useLivingPlan.ts` · M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 10-07-2026 · **Outcome:** Approve (sau 3 patches) · **Layer:** Combined (claims reproduce đủ: tsc, 465, parity 829/830)

**Verdicts:** AC1 PASS · AC2 PASS sau P1/P2 · AC3 PASS (isOwner gate, non-owner strip-only) · AC4 PASS (44px, stack mobile).

### Action Items

- [x] [MED] Drag không khoá khi mutation pending — double drag → 2 PATCH loop interleave → DB rank bẩn. **P1:** early-return + readOnly={isPending}.
- [x] [MED] Sheet what-if bỏ emergencyBalance thật — hộ GĐ2/3 thấy timeline như emergency rỗng, mâu thuẫn strip cùng màn. **P2:** prop emergencyBalance (default 0, onboarding không đổi), RankSheet truyền từ useLivingPlan.
- [x] [LOW] Route error → skeleton pulse vĩnh viễn. **P3:** isError + funds.plan.loadError.

### Deferred

- [Review][Defer] isOwner flash (nút hiện sau members fetch) — polish.
- [Review][Defer] pct trong caption chưa mono span (cosmetic, pattern tách placeholder).
- [Review][Info] currentStage dùng target/3 (floored 100k) vs engine stage1Threshold un-floored — lệch ≤33k, documented choice.
- [Review][Info] Sheet heading reuse copy onboarding rankTitle — wording hơi onboarding-flavored, cân nhắc funds-specific sau.

### Verification sau patch (main thread, độc lập)

tsc exit 0 · 35 files / 465 tests · parity 830 == 830.

## Change Log

- 10-07-2026: Story 12.2 implemented — FundsPlanStrip mini-Tada, RankSheet drag persist priority_rank, GoalRankList props refactor; 465 tests; status → review.

- 10-07-2026: Code review — 3 patches (2 MED: pending gate, emergencyBalance plumb; 1 LOW error state), 4 defer/info; 465 tests; status → done.
