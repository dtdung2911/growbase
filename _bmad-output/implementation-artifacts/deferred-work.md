# Deferred Work

## Deferred from: code review of story-3.6 (2026-07-02)

- ~~`docs/06_STYLE_GUIDE.md` adds "NO: shadow-panel" while `globals.css:407-408` still references `.shadow-panel`~~ — **RESOLVED 02-07-2026**: audited all real call sites (`grep -rn "shadow-panel\b" src/components src/app`) — 4 usages, all on popover/dropdown-menu/select content (floating overlay UI with full-opacity border, not the Cards pattern). This matches the rewritten `docs/06_STYLE_GUIDE.md` §2 exactly ("Popovers/dropdowns: dùng shadow-panel hoặc shadow-card"). The old blanket "NO: shadow-panel" was scoped wrong — it only meant "don't use shadow-panel on a bordered data/stat card", not "never use shadow-panel anywhere". Rewritten guide's Cards NO list now says `shadow-panel cho card có border` instead of a blanket ban. No code changes needed; animation selector (`.shadow-panel, .shadow-card, .shadow-soft-xs { animation: card-enter }`) is intentional and unrelated to the shadow value itself.
- ~~`CLAUDE.md`/`docs/06_STYLE_GUIDE.md` describe UI details not present in the reviewed diff's code hunks~~ — **RESOLVED 02-07-2026**: verified directly against live code, all 5 items exist and match: `sidebar-nav-link[data-active="true"]` (globals.css:308,342,374), `header-custom::before` notch, `card-enter` 400ms animation, `--sidebar-width`/`--topbar-height` vars — all present. Badge variant table needed a small correction (found during this audit, already fixed in `docs/06_STYLE_GUIDE.md` §5): real `badge.tsx` also has an `outline` variant (missing from docs) and `destructive` (alias of `error`); `secondary` variant uses `bg-secondary text-secondary-foreground` not `bg-muted text-muted-foreground` as previously documented (same HSL value today, but wrong class name); padding is `px-2.5 py-0.5` not `px-2 py-1`. Docs now match code.
- ~~Story 3.6 AC4 describes TopHeader as `rounded-2xl` float style, but `CLAUDE.md`/style guide (edited in the reviewed diff) redefine it as flat/flush~~ — **RESOLVED 02-07-2026**: verified `src/components/layout/TopHeader.tsx` directly, no `rounded-2xl` on desktop, only `shadow-soft-xs lg:border-b ... header-custom`. Code matches the flush/flat spec in `docs/06_STYLE_GUIDE.md`. AC4 docs were correctly caught up to shipped code; no action needed.

## Deferred from: code review of story-4.1 (03-07-2026)

- `scripts/reset-test-data.ts` — fail giữa chừng (bước N/22 delete) để DB nửa vời không kèm hướng dẫn. Delete vốn idempotent, chạy lại là hoàn tất, nhưng script không nói. Fix nhỏ: catch trong `main()` in thêm "Chạy lại script để hoàn tất — delete là idempotent." Ưu tiên thấp, gộp khi có dịp đụng script này (story 4.4+ nếu cần re-seed).

## Deferred from: code review of story 7-2 + 7-3 (09-07-2026)

- **[7-2] Đổi household cùng ngày làm mất/gắn sai ngày hoạt động** — `member_activity` PK `(user_id, active_date)` không chứa household_id, heartbeat `ignoreDuplicates: true` → heartbeat thứ 2 trong ngày ở household mới là no-op, row giữ `household_id` cũ vĩnh viễn; ngày đó invisible với household mới qua RLS. Edge hiếm (user rời A join B cùng ngày VN). `src/app/api/activity/heartbeat/route.ts:9-18`, `supabase/migrations/014_member_activity.sql`.
- **[7-3] POST /api/income-sources không validate `member_id` thuộc household** — pre-existing: `createIncomeSourceSchema` chỉ check UUID shape, FK trỏ `household_members(id)` global → member id household khác / member inactive được lưu không lỗi, UUID không tồn tại trả 500 thay vì 400. UI mới chỉ offer member hợp lệ nên chỉ exploit qua API trực tiếp. Fix gợi ý: verify `member_id` thuộc `auth.householdId` và `is_active=true` trong route. `src/app/api/income-sources/route.ts:41-48`.

## Deferred from: code review vòng 2 — Epic 7 + Epic 8 (09-07-2026)

- **[7-2] Tab sống qua nửa đêm VN không re-record ngày mới** — `useRecordActivity` effect deps `[householdId, userId]`, fire 1 lần mỗi mount; không interval/visibilitychange. Undercount `activeDaysLast7` cho tab luôn mở. `src/lib/hooks/useRecordActivity.ts:33-37`.
- **[7-2] Heartbeat không rate-limit + response `recorded: true` vô điều kiện; tests chỉ assert mock** — thiếu case householdId null. `src/app/api/activity/heartbeat/route.ts`.
- **[7-2] `member_activity` không có UPDATE/DELETE policy + `created_at`** — rows bất biến, user không purge được activity trail (privacy). `supabase/migrations/014_member_activity.sql`.
- **[7-3] Edit form không hiển thị orphan assignment** — Select value = uuid mồ côi render placeholder nhưng submit giữ orphan id; list badge nói "Thành viên cũ", form nói "chưa gán". `src/components/settings/IncomeSourceForm.tsx:143-158`.
- **[8-1] Công thức aggregate feasibility duplicate 2 chỗ với epsilon `+1` magic** — route + TadaStep, không share `calculateFeasibility`. Refactor thành helper chung. `src/app/api/onboarding/complete/route.ts:400`, `src/components/onboarding/v2/TadaStep.tsx:142`.
- **[8-2] Goal names đóng băng theo locale lúc toggle** — `t()` capture vào store + sessionStorage persist; đổi ngôn ngữ giữa onboarding → fund name locale cũ. Gắn với decision vi-only. `src/components/onboarding/v2/GoalStep.tsx`.
- **[8-2] Custom goal bỏ trống fields → Next disabled không inline message** — UX polish. `src/components/onboarding/v2/GoalStep.tsx`.
- **[8-3] Mutation cache flash giữa 2 user cùng tab** — `resetOnboarding` không clear MutationCache; logout flow cần clear queryClient. `src/components/onboarding/v2/TadaStep.tsx:57-63`.
- **[8-3] BUDGET_SEGMENTS không normalize/assert tổng 100%** — costTypeGroup ngoài nhóm liệt kê bị drop im lặng. `src/components/onboarding/v2/TadaStep.tsx`.
