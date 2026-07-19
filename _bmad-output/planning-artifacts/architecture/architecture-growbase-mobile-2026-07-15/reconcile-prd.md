---
title: "Reconcile — PRD ↔ Architecture Spine (GrowBase Mobile)"
status: draft
created: 2026-07-15
inputs:
  - prds/prd-growbase-2026-07-15/prd.md
  - prds/prd-growbase-2026-07-15/addendum.md
  - architecture/architecture-growbase-mobile-2026-07-15/ARCHITECTURE-SPINE.md
---

# Reconcile — PRD ↔ Architecture Spine

Mục tiêu: kiểm tra spine (AD-M1..M8 + inherited invariants) có phủ đủ requirement
load-bearing của PRD không. Legend: ✅ covered · 🟡 partial/deferred · ❌ gap · ⚠️ conflict.

## Tổng quan mapping

| Req | Nội dung (rút gọn) | Spine coverage | Trạng thái |
|-----|--------------------|----------------|------------|
| **FG-A** | | | |
| FR-1 | App icon riêng, cài từ store, mở không cần URL | AD-M8 (EAS → App/Play Store); Expo runtime | ✅ (app icon không nêu tường minh nhưng thuộc EAS config) |
| FR-2 | Login email/pw + **đăng ký mới** + **onboarding** (welcome+tour+income step) parity web | AD-M3 chỉ lo login/refresh session. **Không** có AD cho sign-up flow hay onboarding parity | ❌ gap — thiếu quyết định cho registration + onboarding; driver.js tour là web-only, cần mô hình mobile riêng |
| FR-3 | Secure session, Face ID unlock, fallback passcode | AD-M3 (LargeSecureStore + expo-local-authentication + fallback) | ✅ |
| FR-4 | Context householdId + currentMonth; switch household; đổi tháng | AD-M6 (state từ Zustand). Switch household / đổi tháng UX **deferred** → §6 giao bmad-ux | 🟡 state layer covered; cơ chế switch để UX quyết |
| FR-5 | i18n vi/en + light/dark theme, nhất quán web | **Không đề cập trong spine** | ❌ gap |
| **FG-B** | | | |
| FR-6 | Tạo transaction đủ trường như web | AD-M1 (qua /api) + AD-M4 (ghi qua queue) | ✅ |
| FR-7 | Màn nhập tối ưu tốc độ (numpad, recent category, default) | UX-level, không phải quyết định spine | 🟡 hợp lý để UX sở hữu |
| FR-8 | List gần đây + sửa/xóa (của mình, tháng hiện tại) | AD-M1 (đọc/ghi qua /api) | ✅ (ràng buộc "của mình/tháng hiện tại" là API/RLS backend, không đổi) |
| FR-9 | Tôn trọng business rule (atomic RPC, behavior_type readonly) | AD-M1 + inherited A-1, AD-2 | ✅ |
| FR-10 | OCR — ngoài v1 | §6 Deferred (OCR → v2) | ✅ |
| **FG-C** | | | |
| FR-11 | Tổng chi currentMonth | AD-M1 qua /api | ✅ |
| FR-12 | Chi theo category/group + chart (donut, bar) | Stack: react-native-gifted-charts (PRD gợi ý victory-native HOẶC gifted-charts → spine chốt gifted-charts) | ✅ |
| FR-13 | Đối chiếu budget, tín hiệu vượt | AD-M1 qua /api | ✅ |
| **FG-D** | | | |
| FR-14 | Xem danh sách quỹ (5 loại), số dư | AD-M1 qua /api | ✅ |
| FR-15 | Contribute/withdraw — ngoài v1 | §6 Deferred + inherited A-1 | ✅ |
| **FG-E** | | | |
| FR-16 | Xem budget line currentMonth | AD-M1 qua /api | ✅ |
| FR-17 | Tạo/sửa budget, money model — ngoài v1 | §6 Deferred | ✅ |
| **FG-F** | | | |
| FR-18 | Offline create + queue + sync tuần tự | AD-M4 (durable local mutation queue, replay tuần tự) | ✅ |
| FR-19 | Cached read offline + chỉ báo "dữ liệu tính đến {thời điểm}" | AD-M4 (persistQueryClient + MMKV). Chỉ báo staleness timestamp là UX | ✅ data layer; 🟡 indicator để UX |
| FR-20 | Hiển thị trạng thái sync (pending/synced/**error**) mỗi giao dịch | AD-M4 có queue + replay nhưng **không mô hình hóa per-tx status/error surfacing** | 🟡 gap nhẹ — cần định nghĩa trạng thái lỗi/retry expose lên UI |
| **FG-G** | | | |
| FR-21 | Nhắc ghi chép hằng ngày (local) + tap → màn nhập | AD-M7 (expo-notifications local). Deep-link tap→quick-entry ẩn qua Expo Router | ✅ (deep-link không nêu tường minh) |
| FR-22 | Toggle + đặt giờ nhắc trong settings | AD-M7 (trigger {hour,minute,repeats}) | ✅ |
| FR-23 | Push nâng cao — ngoài v1 | AD-M7 + §6 Deferred (remote push → v2) | ✅ |

## NFR mapping

| NFR | Nội dung | Spine coverage | Trạng thái |
|-----|----------|----------------|------------|
| NFR-1 | Performance: chạm→lưu <15s; cold start ≤3s | **Không có AD/budget performance tường minh**. MMKV persist + offline queue giúp "lưu" không chờ network; nhưng cold-start + Face ID + read qua /api chưa được đối chiếu ngân sách | ❌ gap — không có quyết định/verify cho ngưỡng performance |
| NFR-2 | Security: secure store, biometric, RLS, auth-first | AD-M1/M2/M3 + inherited AD-2, AD-6 | ✅ |
| NFR-3 | Data integrity: invariants y hệt web | AD-M1 + inherited A-1, AD-2 (is_system immutable inherited, không restate) | ✅ |
| NFR-4 | Platform iOS+Android, review 2 store (privacy/permission) | AD-M8 (stores) — **compliance review/privacy/permission prompts không đề cập** | 🟡 partial |
| NFR-5 | Reliability/offline idempotent, không trùng | AD-M4 (Idempotency-Key, dedupe backend) | ✅ |
| NFR-6 | Consistency web↔mobile (shared types/schema/rules/keys) | AD-M5 (pnpm workspace + packages/shared) | ✅ |
| NFR-7 | i18n vi/en + light/dark, không hardcode | **Không đề cập trong spine** | ❌ gap (trùng FR-5) |
| NFR-8 | Mobile UX (44px, 16px, safe-area) | UX-level | 🟡 hợp lý để UX |
| NFR-9 | Native feel — north star (nav/scroll/chạm mượt native) | Paradigm chọn RN/Expo (native primitives). Tension ẩn: thin-client-over-/api thêm 1 network hop cho read live so với direct DB — cache-first (AD-M4) giảm nhẹ | 🟡 paradigm phủ; không có AD tường minh về latency perceived |

## ⚠️ Mâu thuẫn load-bearing

### C-1 — Data path: addendum "supabase-js trực tiếp" ↔ spine "/api-only" (ĐẢO NGƯỢC)
- **PRD addendum** (dòng 13): *"data-fetching layer (RN dùng client Supabase JS + TanStack Query cấu hình riêng)"* và (dòng 20): *"mọi query đi qua Supabase với user session"*. → chủ trương RN gọi Supabase **trực tiếp** cho data.
- **Spine** AD-M1 + Boundary invariant: mobile **không bao giờ** gọi Supabase cho data; `supabase-js` chỉ auth. Mọi đọc/ghi qua `/api/*`.
- **Đánh giá:** Lựa chọn của spine hợp lý hơn (tái dùng membership guard AD-6, tránh logic drift, kế thừa security web). NHƯNG đây là đảo ngược trực tiếp so với PRD addendum → **cần đồng bộ ngược addendum + xác nhận với user**.
- **Hệ quả kéo theo:** spine phát sinh **2 backend touch** không có trong PRD:
  - AD-M2: `withAuth()` phải chấp nhận **Bearer token** (web hiện cookie-only).
  - AD-M4: `/api` mutation routes phải **dedupe theo Idempotency-Key**.
  - PRD/brief từng ngụ ý "backend không đổi"; spine §7 Open Questions đã cờ 2 touch này → cần user chốt sẵn sàng sửa web `/api`.

## ❌ Gap cần bổ sung AD (hoặc xác nhận giao UX/tầng khác)

1. **FR-2 registration + onboarding parity** — spine không có quyết định cho sign-up flow và onboarding (welcome + tour + income step). Tour driver.js là web-only; cần mô hình tour mobile (ví dụ overlay/coachmark RN). Load-bearing vì FR-2 nằm trong v1 scope §6.1.
2. **FR-5 / NFR-7 i18n + theme** — hoàn toàn vắng trong spine. Cần AD: nguồn preference (account vs local), thư viện i18n RN, cơ chế theme token chia sẻ hay riêng. Nằm trong v1 scope.
3. **NFR-1 performance budget** — không có quyết định/verify cho <15s và cold-start ≤3s. Là success metric cốt lõi (SM-2) → nên có AD hoặc POC gate.

## 🟡 Gap nhẹ / để tầng khác sở hữu

- **FR-20** per-transaction sync status (đặc biệt trạng thái error/retry) chưa được mô hình hóa expose lên UI — AD-M4 mới nói queue + replay.
- **FR-4** switch household / đổi tháng: cơ chế deferred cho bmad-ux (spine §6) — hợp lệ nhưng cần đảm bảo UX pick up.
- **NFR-4** store-review compliance (privacy manifest, permission prompt notification) chưa nêu — AD-M8 mới ở mức "build tới store".
- **NFR-8/FR-7** UX-level, hợp lý để bmad-ux sở hữu.

## Kết luận
Spine phủ tốt trục **security, offline/sync, shared-code, notification, data boundary** (FG-B/C/D/E/F/G phần data + NFR-2/3/5/6). Các điểm phải xử lý trước khi implementation-ready: **(1) đồng bộ ngược C-1 về PRD addendum** + chốt 2 backend touch; **(2) bổ sung AD cho i18n/theme (FR-5/NFR-7)**; **(3) bổ sung AD/POC cho onboarding parity (FR-2)** và **performance budget (NFR-1/SM-2)**.
