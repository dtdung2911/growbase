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

## Living Plan — Could/Won't (từ brainstorm 10-07-2026)

Nguồn: brainstorm-tada-dashboard-continuity-2026-07-10 + sprint-change-proposal-2026-07-10.md. Epic 12/13 lấy Must+Should; các item dưới đây scoped ra ngoài.

- **H — Insight engine ngôn ngữ giai đoạn toàn diện** (Could): kể mọi khoảnh khắc bằng ngôn ngữ GĐ (kể cả first-expense = "viên gạch đầu GĐ1"). Story 13.2 CHỈ làm sự kiện chuyển GĐ (events), chưa phủ toàn diện.
- **J — Permission flag UI đầy đủ** (Could): màn cấu hình quyền sửa kế hoạch per member (owner cấp). Story 12.2 CHỈ check owner trước; non-owner read-only, chưa có UI cấp quyền chi tiết.
- **O — Dòng chuyện 4 bucket ở Budget page** (Could): 1 dòng kể câu chuyện 4 bucket (thay nhà tạm CSP bar) trên trang Budget.
- **N — Chế độ tháng khó** (Won't lần này): gom tin xấu thành 1 câu chuyện + lối thoát. Cần Story 13.2 (drift + sự kiện GĐ) chạy trước để có data tín hiệu.

## Deferred from: code review story 12-1 (10-07-2026)

- Ghost ranks: soft-delete (is_active=false) giữ priority_rank, POST max+1 đếm cả fund chết → gaps — 12.2 rank display không assume contiguous; cân nhắc clear rank khi archive.
- 2 emergency funds có thể tồn tại → living-plan `.find()` chọn arbitrary — chặn tạo emergency thứ 2 hoặc sum balance.
- `monthRange` util parse UTC/format local — pre-existing, chỉ lệch nếu server TZ tây UTC.
- POST max-rank race đồng thời → duplicate rank (hiếm) — dedup tự nhiên ở reorder sheet 12.2.
- Route living-plan chưa có integration test (sort/bucketing/fallback = manual trace).

## Deferred from: code review Epic 13 (11-07-2026)

- `withAuth()` chọn membership joined_at ASC — user đa hộ luôn thấy data hộ đầu tiên bất kể appStore (systemic; cần household context param trong API).
- StageEventCard: cached plan + background refetch error → event consumed nhưng card ẩn (hiếm, per-device).
- Copy BudgetBar/ThreeStageLine ở /welcome — đổi TadaStep keys/logic phải sửa cả 2 chỗ.

- source_spec: `_bmad-output/implementation-artifacts/spec-14-2-scaffold-expo-app.md`
  summary: apps/mobile thiếu `ios.bundleIdentifier` + `android.package` — cần quyết định naming (vd com.growbase.mobile) trước mọi native build/EAS.
  evidence: app.json hiện không có 2 field này; expo prebuild/EAS build sẽ fail hoặc tự sinh giá trị không chủ đích.

- source_spec: `_bmad-output/implementation-artifacts/spec-14-2-scaffold-expo-app.md`
  summary: Root export `@growbase/shared` kéo `@supabase/supabase-js` vào bundle Hermes — mobile cần URL polyfill (react-native-url-polyfill) trước khi import root thay vì subpath (thuộc scope story 14.3).
  evidence: packages/shared/src/index.ts re-export mọi module; supabase-js dùng URL/fetch APIs mà Hermes không có đủ; story này chỉ verify subpath `rules/currency`.

- source_spec: `_bmad-output/implementation-artifacts/spec-14-2-scaffold-expo-app.md`
  summary: Mobile app đang dùng nguyên bộ nhận diện template Expo (icon expo.icon, splash #208AEF, adaptiveIcon #E6F4FE, thiếu dark splash variant) — cần thay bằng brand GrowBase (#0084DB) trước release.
  evidence: assets/ và app.json giữ nguyên template; style guide docs/06 có đủ tokens nhưng chưa áp dụng.

- source_spec: `_bmad-output/implementation-artifacts/spec-14-2-scaffold-expo-app.md`
  summary: Exports map của packages/shared (`"./*": "./src/*.ts"`) chỉ cover single-file .ts — subpath tới directory index hoặc file .tsx sẽ fail khi `unstable_enablePackageExports` bật (pre-existing từ 14.1).
  evidence: packages/shared/package.json exports không có pattern `./src/*/index.ts` hay `.tsx`; Metro mobile resolve theo exports map nghiêm ngặt.
- source_spec: `_bmad-output/implementation-artifacts/14-3-api-fetch-client.md`
  summary: API envelope `{ data, error }` không có machine-readable error code — client (mobile lẫn web) buộc phải string-match message tiếng Việt đã localize nếu muốn branch theo loại lỗi.
  evidence: Toàn bộ routes apps/web/src/app/api/**/route.ts trả `error: string` free-text (pattern có trước story 14.3); mobile `ApiError` giờ chỉ mang `status` + `message`, không có field code để phân biệt lỗi validation/business một cách bền vững.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: `idempotency_keys` uniqueness is `(key, user_id)` only, with no route/method or request-body hash — same-user key reuse across two different endpoints (or with a different body) silently replays the wrong cached response.
  evidence: `supabase/migrations/021_idempotency_keys.sql` unique constraint; confirmed by two independent reviewers (adversarial + edge-case) as a real cross-route/body-mismatch gap, mitigated in practice by the mobile client generating a fresh UUID per logical request, but not enforced server-side.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: `idempotency_keys` has no `expires_at`/TTL column and no cleanup job — the table grows unbounded and a given key is unusable forever for that user.
  evidence: migration `021_idempotency_keys.sql` has no expiry column or pruning logic anywhere in the diff.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: No unit tests were added for `withIdempotency()` (cache-hit/miss/reserve-conflict branches) or for the new Bearer branch in `withAuth()`/`withAuthUser()` — the riskiest new logic in this story has no dedicated test coverage.
  evidence: implementation report listed only regression-test pass counts; no new test files for `apps/web/src/lib/api/idempotency.ts` or the bearer path in `auth-check.test.ts`.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: On idempotency cache-insert failure, the code assumes it's always a unique-violation race and silently re-fetches; any other insert failure (RLS denial, connection error) falls through the same path with no logging, so a real failure to apply idempotency guarantees is invisible.
  evidence: `apps/web/src/lib/api/idempotency.ts` insert-error branch has no error-type check or logging.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: If a wrapped route ever returns a non-JSON body (e.g. 204, redirect, stream), `withIdempotency`'s `response.clone().json()` catch silently skips caching with no diagnostic trace.
  evidence: `apps/web/src/lib/api/idempotency.ts` catch block returns the response uncached with no logging; no current route hits this today but it is an unguarded gap for future routes.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: `idempotency_keys.response` stores full response bodies (amounts, account/member IDs for fund/transaction endpoints) verbatim and indefinitely, with no size bound or redaction — a data-retention/PII surface never discussed in scope.
  evidence: migration `021_idempotency_keys.sql` `response jsonb` column, no redaction logic in `withIdempotency()`.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: A wrapped route returning a non-JSON/204/redirect response is never cached (falls into the clone().json() catch), so a client retry with the same key re-executes the mutation for those response types, defeating dedupe for that class of response.
  evidence: `apps/web/src/lib/api/idempotency.ts` — same catch block as above; no current route returns such a response but the gap is unguarded.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: No unit tests for `withIdempotency()` (reserve-before-execute, cache hit, 409-in-flight, 5xx release, exception release) despite it having had a HIGH-severity race bug in review pass 1.
  evidence: `apps/web/src/lib/api/idempotency.ts` has no adjacent `__tests__` file.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: No test coverage for the Bearer-token branch of `resolveAuthContext()` in `auth-check.ts` — the exact code path that had the HIGH-severity RLS-bypass bug in review pass 1.
  evidence: existing `auth-check.test.ts` only covers `verifyHouseholdMember`; no test drives the `Authorization: Bearer` branch.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: The placeholder-release `DELETE` (on 5xx or on `run()` throwing) and the finalize `UPDATE` in `withIdempotency()` don't check for a Supabase error — a failed release/finalize write leaves the row stuck in "pending" with no log signal, causing permanent `409`s for that key with no way to diagnose why.
  evidence: `apps/web/src/lib/api/idempotency.ts`, the `.delete(...)` and `.update(...)` calls don't inspect their returned `error`.
- source_spec: `_bmad-output/implementation-artifacts/spec-14-4-backend-touches.md`
  summary: If the reservation `INSERT` fails for a reason other than a unique-violation (e.g. transient RLS/connection error), `withIdempotency()` fails open and calls `run()` without any lock — a deliberate "don't block legitimate requests on a DB hiccup" tradeoff, but it silently drops dedupe protection for that request with no log signal.
  evidence: `apps/web/src/lib/api/idempotency.ts`, `if (insertError.code !== PG_UNIQUE_VIOLATION) return run()`.

## Deferred from: code review story 15-1 (16-07-2026)

- **[15-1] Session encryption (AES-CTR) không có auth tag/MAC** — `largeSecureStore.ts` dùng `aesjs.ModeOfOperation.ctr` (đúng pattern chính thức Supabase khuyến nghị cho RN), nhưng CTR ciphertext malleable — kẻ tấn công có filesystem/MMKV access có thể bit-flip blob mã hoá mà không bị phát hiện (decrypt vẫn ra JSON hợp lệ nếu flip đúng byte). Khuyến nghị: chuyển sang AES-GCM hoặc thêm HMAC riêng khi có story dedicated cho session hardening. `apps/mobile/src/lib/supabase/largeSecureStore.ts`.
- **[15-1] Chưa có sign-out (logout) trong app** — `clearUser`/token provider đã wire sẵn cho auth-state listener, nhưng chưa có màn hình/nút gọi `supabase.auth.signOut()`. Theo epic-context AD-M9 (cache purge/logout), việc này thuộc story sau (15.x kế tiếp), ngoài scope 15.1 (chỉ login).
- **[15-1] `appStore.currentMonth` tính 1 lần lúc store khởi tạo, không refresh qua ranh giới tháng thật** — field này mới chỉ được thêm theo convention CLAUDE.md, chưa có consumer thực tế trong 15.1. Cần revisit khi có story dùng `currentMonth` cho trang thật (đảm bảo tab mở qua đêm 1 tháng vẫn đúng). `apps/mobile/src/store/appStore.ts`.
- **[15-1] `largeSecureStore.encrypt()` xoay AES key mỗi lần write, không serialize ghi đồng thời** — 2 lệnh `setItem` chạy song song lý thuyết có thể làm lệch cặp key/blob (write sau ghi đè key trước khi write trước kịp lưu blob). Rủi ro thấp vì supabase-js gọi storage tuần tự nội bộ, nhưng nên revisit nếu phát sinh lỗi decrypt lạ. `apps/mobile/src/lib/supabase/largeSecureStore.ts`.
- **[15-1] Thiếu test cho `AuthGate` redirect effect, `useAutoRefresh` AppState handling, `LoginScreen` submit/error UI flow** — chỉ có unit test cho pure logic (`applySession`, `largeSecureStore`). Cần RN component/integration testing lib (chưa có trong `apps/mobile`) để cover các luồng stateful này ở story sau.
- source_spec: `_bmad-output/implementation-artifacts/spec-15-2-faceid-unlock.md`
  summary: Native Face ID permission string (`app.json` `faceIDPermission`) is Vietnamese-only with no English variant, unlike in-app UI copy which is fully i18n'd via `t()`.
  evidence: OS-level `NSFaceIDUsageDescription` strings aren't wired through the app's runtime i18n system; a locale-aware permission string would need per-platform config beyond the scope of this story's `t()` requirement.
- source_spec: `_bmad-output/implementation-artifacts/spec-15-2-faceid-unlock.md`
  summary: No test exercises `useAuthSession`'s `onAuthStateChange` event filtering (SIGNED_IN vs INITIAL_SESSION vs TOKEN_REFRESHED) end-to-end.
  evidence: Only pure-logic (`shouldRelock`) is unit tested; the auth-state-driven lock/unlock transitions are stateful and would need RN hook/integration testing infra not yet present in `apps/mobile` (same gap noted in the 15.1 deferred entry).
- source_spec: `_bmad-output/implementation-artifacts/spec-15-2-faceid-unlock.md`
  summary: If `supabase.auth.signOut()` throws (e.g. network failure) in `UnlockScreen.tsx`'s password-fallback handler, the catch path clears only local store state (`clearUser`/`unlock`) and routes to `/login` — but the persisted Supabase session token in storage is never invalidated. A later cold start can silently restore that session, so the user is gated behind biometrics only instead of the fresh password entry the "logout to password" flow was meant to force.
  evidence: `apps/mobile/src/features/auth/UnlockScreen.tsx` `handlePassword()` catch block calls `clearUser()`/`unlock()` with no local-scope sign-out or storage wipe fallback.
- source_spec: `_bmad-output/implementation-artifacts/spec-15-2-faceid-unlock.md`
  summary: This story adds a new native module (`expo-local-authentication`) but nothing in the spec's Verification section accounts for the fact that a dev-client binary built before this change does not contain the native code — running against a stale dev client will fail to resolve the module until a fresh dev-client build is produced.
  evidence: `apps/mobile/package.json`/`apps/mobile/app.json` add `expo-local-authentication` + `faceIDPermission`; no rebuild step is called out in the spec or story.
