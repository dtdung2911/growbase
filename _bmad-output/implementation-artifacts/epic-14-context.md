# Epic 14 Context: Foundation & Monorepo

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Dựng nền kỹ thuật cho GrowBase Mobile (companion app React Native/Expo, chung backend với web): chuyển repo sang pnpm workspace với `packages/shared`, scaffold Expo app trong `apps/mobile`, xây API fetch client chuẩn hóa (Bearer + Idempotency-Key + env base-URL), và thực hiện 2 backend touch duy nhất trên web `/api` (chấp nhận Bearer token, dedupe Idempotency-Key). Epic này là enabler — không có giá trị người dùng trực tiếp nhưng chặn toàn bộ Epic 15–18; nó hiện thực hóa nguyên tắc "thin native client over shared API": mobile chỉ trình bày + hàng đợi offline, không chứa business logic riêng, backend/DB/security không đổi.

## Stories

- Story 14.1: Chuyển sang pnpm monorepo + shared package
- Story 14.2: Scaffold Expo app + Metro monorepo config
- Story 14.3: API fetch client (Bearer + Idempotency-Key + env base-URL)
- Story 14.4: Backend touches trên web /api

## Requirements & Constraints

- **Web không được vỡ khi migrate:** sau khi restructure thành `apps/web` + `packages/shared`, web build + test pass như trước; `apps/web` import từ `@growbase/shared` thay path nội bộ. Regression web pass là điều kiện bắt buộc cho backend touches.
- **Consistency web↔mobile:** types, Zod schemas, pure business rules, query-key factory `keys.*` phải shared qua `packages/shared` — không duplicate, tránh drift giữa 2 codebase.
- **Backend touch giới hạn đúng 2 điểm:** (1) `withAuth()` chấp nhận `Authorization: Bearer <token>` bên cạnh cookie session, verify qua Supabase, giữ nguyên hành vi cookie của web; (2) mutation routes dedupe theo `Idempotency-Key` — cùng key thì không tạo bản ghi trùng, trả lại kết quả lần đầu. Không đổi gì khác ở backend/DB.
- **Idempotency là nền của offline reliability:** retry/replay từ mobile không được tạo bản ghi trùng (client tự generate key, server dedupe).
- **Security kế thừa nguyên vẹn:** mọi `/api` route gọi `withAuth()` dòng đầu, response shape `{ data, error }`; household membership double-guard (API route + RLS) vẫn áp dụng cho request từ mobile.
- **Platform:** iOS 15+ / Android tương đương; native feel (không webview). Performance budget: cold start → màn nhập ≤ 3s (foundation phải không phá budget này).
- **Không hardcode API endpoint:** base URL từ env config (dev: tunnel/LAN tới Next.js dev server; prod: domain web đã host).

## Technical Decisions

- **Paradigm — offline-first thin client:** mọi đọc/ghi dữ liệu qua `fetch` tới `/api/*` của web Next.js sẵn có. `supabase-js` trên mobile chỉ dùng cho auth (login, refresh, lấy `access_token`) — tuyệt đối không gọi Supabase trực tiếp cho data.
- **Monorepo:** pnpm workspace, cấu trúc `apps/web` (Next.js cũ) + `apps/mobile` (Expo mới) + `packages/shared`. Turborepo optional, không bắt buộc.
- **Repo shape mobile (seed):** `apps/mobile/app/` (Expo Router screens) + `src/api` (fetch client), `src/auth`, `src/offline`, `src/query`, `src/store` + `metro.config.js`.
- **Stack seed (đúng ở cold-start):** Expo SDK 56 (RN 0.86, React 19.2, CNG managed) · Expo Router v6 (typedRoutes) · TanStack Query v5 · Zustand v5 · react-native-mmkv 3.x · @supabase/supabase-js 2.x (auth only) · build qua Expo EAS.
- **Metro monorepo config:** bật `unstable_enableSymlinks` + `unstable_enablePackageExports` (theo mẫu expo-monorepo-example), đảm bảo import được `@growbase/shared` và chỉ 1 instance react/react-native.
- **API client contract:** mọi request gắn `Authorization: Bearer <access_token>` + header `app-version` (để backend gate min-version sau này); mọi mutating request gắn client-generated `Idempotency-Key`; parse response chuẩn `{ data, error }`.
- **Storage:** MMKV là storage layer duy nhất (dùng chung cho query-cache persist lẫn Zustand persist ở các epic sau) — cài từ epic này cùng TanStack Query v5 + Zustand v5.
- **Env/network:** native `fetch` không chịu browser CORS; phân biệt dev/prod qua env config, không nhánh code.

## Cross-Story Dependencies

- Thứ tự trong epic: 14.1 (monorepo + shared) → 14.2 (Expo app cần workspace + `@growbase/shared`) → 14.3 (API client nằm trong `apps/mobile`). 14.4 độc lập về code (chỉ đụng web `/api`) nhưng là nửa server của contract mà 14.3 định nghĩa phía client (Bearer + Idempotency-Key) — hai story phải khớp contract.
- Story 14.4 chặn Epic 15+ (auth Bearer là tiền đề cho login/session mobile); toàn Epic 14 chặn Epic 15–18.
- Open question còn treo: env dev base-URL dùng Expo tunnel hay LAN IP — chốt khi setup (story 14.3), không chờ planning.
