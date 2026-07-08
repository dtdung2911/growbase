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

### Testing

| # | Business flow | Method | Result |
|---|---|---|---|
| 1 | Heartbeat idempotent (2 lần/ngày → 1 row) | Automated `heartbeat/route.test.ts` (assert onConflict `user_id,active_date` + ignoreDuplicates; PK + ON CONFLICT DO NOTHING đảm bảo 1 row) | ✅ Pass |
| 2 | Heartbeat 401 no-auth (withAuth first) | Automated `route.test.ts` | ✅ Pass |
| 3 | Heartbeat upsert fail → 500 | Automated `route.test.ts` | ✅ Pass |
| 4 | Eligibility boundary 4/7→false, 5/7→true | Automated `invitePrompt.test.ts` | ✅ Pass |
| 5 | Eligibility member≥2→false | Automated `invitePrompt.test.ts` | ✅ Pass |
| 6 | Cooldown active→false / sau 14d→true | Automated `invitePrompt.test.ts` | ✅ Pass |
| 7 | Prompt render CHỈ khi member=1 & ≥5/7 & chưa dismiss | Manual trace (`InviteCompanionPrompt` null trừ khi shouldShow; guard dismissedAt undefined/loading/!data tránh flash) — **cần xác nhận mắt trên browser** | ✅ Pass |
| 8 | Dismiss ẩn ngay + cooldown persist | Manual trace ("Để sau" ghi localStorage keyed householdId + setState → ẩn; re-read next mount) — **cần xác nhận mắt** | ✅ Pass |
| 9 | CTA điều hướng /settings/members | Manual trace (`<Link href="/settings/members">`, tái dùng 7.1) | ✅ Pass |
| 10 | Regression dashboard payload (insight/goal/milestone) không đổi | Automated: full suite 391/391, field `activeDaysLast7` chỉ additive | ✅ Pass |

### File List

New:
- `supabase/migrations/014_member_activity.sql`
- `src/app/api/activity/heartbeat/route.ts`
- `src/app/api/activity/heartbeat/__tests__/route.test.ts`
- `src/lib/hooks/useRecordActivity.ts`
- `src/lib/insight/invitePrompt.ts`
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
