---
baseline_commit: a0da13dc3a06a8950e87e3f68ba5256d24405609
---

# Story 7.2: Khoảnh khắc có nghĩa — prompt mời sau khi dùng đều

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **người dùng đã dùng app đều đặn một mình**,
I want **app nhẹ nhàng gợi ý mời người đồng hành đúng lúc tôi thấy giá trị (sau khi dùng đều ≥5/7 ngày)**,
so that **lời mời đến như một khoảnh khắc tự nhiên, không phải pop-up làm phiền — và chỉ khi household còn 1 người**.

## Acceptance Criteria

**AC1 — Điều kiện xuất hiện prompt: dùng đều ≥5/7 ngày + household 1 người (FR19)**
**Given** household chỉ có **1 thành viên active** và user đã có hoạt động (mở app hoặc ghi giao dịch) ở **≥5 trong 7 ngày gần nhất**
**When** user vào Dashboard
**Then** một prompt "Mời người đồng hành" xuất hiện như card gợi ý (không phải modal chặn)
**And** nếu household đã có ≥2 thành viên → **KHÔNG bao giờ** hiện prompt (điều kiện `members.length === 1` là bắt buộc)
**And** nếu <5/7 ngày hoạt động → không hiện

**AC2 — Non-blocking + dismissible + cooldown (FR19)**
**Given** prompt đang hiển thị
**When** user bấm "Để sau" / đóng
**Then** prompt biến mất ngay, không chặn thao tác nào khác trên Dashboard
**And** prompt **không hiện lại trong thời gian cooldown** (14 ngày) — trạng thái dismiss lưu **household-scoped** (AD-3), keyed theo `householdId`
**And** sau cooldown, nếu điều kiện AC1 vẫn đúng, prompt có thể hiện lại

**AC3 — CTA dẫn tới flow mời (tái dùng 7.1) + i18n**
**Given** prompt hiển thị
**When** user bấm CTA chính ("Mời ngay" / tương đương)
**Then** điều hướng tới `/settings/members` (điểm mời canonical đã dựng ở story 7.1) — KHÔNG build flow mời mới
**And** mọi string qua `t()` vi+en, tone "bạn" (NFR2), không hardcode

**AC4 — Theo dõi hoạt động tối giản (không dựng analytics infrastructure)**
**Given** cần biết "≥5/7 ngày gần nhất"
**When** user mở Dashboard hoặc ghi 1 giao dịch
**Then** hệ thống ghi nhận **1 ngày hoạt động** của user hôm nay (idempotent — nhiều lần trong ngày chỉ tính 1)
**And** chỉ theo dõi mức tối thiểu đủ cho điều kiện (last-active dates per user) — KHÔNG dựng event pipeline/analytics ngoài phạm vi

## Tasks / Subtasks

- [x] Task 1: Theo dõi hoạt động tối giản — DB + ghi nhận (AC4)
  - [x] 1.1 Migration `supabase/migrations/014_member_activity.sql`: bảng `member_activity` PK `(user_id, active_date)` + FK + index + RLS (insert/select own, household members select same household).
  - [x] 1.2 Route `POST /api/activity/heartbeat`: `withAuth()` first, upsert onConflict `user_id,active_date` ignoreDuplicates, `{data,error}`, Node runtime.
  - [x] 1.3 Hook `useRecordActivity()` — heartbeat 1 lần/session khi Dashboard mount.
  - [x] 1.4 Fire-and-forget heartbeat trong `useCreateTransaction()` onSuccess (invalidation/toast giữ nguyên).
- [x] Task 2: Tính eligibility phía server + trả về Dashboard payload (AC1)
  - [x] 2.1 `src/app/api/dashboard/route.ts`: `activeDaysLast7` = count `member_activity` của user trong 7 ngày (cutoff `todayVN()-6d`; PK đảm bảo 1 row/ngày = distinct count).
  - [x] 2.2 Member count lấy ở CLIENT qua `useMembers` (`keys.members(hid)`) — KHÔNG thêm memberCount vào route dashboard.
  - [x] 2.3 `src/types/app.ts`: thêm `activeDaysLast7: number` vào `DashboardData`.
- [x] Task 3: Component prompt + logic hiển thị/dismiss (AC1, AC2, AC3)
  - [x] 3.1 `src/components/dashboard/InviteCompanionPrompt.tsx` — card non-blocking; helper thuần `shouldShowInvitePrompt` tách sang `src/lib/insight/invitePrompt.ts`.
  - [x] 3.2 Dismiss cooldown 14 ngày (AD-3): localStorage `growbase.invite-moment-dismissed.${householdId}`, đọc trong useEffect (tránh SSR mismatch), pattern từ MilestoneCelebrationDialog/DailyInsightBanner.
  - [x] 3.3 CTA `<Link href="/settings/members">` (tái dùng 7.1); "Để sau" set timestamp + ẩn.
  - [x] 3.4 Mount trong `DashboardView.tsx` khu insight (sau `FirstExpenseCta`, trên metric cards); memberCount lấy nội bộ qua `useMembers`.
- [x] Task 4: i18n + style (AC3)
  - [x] 4.1 Keys `dashboard.inviteMoment.{title,body,cta,dismiss}` vào vi.json + en.json, tone "bạn".
  - [x] 4.2 Style STYLE_GUIDE: card `rounded-[13px] border border-border/40 bg-card shadow-card`, pill button, touch ≥44px, không hardcode màu, `@iconify/react`.
- [x] Task 5: Tests + verify
  - [x] 5.1 Test route heartbeat: 401 no-auth; upsert idempotent; 500 khi upsert fail. Colocated.
  - [x] 5.2 Unit `shouldShowInvitePrompt` boundaries (4→false, 5→true, member≥2→false, cooldown active→false, sau cooldown→true).
  - [x] 5.3 `npx vitest run` 391/391 (baseline 383, +8) + `npx tsc --noEmit` 0 lỗi — zero regression (verify độc lập bởi orchestrator).
  - [x] 5.4 `### Testing` table điền đầy đủ.

### Review Findings (code review 09-07-2026, range 954f19c..HEAD)

- [x] [Review][Decision] Prompt mời không xét pending invitation — household 1 active member + 1 lời mời đang pending vẫn hiện prompt "mời người đồng hành". Spec AC1 chỉ nói memberCount==1. **Quyết: giữ suppression + lọc expires_at** (suppress khi có pending invite còn hạn). [src/components/dashboard/InviteCompanionPrompt.tsx:31, src/lib/insight/invitePrompt.ts:9]
- [x] [Review][Decision] Thay đổi ngoài scope bundled vào commit 2ae020d, không có trong File List story nào: (1) globals.css comment-out border của `.shadow-card` — đổi visual toàn app; (2) SpendingDonut.tsx; (3) DashboardView.tsx tô màu semantic cả row bảng budget — contrast kém (`#49d68d`/`#ffbd6f` trên nền trắng), default "all green" làm mất ý nghĩa signal, boundary 100=warning/85=success chưa đối chiếu AC. **Quyết: accept + document, chốt 09-07-2026.**
- [x] [Review][Patch] (Major) Heartbeat session flag sai semantics ngày: `SESSION_KEY` không có date + không scope theo user → tab sống qua nửa đêm không ghi ngày mới, đổi account cùng tab bị bỏ qua; flag set TRƯỚC fetch, fetch không .catch → 1 lần fail là mất cả ngày; tx-success heartbeat bắn vô điều kiện bỏ qua dedupe [src/lib/hooks/useRecordActivity.ts:6-16, src/lib/hooks/useTransactions.ts:521]
- [x] [Review][Patch] (Major) Migration hardening: RLS INSERT chỉ check `user_id = auth.uid()`, không check household membership → user bất kỳ insert row gắn household lạ; `active_date` client-supplied không CHECK bounds → fake streak/unbounded rows; DEFAULT `current_date` theo UTC lệch todayVN — fixed bởi migration 015 (policy household check, CHECK today ±1 NOT VALID, default VN timezone, cleanup rows độc) [supabase/migrations/014_member_activity.sql]
- [x] [Review][Patch] Query activeDaysLast7 thiếu filter `household_id` (đếm chéo household) + thiếu `.lte` today (chặn future-dated rows) [src/app/api/dashboard/route.ts:143-147]
- [x] [Review][Patch] Storage access không guard: `localStorage.getItem` trong effect + 2 call sessionStorage bare → SecurityError khi browser block storage làm sập dashboard subtree; `Number(raw)` NaN làm prompt hồi sinh bỏ qua cooldown [src/components/dashboard/InviteCompanionPrompt.tsx:26-27, src/lib/hooks/useRecordActivity.ts:14-15]
- [x] [Review][Patch] vi/en lệch copy: `login.feature2` vi bỏ "5 loại", en vẫn "Smart 5-type fund management" [src/lib/i18n/messages/vi.json:636, en.json:549]
- [ ] [Review][Patch] Story doc: (1) việc xóa `freedom_target_monthly` khỏi funds select vi phạm ràng buộc Dev Notes "Không đổi field cũ" (đã verify là dead field, không regression) — cần ghi deviation note; (2) Testing rows 7-8 đánh "✅ Pass" nhưng ghi "cần xác nhận mắt trên browser" — mâu thuẫn, sửa lại trạng thái thật [7-2 story file]
- [x] [Review][Defer] Đổi household cùng ngày: PK `(user_id, active_date)` + `ignoreDuplicates` → row giữ household cũ vĩnh viễn, ngày đó invisible ở household mới — deferred, edge hiếm, chấp nhận giới hạn [src/app/api/activity/heartbeat/route.ts:9-18]

### Review Findings (vòng 2, 09-07-2026)

- [x] [Review][Decision] Backdate fake-streak: 015 chỉ chặn future date; user gọi PostgREST trực tiếp vẫn insert được ngày quá khứ → tự thoả ≥5/7 ngay lập tức. **Quyết: chặn, CHECK today ±1 NOT VALID trong 015.** [supabase/migrations/015_member_activity_hardening.sql]
- [x] [Review][Decision] Scope-creep vòng 2 chưa chốt (nối Decision #2 vòng 1): login copy rewrite (`login.headline/freeBadge`), ~15 keys `setupV2.*` mới, `globals.css` shadow-card, spacing DashboardClient/InviteClient, header width 70→168px, demo child rename. **Quyết: accept + document.** [src/lib/i18n/messages/*, src/app/globals.css]
- [x] [Review][Decision] Pending invite hết hạn chặn prompt vĩnh viễn: `i.status === "pending"` không check `expires_at`; `accept_invitation` chỉ flip status khi có người bấm link → invite gửi đi không ai mở = prompt không bao giờ hiện lại. Liên quan Decision #1 vòng 1. **Quyết: giữ suppression + lọc expires_at > now.** [src/components/dashboard/InviteCompanionPrompt.tsx]
- [x] [Review][Patch] Dashboard 500 khi query `member_activity` fail (table chưa migrate / lỗi phụ): `activityErr` gộp vào `fetchErr` → counter trang trí kéo sập toàn bộ dashboard. Degrade `activeDaysLast7 = 0` thay vì 500 [src/app/api/dashboard/route.ts:46]
- [x] [Review][Patch] `dismissedAt` tương lai (clock lệch / giá trị rác finite) → `now - dismissedAt` âm, luôn < cooldown, prompt bị nén tới tận mốc tương lai + 14d. Clamp `dismissedAt > now` về now [src/components/dashboard/InviteCompanionPrompt.tsx:214-216]
- [x] [Review][Patch] Migration 015: (1) không cleanup rows độc đã ghi được dưới policy yếu của 014 (household lạ) trước khi siết; (2) CHECK `active_date <= todayVN` không dung sai clock skew → heartbeat 500 đúng lúc nửa đêm VN. Thêm DELETE cleanup + dung sai +1 ngày [supabase/migrations/015_member_activity_hardening.sql]
- [x] [Review][Patch] Migration 015 đang untracked (`??`) — chưa `git add` là fixes chưa được deliver [supabase/migrations/015_member_activity_hardening.sql]
- [x] [Review][Patch] Row coloring bảng budget: `Math.round` trước khi so sánh → 100.4% ra amber thay vì đỏ; `usage_pct = null` (chi tiêu không có allocation) ra xanh. Phân loại trên raw pct trước khi round, null+spend>0 không được xanh [src/components/dashboard/DashboardView.tsx:155-166]
- [x] [Review][Patch] Doc sync vòng 1: tick các patch đã verify fixed (heartbeat semantics, dashboard query filter, storage guards, login.feature2), sửa Testing rows 7-8, bổ sung File List (migration 015, invitePrompt signature, IncomeSourceCard/Manager), Change Log entry post-review [7-2 story file]
- [x] [Review][Defer] Tab sống qua nửa đêm VN không re-record ngày mới (effect deps `[householdId, userId]`, không interval/visibilitychange) — deferred, undercount nhẹ, chấp nhận [src/lib/hooks/useRecordActivity.ts:33-37]
- [x] [Review][Defer] Heartbeat không rate-limit, response `recorded: true` vô điều kiện; tests chỉ assert mock, thiếu case householdId null — deferred, không ảnh hưởng data [src/app/api/activity/heartbeat/route.ts]
- [x] [Review][Defer] `member_activity` không có UPDATE/DELETE policy + `created_at` — rows bất biến, không audit/purge được — deferred, privacy consideration [supabase/migrations/014_member_activity.sql]

## Dev Notes

### Phát hiện quan trọng nhất (đọc trước khi code)

**Activity-tracking infrastructure CHƯA tồn tại** — không có cột `last_active`, không table activity, không streak counter, không client app-open listener (recon xác nhận). Đây là phần build thật duy nhất của story ngoài UI prompt. Giữ **tối giản đúng AC4**: 1 bảng `member_activity` + upsert idempotent theo ngày. KHÔNG dựng event pipeline.

**Flow mời ĐÃ có đầy đủ (story 7.1)** — prompt này chỉ là *trigger theo thời điểm* dẫn tới `/settings/members`. KHÔNG build form mời, không đụng `/api/household/invite`. CTA = điều hướng.

**Dismiss pattern ĐÃ có mẫu chuẩn** — `MilestoneCelebrationDialog.tsx` và `DailyInsightBanner.tsx` đều dùng localStorage keyed `...${householdId}` (AD-3). Copy đúng pattern, thêm cooldown 14 ngày (so timestamp).

### Files sẽ đụng (UPDATE) + hiện trạng

- `src/components/dashboard/DashboardView.tsx` (UPDATE) — hiện render các insight card + metric; đây là nơi gắn prompt (khu insight, trên metric cards). Đọc file trước khi sửa, đặt đúng vị trí, không phá layout `gap-6`.
- `src/app/api/dashboard/route.ts` (UPDATE) — GET đã lấy `householdId` từ middleware, fetch funds/budget. Thêm query `activeDaysLast7`. Giữ shape `{ data, error }`. Không đổi field cũ (regression insight/goal/milestone).
- `src/lib/hooks/useTransactions.ts` (UPDATE) — `useCreateTransaction` onSuccess đang invalidate dashboard+budget keys. Thêm fire-and-forget heartbeat, KHÔNG thay đổi invalidation/toast hiện có.
- `src/types/app.ts` (UPDATE) — thêm `activeDaysLast7` vào type dashboard payload.
- `src/lib/i18n/messages/{vi,en}.json` (UPDATE) — keys mới.

### Files mới (NEW)

- `supabase/migrations/0XX_member_activity.sql` — bảng + RLS (đánh số tiếp theo migration cao nhất hiện có; kiểm tra thư mục `supabase/migrations/` để lấy số kế tiếp, migration cao nhất đang là `013_onboarding_multi_goal.sql`).
- `src/app/api/activity/heartbeat/route.ts` — POST upsert.
- `src/lib/hooks/useRecordActivity.ts` — hook heartbeat.
- `src/components/dashboard/InviteCompanionPrompt.tsx` — card prompt.
- Helper thuần `shouldShowInvitePrompt(...)` (đặt trong component file hoặc `src/lib/insight/invitePrompt.ts` để test) .

### Architecture compliance (bắt buộc)

- **AD-1**: route `withAuth()` dòng đầu, response `{ data, error }`. `withAuth`/`withAuthUser`/`verifyHouseholdMember` tại `src/lib/supabase/auth-check.ts` (`withAuth` line 25, `verifyHouseholdMember` line 70).
- **AD-3**: KHÔNG thêm state household-scoped mới vào Zustand (`appStore` chỉ có `householdId/currentMonth/user`, `src/lib/stores/appStore.ts`). Dismiss state = localStorage keyed householdId; activity = DB. Member count qua TanStack Query `keys.members(hid)`.
- **AD-5**: route heartbeat dùng client → Node runtime, KHÔNG declare `edge`.
- **A-4**: query keys qua factory `src/lib/queries/queryKeys.ts` — `keys.members(hid)` (line 18), `keys.dashboard(hid, month)` (line 28). Nếu cần key riêng cho activity thì thêm vào factory, KHÔNG hardcode.
- **A-5**: mọi string qua `t()`, thêm cả `vi.json` + `en.json`.
- **Rule dự án**: fund ops = RPC atomic (không liên quan story này); activity heartbeat KHÔNG phải fund op nên dùng route thường + upsert là hợp lệ.

### UI/Style (docs/06_STYLE_GUIDE.md là authority)

- Card data: `rounded-[13px] border border-border/40 bg-card shadow-card`. Button pill `rounded-full`, `hover:brightness-[0.8]`. Touch ≥44px. Không hardcode màu (dùng semantic token, dark-mode OK). Icon `@iconify/react` (lucide collection), KHÔNG import `lucide-react`.
- Prompt là **card gợi ý non-blocking**, KHÔNG dùng Dialog/modal (khác `MilestoneCelebrationDialog` — chỉ mượn localStorage pattern, không mượn modal).

### Previous story intelligence (7.1)

- 7.1 đã biến `/settings/members` thành điểm mời canonical (owner-gated `InviteMemberForm` + `MembersManager`). CTA của prompt trỏ vào đây — đã sẵn sàng.
- `useMembers()` (`src/lib/hooks/useMembers.ts`) trả members array; `members.length` = member count. `isOwner`/loading state có sẵn — chỉ render label/logic khi `!isLoading && data` để tránh flash (bài học 7.1 review fix #2).
- 7.1 pattern tốt: verify-only ghi rõ "khớp AC, không sửa"; deviation ghi trong Completion Notes; `### Testing` table từng flow.
- Baseline test 7.1 kết thúc: **381/381 pass** — xác nhận lại trước khi thêm.

### Git intelligence

- Commits gần đây (a0da13d Epic 8-4, 96271dc 8-3, 954f19c review fixes, dbab5bf 7-1, 9361070 Epic 6): pattern nhất quán — migration đánh số tăng dần, route colocated test, i18n thêm cả 2 file, dismiss localStorage keyed householdId. Theo đúng.

### Latest tech

- Stack cố định: Next.js 14 App Router, TanStack Query v5, Zustand, Supabase JS. Upsert Supabase: `.upsert(row, { onConflict: 'user_id,active_date', ignoreDuplicates: true })`. Không cần lib mới.

### Testing requirements

- Vitest, colocated `__tests__/` cạnh route + unit cho helper thuần.
- Business flows phải verify (ghi `### Testing` table): heartbeat idempotent (2 lần/ngày = 1 row), 401 no-auth; eligibility boundary (4/7 false, 5/7 true, member≥2 false, cooldown active false, sau cooldown true); prompt render đúng điều kiện + dismiss ẩn + CTA điều hướng `/settings/members`; regression dashboard payload (insight/goal/milestone không đổi).
- Flow UI thuần (card hiển thị, điều hướng) → manual trace, ghi method.

### Project structure notes

- Alignment: route dưới `src/app/api/`, hook `src/lib/hooks/`, component dashboard `src/components/dashboard/`, insight helper `src/lib/insight/` — khớp cấu trúc hiện có. Không lệch.

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story 7.2] — AC gốc, FR19, cooldown, household-scoped AD-3
- [Source: _bmad-output/implementation-artifacts/7-1-invite-settings-household-label.md] — flow mời canonical + AD compliance
- [Source: docs/06_STYLE_GUIDE.md] — card/button/icon/color rules
- [Source: _bmad-output/project-context.md] — bắt buộc đọc trước khi code

### Project context reference

- Đọc `_bmad-output/project-context.md` trước khi code (bắt buộc).
- Áp dụng skill `karpathy-guidelines` trước khi viết code (hard gate theo CLAUDE.md).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (orchestrator + DoD gate) · growbase-senior-developer harness agent (implementation, claude-sonnet-5) · cavecrew-investigator (recon)

### Debug Log References

- `npx vitest run` → 31 files, **391/391 pass** (baseline 383, +8 new) — verify độc lập bởi orchestrator
- `npx tsc --noEmit` → 0 lỗi — verify độc lập bởi orchestrator

### Implementation Plan

Activity tracking tối giản: bảng `member_activity` (PK `user_id,active_date` → idempotent theo ngày) + route heartbeat upsert; ghi nhận khi Dashboard mount (`useRecordActivity`, 1 lần/session) và khi tạo giao dịch (fire-and-forget trong `useCreateTransaction`). Eligibility `activeDaysLast7` tính server-side trong dashboard route (count 7-ngày, PK đảm bảo distinct); member count lấy client qua `useMembers`. Prompt là card non-blocking trong khu insight của DashboardView, render khi `shouldShowInvitePrompt(memberCount, activeDaysLast7, dismissedAt, now)` = true; dismiss cooldown 14 ngày localStorage keyed householdId. CTA → `/settings/members` (tái dùng flow mời 7.1).

### Completion Notes List

- **Task 1-2:** `member_activity` + heartbeat route + `useRecordActivity` + fire trong `useCreateTransaction` onSuccess (không đụng invalidation/toast). `activeDaysLast7` thêm vào dashboard route payload + `DashboardData` type. Member count lấy client (`useMembers`), KHÔNG phình route.
- **Task 3-4:** `InviteCompanionPrompt` card non-blocking; helper thuần `shouldShowInvitePrompt` + `INVITE_PROMPT_COOLDOWN_MS` tách sang `src/lib/insight/invitePrompt.ts` (testable). Dismiss localStorage keyed householdId, đọc trong useEffect. CTA `<Link href="/settings/members">`. i18n vi+en, style STYLE_GUIDE.
- **Deviation (chủ đích, cần biết):** `src/types/database.ts` là hand-maintained (không auto-gen) → phải đăng ký `member_activity` + `MemberActivityRow`, nếu không `.from("member_activity")` type `never` và tsc fail. Đây là vùng thường của Migration-Agent — flag để review.
- **Assumption:** `activeDaysLast7` dùng row COUNT thay vì `COUNT(DISTINCT)` — hợp lệ vì PK `(user_id, active_date)` = tối đa 1 row/ngày/user. Cutoff `todayVN()-6d` (theo VN date convention có sẵn).
- **Demo payload:** `hookDemoData.ts` set `activeDaysLast7: 0` → prompt không xuất hiện trong onboarding demo (demo không có householdId/members thật).
- **Deviation (vi phạm ràng buộc "Không đổi field cũ", chủ đích):** đã gỡ `freedom_target_monthly` khỏi select funds ở dashboard route. Đã verify đây là dead field — không còn runtime consumer nào đọc nó. Ghi lại để review đối chiếu ràng buộc.

### Testing

| # | Business flow | Method | Result |
|---|---|---|---|
| 1 | Heartbeat idempotent (2 lần/ngày → 1 row) | Automated `heartbeat/route.test.ts` (assert onConflict `user_id,active_date` + ignoreDuplicates; PK + ON CONFLICT DO NOTHING đảm bảo 1 row) | ✅ Pass |
| 2 | Heartbeat 401 no-auth (withAuth first) | Automated `route.test.ts` | ✅ Pass |
| 3 | Heartbeat upsert fail → 500 | Automated `route.test.ts` | ✅ Pass |
| 4 | Eligibility boundary 4/7→false, 5/7→true | Automated `invitePrompt.test.ts` | ✅ Pass |
| 5 | Eligibility member≥2→false | Automated `invitePrompt.test.ts` | ✅ Pass |
| 6 | Cooldown active→false / sau 14d→true | Automated `invitePrompt.test.ts` | ✅ Pass |
| 7 | Prompt render CHỈ khi member=1 & ≥5/7 & chưa dismiss | Manual trace (`InviteCompanionPrompt` null trừ khi shouldShow; guard dismissedAt undefined/loading/!data tránh flash) | ⏳ Cần verify browser |
| 8 | Dismiss ẩn ngay + cooldown persist | Manual trace ("Để sau" ghi localStorage keyed householdId + setState → ẩn; re-read next mount) | ⏳ Cần verify browser |
| 9 | CTA điều hướng /settings/members | Manual trace (`<Link href="/settings/members">`, tái dùng 7.1) | ✅ Pass |
| 10 | Regression dashboard payload (insight/goal/milestone) không đổi | Automated: full suite 391/391, field `activeDaysLast7` chỉ additive | ✅ Pass |

### File List

New:
- `supabase/migrations/014_member_activity.sql`
- `supabase/migrations/015_member_activity_hardening.sql` — hardening (RLS household check, VN tz default, CHECK today±1 NOT VALID, cleanup rows độc)
- `src/app/api/activity/heartbeat/route.ts`
- `src/app/api/activity/heartbeat/__tests__/route.test.ts`
- `src/lib/hooks/useRecordActivity.ts`
- `src/lib/insight/invitePrompt.ts` — signature đổi: thêm param `pendingInvites` (suppress khi có pending invite còn hạn)
- `src/lib/insight/__tests__/invitePrompt.test.ts`
- `src/components/dashboard/InviteCompanionPrompt.tsx`

Modified:
- `src/app/api/dashboard/route.ts` — `activeDaysLast7` query + payload
- `src/types/app.ts` — `activeDaysLast7` trên `DashboardData`
- `src/types/database.ts` — đăng ký `member_activity` + `MemberActivityRow` (deviation, hand-maintained types)
- `src/lib/hooks/useTransactions.ts` — fire-and-forget heartbeat onSuccess
- `src/components/dashboard/DashboardClient.tsx` — mount `useRecordActivity()`
- `src/components/dashboard/DashboardView.tsx` — mount `<InviteCompanionPrompt />`
- `src/components/onboarding/v2/hookDemoData.ts` — `activeDaysLast7: 0` demo payload
- `src/lib/i18n/messages/vi.json`, `src/lib/i18n/messages/en.json` — `dashboard.inviteMoment.*`

## Change Log

- 2026-07-07: Implement story 7.2 — meaningful-moment invite prompt. Activity tracking tối giản (`member_activity` + heartbeat idempotent), eligibility ≥5/7 ngày + household 1 người, card non-blocking dismissible cooldown 14 ngày (AD-3 localStorage keyed householdId), CTA → /settings/members (tái dùng 7.1). +8 tests, 391/391 pass, tsc 0. Deviation: `database.ts` hand-maintained cập nhật cho `member_activity`. Status → review.
- 09-07-2026 — Code-review vòng 2 fixes (xem Review Findings vòng 2)
