---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-extract-requirements", "step-03-epics-and-stories"]
note: "Mobile initiative — epics numbered 14-18 to avoid collision with web epics 1-13 in shared sprint-status.yaml"
inputDocuments:
  - _bmad-output/specs/spec-growbase-mobile/SPEC.md
  - _bmad-output/planning-artifacts/prds/prd-growbase-2026-07-15/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-growbase-mobile-2026-07-15/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-growbase-mobile-2026-07-15/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-growbase-mobile-2026-07-15/DESIGN.md
---

# GrowBase Mobile - Epic Breakdown

## Overview

Decompose GrowBase Mobile (RN companion, Expo) v1 thành epics + stories. Nguồn: SPEC (8 CAP), PRD (23 FR / 9 NFR), architecture spine (AD-M1..M10 + inherited), UX (DESIGN.md + EXPERIENCE.md). Phạm vi v1 = capture + glance; heavy management ở web.

**Đánh số Epic 14–18** (web đã dùng 1–13) để chung sprint-status.yaml không đụng nhau.

## Requirements Inventory

### Functional Requirements
- FR-1 App icon, cài từ store, mở không cần URL.
- FR-2 Đăng ký + login email/password (Supabase) + onboarding (welcome/tour/income).
- FR-3 Face ID/biometric unlock các lần sau, fallback passcode.
- FR-4 Context householdId + currentMonth; switch household + đổi tháng.
- FR-5 i18n vi/en + light/dark theme.
- FR-6 Tạo giao dịch (fields như web: amount, category, ngày, quỹ/hướng, note).
- FR-7 Màn nhập tối ưu tốc độ (number keypad, category quick-pick, defaults).
- FR-8 List giao dịch gần đây + sửa/xóa (của mình, tháng hiện tại).
- FR-9 Ghi/sửa tôn trọng business rule (fund ops RPC, behavior_type readonly).
- FR-11 Tổng chi currentMonth.
- FR-12 Chi theo category/group + donut/bar chart.
- FR-13 Đối chiếu ngân sách (đã chi/còn lại/% + tín hiệu vượt).
- FR-14 Xem quỹ (5 loại, số dư, trạng thái, nhóm).
- FR-16 Xem budget line (ngân sách/đã chi/còn lại/%/vượt).
- FR-18 Tạo giao dịch offline → queue → sync tuần tự.
- FR-19 Xem dữ liệu cached khi offline + chỉ báo thời điểm.
- FR-20 Sync status per-transaction (pending/synced/error).
- FR-21 Local daily reminder notification; tap → quick-add.
- FR-22 Bật/tắt + đặt giờ nhắc trong settings.

*(Ngoài v1: FR-10 photo/OCR, FR-15 fund ops, FR-17 budget config, FR-23 push nâng cao.)*

### NonFunctional Requirements
- NFR-1 Cold start ≤3s; chạm→lưu <15s end-to-end.
- NFR-2 Security: secure session, biometric, RLS, auth check.
- NFR-3 Data integrity: fund RPC atomic, is_system immutable, behavior_type trigger.
- NFR-4 iOS 15+ / Android; store compliance.
- NFR-5 Offline reliability: không mất dữ liệu, sync idempotent không trùng.
- NFR-6 Consistency web↔mobile qua shared code.
- NFR-7 i18n + theme, no hardcode.
- NFR-8 Touch ≥44px, input ≥16px, safe-area.
- NFR-9 Native feel (không webview).

### Additional Requirements (Architecture spine)
- AD-M1 Client → /api/* only; supabase-js chỉ auth.
- AD-M2 Auth Bearer token. **Backend touch:** withAuth() nhận Bearer.
- AD-M3 LargeSecureStore + biometric gate.
- AD-M4 Offline queue (tx CRUD only) + Idempotency-Key. **Backend touch:** /api dedupe.
- AD-M5 pnpm monorepo, packages/shared (types/Zod/rules/keys.*).
- AD-M6 TanStack Query v5 + Zustand v5, MMKV single storage.
- AD-M7 Local scheduled notification only (no push server).
- AD-M8 Expo EAS build + env base-URL + OTA + crash reporting + version gate.
- AD-M9 Household-scoped cache; purge on switch/logout.
- AD-M10 i18n/theme via shared catalog + t() + tokens.
- Inherited: AD-1 withAuth first + {data,error}; AD-2 admin client system ops; AD-6 membership double-guard; A-1/A-3/A-4/A-7.

### UX Design Requirements
- UX-DR1 IA: bottom nav 4 tab (Home/Transactions/Stats/Menu) + center FAB add-transaction.
- UX-DR2 Quick-add bottom sheet, focus order amount→category→date→fund→save.
- UX-DR3 Transaction row swipe edit/delete + sync chip.
- UX-DR4 State patterns: skeleton/empty/error toast 5s/success toast 2s/offline banner/optimistic add/cached indicator.
- UX-DR5 Biometric unlock screen on cold start.
- UX-DR6 Native onboarding tour (coach-mark, không driver.js) + income step.
- UX-DR7 Switch household với cache purge + chỉ báo.
- UX-DR8 Visual identity kế thừa web tokens (DESIGN.md), amounts mono tabular-nums.
- UX-DR9 A11y: labels cho FAB/chip/icon buttons, reduce-motion, dynamic type.

### FR Coverage Map
| Req | Epic.Story |
|---|---|
| AD-M5, AD-M8, AD-M1 setup | 14.1, 14.2, 14.3 |
| Backend touches (AD-M2, AD-M4) | 14.4 |
| FR-2 (login), FR-3, AD-M3, UX-DR5 | 15.1, 15.2 |
| FR-4, UX-DR7, AD-M9 | 15.3 |
| FR-1, FR-5, NFR-7, AD-M10, UX-DR1 | 15.4 |
| FR-6, FR-7, FR-9, UX-DR2 | 16.1 |
| FR-8, UX-DR3 | 16.2 |
| FR-18, FR-19, FR-20, NFR-5, UX-DR4 | 16.3, 16.4 |
| FR-11, FR-12, FR-13, UX-DR8 | 17.1, 17.2 |
| FR-14 | 17.3 |
| FR-16 | 17.4 |
| FR-21, FR-22, AD-M7 | 18.1 |
| FR-2 (register+onboarding), UX-DR6 | 18.2 |

## Epic List

14. **Foundation & Monorepo** — pnpm workspace, shared package, Expo scaffold, API client, backend touches (enabler).
15. **Auth, Unlock & Shell** — đăng nhập, biometric, context, nav shell, i18n/theme.
16. **Transaction Capture & Offline** — quick-add <15s, CRUD, offline queue + sync.
17. **Glance, Stats, Funds & Budget** — Home glance, thống kê tháng, quỹ, ngân sách.
18. **Notifications & Onboarding** — local daily reminder, native onboarding + income.

---

## Epic 14: Foundation & Monorepo

Dựng nền kỹ thuật để mọi feature build lên: chuyển repo sang pnpm workspace, tạo shared package, scaffold Expo app, API fetch client (Bearer + Idempotency-Key), và 2 backend touch trên web /api. Không có giá trị người dùng trực tiếp nhưng chặn mọi epic sau.

### Story 14.1: Chuyển sang pnpm monorepo + shared package
As a developer,
I want repo là pnpm workspace với packages/shared,
So that web và mobile dùng chung types/Zod/rules/keys.* không duplicate.

**Acceptance Criteria:**

**Given** repo web single-package hiện tại
**When** migrate sang pnpm workspace
**Then** cấu trúc thành `apps/web` (Next.js cũ, chạy như trước) + `packages/shared`
**And** `packages/shared` export TypeScript types, Zod schemas, pure business rules, query-key factory `keys.*`
**And** `apps/web` import từ `@growbase/shared` thay vì path nội bộ, build + test pass như trước.

### Story 14.2: Scaffold Expo app + Metro monorepo config
As a developer,
I want một Expo app (SDK 56) trong `apps/mobile` chạy được trên iOS + Android,
So that có nền để build UI + native features.

**Acceptance Criteria:**

**Given** monorepo đã có
**When** tạo `apps/mobile` với Expo SDK 56 + Expo Router v6 + TypeScript
**Then** app chạy được trên iOS simulator + Android emulator (blank shell)
**And** Metro config bật symlink (`unstable_enableSymlinks` + `unstable_enablePackageExports`), import được `@growbase/shared`, 1 instance react/react-native
**And** cài base deps: TanStack Query v5, Zustand v5, react-native-mmkv.

### Story 14.3: API fetch client (Bearer + Idempotency-Key + env base-URL)
As a developer,
I want một fetch client gọi `/api/*` chuẩn hóa,
So that mọi feature gọi backend nhất quán theo AD-M1/M2/M4.

**Acceptance Criteria:**

**Given** app shell chạy
**When** tạo API client trong `apps/mobile/src/api`
**Then** mọi request gắn `Authorization: Bearer <access_token>` + `app-version` header
**And** mutating request gắn client-generated `Idempotency-Key`
**And** base URL đọc từ env config (dev tunnel / prod domain), không hardcode
**And** parse response chuẩn `{ data, error }` (AD-1).

### Story 14.4: Backend touches trên web /api
As a developer,
I want web `/api` chấp nhận Bearer + dedupe Idempotency-Key,
So that mobile client dùng được backend hiện có mà không phá web.

**Acceptance Criteria:**

**Given** `withAuth()` hiện chỉ đọc cookie session
**When** mở rộng withAuth()
**Then** withAuth() chấp nhận `Authorization: Bearer <token>` bên cạnh cookie, verify qua Supabase, giữ nguyên hành vi web (cookie)
**And** mutation routes dedupe theo `Idempotency-Key` (cùng key → không tạo bản ghi trùng, trả kết quả lần đầu)
**And** AD-6 membership double-guard vẫn áp dụng; regression test web pass.

---

## Epic 15: Auth, Unlock & Shell

Người dùng đăng nhập, mở app bằng Face ID, làm việc trong đúng household + tháng, di chuyển qua nav shell với ngôn ngữ/theme nhất quán. (CAP-1, CAP-8)

### Story 15.1: Đăng nhập email/password + session lưu an toàn
As a người dùng,
I want đăng nhập bằng tài khoản GrowBase,
So that dùng app với dữ liệu gia đình của mình.

**Acceptance Criteria:**

**Given** màn login
**When** nhập email/password đúng
**Then** supabase-js (auth-only) login, lấy access_token
**And** session lưu qua **LargeSecureStore** (AES key trong expo-secure-store + blob mã hóa trong MMKV), KHÔNG raw session trong SecureStore
**And** auto-refresh token bật, start/stop theo AppState
**And** login sai → giữ form + toast.error 5s.

### Story 15.2: Face ID unlock (cold start + resume)
As a người dùng,
I want mở app bằng Face ID,
So that không phải gõ mật khẩu mỗi lần.

**Acceptance Criteria:**

**Given** đã đăng nhập trước đó, có session trong LargeSecureStore
**When** cold start hoặc resume sau timeout
**Then** hiện biometric unlock screen, Face ID/fingerprint pass → giải mã session → vào app
**And** biometric fail → fallback passcode/password
**And** cold start → màn nhập ≤ 3s (NFR-1).

### Story 15.3: Household + month context + switch (cache purge)
As a người dùng thuộc nhiều household,
I want chọn household + tháng đang xem,
So that thấy đúng dữ liệu.

**Acceptance Criteria:**

**Given** user có ≥1 household
**When** app load
**Then** householdId + currentMonth lấy từ Zustand store (A-7), default household gần nhất + tháng hiện tại
**And** switch household → **purge + invalidate persisted cache** (AD-M9) trước khi load mới, có chỉ báo đang đổi
**And** logout → clear toàn bộ cache + session.

### Story 15.4: Nav shell + i18n + theme
As a người dùng,
I want bottom nav + FAB và giao diện quen thuộc,
So that dùng app dễ và nhất quán với web.

**Acceptance Criteria:**

**Given** đã unlock
**When** vào app
**Then** bottom nav 4 tab (Home/Transactions/Stats/Menu) + center FAB "+" (UX-DR1)
**And** app icon riêng, mở không cần URL (FR-1)
**And** i18n vi (default) + en, mọi chuỗi qua `t()` (A-5, no hardcode)
**And** light/dark theo OS + toggle trong Settings, dùng DESIGN.md tokens (no hardcode màu)
**And** touch ≥44px, input font ≥16px, safe-area (NFR-8).

---

## Epic 16: Transaction Capture & Offline

Trái tim sản phẩm: nhập giao dịch <15s, sửa/xóa, hoạt động offline không mất/không trùng. (CAP-2, CAP-6)

### Story 16.1: Quick-add giao dịch (<15s)
As a Dũng đứng ở siêu thị,
I want ghi một khoản chi trong vài giây,
So that không phải nhớ để tối về nhập.

**Acceptance Criteria:**

**Given** đã unlock, ở bất kỳ tab
**When** chạm FAB "+"
**Then** mở bottom sheet quick-add; number keypad bật sẵn cho amount
**And** focus order amount → category quick-pick (recent/thường dùng đầu) → ngày (default hôm nay) → quỹ (default) → Lưu (UX-DR2)
**And** lưu → toast.success 2s + về context trước, số liệu cập nhật
**And** ghi tôn trọng business rule qua /api (fund ops RPC, behavior_type readonly — FR-9)
**And** đo được chạm→lưu <15s (NFR-1/SM-2).

### Story 16.2: List + sửa/xóa giao dịch
As a người dùng,
I want xem và sửa/xóa giao dịch gần đây,
So that chỉnh sai sót nhanh.

**Acceptance Criteria:**

**Given** tab Transactions
**When** xem list
**Then** hiện giao dịch gần đây (mono amount tabular-nums)
**And** swipe row → Sửa / Xóa (giao dịch của mình, tháng hiện tại — FR-8)
**And** sửa/xóa qua /api, cập nhật cache; skeleton khi load, empty state khi trống.

### Story 16.3: Offline queue + idempotent sync
As a người dùng ở nơi mất sóng,
I want ghi giao dịch vẫn lưu và tự sync,
So that không mất dữ liệu, không trùng.

**Acceptance Criteria:**

**Given** offline
**When** tạo giao dịch
**Then** lưu vào durable local mutation queue (MMKV), hiện optimistic với chip `pending`, banner offline
**And** khi online → replay tuần tự với Idempotency-Key → không tạo bản ghi trùng dù retry (NFR-5)
**And** 4xx conflict → surface + drop khỏi queue; 5xx/network → retry backoff
**And** chỉ queue tx CRUD (không fund ops — AD-M4 eligibility).

### Story 16.4: Sync status + cached read
As a người dùng,
I want biết trạng thái sync và xem được dữ liệu khi offline,
So that tin tưởng dữ liệu.

**Acceptance Criteria:**

**Given** có giao dịch pending/synced/error
**When** xem list/Home
**Then** mỗi giao dịch có sync chip đúng trạng thái (pending/synced/error), error có retry
**And** offline → đọc từ persisted TanStack Query cache, chỉ báo "Số liệu tính đến {time}" (FR-19)
**And** cache phân vùng theo householdId (AD-M9).

---

## Epic 17: Glance, Stats, Funds & Budget

Tra cứu nhanh khi di động: liếc số dư, thống kê tháng, quỹ, ngân sách. (CAP-3, CAP-4, CAP-5)

### Story 17.1: Home glance
As a người dùng,
I want mở app thấy ngay tình hình hôm nay/tháng này,
So that nắm nhanh không cần đào.

**Acceptance Criteria:**

**Given** tab Home
**When** load
**Then** hiện "hôm nay tiêu được bao nhiêu" (nếu áp dụng), tổng chi tháng vs budget, giao dịch gần đây, offline/sync banner nếu có
**And** amounts mono tabular-nums; skeleton khi load; pull-to-refresh.

### Story 17.2: Thống kê chi tiêu tháng (chart + budget compare)
As a vợ Dũng,
I want liếc chi tiêu tháng theo category và so ngân sách,
So that biết chỗ nào vượt.

**Acceptance Criteria:**

**Given** tab Stats
**When** xem currentMonth
**Then** tổng chi tháng (FR-11) + chi theo category/group dạng list + tỉ trọng + **donut + bar** (gifted-charts, FR-12)
**And** đối chiếu budget line: đã chi/còn lại/%/tín hiệu vượt màu semantic (FR-13)
**And** dữ liệu qua /api, cache theo household.

### Story 17.3: Xem quỹ (funds)
As a người dùng,
I want xem số dư các quỹ,
So that biết tình hình tiết kiệm/mục tiêu.

**Acceptance Criteria:**

**Given** Menu → Funds
**When** xem
**Then** list 5 loại quỹ (emergency/sinking/goal/investment/freedom) với số dư + trạng thái, nhóm theo loại (FR-14)
**And** view-only — không contribute/withdraw (web-only v1).

### Story 17.4: Xem ngân sách (budget)
As a người dùng,
I want xem ngân sách còn lại,
So that biết còn tiêu được bao nhiêu.

**Acceptance Criteria:**

**Given** Menu → Budget
**When** xem currentMonth
**Then** list budget line: ngân sách/đã chi/còn lại/%/tín hiệu vượt (FR-16)
**And** view-only — không tạo/sửa budget (web-only).

---

## Epic 18: Notifications & Onboarding

Tạo thói quen (nhắc daily) + đưa người mới vào app mượt. (CAP-7, CAP-1 onboarding)

### Story 18.1: Local daily reminder
As a người dùng,
I want được nhắc ghi chép cuối ngày,
So that duy trì thói quen daily.

**Acceptance Criteria:**

**Given** đã cấp quyền notification
**When** tới giờ nhắc mà hôm nay chưa ghi giao dịch nào
**Then** local scheduled notification (`expo-notifications`, trigger `{hour,minute,repeats:true}` + Android channel) — không cần push server (AD-M7)
**And** tap notification → mở thẳng quick-add (deep link, FR-21)
**And** Settings cho bật/tắt + đặt giờ (FR-22); permission prompt sau onboarding.

### Story 18.2: Đăng ký + onboarding native
As a người dùng mới,
I want tạo tài khoản và được hướng dẫn nhanh,
So that bắt đầu dùng ngay.

**Acceptance Criteria:**

**Given** chưa có tài khoản
**When** đăng ký trên mobile
**Then** tạo tài khoản qua Supabase Auth (FR-2)
**And** onboarding: welcome screen → **native tour** (coach-mark từng tab, KHÔNG driver.js — UX-DR6) → bước nhập thu nhập cố định (income step, logic dùng chung `packages/shared`)
**And** hoàn tất → vào Home; mọi chuỗi qua `t()`.

---

## Notes
- Thứ tự build: Epic 14 (nền) → 15 → 16 (core value) → 17 → 18. Story 14.4 (backend touches) chặn Epic 15+.
- Ngoài v1 (không có story): photo/OCR, fund contribute/withdraw, budget/money-model config, đóng sổ, report chuyên sâu, push nâng cao.
- Open: ngưỡng success metric, migrate-repo confirm, env dev base-URL — theo dõi ở SPEC open_questions.
