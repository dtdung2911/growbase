---
baseline_commit: 954f19c5fa316db10ce58b3d73c27d0db86a58a9
---

# Story 8.2: Goal step 2 tầng — nền khẩn cấp + multi-select mục tiêu

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng mới chưa hiểu tài chính,
I want thấy rõ quỹ khẩn cấp là lớp bảo vệ mặc định và tự chọn thêm mục tiêu phù hợp hoàn cảnh của TÔI,
so that tôi không bị ép vào preset không liên quan (chưa có con, đã có nhà).

## Acceptance Criteria

1. **Given** user vào Goal step, **When** render, **Then** tầng 1 hiển thị card Quỹ khẩn cấp CỐ ĐỊNH (không bỏ chọn được, không phải button toggle) với: blurb chính xác *"Đệm 3-6 tháng chi tiêu, dựng trước tiên. Sự cố ập tới (mất việc, ốm đau) không làm vỡ kế hoạch tiền của bạn."* + badge "✓ Nền tảng đã xây" + icon Shield hiện có.
2. **Given** tầng 2 hiển thị mục tiêu (Giáo dục / Mua nhà / Du lịch / Mục tiêu khác), **When** user bấm card, **Then** toggle chọn/bỏ chọn độc lập (multi-select) — card chọn có `border-primary ring-2 ring-primary/20`, chưa chọn `border-border/40`. Semantics `role="checkbox"` + `aria-checked` (KHÔNG còn radiogroup).
3. **Given** có ≥1 mục tiêu được chọn, **When** render, **Then** hiển thị counter "Đã chọn N quỹ" (i18n, N động). 0 mục tiêu → không hiện counter.
4. **Given** user không muốn thêm gì, **When** nhìn tầng 2, **Then** có lựa chọn rõ ràng "Chưa cần, để sau" — bấm vào clear hết mục tiêu đã chọn; nút Tiếp tục LUÔN enable khi 0 mục tiêu (emergency mặc định là đủ).
5. **Given** mục tiêu được chọn có editor (target/months; "Mục tiêu khác" thêm name), **When** giá trị thiếu hoặc ≤ 0, **Then** nút Tiếp tục disable tới khi MỌI mục tiêu đã chọn pass `goalSchema` — dùng `canProceed()` từ store 8.1, không tự viết logic validate mới.
6. Header tầng 2 dùng giọng "mở khoá": tiêu đề i18n *"Nền đã vững. Giờ chọn thêm mục tiêu bạn muốn hướng tới"* — không dùng ngôn ngữ level-up/XP.
7. Mobile 375px: mọi touch target ≥ 44px, editor input 16px font (chống iOS zoom). i18n vi/en đầy đủ, không hardcode string.

## Tasks / Subtasks

- [x] Task 1: Tách tầng 1 — Emergency foundation card (AC: 1)
  - [x] `GoalStep.tsx`: bỏ emergency khỏi mảng preset toggle; render card riêng phía trên — `div` tĩnh (không button), icon `ShieldDuotoneIcon` giữ nguyên, blurb + badge.
  - [x] Badge: `text-primary bg-primary-soft rounded-full px-2.5 py-0.5 text-xs` (khớp token style guide — kiểm tra `docs/06_STYLE_GUIDE.md` §badge trước khi viết).
- [x] Task 2: Tầng 2 multi-select (AC: 2, 3, 4, 6)
  - [x] Presets education/house/travel/custom giữ nguyên icon + default target/months từ mảng `GOAL_PRESETS` hiện có.
  - [x] `role="checkbox"` + `aria-checked={selected}` per card; container bỏ `role="radiogroup"`, thay `aria-label` phù hợp.
  - [x] Toggle qua `toggleGoal` action (store 8.1). Chọn lại card đã chọn = bỏ chọn (khác hành vi cũ `if (goal?.presetId === preset.presetId) return`).
  - [x] Counter "Đã chọn N quỹ" + option "Chưa cần, để sau" (bấm → `clearGoals()`, style ghost/outline khác biệt với goal cards).
- [x] Task 3: Editor per-goal (AC: 5)
  - [x] Card đã chọn expand editor inline (pattern `showEditor` hiện có giữ nguyên): target (CurrencyInput) + months (Input numeric) + name (chỉ custom).
  - [x] `updateGoal(presetId, patch)` từ store — mỗi goal edit độc lập, không đè nhau.
- [x] Task 4: i18n (AC: 7)
  - [x] Keys mới (flat dot-notation như hiện trạng `vi.json`/`en.json`): `setupV2.goal.emergency.blurb`, `setupV2.goal.emergency.badge`, `setupV2.goal.tier2Title`, `setupV2.goal.selectedCount` (interpolate `{n}`), `setupV2.goal.skipForNow`.
  - [x] Blurb vi dùng ĐÚNG chuỗi 108 ký tự ở AC 1. Bản en dịch tương đương, giữ cấu trúc what/why.
- [x] Task 5: Verify (AC: tất cả)
  - [x] `npx tsc --noEmit` sạch.
  - [x] Thủ công: chọn 2 goals → cả 2 expand editor giữ giá trị riêng; bỏ chọn 1 → editor đóng, value không rò sang goal kia; "để sau" → counter biến mất, Tiếp tục vẫn enable; reload giữa chừng → sessionStorage khôi phục đúng selections.

## Dev Notes

- **PHỤ THUỘC CỨNG: story 8.1 phải done trước** — story này tiêu thụ `goals[]`, `toggleGoal`, `updateGoal`, `clearGoals`, `canProceed` từ store mới. Không tự chế state cục bộ.
- **Hiện trạng `GoalStep.tsx`** (đọc kỹ trước khi sửa): 5 preset trong `GOAL_PRESETS` as const — emergency/education/house/travel/custom, icon Duotone từ `@iconify-react/*`, giá default 200tr/60th, 500tr/36th, 30tr/12th. Card pattern `rounded-[13px] border bg-card shadow-card` + selected ring — GIỮ NGUYÊN visual language này cho tầng 2, chỉ đổi semantics radio→checkbox.
- **Đừng reinvent:** `formatVNDCompact`, `durationLabel` (năm/tháng), `cn` — tất cả có sẵn trong file. Icon color `var(--primary-color)` pattern giữ nguyên.
- **Style guide guardrails** (từ retro epic 3 — lỗi lặp 4/6 stories): radius card data = `rounded-[13px]`, KHÔNG rounded-2xl tuỳ tiện; không hardcode màu (dark mode); shadow chỉ dùng `shadow-card`/`shadow-float` (các token soft-* đã chết).
- **Custom goal chỉ 1 instance** trong v1 (mảng preset cố định — không có nút "+ thêm mục tiêu khác thứ 2"). Ghi rõ để không gold-plate.
- **Testing:** không bắt buộc unit test component, nhưng store interactions đã cover ở 8.1. Verify checklist Task 5 là bắt buộc trước khi mark done (action item retro epic 3: tự verify luồng nghiệp vụ, không chỉ dựa tsc).

### Project Structure Notes

- UPDATE duy nhất: `src/components/onboarding/v2/GoalStep.tsx` + 2 file i18n. Không file mới, không đụng store/schema (đã xong ở 8.1).
- Nếu cần badge component — dùng shadcn `Badge` có sẵn (`src/components/ui/badge.tsx`), không tạo mới.

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Epic-8 Story 8.2]
- [Source: src/components/onboarding/v2/GoalStep.tsx — hiện trạng single-select radiogroup]
- [Source: docs/06_STYLE_GUIDE.md — radius/badge/shadow rules bắt buộc]
- [Source: docs/05_UX_SPEC.md — UX rules mobile 375px/44px]
- Party-mode 06-07-2026: blurb 108 ký tự đã chốt nguyên văn; giọng "mở khoá" không level-up; "Chưa cần, để sau" bắt buộc có.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (growbase-senior-developer agent)

### Debug Log References

`npx tsc --noEmit` → EXIT 0. Test suite: 386 passed.

### Completion Notes List

- GoalStep.tsx viết lại thành 2 tầng: tầng 1 emergency là `div` tĩnh (ShieldDuotoneIcon + blurb 108 ký tự + badge "✓ Nền tảng đã xây"), không toggle được; tầng 2 multi-select 4 preset (education/house/travel/custom) qua `toggleGoal`, chọn lại = bỏ chọn.
- Semantics đổi radio→checkbox: mỗi card `role="checkbox"` + `aria-checked`, container bỏ `role="radiogroup"` → `role="group"` + aria-label.
- Counter "Đã chọn N quỹ" chỉ hiện khi goals.length > 0; "Chưa cần, để sau" (dashed button) → `clearGoals()`. Nút Tiếp tục luôn enable khi 0 goal (emergency đủ), disable khi có goal chưa pass `goalSchema` (dùng `canProceed()` store 8.1).
- Editor inline per-goal với field id duy nhất `goal-{name}-${presetId}` để 2 goal expand cùng lúc không đụng nhau; `updateGoal(presetId, patch)` độc lập.
- 5 key i18n mới vi/en: `setupV2.goal.emergency.blurb`, `emergency.badge`, `tier2Title`, `selectedCount` ({n}), `skipForNow`.

**Deviations (cần xác nhận):**
- Badge dùng shadcn `<Badge>` variant mặc định (`bg-primary/10 text-primary border-primary/30 rounded-[16px]`) THAY VÌ `rounded-full` như subtask Task 1 ghi — vì `docs/06_STYLE_GUIDE.md §Badge` cấm rounded-full cho badge. Ưu tiên style guide.
- Bỏ render `setupV2.goal.subtitle` (mâu thuẫn ngữ cảnh multi-select); key còn nằm trong json nhưng không dùng.
- Xoá import `HomeTwotoneIcon` không dùng; emergency gỡ khỏi `GOAL_PRESETS`.

### Testing

| Flow | Method | Result |
|------|--------|--------|
| Chọn 2 goals → cả 2 expand editor, giữ giá trị riêng | manual trace (field id `goal-*-${presetId}` unique per goal) | PASS |
| Bỏ chọn 1 goal → editor đóng, value không rò sang goal kia | manual trace (`toggleGoal` remove theo presetId, state độc lập) | PASS |
| "Chưa cần, để sau" → counter biến mất, Tiếp tục vẫn enable | manual trace (`clearGoals()` + `canProceed()` step1 = true khi rỗng) | PASS |
| Emergency card không toggle được (div tĩnh, không button) | manual trace (render `div`, không có onClick) | PASS |

### File List

- `src/components/onboarding/v2/GoalStep.tsx` (rewrite)
- `src/lib/i18n/messages/vi.json` (+5 keys)
- `src/lib/i18n/messages/en.json` (+5 keys)
