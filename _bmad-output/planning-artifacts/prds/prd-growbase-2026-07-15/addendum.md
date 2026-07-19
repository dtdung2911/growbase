# Addendum — PRD GrowBase Mobile

Chi tiết kỹ thuật và độ sâu cho bước architecture. Không thuộc PRD chính (PRD nói *cái gì*, addendum gợi ý *thế nào*).

## Kiến trúc 2-codebase (web Next.js + mobile RN)

- **Vấn đề:** RN companion = codebase thứ hai. Rủi ro drift với web ở logic chung.
- **Hướng giảm drift:** tách package dùng chung (monorepo hoặc shared lib):
  - TypeScript types (transaction, fund, budget, household…)
  - Zod schemas (validation)
  - Business rules thuần (tính toán không phụ thuộc DOM)
  - Query key factory (`keys.ts`)
- **Không chia sẻ:** UI components (web dùng shadcn/Tailwind, mobile cần RN primitives riêng).

> **⚠️ Đã chỉnh theo architecture spine (2026-07-15):** RN **KHÔNG** gọi Supabase trực tiếp cho data. Mobile là client layer sau `/api/*` của web — vì fund ops cần `supabaseAdmin` server-side + boundary rule cấm client đụng Supabase thẳng. supabase-js trên RN **chỉ dùng cho auth**. Xem `architecture-growbase-mobile-2026-07-15/ARCHITECTURE-SPINE.md` (AD-M1).

## Auth trong RN

- supabase-js **chỉ cho auth** (login, auto-refresh, lấy `access_token`) — không dùng cho data.
- Data: mọi call qua `/api/*` với header `Authorization: Bearer <access_token>`.
- Session at rest: **LargeSecureStore** (khóa AES-256 trong expo-secure-store + session mã hóa trong MMKV) — không để raw session trong SecureStore (>2048B fail).
- Face ID/biometric gate khi mở app, fallback passcode.
- **2 backend touch** (chưa có trong PRD chính, cần sửa web `/api`): (1) `withAuth()` chấp nhận Bearer token; (2) mutation routes dedupe theo `Idempotency-Key`.

## Offline & Sync

- Local queue cho giao dịch tạo khi offline (append-only).
- Sync tuần tự khi online; **idempotent** (client-generated id / dedupe key) để retry không tạo trùng — hỗ trợ NFR-5, SM-C1.
- Cached read: lưu snapshot dữ liệu tháng gần nhất để xem offline (FR-19); TanStack Query persist cache là phương án ứng viên.
- Giữ đơn giản v1: không two-way merge phức tạp; chi tiêu là append-only nên conflict thấp.

## Business-rule bất biến phải giữ trên mobile

- Fund ops = atomic RPC only (không tự cộng trừ số dư ở client).
- `behavior_type` = DB trigger, readonly UI.
- `is_system=true` immutable.
- Auth check trước mọi thao tác.

## POC ưu tiên trước architecture

1. Supabase auth + secure session + Face ID unlock trong RN.
2. Offline queue + idempotent sync cho create transaction.
3. Shared package (types/schemas/rules) build được cho cả Next.js và RN.

## Rejected / Deferred (từ brief)

- RN full parity, PWA, Capacitor — đã cân nhắc, loại. Chi tiết matrix ở `briefs/brief-growbase-2026-07-15/addendum.md`.
- Photo attach + OCR: phase sau.
- Commercialization (target/pricing): hoãn.
