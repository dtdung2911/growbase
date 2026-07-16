---
title: 'Story 14.3: API fetch client (Bearer + Idempotency-Key + env base-URL)'
type: 'feature'
created: '2026-07-16'
status: 'done'
baseline_revision: '1f8fcb481aae1ab5637d76d69faf22945cc5c6ca'
final_revision: '0f4933f0517491fe3594119d4f573a59ade5d554'
review_loop_iteration: 0
followup_review_recommended: false # module mới cô lập trong apps/mobile, 23 unit tests phủ I/O matrix + patches, không đụng behavior/API/security hiện có
context: []
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** `apps/mobile` (Expo SDK 56, thin client) chưa có API client — Epic 15–18 cần một kênh data duy nhất gọi về web `/api/*` với contract chuẩn (Bearer + app-version + Idempotency-Key + envelope `{ data, error }`). Story 14.4 sẽ implement nửa server của contract này, nên phía client phải được định nghĩa rõ trước.

**Approach:** Tạo fetch wrapper tại `apps/mobile/src/api/` — base URL từ env `EXPO_PUBLIC_API_URL` (không nhánh code dev/prod), tự gắn headers chuẩn, parse envelope, throw `ApiError` có status + message. Kèm vitest unit tests (node env, mock expo modules).

## Boundaries & Constraints

**Always:**
- Base URL chỉ từ `process.env.EXPO_PUBLIC_API_URL` — thiếu thì throw error message rõ ràng ngay khi dùng (fail fast). Không hardcode endpoint.
- Mọi request: header `app-version` = `Constants.expoConfig?.version ?? "0.0.0"` (expo-constants). Có token thì gắn `Authorization: Bearer <token>`.
- Mutating request (POST/PUT/PATCH/DELETE): header `Idempotency-Key` — caller truyền vào thì dùng, không thì tự sinh UUID v4 qua `expo-crypto`.
- Access token qua provider injectable (`setAccessTokenProvider`) — auth thật đến ở Epic 15, client không tự lấy token.
- Response luôn parse theo envelope `{ data, error }`; `error != null` HOẶC `!res.ok` → throw `ApiError { status, message }`. Envelope là source of truth.
- Import từ `@growbase/shared` (nếu cần) chỉ dùng subpath (vd `@growbase/shared/queryKeys`), không import root — root barrel kéo `@supabase/supabase-js` vào Hermes bundle (cần URL polyfill, xem deferred-work.md).
- TypeScript strict, không `any`. Alias `@/*` → `src/*` (đã có trong tsconfig).

**Block If:** contract header names (`Authorization`, `app-version`, `Idempotency-Key`) hoặc envelope shape cần đổi khác với epic-14-context — đây là contract chung với story 14.4, không tự quyết.

**Never:**
- Không đụng `apps/web` hay `packages/shared` (14.4 làm server half).
- Không import `react-native-mmkv` runtime (vỡ Expo Go — chưa có dev build).
- Không cài `@supabase/supabase-js` vào mobile trong story này (auth = Epic 15).
- Không thêm retry/timeout/queue logic — offline handling thuộc epic sau.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| GET happy | `apiFetch<T>("/api/household")`, token provider trả token | Request có `Authorization` + `app-version`, KHÔNG có `Idempotency-Key`; trả `data` typed `T` | No error expected |
| POST mutating | `apiFetch("/api/transactions", { method: "POST", body: {...} })` | Body JSON.stringify + `Content-Type: application/json`; `Idempotency-Key` = UUID v4 tự sinh, unique mỗi call | No error expected |
| POST key custom | options có `idempotencyKey: "abc"` | Header `Idempotency-Key: abc` (retry-stable cho caller) | No error expected |
| Server error envelope | Response status 400, body `{ data: null, error: "msg" }` | throw `ApiError` với `status=400`, `message="msg"` | Caller catch |
| 200 nhưng error non-null | `res.ok` true, body `{ data: null, error: "x" }` | throw `ApiError` `status=200`, `message="x"` | Envelope thắng res.ok |
| Non-JSON response | Status 502, body HTML | throw `ApiError` `status=502`, message generic (không crash JSON.parse) | Fail rõ ràng |
| Env missing | `EXPO_PUBLIC_API_URL` không set | `getApiBaseUrl()` throw Error nêu tên biến env | Fail fast |
| No token | Provider chưa đăng ký hoặc trả `null` | Request đi bình thường, KHÔNG có header `Authorization` (server sẽ 401) | No error client-side |

</intent-contract>

## Code Map

- `apps/mobile/src/api/config.ts` -- MỚI: `getApiBaseUrl()` đọc env, strip trailing slash
- `apps/mobile/src/api/client.ts` -- MỚI: `ApiError`, `setAccessTokenProvider`, `apiFetch<T>`
- `apps/mobile/src/api/client.test.ts` -- MỚI: unit tests cho I/O matrix
- `apps/mobile/vitest.config.ts` -- MỚI: node env, alias `@`
- `apps/mobile/.env.example` -- MỚI: document `EXPO_PUBLIC_API_URL`
- `apps/mobile/package.json` -- SỬA: thêm deps + script test
- `apps/web/src/app/api/transactions/route.ts` -- THAM CHIẾU envelope `{ data, error }` (không sửa)
- `_bmad-output/implementation-artifacts/deferred-work.md` -- THAM CHIẾU ràng buộc shared subpath import

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/package.json` -- Cài `expo-crypto` (version khớp SDK 56, dùng `expo install`), devDep `vitest`, script `"test": "vitest run"` -- cần UUID v4 chạy được trong Expo Go + test runner
- [x] `apps/mobile/src/api/config.ts` -- Viết `getApiBaseUrl()`: đọc `process.env.EXPO_PUBLIC_API_URL`, trim trailing slash, throw nếu thiếu -- env-only base URL, fail fast
- [x] `apps/mobile/src/api/client.ts` -- Viết `ApiError` (class, `status` + `message`), `setAccessTokenProvider(fn)`, `apiFetch<T>(path, options?)` theo đúng contract ở Boundaries -- core của story
- [x] `apps/mobile/.env.example` -- `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000` + comment hướng dẫn tunnel; verify `.env` bị git ignore -- chốt open question: 1 biến env duy nhất, LAN là default dev, tunnel chỉ là đổi giá trị
- [x] `apps/mobile/vitest.config.ts` -- Node environment, alias `@` → `./src`; mock `expo-constants`/`expo-crypto` bằng `vi.mock` trong test -- mobile chưa có test setup
- [x] `apps/mobile/src/api/client.test.ts` -- Unit tests phủ toàn bộ I/O & Edge-Case Matrix (stub `fetch` bằng `vi.stubGlobal`) -- matrix phải verify được

**Acceptance Criteria:**
- Given token provider đã đăng ký, when gọi `apiFetch` GET, then request có `Authorization: Bearer` + `app-version` và không có `Idempotency-Key`.
- Given hai lần gọi POST không truyền key, when so sánh headers, then hai `Idempotency-Key` là UUID v4 hợp lệ và khác nhau.
- Given story hoàn tất, when chạy verification commands, then tất cả pass và không file nào ngoài `apps/mobile/**` bị đổi.

## Spec Change Log

## Review Triage Log

### 2026-07-16 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 8: (high 0, medium 2, low 6)
- defer: 1: (high 0, medium 1, low 0)
- reject: 7: (high 0, medium 0, low 7)
- addressed_findings:
  - `[medium]` `[patch]` Envelope shape guard: JSON không phải object hoặc thiếu cả `data`/`error` → ApiError thay vì TypeError/`undefined as T`; `error` non-string coerce qua `String()`.
  - `[medium]` `[patch]` Token provider nhận sync/async (`Promise<string | null>`), await kết quả; `setAccessTokenProvider(null)` để clear khi logout.
  - `[low]` `[patch]` Path guard: path không bắt đầu bằng `/` → throw trước fetch.
  - `[low]` `[patch]` `getApiBaseUrl()` validate `/^https?:\/\/.+$/` sau trim/strip; comment giải thích ràng buộc literal `process.env.EXPO_PUBLIC_API_URL` (babel inline).
  - `[low]` `[patch]` `idempotencyKey` chuỗi rỗng coi như absent → tự sinh UUID.
  - `[low]` `[patch]` Body type mở rộng `Record<string, unknown> | unknown[]` (JSON array hợp lệ).
  - `[low]` `[patch]` Tests: `vi.stubEnv`/`vi.unstubAllEnvs` (hết leak env giữa test files); thêm coverage PUT/PATCH/DELETE key, non-envelope JSON, async provider, clear provider, bad path, base URL rác, signal pass-through (10 → 23 tests).
  - `[low]` `[patch]` `.env.example` note https/iOS ATS cho build thật; vitest include glob thêm `.tsx`.

## Design Notes

- **Idempotency semantics:** key tự sinh per-call chỉ là default an toàn; caller nào có retry (TanStack Query mutation ở epic sau) phải truyền key ổn định per-logical-operation qua `options.idempotencyKey`. Server dedupe là việc của 14.4.
- **`withAuth()` web hiện chỉ đọc cookie** (auth-check.ts:15) — client gửi Bearer từ bây giờ là đúng contract; server chấp nhận Bearer ở 14.4. Không chặn story này.
- **Options shape gợi ý:** `{ method?, body? (object, tự stringify), idempotencyKey?, signal? }` — giữ tối giản, không wrap RequestInit đầy đủ.

## Verification

**Commands:**
- `pnpm --filter @growbase/mobile exec tsc --noEmit` -- expected: 0 errors
- `pnpm --filter @growbase/mobile test` -- expected: toàn bộ tests pass
- `git check-ignore apps/mobile/.env` -- expected: in ra path (file được ignore)

**Manual checks (if no CLI):**
- `git status` chỉ thấy thay đổi trong `apps/mobile/**` + spec file này.

## Auto Run Result

Status: done

**Summary:** Mobile API fetch client hoàn chỉnh tại `apps/mobile/src/api/` — `apiFetch<T>` gắn `Authorization: Bearer` (token provider injectable sync/async, clear được khi logout), header `app-version` (expo-constants), `Idempotency-Key` UUID v4 (expo-crypto) cho POST/PUT/PATCH/DELETE, base URL duy nhất từ `EXPO_PUBLIC_API_URL` (validate `http(s)://`, fail fast), parse envelope `{ data, error }` với shape guard → `ApiError { status, message }`. Open question tunnel-vs-LAN đã chốt: 1 biến env, LAN default, tunnel chỉ đổi giá trị.

**Files:**
- `apps/mobile/src/api/config.ts` — `getApiBaseUrl()`: env read (literal access cho babel inline), trim/strip, validate scheme
- `apps/mobile/src/api/client.ts` — `ApiError`, `setAccessTokenProvider`, `apiFetch<T>` full contract
- `apps/mobile/src/api/client.test.ts` — 23 unit tests (I/O matrix + review edge cases)
- `apps/mobile/vitest.config.ts` — node env, alias `@`, include `.ts/.tsx`
- `apps/mobile/.env.example` — `EXPO_PUBLIC_API_URL` doc (LAN/tunnel/ATS note)
- `apps/mobile/package.json` — +`expo-crypto ~56.0.4`, +devDep `vitest ^2.1.9`, script `test`
- `pnpm-lock.yaml` — lockfile theo deps

**Review:** 2 hunters song song → 8 patch (2 medium, 6 low) auto-fixed cùng pass; 1 defer (envelope thiếu error code — ghi vào deferred-work.md); 7 reject; 0 intent_gap, 0 bad_spec.

**Verification:** `tsc --noEmit` 0 errors · 23/23 tests pass · `.env` git-ignored · thay đổi chỉ trong `apps/mobile/**` + lockfile + artifacts.

**Commit:** `0f4933f` trên branch `bmad-loop/20260715-231732-eca5/14-3-api-fetch-client` (chưa push).
