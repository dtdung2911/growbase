---
title: "SPEC — GrowBase Mobile"
slug: growbase-mobile
status: final
created: 2026-07-15
updated: 2026-07-15
companions:
  - glossary.md
  - ../../planning-artifacts/architecture/architecture-growbase-mobile-2026-07-15/ARCHITECTURE-SPINE.md
sources:
  - ../../planning-artifacts/prds/prd-growbase-2026-07-15/prd.md
  - ../../planning-artifacts/prds/prd-growbase-2026-07-15/addendum.md
---

# SPEC — GrowBase Mobile

## Why

Web GrowBase mạnh ở quản lý/phân tích nhưng yếu ở *ghi nhận tức thời*: người dùng khó ghi chi tiêu ngay lúc phát sinh (nhớ domain, mở browser, đăng nhập, gõ nhiều) → hoãn → quên → dữ liệu tài chính thiếu, kéo mọi phân tích phía sau mất giá trị. Mobile companion (React Native) xóa ma sát đó: mở từ icon, Face ID, nhập vài giây kể cả offline, nhắc ghi chép. v1 (3 tháng) validate giả thuyết "companion không ma sát giữ chân ghi chép hằng ngày" → bàn đạp thương mại hóa.

## Capabilities

- **CAP-1 — Auth & shell.**
  - *Intent:* Người dùng đăng ký/đăng nhập trên mobile, mở app bằng Face ID, làm việc trong context household + tháng hiện tại.
  - *Success:* Đăng nhập lần đầu bằng email/password; các lần sau mở khóa bằng biometric không nhập lại; switch được household (nếu >1) và đổi tháng; onboarding chạy được cho tài khoản mới.

- **CAP-2 — Nhập giao dịch.**
  - *Intent:* Tạo/sửa/xóa giao dịch nhanh nhất có thể trên mobile (fields như web).
  - *Success:* Lưu 1 giao dịch mới với số lần chạm tối thiểu; sửa/xóa được giao dịch của mình trong tháng hiện tại; ghi tôn trọng business rule (fund ops qua RPC, `behavior_type` readonly).

- **CAP-3 — Thống kê chi tiêu tháng.**
  - *Intent:* Liếc nhanh tình hình chi tiêu tháng.
  - *Success:* Xem tổng chi tháng, chi theo category/group (list + tỉ trọng + donut/bar chart), và đối chiếu ngân sách (đã chi/còn lại/% + tín hiệu vượt) cho `currentMonth`.

- **CAP-4 — Xem quỹ (funds).**
  - *Intent:* Nắm số dư/trạng thái các quỹ khi di chuyển.
  - *Success:* Xem danh sách 5 loại quỹ với số dư + trạng thái, nhóm theo loại. Không thao tác contribute/withdraw (web-only v1).

- **CAP-5 — Xem ngân sách (budget).**
  - *Intent:* Biết còn bao nhiêu ngân sách.
  - *Success:* Xem budget line của `currentMonth`: ngân sách, đã chi, còn lại, %, tín hiệu vượt. Không tạo/sửa budget (web-only).

- **CAP-6 — Offline entry + sync.**
  - *Intent:* Nhập giao dịch kể cả khi mất mạng, không mất dữ liệu, không trùng.
  - *Success:* Tạo giao dịch offline → vào queue local → sync tuần tự khi online; mỗi call mang Idempotency-Key nên replay không tạo bản ghi trùng; mỗi giao dịch hiển thị sync status (pending/synced/error); xem được dữ liệu cached khi offline với chỉ báo thời điểm.

- **CAP-7 — Nhắc ghi chép hằng ngày.**
  - *Intent:* Tạo thói quen ghi chép daily.
  - *Success:* Local scheduled notification cuối ngày (bật/tắt + đặt giờ được); chạm → mở thẳng màn nhập nhanh. Không cần push server.

- **CAP-8 — i18n & theme.**
  - *Intent:* Trải nghiệm nhất quán với web về ngôn ngữ và giao diện.
  - *Success:* vi (mặc định) + en; light/dark; mọi chuỗi qua `t()`, không hardcode chuỗi/màu.

## Constraints

- **Client → `/api/*` only.** Mobile không gọi Supabase trực tiếp cho data; `supabase-js` chỉ dùng cho auth. (spine AD-M1 + inherited Boundary)
- **Auth Bearer token.** Gắn `Authorization: Bearer <access_token>` mọi call `/api`. ⚠️ *Backend touch:* `withAuth()` phải chấp nhận Bearer (spine AD-M2).
- **Idempotent mutations.** Mọi mutating call mang client-generated Idempotency-Key. ⚠️ *Backend touch:* `/api` mutation routes dedupe theo key (spine AD-M4).
- **Offline queue chỉ non-balance-sensitive** (transaction CRUD). Fund RPC (balance-sensitive, A-1) online-only + ngoài v1.
- **Session at rest = LargeSecureStore** (AES key trong expo-secure-store + session mã hóa trong MMKV); biometric gate mở app (spine AD-M3).
- **Household-scoped cache.** Purge/invalidate persisted cache khi switch household / logout — chống rò rỉ chéo (spine AD-M9).
- **Shared code qua pnpm monorepo** `packages/shared` (types/Zod/rules/`keys.*`); không duplicate logic web↔mobile (spine AD-M5).
- **Performance budget:** cold start → màn nhập ≤ 3s; chạm icon → lưu < 15s end-to-end (PRD NFR-1).
- **Inherited (web spine, binding):** AD-1 `withAuth()` first + response `{data,error}`; AD-6 membership double-guard; AD-2 system ops qua `supabaseAdmin` server-side; A-1 fund mutation atomic RPC; A-3 `is_system` immutable readonly UI; A-4 query keys qua `keys.*`; A-7 `householdId` từ Zustand store.

## Non-goals

- Đính ảnh hóa đơn / screenshot + OCR tự động điền (→ v2).
- Contribute/withdraw quỹ, tạo/sửa budget, money model, đóng sổ tháng, report/phân tích chuyên sâu, living plan (→ giữ web).
- Remote push server (FCM/APNs) + cảnh báo budget/scheduled-due (→ v2).
- Backend thương mại hóa (scaling, pricing, multi-tenant) (→ sau 3 tháng).
- Bất kỳ tính năng tài chính *mới* chưa có trên web.

## Success signal

Sau 3 tháng dùng thật: người dùng + gia đình nhập giao dịch **≥ 5 ngày/tuần qua mobile** (thay vì web); thời gian mở app → lưu 1 giao dịch **< 15 giây**; tỉ lệ giao dịch ghi *trong ngày phát sinh* **≥ 70%**; không có bản ghi trùng do sync và số liệu mobile khớp web. Đạt → mở giai đoạn nghiên cứu thương mại hóa.

## Open questions

- Ngưỡng success metric (≥5 ngày/tuần, <15s, ≥70%) — cần user chốt số chính thức.
- Migrate web repo → pnpm workspace (`apps/web`): xác nhận chấp nhận restructure (import paths, CI).
- 2 backend touch (Bearer, Idempotency-Key): xác nhận sẵn sàng sửa web `/api`.
- Thương mại hóa (target customer, pricing) — hoãn.

## Assumptions

- Nền tảng tối thiểu iOS 15+ / Android tương đương.
- Onboarding tour mobile cần mô hình native riêng (driver.js là web-only) — `bmad-ux` sở hữu.
- Fallback passcode khi Face ID fail.
