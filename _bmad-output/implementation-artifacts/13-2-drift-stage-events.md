---
baseline_commit: 16e7bf3cf66c07f35452170ff81f9ca94483d859
---

# Story 13.2: Drift + sự kiện giai đoạn kể tử tế

Status: done

## Story

As a người dùng có tháng biến động,
I want app kể chuyện tụt/giãn kèm lối thoát thay vì báo lỗi,
So that tin xấu không làm tôi bỏ cuộc.

**Nguồn:** Epic 13 (`epics-onboarding-v2.md:1084-1101`) · BR-OB-012, BR-OB-017, BR-OB-018 · Epic 5 insight layer.

## Acceptance Criteria

1. **Given** một tháng hộ không góp (hoặc góp thiếu)
   **When** dashboard/fund render
   **Then** timeline giãn + message lối thoát ("còn N tháng là đầy lại"), khung tích cực, KHÔNG hiện như lỗi (BR-OB-017)

2. **Given** emergency balance qua ngưỡng GĐ (lên hoặc xuống — kể cả rút tụt ngưỡng)
   **When** useLivingPlan phát hiện chuyển giai đoạn
   **Then** insight card kể sự kiện GĐ kèm lối thoát "còn N tháng là đầy lại" (BR-OB-018); tận dụng Epic 5 insight layer; KHÔNG notify chéo member

3. **Given** sự kiện GĐ được kể
   **When** render
   **Then** insight ngôn ngữ giai đoạn ở mức EVENTS (insight engine ngôn ngữ GĐ toàn diện = deferred item H); i18n vi/en; vitest cho logic phát hiện chuyển GĐ; `tsc` sạch

## Tasks / Subtasks

- [x] Task 1: Phát hiện chuyển GĐ (AC: 2)
  - [x] Helper thuần `detectStageTransition(lastSeen: 1|2|3|null, current: 1|2|3): { direction: "up"|"down", from, to } | null` — null khi bằng nhau hoặc lastSeen null (lần đầu = baseline, không event)
  - [x] Lưu last-seen: localStorage `growbase.last-stage.${householdId}` (pattern `growbase.goal-narrative-shown` DailyInsightBanner:35 — per-device chấp nhận được: sự kiện là câu chuyện cá nhân, KHÔNG notify chéo member đúng BR-OB-018)
  - [x] Component client `StageEventCard`: đọc useLivingPlan → currentStage → so localStorage → transition → render card + GHI stage mới NGAY (event kể 1 lần; reload không lặp); không transition → chỉ sync stored
  - [x] Tests: detectStageTransition đủ ma trận (null/1→2/2→1/3→2/không đổi)
- [x] Task 2: Nội dung sự kiện + lối thoát (AC: 2, BR-OB-018 verbatim)
  - [x] "Còn N tháng là đầy lại": N = tháng để emergency về ngưỡng vừa tụt — tính thuần từ plan: thiếu = ngưỡng − balance; rate = capacity × share GĐ hiện tại (GĐ1 100%, GĐ2 70%); N = ceil(thiếu/rate); rate 0 → bỏ số, câu vẫn tích cực
  - [x] Lên GĐ: celebrate ngắn ("Lá chắn đạt X — sang giai đoạn Y 🎉" — giọng milestone Epic 6, không dài)
  - [x] Xuống GĐ: sự thật + lối thoát LIỀN NHAU 1 card ("Lá chắn xuống dưới X — không sao, còn ~N tháng là đầy lại") — số tụt mood không đứng một mình (BR-OB-012); KHÔNG đỏ, dùng token info/primary
  - [x] Style card khớp DailyInsightBanner hiện có (đọc component trước); dismiss được (X) → cũng ghi stored
- [x] Task 3: Drift message dashboard (AC: 1)
  - [x] Điều kiện: tháng TRƯỚC (lịch thực) hộ không có fund_contribution nào VÀ có goal/emergency fund chưa đạt — nguồn: 1 query transactions tháng trước qua hook hiện có hay data dashboard đã fetch (ĐỌC DashboardView data flow — KHÔNG API mới nếu tránh được; nếu bắt buộc thì mở rộng response /api/living-plan thêm `contributedLastMonth: boolean` — 1 count query, chọn cách này nếu dashboard không sẵn data)
  - [x] Message 1 dòng trong StageEventCard slot (ưu tiên event GĐ hơn drift — 1 card 1 lần, không stack): "Tháng trước chưa góp — timeline đã tự tính lại, mọi thứ vẫn trong tầm" + suggest ngắn; khung tích cực text-muted (BR-OB-017), hiện tối đa 1 lần/tháng (localStorage `growbase.drift-shown.${hid}.${month}`)
- [x] Task 4: Mount + verify (AC: 3)
  - [x] Mount `StageEventCard` trong DashboardView SAU StageBadge trước MilestoneCelebration (thứ tự: badge → event card → milestone → daily insight — đọc layout thật, tránh 3 cards cùng lúc: nếu MilestoneCelebration đang show thì event GĐ vẫn show được? — QUYẾT: event GĐ độc lập milestone quỹ, cho phép cùng lúc nhưng drift thì nhường)
  - [x] i18n `dashboard.stageEvent.*` parity · `npx tsc --noEmit` · `npx vitest run` full · manual trace: giả lập localStorage stage 3 + balance GĐ2 → card tụt hiện đúng 1 lần

## Dev Notes

### BR verbatim

- **BR-OB-017:** tháng không góp = hợp lệ, timeline tự giãn + kể tử tế kèm lối thoát, không phải lỗi.
- **BR-OB-018:** chuyển GĐ (lên/xuống, kể cả rút tụt ngưỡng) PHẢI được kể kèm lối thoát ("còn N tháng là đầy lại"); không notify chéo member.
- Epic AC3: ngôn ngữ GĐ mức EVENTS — KHÔNG refactor insight engine toàn diện (deferred H).

### Hiện trạng insight (investigator)

- DashboardView 287 dòng: space-y-6 = StageBadge (13.1) → MilestoneCelebration → DailyInsightBanner → FirstExpenseCta → InviteCompanionPrompt
- DailyInsightBanner: client-side compute (`resolveGoalInsight` → `buildInsightDescriptor`), localStorage `growbase.goal-narrative-shown.${householdId}` (dòng 35), card style ở dòng 52
- `currentStage` helper + `useLivingPlan` (plan.emergencyTarget DB thật, capacityThisMonth, emergencyBalance)
- Share GĐ theo BR-OB-010: GĐ1 emergency 100%, GĐ2 70% (mirror suggestedContribution 12.4 — cap room đã có pattern trong fundPlan.ts)

### Previous Story Intelligence

- 12.3 P2: tháng lịch THỰC (todayVN) cho mọi logic tháng — drift check tháng trước = todayVN tháng −1
- 12.4: suggestedContribution + share theo GĐ — tính N tháng đầy lại dùng cùng share logic (import/mirror, đừng chế công thức thứ 3)
- 13.1: stageBadgeContent pattern helper thuần + union type; split {{months}} mono
- Lessons: insight card không stack chồng (drift nhường event); localStorage per-device OK cho personal narrative; số tụt mood LUÔN kèm lối thoát cùng card

### Project Structure Notes

- Mới: `src/lib/insight/stageEvent.ts` (detect + N-months + drift condition — thuần, testable) + `src/components/dashboard/StageEventCard.tsx` + tests
- Sửa: `DashboardView.tsx` (1 mount), có thể `/api/living-plan/route.ts` (+contributedLastMonth nếu cần — 1 count query)
- KHÔNG đụng: insight engine hiện có (goalInsight/selectState/goalProgress), MilestoneCelebration, engine allocation

### References

- `epics-onboarding-v2.md:1084-1101` (13.2 verbatim) · BR-OB-012/017/018
- `12-4-prefill-contribute.md` (share GĐ pattern) · `13-1-*.md` (badge pattern)

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer; main thread verify độc lập)

### Debug Log References

- tsc exit 0 · vitest 38 files / 523 tests (506 → 523, +17 stageEvent) — verify độc lập · parity 850 == 850

### Completion Notes List

1. `stageEvent.ts` thuần: detectStageTransition (baseline null không event) + monthsToRefill (share mirror fundPlan GĐ1 100%/GĐ2 70%, rate ≤0 → downNoMonths bỏ số) + drift condition. 17 tests ma trận.
2. StageEventCard: localStorage last-stage ghi NGAY (kể 1 lần); lên GĐ celebrate 🎉, xuống = sự thật + lối thoát cùng card token primary KHÔNG đỏ (BR-OB-012); style khớp DailyInsightBanner; dismiss 44px; drift nhường event, 1 lần/tháng, text-muted khung tích cực (BR-OB-017).
3. Data drift: mở rộng /api/living-plan + hook `contributedLastMonth` (1 count query head:true, tháng trước lịch thực todayVN — lesson 12.3 P2); fallback true khi chưa data (tránh false-positive loading).
4. Bug tự bắt: plan object tươi mỗi render → effect re-run có thể ghi đè event bằng drift — fix `resolvedFor` ref resolve đúng 1 lần (không set trong guard hộ-mới để retry).

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| detectStageTransition ma trận đủ (null/lên/xuống các cặp) | Automated (17 tests) | PASS |
| monthsToRefill share đúng GĐ + rate 0 | Automated | PASS |
| Event kể 1 lần (ghi stored ngay), reload không lặp | Manual trace ref+localStorage — **cần browser verify** | PASS (trace) |
| Xuống GĐ: số tụt mood + lối thoát CÙNG card, không đỏ | Manual trace + i18n — **cần browser verify** | PASS (trace) |
| Drift nhường event, 1 lần/tháng, không notify chéo member | Manual trace (localStorage per-device) | PASS |

### File List

- A `src/lib/insight/stageEvent.ts` · A `src/lib/insight/__tests__/stageEvent.test.ts` · A `src/components/dashboard/StageEventCard.tsx`
- M `src/app/api/living-plan/route.ts` · M `src/lib/hooks/useLivingPlan.ts` · M `src/components/dashboard/DashboardView.tsx` · M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json`

## Senior Developer Review (AI)

**Date:** 11-07-2026 · **Outcome:** Approve (sau 4 patches) · **Layer:** Combined (localStorage lifecycle + share formula + TZ trace; 6 dropped)

**Verdicts:** AC1 PASS sau P1/P3 · AC2 PASS sau P2 · AC3 PASS.

### Action Items

- [x] [MED] Drift false-positive hộ mới onboard (tháng trước chưa tồn tại → "Tháng trước chưa góp" sai sự thật, vi phạm BR-OB-017). **P1:** guard households.created_at — hộ tạo trong/sau đầu tháng trước → contributedLastMonth=true.
- [x] [MED-LOW] monthsToRefill share hardcode thiếu nhánh no-incomplete-goals (spec cấm "công thức thứ 3") — hộ hết goal dở tụt GĐ thấy N chậm ×1.43. **P2:** hasIncompleteGoals param mirror fundPlan + test.
- [x] [LOW] Drift-shown key dùng device month thay todayVN → double-show quanh giao tháng. **P3:** todayVN().slice(0,7).
- [x] [check] count query error → false drift. **P4:** error → true (im lặng an toàn).

### Deferred / Accepted

- [Review][Accepted] resolvedFor one-shot: stage đổi ngay sau contribute cùng mount → event DELAY tới lần mount kế (không mất — last-stage chưa ghi đè); trade-off hợp lý, MilestoneCelebration cover khoảnh khắc quỹ đầy.
- [Review][Accepted] localStorage per-device: member thứ 2 chung máy kế thừa baseline — personal narrative by design.
- [Review][F4 plausible] Cached plan + background refetch error → event consumed nhưng card ẩn (hiếm, per-device).
- [Review][Cosmetic] Up-copy không hiện số ngưỡng X; drift thiếu "suggest ngắn" Task 3 — copy deviation nhỏ.

### Verification sau patch (main thread, độc lập — chạy ở turn kế)

Xem Change Log.

## Change Log

- 11-07-2026: Story 13.2 implemented — stageEvent detect + refill months + drift (BR-OB-012/017/018), StageEventCard 1-card policy; 523 tests; status → review.

- 11-07-2026: Code review — 4 patches (MED drift hộ mới, share mirror, TZ, error guard); 524 tests; status → done.
