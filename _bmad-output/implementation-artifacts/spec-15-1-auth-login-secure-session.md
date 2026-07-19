---
title: 'Epic 15.1 — Đăng nhập email/password + session lưu an toàn (mobile)'
type: 'feature'
created: '2026-07-16'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context: []
warnings: []
baseline_revision: '402eded3dc3c8bc0c79004f2cd9ee400d98c6260'
final_revision: '18b84dd916655c374b9f9fdee4b2f7d4e7d05de4'
---

## Intent

**Problem:** App mobile (Expo, apps/mobile) chưa có màn đăng nhập lẫn cơ chế lưu session. `apiFetch` đã có hook `setAccessTokenProvider` (stub) chờ Epic 15 nối vào; chưa có Supabase auth client, chưa có nơi lưu session an toàn.

**Approach:** Thêm Supabase auth-only client cho mobile, màn login email/password, và `LargeSecureStore` (AES key trong `expo-secure-store`, blob mã hóa lưu MMKV) làm storage adapter cho `supabase-js`. Bật `autoRefreshToken`, start/stop theo `AppState`. Nối `setAccessTokenProvider` vào session hiện có. Chỉ scope story 15.1 — KHÔNG làm Face ID (15.2), household/month switch (15.3), nav shell đầy đủ (15.4).

## Boundaries & Constraints

**Always:**
- Raw Supabase session KHÔNG được lưu trực tiếp vào `expo-secure-store` (chỉ AES key). Blob session mã hóa lưu MMKV.
- `supabase-js` config: `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`; gọi `startAutoRefresh()`/`stopAutoRefresh()` theo `AppState` (active → start, background/inactive → stop) — pattern chuẩn của Supabase React Native docs.
- Login sai → giữ nguyên form (không clear input) + `toast.error` hiển thị 5s (theo Error Pattern trong CLAUDE.md).
- Dùng `@growbase/shared/types/database` cho typing Supabase client (giống web).
- MMKV chỉ được import runtime khi app chạy qua dev client (không phải Expo Go) — vì vậy story này bổ sung `expo-dev-client`, cập nhật script `start`/`ios`/`android` dùng `--dev-client`, và cập nhật ghi chú MMKV trong root CLAUDE.md (bỏ giới hạn "không import runtime", vì từ story này trở đi bắt buộc dev build).
- Zustand store field `user` (theo shape đã chốt `{ householdId, currentMonth, user }`) là nơi lưu user đã đăng nhập.

**Block If:** (none — env var convention đã có sẵn, xem Code Map)

**Never:**
- Không làm biometric unlock (15.2), household/month context (15.3), bottom nav/i18n toàn shell (15.4) — chỉ i18n tối thiểu cho 2 chuỗi của màn login (dùng key theo pattern web, không hardcode).
- Không thêm react-hook-form/zod cho form này — 2 field email/password, validate tối thiểu (non-empty) đủ, lỗi thật lấy từ Supabase.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login thành công | email/password đúng | `signInWithPassword` OK → session lưu qua LargeSecureStore, `apiFetch` accessTokenProvider trả token, điều hướng vào app (route index hiện có) | No error expected |
| Login sai | email/password sai | Form giữ nguyên input, `toast.error(message, {duration:5000})` | Hiển thị message từ Supabase error |
| Cold start có session hợp lệ | LargeSecureStore có blob giải mã được, chưa hết hạn | Vào thẳng app, không hiện lại login | N/A (auto-refresh nếu access token gần hết hạn) |
| Session hỏng/giải mã lỗi | MMKV blob corrupt hoặc SecureStore key mất | Coi như chưa đăng nhập, xóa entry hỏng, về màn login | Không crash app |
| App background → foreground | AppState chuyển active | `startAutoRefresh()` gọi lại khi active, `stopAutoRefresh()` khi background | N/A |

## Code Map

- `apps/mobile/package.json` -- thêm `@supabase/supabase-js`, `expo-secure-store`, `aes-js` (+ `@types/aes-js` dev), `expo-dev-client`, `react-native-toast-message`
- `apps/mobile/app.json` -- thêm plugin `expo-secure-store` nếu cần, giữ nguyên còn lại
- `apps/mobile/.env.example` -- thêm `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mirror `EXPO_PUBLIC_API_URL` convention đã có; cùng project Supabase với web, giá trị lấy từ root `.env.example` `NEXT_PUBLIC_SUPABASE_*`)
- `apps/mobile/src/lib/supabase/largeSecureStore.ts` -- LargeSecureStore adapter (AES key SecureStore + blob MMKV), theo pattern chuẩn Supabase docs
- `apps/mobile/src/lib/supabase/client.ts` -- tạo `supabase` client (`createClient<Database>`) dùng LargeSecureStore, autoRefreshToken, env `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `apps/mobile/src/lib/supabase/useAutoRefresh.ts` -- hook AppState start/stop `supabase.auth.startAutoRefresh()/stopAutoRefresh()`
- `apps/mobile/src/store/appStore.ts` -- Zustand store `{ householdId, currentMonth, user }`, action `setUser`/`clearUser`
- `apps/mobile/src/features/auth/LoginScreen.tsx` -- form email/password, gọi `supabase.auth.signInWithPassword`, toast lỗi 5s, giữ form khi sai
- `apps/mobile/src/features/auth/useAuthSession.ts` -- theo dõi `onAuthStateChange`, nối `setAccessTokenProvider` (từ `src/api/client.ts`) trả `session?.access_token ?? null`, đồng bộ Zustand `user`
- `apps/mobile/app/login.tsx` -- route Expo Router cho `LoginScreen`
- `apps/mobile/app/_layout.tsx` -- redirect: chưa có session → `/login`, có session → route hiện có (`index`)
- `apps/mobile/app/index.tsx` -- không đổi logic nghiệp vụ, chỉ đảm bảo chỉ vào được khi đã có session (qua `_layout` redirect)
- `apps/mobile/src/lib/i18n/` (mirror `apps/web/src/lib/i18n/` pattern) -- provider tối thiểu + `messages/vi.ts`, `messages/en.ts` chỉ cho 2 chuỗi login cần
- `CLAUDE.md` (root) -- cập nhật dòng ghi chú MMKV: bỏ hạn chế "không import runtime", note app giờ chạy qua dev client

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/.env.example` -- thêm `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` -- Supabase client mobile cần đọc từ env
- [x] `apps/mobile/package.json` -- thêm deps `@supabase/supabase-js`, `expo-secure-store`, `aes-js`, `@types/aes-js`, `expo-dev-client`, `react-native-toast-message`; cập nhật scripts `start`/`android`/`ios` thêm `--dev-client` -- MMKV cần dev build, Supabase cần client lib, toast cần lib RN
- [x] `apps/mobile/src/lib/supabase/largeSecureStore.ts` -- implement `SupportedStorage` interface (`getItem`/`setItem`/`removeItem`) dùng `expo-secure-store` cho AES key + `aes-js` mã hoá, `react-native-mmkv` lưu blob -- đúng AC "session lưu qua LargeSecureStore ... KHÔNG raw session trong SecureStore"
- [x] `apps/mobile/src/lib/supabase/client.ts` -- `createClient<Database>(url, anonKey, { auth: { storage: largeSecureStore, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } })` -- AC "auto-refresh token bật"
- [x] `apps/mobile/src/lib/supabase/useAutoRefresh.ts` -- `AppState.addEventListener('change', ...)` gọi `startAutoRefresh()`/`stopAutoRefresh()` -- AC "start/stop theo AppState"
- [x] `apps/mobile/src/store/appStore.ts` -- Zustand store theo shape CLAUDE.md, action set/clear user -- lưu trạng thái đăng nhập cho toàn app
- [x] `apps/mobile/src/features/auth/useAuthSession.ts` -- `supabase.auth.onAuthStateChange`, gọi `setAccessTokenProvider(() => session?.access_token ?? null)`, sync Zustand `user` -- nối session vào `apiFetch` đã stub sẵn
- [x] `apps/mobile/src/features/auth/LoginScreen.tsx` -- form 2 input (email, password), nút submit disabled khi `isPending`, `signInWithPassword` lỗi → `Toast.show({type:'error', text1: message, visibilityTime: 5000})` + giữ input -- AC "login sai giữ form + toast.error 5s"
- [x] `apps/mobile/app/login.tsx` + `apps/mobile/app/_layout.tsx` -- route `/login`, redirect theo trạng thái session từ `appStore.user` -- vào đúng luồng có/chưa auth
- [x] `apps/mobile/src/lib/i18n/` -- provider tối thiểu (mirror web, không thêm lib mới) + 2 chuỗi login (label email/password, nút đăng nhập) vi/en -- CLAUDE.md "i18n vi/en, no hardcode"
- [x] root `CLAUDE.md` -- sửa dòng ghi chú MMKV, bỏ giới hạn Expo Go -- phản ánh đúng trạng thái sau khi thêm dev client
- [x] `apps/mobile/src/lib/supabase/largeSecureStore.test.ts` -- unit test encrypt/decrypt round-trip, và trường hợp blob corrupt trả `null` thay vì throw -- phủ I/O matrix "session hỏng"
- [x] `apps/mobile/src/features/auth/useAuthSession.test.ts` -- unit test: `onAuthStateChange` callback gắn đúng `accessTokenProvider` và cập nhật Zustand `user`; session null → provider trả `null` -- phủ I/O matrix "login sai"/"session hỏng" ở tầng logic (không cần RN component testing lib chưa có sẵn)

**Acceptance Criteria:**
- Given màn login, when nhập email/password đúng, then đăng nhập thành công, session lưu qua LargeSecureStore (không raw trong SecureStore), `apiFetch` tự động gắn `Authorization: Bearer <token>`.
- Given màn login, when nhập sai, then form giữ nguyên input và `toast.error` hiện 5s.
- Given app đang chạy, when chuyển background rồi foreground, then `stopAutoRefresh`/`startAutoRefresh` được gọi tương ứng.
- Given đã đăng nhập trước đó, when mở lại app (cold start), then không cần đăng nhập lại (session giải mã thành công từ LargeSecureStore).
- Given blob session bị hỏng, when app đọc session, then coi như chưa đăng nhập, không crash.

## Design Notes

`LargeSecureStore` theo đúng pattern chính thức Supabase khuyến nghị cho Expo/React Native (AES key trong SecureStore, `aes-js` mã hoá blob, MMKV lưu blob) — không tự sáng chế thuật toán mã hoá riêng. Tham khảo interface tối giản:

```ts
class LargeSecureStore {
  async getItem(key: string) { /* lấy AES key từ SecureStore, giải mã blob MMKV */ }
  async setItem(key: string, value: string) { /* tạo/lấy AES key, mã hoá, lưu MMKV */ }
  async removeItem(key: string) { /* xoá key SecureStore + entry MMKV */ }
}
```

## Verification

**Commands:**
- `pnpm --filter @growbase/mobile type-check` -- expected: 0 lỗi TypeScript
- `pnpm --filter @growbase/mobile test` -- expected: unit test LargeSecureStore + auth hook pass

**Manual checks (if no CLI):**
- Chạy `pnpm --filter @growbase/mobile start --dev-client` trên simulator, thử login đúng/sai, thử kill+reopen app để xác nhận session được nhớ.

## Review Triage Log

### 2026-07-16 — review_loop_iteration 0

Blind Hunter (`bmad-review-adversarial-general`) + Edge Case Hunter (`bmad-review-edge-case-hunter`) chạy song song trên diff 14 files. Sau dedupe: 0 intent_gap, 0 bad_spec.

- **patch (6)**: high×2, medium×2, low×2
- **defer (5)**: high×1, medium×1, low×3
- **reject (5)**: no severity assigned (dropped)

**addressed_findings (patch, đã fix trực tiếp trong code):**
1. `LoginScreen.handleSubmit` không try/catch — network exception làm nút submit kẹt pending vĩnh viễn → thêm try/catch/finally, luôn reset `isPending`, toast lỗi cả khi throw. (high)
2. `useAuthSession` `getSession().then()` thiếu `.catch` — reject làm `initializing` treo mãi, user không redirect được → thêm `.catch`/`.finally`. (high)
3. `AuthGate` render `<Stack>` ngay cả khi `initializing=true` → flash màn hình sai trước khi redirect → return `null` khi đang initializing. (medium)
4. Toast lỗi login show raw `error.message` tiếng Anh, vi phạm convention i18n "no hardcode" → map `"Invalid login credentials"` sang `t("login.error.invalidCredentials")`, thêm key vi/en. (medium)
5. `largeSecureStore.removeItem` không wrap SecureStore delete — lỗi SecureStore làm skip luôn MMKV cleanup → wrap try/finally. (low)
6. `.env.example` không cảnh báo tránh dán nhầm `SUPABASE_SERVICE_ROLE_KEY` vào biến client → thêm comment cảnh báo. (low)

**deferred (ghi vào `deferred-work.md`, không fix trong lần này):**
- AES-CTR không có auth tag/MAC (residual risk của pattern chính thức Supabase, cần story riêng để đổi sang GCM/HMAC). (high)
- Chưa có sign-out — thuộc scope story sau (AD-M9 cache purge/logout), ngoài AC 15.1 (chỉ login). (medium)
- `appStore.currentMonth` tính 1 lần lúc khởi tạo, không refresh qua ranh giới tháng — chưa có consumer thực tế trong 15.1. (low)
- `largeSecureStore.encrypt()` xoay key mỗi write, không serialize ghi đồng thời — rủi ro lý thuyết, supabase-js gọi tuần tự nội bộ. (low)
- Thiếu test cho `AuthGate`/`useAutoRefresh`/`LoginScreen` UI flow — cần RN component-testing lib chưa có trong `apps/mobile`. (low)

**rejected (không hành động):** thiếu client-side email validation (server đã validate); `client.ts` throw lúc module-load khi thiếu env (fail-fast có chủ đích); `useAutoRefresh` gọi `startAutoRefresh` vô điều kiện (vô hại theo docs Supabase); CLAUDE.md "overstate" security (không đáng sửa); `applySession` set token provider trước check `user` (đúng hành vi dự kiến).

## Auto Run Result

**Summary**: Đăng nhập email/password cho mobile app (Expo). Supabase client dùng LargeSecureStore (AES key trong `expo-secure-store`, blob mã hoá trong MMKV qua dev-client), auto-refresh token theo AppState foreground/background, redirect gate login↔app theo session, sai đăng nhập giữ form + toast lỗi 5s (i18n vi/en).

**Files changed** (14): `CLAUDE.md`, `apps/mobile/.env.example`, `apps/mobile/app.json`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/login.tsx` (new), `apps/mobile/package.json`, `apps/mobile/src/features/auth/LoginScreen.tsx` (new), `apps/mobile/src/features/auth/useAuthSession.ts` (+test, new), `apps/mobile/src/lib/i18n/TranslationProvider.tsx` (+messages, new), `apps/mobile/src/lib/supabase/client.ts` (new), `apps/mobile/src/lib/supabase/largeSecureStore.ts` (+test, new), `apps/mobile/src/lib/supabase/useAutoRefresh.ts` (new), `apps/mobile/src/store/appStore.ts` (new).

**Review findings**: Blind Hunter + Edge Case Hunter chạy song song, 0 intent_gap, 0 bad_spec. 6 patch (đã fix trực tiếp), 5 defer (ghi `deferred-work.md`), 5 reject. Chi tiết đầy đủ ở `## Review Triage Log` phía trên.

**Follow-up review**: không cần — không còn patch/intent_gap/bad_spec tồn đọng sau vòng này.

**Verification performed**: `pnpm --filter @growbase/mobile type-check` (0 lỗi), `pnpm --filter @growbase/mobile test` (30/30 pass) — chạy lại sau khi áp patch để xác nhận không regress.

**Residual risks** (xem `deferred-work.md` để chi tiết): AES-CTR không có auth tag (dùng đúng pattern chính thức Supabase, nhưng ciphertext malleable); chưa có sign-out (thuộc story sau); `currentMonth` store field chưa có consumer thật; thiếu RN component-testing cho AuthGate/useAutoRefresh/LoginScreen UI flow; `react-native-url-polyfill` chưa thêm dù supabase-js trên RN thường cần — cần verify khi smoke-test thật trên dev-client (type-check/test không exercise real URL parsing nên không bắt được).
