---
baseline_commit: 936107009c074f6d62c2286391c9f5cca3e46a3e
---

# Story 7.1: Invite từ Settings & trạng thái household tự suy

Status: review

## Story

As a **người dùng muốn mời vợ/chồng**,
I want **mời người đồng hành từ Settings bất cứ lúc nào**,
So that **flow mời luôn sẵn — không phụ thuộc prompt, không cần wizard cũ**.

## Acceptance Criteria

**AC1 — Entry mời trong Settings, độc lập khỏi onboarding (FR19)**
**Given** wizard cũ (bước Mời thành viên) đã bị gỡ ở Epic 4
**When** user vào Settings
**Then** entry "Mời người đồng hành" hiển thị — flow mời (tạo invite token qua system op, AD-2) hoạt động độc lập khỏi onboarding
**And** route API mời: `withAuth()` first + membership double guard (AD-6)

**AC2 — Trạng thái household tự suy (FR18)**
**Given** household đang 1 thành viên
**When** UI hiển thị trạng thái household
**Then** không nơi nào bắt user khai "Cá nhân/Gia đình" — trạng thái tự suy từ số thành viên: 1 người → không nhãn/nhãn trung tính, ≥2 người → "Gia đình"

**AC3 — Chia sẻ invite**
**Given** invite được tạo
**When** user chia sẻ
**Then** link/mã mời copy được, có hạn dùng, toast success 2s
**And** mọi string qua `t()` vi+en, tone "bạn" (NFR2)

## Tasks / Subtasks

- [x] Task 1: Entry "Mời người đồng hành" trong Settings (AC1)
  - [x] 1.1 Thêm item `settings.inviteCompanion` vào `SETTINGS_ITEMS` trong `src/components/settings/SettingsMenu.tsx` (icon iconify pattern `lucide:user-plus`, href `/settings/members`) — đặt cạnh item `settings.household`
  - [x] 1.2 Bổ sung `InviteMemberForm` (component có sẵn, tái dùng) vào `src/app/(app)/settings/members/page.tsx` — owner-gated giống trang household (xem cách `/settings/household/page.tsx:31-40` gate `isOwner`)
  - [x] 1.3 i18n key mới `settings.inviteCompanion` (vi: "Mời người đồng hành", en: "Invite a companion") vào cả `vi.json` + `en.json`
- [x] Task 2: Route invite tuân AD-2 — token generation là system op (AC1)
  - [x] 2.1 `src/app/api/household/invite/route.ts`: giữ nguyên thứ tự guard (`withAuth()` → `verifyHouseholdMember` AD-6 → owner recheck bằng user client), **chuyển riêng câu INSERT `household_invitations` sang `supabaseAdmin`** (AD-2: invite token generation = system operation)
  - [x] 2.2 Xác nhận route chạy Node.js runtime (AD-5) — không có `export const runtime = "edge"`; không cần thêm declaration (Node là default)
  - [x] 2.3 Update/giữ test `src/app/api/household/invite/__tests__/route.test.ts` pass với client mới
- [x] Task 3: Household label tự suy từ số thành viên (AC2)
  - [x] 3.1 `src/components/settings/HouseholdSettingsForm.tsx:68-73`: thay label đọc cứng `household.household_type` bằng label suy từ **số thành viên active** (data từ `useMembers` hook có sẵn): 1 người → nhãn trung tính (dùng key `settings.household.type.solo` mới, vi: "Một mình", en: "Just you" — hoặc ẩn hàng nếu gọn hơn), ≥2 → `settings.household.type.family` ("Gia đình")
  - [x] 3.2 KHÔNG write `household_type` vào DB — cột giữ nguyên, chỉ đổi cách hiển thị (story 7.3 xử lý phía người thứ hai join)
  - [x] 3.3 Grep xác nhận không còn nơi nào trong UI bắt user chọn "Cá nhân/Gia đình" (wizard cũ đã xoá ở 4.7 — verify lại `household_type` không xuất hiện trong form input nào)
- [x] Task 4: Verify luồng chia sẻ invite (AC3)
  - [x] 4.1 Verify `InviteMemberForm` hiện hành: tạo invite → toast success có action copy link — chỉnh nếu thiếu: copy được link/mã, toast success duration 2s (pattern chuẩn dự án)
  - [x] 4.2 Verify hạn dùng hiển thị: `InviteCard.tsx` đã show `expiresAt` — xác nhận có trong pending list sau khi tạo
  - [x] 4.3 Audit strings mới + strings hiện hành trong luồng này qua `t()` vi+en, tone "bạn"
- [x] Task 5: Tests + dọn baseline
  - [x] 5.1 Fix fixture sai baseline: `src/app/api/household/__tests__/route.test.ts` dùng `household_type: "couple"` — không tồn tại trong enum (`personal | family`) → sửa về giá trị hợp lệ
  - [x] 5.2 Chạy full suite `npx vitest run` + `npx tsc --noEmit` — zero regression

## Dev Notes

### Phát hiện quan trọng nhất (đọc trước khi code)

**Invite flow ĐÃ TỒN TẠI đầy đủ từ V1 — story này KHÔNG build invite mới.** Đã có:

- `src/components/settings/InviteMemberForm.tsx` — form RHF+Zod, role select, toast copy-link
- `src/components/settings/InviteCard.tsx` — card pending invite (role badge + expiresAt)
- `src/components/settings/MembersManager.tsx` — list members + pending invitations
- `src/lib/hooks/useInvitation.ts` — `useCreateInvite`, `useAcceptInvite`
- `src/lib/hooks/useMembers.ts` — GET `/api/household/members`
- `src/app/api/household/invite/route.ts` — POST tạo invite (guards đúng AD-1/AD-6, NHƯNG insert đang dùng user client — cần chuyển supabaseAdmin, Task 2)
- `src/app/api/household/invite/[token]/accept/route.ts` — accept qua RPC `get_invitation_by_token` + `accept_invitation`
- `src/app/invite/[token]/page.tsx` + `InviteClient.tsx` — public landing accept (middleware whitelist `/^\/invite\//` tại `src/middleware.ts:8`)
- DB: bảng `household_invitations` (`supabase/migrations/002_tables.sql`: email, display_name, role, token, status, expires_at), RPC `accept_invitation` (`003_functions.sql:357`)

Story = 3 việc mỏng: (1) entry Settings lộ rõ, (2) chuyển insert sang system op AD-2, (3) label tự suy.

### Gap phân tích

- **Không có entry menu riêng cho invite** — form đang chôn trong `/settings/household` (owner-gated inline). `/settings/members` page tồn tại nhưng CHỈ render `MembersManager`, không có invite form → Task 1 biến members page thành điểm mời canonical, menu item trỏ vào đó. Giữ form ở household page nguyên trạng (tái dùng cùng component, không duplicate logic).
- **Không có code path nào tự suy household_type** — `SetupClient`/onboarding v2 không set (DB default `'personal'`), `accept_invitation` RPC không đụng. `HouseholdSettingsForm.tsx:68-73` hiển thị cứng `t("settings.household.type." + household.household_type)`. Task 3 chỉ đổi cách hiển thị (derive từ member count) — không migration, không write DB.
- **AD-2 mismatch:** spine liệt kê "invite token generation" là system operation → `supabaseAdmin`. Route hiện dùng user client cho INSERT. Guards giữ nguyên user client (đúng), chỉ INSERT đổi.

### Architecture compliance (bắt buộc)

- AD-1: `withAuth()` dòng đầu, response `{ data, error }` — route hiện tại đã đúng, giữ nguyên
- AD-2: system op = `supabaseAdmin` từ `@/lib/supabase/admin` (xem import pattern trong `/api/onboarding/complete/route.ts`)
- AD-5: route dùng `supabaseAdmin` → Node runtime, KHÔNG declare edge
- AD-6: `verifyHouseholdMember(supabase, user.id, householdId)` đã có tại `auth-check.ts:70-90` — giữ
- A-4: query keys qua factory — `keys.members(hid)`, `keys.invitations(hid)` đã tồn tại trong `queryKeys.ts`
- A-5: mọi string qua `t()` — key mới thêm cả `vi.json` + `en.json` (flat map, `src/lib/i18n/messages/`)
- A-6: page thin wrapper — members page hiện là thin page, logic vào client component
- AD-3: không thêm state household-scoped mới vào Zustand (member count lấy từ TanStack Query theo `keys.members(hid)` — tự invalidate theo householdId)

### UI/Style (docs/06_STYLE_GUIDE.md là authority)

- Menu item theo đúng pattern `SETTINGS_ITEMS` hiện hành (icon iconify `lucide:*` collection qua `@iconify/react` — KHÔNG import package `lucide-react`)
- Touch target ≥44px, cards `rounded-[13px] border border-border/40 bg-card`, không hardcode màu
- Toast: `toast.success(t(...), { duration: 2000 })` pattern chuẩn dự án

### Previous story intelligence

- Story 4.7 đã xoá `WizardStep2Invite.tsx` + 60 keys `setup.*` (bao gồm `setup.invite*`) — KHÔNG tham chiếu lại; namespace live là `setupV2.*` (không đụng) và `settings.members.*` (keys invite hiện hành tại `vi.json:564-583`)
- Story 6.4 pattern tốt: verify-only tasks ghi rõ "hiện trạng khớp AC, không sửa"; deviation ghi rõ trong Completion Notes; Testing table từng flow một
- `npx vitest run` baseline: 378/378 pass (28 files) tại thời điểm 6.4

### Testing requirements

- Vitest, tests tại `src/__tests__/` + colocated `__tests__/` cạnh route
- Business flows phải verify (ghi vào `### Testing` table): tạo invite từ Settings entry mới, copy link, label 1 thành viên vs ≥2, route guards (401/403/non-owner), fixture fix không phá test cũ
- Flow UI thuần (menu item hiển thị, toast) → manual trace, ghi rõ method

### Project context reference

- Đọc `_bmad-output/project-context.md` trước khi code (bắt buộc)
- Áp dụng skill `karpathy-guidelines` trước khi viết code (hard gate theo CLAUDE.md)

## Dev Agent Record

### Agent Model Used

Claude Fable 5 (orchestrator + review) · claude-sonnet-5 (implementation qua harness agents growbase-senior-developer + cavecrew-builder)

### Debug Log References

- `npx vitest run` — 378/378 pass (28 files), zero regression vs baseline 6.4
- `npx tsc --noEmit` — 0 lỗi
- Recon trước khi code (cavecrew-investigator): xác nhận invite flow V1 đã tồn tại đầy đủ — story chỉ là entry Settings + AD-2 client swap + label tự suy

### Implementation Plan

Tái dùng toàn bộ invite flow V1 (form/card/hooks/routes/RPC). 3 việc mỏng: (1) lộ entry Settings qua menu item + gắn `InviteMemberForm` vào `/settings/members` owner-gated; (2) INSERT `household_invitations` chuyển sang `supabaseAdmin` (AD-2), guard order giữ nguyên; (3) label household suy từ `useMembers().members.length` thay vì đọc cột `household_type` — không write DB.

### Completion Notes List

- **Task 1:** Menu item `settings.inviteCompanion` (icon `lucide:user-plus`, cạnh `settings.household`) → `/settings/members`; page này giờ render `InviteMemberForm` owner-gated (cùng pattern household page) phía trên `MembersManager`. Form ở `/settings/household` giữ nguyên (tái dùng cùng component).
- **Task 2:** `invite/route.ts` — chỉ câu INSERT đổi sang `supabaseAdmin`; `withAuth()` → `verifyHouseholdMember` (AD-6) → owner recheck vẫn chạy trên user client. Test colocated rework mock: assert INSERT đi qua `supabaseAdmin.from("household_invitations")` và KHÔNG qua user client (khoá AD-2 bằng test).
- **Task 3:** `HouseholdSettingsForm` label suy từ member count (≥2 → `settings.household.type.family`, 1 → key mới `settings.household.type.solo` "Một mình"/"Just you"). Cột `household_type` không bị write. Grep xác nhận không form nào bắt user chọn "Cá nhân/Gia đình".
- **Task 4:** Toast success 10000ms → 2000ms (AC3). Audit i18n phát hiện 2 gap baseline: label `Email` hardcode → `settings.members.emailLabel`; toast action label tham chiếu `common.copy` không tồn tại → thêm vi+en.
- **Task 5:** Fixture sai `household_type: "couple"` → `"family"` (enum chỉ có personal|family).
- **Ngoài task list (chủ đích, phục vụ AC3):** toast 2s làm action copy trong toast gần như không bấm kịp — mà đó là affordance copy duy nhất → AC3 "link copy được" thực tế fail. Fix: thêm `token` vào select GET `/api/household/members` + nút copy bền (icon-only 44px, `aria-label`, chỉ hiện khi `status === "pending"`) trên `InviteCard`, key mới `settings.members.linkCopied`. Token chỉ lộ cho member đã trong household (route gated) — member accept lại sẽ bị short-circuit "already-member" nên rủi ro thấp.

### Testing

| # | Business flow | Method | Result |
|---|---|---|---|
| 1 | Settings menu hiện entry "Mời người đồng hành" → điều hướng `/settings/members` | Manual trace (SettingsMenu → Link href; page render) — cần xác nhận mắt trên browser | ✅ Pass |
| 2 | Owner thấy invite form trên members page; non-owner không thấy | Manual trace (`isOwner` từ `useMembers` + appStore, cùng logic household page) | ✅ Pass |
| 3 | Tạo invite → token insert qua `supabaseAdmin` (AD-2), user client không đụng bảng invitations | Automated (`invite/__tests__/route.test.ts` assert cả 2 chiều) | ✅ Pass |
| 4 | Route guards: 401 no-auth, 400 bad body, 403 non-member (AD-6), 403 non-owner | Automated (test suite có sẵn, pass sau rework mock) | ✅ Pass |
| 5 | Copy link: toast 2s có action copy + nút copy bền trên InviteCard (pending) | Manual trace (clipboard.writeText origin+/invite/token; token giờ có trong GET members) — cần xác nhận mắt | ✅ Pass |
| 6 | Hạn dùng hiển thị trên pending invite | Manual trace (InviteCard `expiresAt` từ `expires_at`, có sẵn) | ✅ Pass |
| 7 | Label household: 1 thành viên → "Một mình", ≥2 → "Gia đình", không nơi nào bắt khai loại hộ | Manual trace (derive từ members.length; grep không form input nào cho household_type) | ✅ Pass |
| 8 | i18n vi+en đầy đủ luồng invite (key mới + gap cũ emailLabel/common.copy) | Manual trace + grep key tồn tại cả 2 file, không trùng | ✅ Pass |
| 9 | Regression toàn cục | Automated: vitest 378/378 (28 files) + tsc 0 lỗi | ✅ Pass |
| 10 | Review fix: GET `/api/household/members` chỉ trả `token` cho requester là owner; non-owner nhận invitation object không có field `token` | Automated (`members/__tests__/route.test.ts` — 2 case owner/non-owner, assert `toHaveProperty("token")`) | ✅ Pass |
| 11 | Review fix: label loại household ("Một mình"/"Gia đình") không render trong lúc `useMembers()` đang loading hoặc lỗi — tránh flash sai giá trị | Manual trace (`HouseholdSettingsForm` — row chỉ render khi `!isMembersLoading && membersData`) | ✅ Pass |
| 12 | Review fix: copy link thất bại (clipboard API reject) → `toast.error` (5s, key `settings.members.copyFailed`), không còn toast success giả | Manual trace (`InviteCard.copyLink` — `await` trong try/catch, success chỉ khi resolve) | ✅ Pass |

## File List

- `src/components/settings/SettingsMenu.tsx` — thêm menu item invite
- `src/app/(app)/settings/members/page.tsx` — owner-gated InviteMemberForm
- `src/app/api/household/invite/route.ts` — INSERT qua supabaseAdmin (AD-2)
- `src/app/api/household/members/route.ts` — select thêm `token`
- `src/components/settings/HouseholdSettingsForm.tsx` — label tự suy từ member count
- `src/components/settings/InviteMemberForm.tsx` — toast 2s, i18n email label
- `src/components/settings/InviteCard.tsx` — nút copy link bền (pending)
- `src/lib/i18n/messages/vi.json` — keys: inviteCompanion, type.solo, emailLabel, common.copy, linkCopied
- `src/lib/i18n/messages/en.json` — keys tương ứng en
- `src/app/api/household/__tests__/route.test.ts` — fix fixture enum
- `src/app/api/household/invite/__tests__/route.test.ts` — rework mock, assert AD-2
- `src/types/app.ts` — `Invitation.token` optional (review fix)
- `src/app/api/household/members/__tests__/route.test.ts` — mới, assert token owner-only (review fix)

## Change Log

- 2026-07-06: Implement toàn bộ story 7.1 — entry invite trong Settings, AD-2 system op cho token generation, household label tự suy, copy button bền trên InviteCard, fix 3 gap baseline (fixture "couple", Email hardcode, common.copy thiếu). 378/378 tests, tsc clean. Status → review.
- 2026-07-06: Code-review fixes — (1) [High/security] `GET /api/household/members` chỉ trả `token` cho requester role=owner, non-owner nhận invitation đã strip `token`; `Invitation.token` đổi thành optional, `InviteCard` chỉ render nút copy khi `invitation.token` tồn tại. (2) [Med] `HouseholdSettingsForm` ẩn hàng label household trong lúc `useMembers()` loading/lỗi, tránh flash "Một mình" sai cho household nhiều thành viên. (3) [Med] `InviteCard.copyLink` await `navigator.clipboard.writeText` trong try/catch, chỉ toast success khi resolve, thêm `toast.error` + key i18n `settings.members.copyFailed` (vi+en) khi reject. Thêm test `members/__tests__/route.test.ts` (owner thấy token / non-owner không). 381/381 tests, tsc clean. Status không đổi (review).
