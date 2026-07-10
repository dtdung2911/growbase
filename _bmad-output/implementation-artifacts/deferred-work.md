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

## Deferred from: code review Epic 9 (09-07-2026)

- **[9-1] Timezone skew hint vs amount**: days-in-month hint tính client-timezone, `calculateTodayRemaining` chạy server (UTC) → lệch quanh 00:00-07:00 ICT ngày đầu tháng; `addMonthsIso` client vs server cùng skew (off-by-one-day deadline). Pre-existing pattern.
- **[9-1] Adjust inputs không thể hiển thị rỗng**: clear input → state null → snap về giá trị server, user không thấy adjustment đã revert. UX polish.
- **[9-2] Ops note deploy-order**: nếu deploy code trước `supabase db push` 017 → onboarding trong cửa sổ skew thành công nhưng `funds.icon = NULL` im lặng. Quy trình: push DB trước deploy.
- **[9-2/9-3] A11y icon picker labels**: aria-label đang là raw iconify id ("ph:car-duotone") — cần 11 human-readable label keys × 2 locale, làm cùng đợt a11y tổng.

## Sprint 3 — Vận hành Money Model (từ brainstorm 09-07-2026, chưa tạo epic)

- **Khoá budget tháng hiện tại**: không sửa hạn mức trong tháng; vượt mức → gợi ý đổi hạn mức THÁNG SAU.
- **Reconcile cuối tháng**: đối chiếu kế hoạch vs thực tế → gợi ý chỉnh → nhiều tháng hội tụ mẫu số sát thực.
- **Daily notification**: "hôm nay bạn có thể tiêu X" hướng về mục tiêu — điểm nổi bật app (JTBD).
- **Tối ưu nhập liệu**: trở ngại #1 của mô hình — đơn giản hoá nhập chi tiêu tối đa.
- **Slider tỷ lệ power-user** (trang Funds): chỉnh tỷ trọng bậc thang/70-30 chi tiết hậu onboarding.
- **Nối investment portfolio**: gợi ý kênh lãi kép → cửa ngõ sang module đầu tư (retention loop).
- **Review số GĐ2 70/30 + bậc thang** sau khi có data thực (số sản phẩm tự quyết, chưa có nguồn ngoài).

## Deferred from: code review story 10-1 (10-07-2026)

- Target 1đ auto-complete qua epsilon 1đ (`timelineMonths = 0`, `addMonthsIso(0)` = hôm nay) — theoretical: CurrencyInput integer + Zod `.positive()`; cân nhắc `.int().min(100_000)` cho targetAmount.
- `monthlyIncome` schema thiếu `.max()` + `.int()` — income >1e16 mất precision đồng-level (pre-existing Epic 4).
- `addMonthsIso` dùng server TZ (`new Date()`) thay `todayVN()` — `target_date` lệch 1 ngày window 00:00-07:00 VN khi server UTC (pre-existing class; client-side call không bị).
- Engine `calculateAllocationPlan` không guard income <41k (emergencyTarget floor 100k → 0 → stage state mâu thuẫn) — unreachable qua schema min 100k, chỉ ảnh hưởng caller tương lai truyền raw income.
- `targetMonths` user nhập ở GoalStep bị engine bỏ qua (schema giữ backward-compat) — story 10-2 xử lý theo plan (GoalStep live suggest, bỏ months input).
- Response `plan` + `funds[].monthlyAmount/timelineMonths` server-side chưa consumer nào đọc (TadaStep tự recompute client-side) — story 10-3 tiêu thụ cho storytelling 3 giai đoạn; nếu 10-3 không dùng thì xóa khỏi response.

## Deferred from: code review story 10-2 (10-07-2026)

- Suggest line GoalStep font-mono cả câu thay vì chỉ số — cosmetic; 10.3 làm đúng chuẩn cho text mới.
- Toggle goal off/on mất edits + demote rank xuống cuối (rank invisible, chỉ đổi được bằng toggle) — story 11-1 kéo thả xếp hạng giải quyết.
- Emergency card GoalStep không hiện suggest dù engine dồn GĐ1/GĐ2 cho emergency (timeline goals dài hơn user expect, không giải thích) — 10.3 Tada narrative; cân nhắc bổ sung ở GoalStep nếu chưa đủ.

## Deferred from: code review story 10-3 (10-07-2026)

- TadaPending copy rotation không bao giờ advance (`revealed.length` luôn 0 khi pending) — 3 pending strings unreachable, pre-existing Epic 8/9.
- `stage1EndMonth` GĐ1 với input onboarding luôn = 6 tháng (ceil(81/15), không phụ thuộc income) — số "cá nhân hóa" là hằng số; cân nhắc copy product sau (bản chất model BR-OB-009/010, không phải bug).
- `stage2EndMonth` không consumer ngoài engine/tests sau khi 10.3 ẩn số GĐ2 — story 11-3 màn kế hoạch chi tiết nên tiêu thụ.

## Deferred from: code review story 11-2 (10-07-2026)

- `t().replace` trong TranslationProvider.tsx:46 chỉ thay occurrence đầu của placeholder — an toàn hiện tại (mọi template dùng placeholder 1 lần), fragile nếu tương lai template lặp `{{months}}` 2 lần. Fix: replaceAll hoặc regex global.

## Deferred from: code review story 11-3 (10-07-2026)

- `planGoalChannels` (planDetail.ts) mirror logic `goalCalcs` (GoalStep 11.2) — không drift hiện tại, cả 2 có test; extract chung nếu tier logic thay đổi (cập nhật COMPOUND_RATES_YEAR hằng năm chỉ đổi constant, ít rủi ro).
- PlanDetailSheet card kênh gợi ý có thể không có channel line (compound không cải thiện ≥2 tháng) dưới heading "kênh sinh lời" — cân nhắc ẩn card rỗng.
