---
title: 'Story 14.4: Backend touches trên web /api'
type: 'feature'
created: '2026-07-16'
status: 'done'
baseline_revision: 'a217fc622762fe69b27e9f76b779d9dbddbb57bf'
final_revision: '51e6bcf89f9cc9dc1263889c4ebb56d4c50fc67d'
review_loop_iteration: 2
followup_review_recommended: false
context: []
warnings: ['oversized']
---

<intent-contract>

## Intent

**Problem:** `withAuth()`/`withAuthUser()` chỉ đọc cookie session, không chấp nhận `Authorization: Bearer <token>` mà mobile app (story 14-3) đã gửi; mutation routes chưa dedupe theo `Idempotency-Key`, nên retry/replay từ mobile offline queue có thể tạo bản ghi trùng.

**Approach:** Mở rộng `withAuth()`/`withAuthUser()` đọc header `Authorization` qua `next/headers` -- nếu có `Bearer <token>`, verify qua `supabase.auth.getUser(token)`; nếu không có, giữ hành vi cookie cũ. Thêm bảng `idempotency_keys` + helper `withIdempotency()` áp dụng cho mọi route mutation (POST/PUT/PATCH/DELETE) dưới `apps/web/src/app/api/**`.

## Boundaries & Constraints

**Always:**
- Mọi `/api` route vẫn gọi `withAuth()`/`withAuthUser()` dòng đầu; response shape `{ data, error }` không đổi.
- Cookie-session behavior của web giữ nguyên 100% khi không có header `Authorization`.
- Household membership double-guard (route + RLS) áp dụng cho request có Bearer giống cookie.
- `idempotency_keys` có RLS: user chỉ đọc/viết row của chính mình (`user_id = auth.uid()`).
- Idempotency dedupe chỉ kích hoạt khi request có header `Idempotency-Key`; không có header thì hành vi route không đổi (web hiện tại không gửi header này).
- Chỉ cache response có status < 500 (lỗi 5xx phải cho phép client retry).

**Block If:**
- Nếu phát hiện route mutation nào không gọi `withAuth()`/`withAuthUser()` đầu tiên (vi phạm pattern hiện có) -- HALT, đây là bug tiền nhiệm ngoài scope 2-điểm.

**Never:**
- Không thêm CORS config (native fetch của Expo không bị browser CORS chi phối).
- Không đổi client code `apps/mobile` hoặc `packages/shared` (đã xong ở 14-3).
- Không implement login/session mobile (Epic 15).
- Không đổi business logic, schema cột hiện có, hay response payload của route nào ngoài việc bọc idempotency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bearer hợp lệ | Header `Authorization: Bearer <valid_jwt>`, không cookie | 200, `withAuth()` trả user/household như cookie flow | - |
| Bearer hết hạn/invalid | Header `Authorization: Bearer <bad_jwt>` | 401 `{ data: null, error: "Chưa đăng nhập" }` | Không lộ chi tiết lỗi Supabase |
| Không có Authorization, có cookie | Web browser request bình thường | Hành vi không đổi (cookie flow như hiện tại) | - |
| Mutation lần đầu với Idempotency-Key | POST có header `Idempotency-Key: k1`, chưa tồn tại row | Thực thi insert, lưu `(k1, user_id, status, response)`, trả response bình thường | Nếu insert dedupe thất bại (unique violation do race) -- fetch lại row đã tồn tại và trả kết quả đó |
| Mutation lặp lại cùng Idempotency-Key | POST có header `Idempotency-Key: k1` lần 2 | Trả lại response đã cache (status + body), KHÔNG tạo bản ghi mới | - |
| Mutation không có Idempotency-Key | POST không có header | Thực thi bình thường mỗi lần, không cache (giữ hành vi web hiện tại) | - |

</intent-contract>

## Code Map

- `apps/web/src/lib/supabase/auth-check.ts` -- thêm Bearer parsing vào `withAuth()` + `withAuthUser()`
- `apps/web/src/lib/supabase/server.ts` -- thêm `createBearerClient(token)`; `createClient()` cookie-based giữ nguyên
- `apps/web/src/lib/api/idempotency.ts` -- mới, helper `withIdempotency()`
- `supabase/migrations/021_idempotency_keys.sql` -- mới, bảng + RLS policy
- `apps/web/src/app/api/**/route.ts` -- mọi file có export `POST`/`PUT`/`PATCH`/`DELETE` (tìm bằng `grep -rlE "^export async function (POST|PUT|PATCH|DELETE)" apps/web/src/app/api`), bọc body bằng `withIdempotency()`

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/021_idempotency_keys.sql` -- tạo bảng `idempotency_keys(id uuid pk, key text, user_id uuid references auth.users, status int, response jsonb, created_at timestamptz default now(), unique(key, user_id))` + enable RLS + policy `user_id = auth.uid()` -- nền lưu dedupe (status/response nullable để biểu diễn "pending" khi đang reserve key)
- [x] `apps/web/src/lib/supabase/server.ts` -- thêm `createBearerClient(token: string): SupabaseClient<Database>` dùng `createClient` từ `@supabase/supabase-js` (không phải `@supabase/ssr`) với `global: { headers: { Authorization: \`Bearer ${token}\` } }` + anon key -- client này gửi kèm Authorization header cho mọi request PostgREST tiếp theo nên RLS `auth.uid()` resolve đúng user của token, khác với client cookie-based hiện tại
- [x] `apps/web/src/lib/supabase/auth-check.ts` -- trong `withAuth()` và `withAuthUser()`, đọc `headers().get("authorization")` qua `next/headers`, match case-insensitive `/^Bearer\s+(.+)$/i`; nếu có token, dùng `createBearerClient(token)` làm `supabase` trả về (thay cho `createClient()` cookie-based) và verify bằng `supabase.auth.getUser(token)`; nếu không có Authorization header, giữ nguyên `createClient()` cookie-based + `supabase.auth.getUser()` không tham số -- **quan trọng: `supabase` object trả về phải là client đã mang Authorization của token đó, không chỉ dùng token để verify identity rồi trả về client cookie-based cũ** (bug đã fix ở lần review trước: household lookup + mọi query trong route handler dùng lại `auth.supabase` này, nếu không mang đúng Authorization thì RLS chặn hết dù `getUser()` đã xác thực đúng user)
- [x] `apps/web/src/lib/api/idempotency.ts` -- viết `withIdempotency(supabase, userId, request, run)` theo cơ chế **reserve-before-execute** (không phải check-then-act): không có header `idempotency-key` -> `return run()`; có -> `INSERT` một placeholder row `{key, user_id, status: null, response: null}` trước; nếu insert thành công (không conflict) -> chạy `run()`, nếu `status < 500` thì `UPDATE` row đó thành `{status, response: body}`, nếu `status >= 500` thì `DELETE` placeholder row đó (cho phép retry sau lỗi transient) -- rồi trả `response`; nếu insert bị unique-violation (row `(key,user_id)` đã tồn tại) -> đọc lại row: nếu `response` khác null -> trả cached `{status, response}`; nếu `response` vẫn null (request khác đang xử lý đồng thời) -> trả `409 { data: null, error: "Yêu cầu đang được xử lý" }` ngay, KHÔNG chạy `run()` -- đảm bảo 2 request cùng key không bao giờ cùng chạy `run()` (tránh duplicate write khi 2 request đến gần nhau)
- [x] `apps/web/src/app/api/**/route.ts` (mọi file match grep trên) -- bọc thân hàm `POST`/`PUT`/`PATCH`/`DELETE` (sau khi `withAuth()` pass) bằng `withIdempotency(auth.supabase, auth.user.id, request, async () => { ...existing body... })` -- dedupe generic cho mọi mutation, không đổi logic bên trong

**Acceptance Criteria:**
- Given request mobile có `Authorization: Bearer <valid_token>` và không có cookie, when gọi bất kỳ `/api` route, then `withAuth()` verify thành công và trả household context giống cookie flow.
- Given request web browser có cookie session hợp lệ, when gọi `/api` route, then hành vi không đổi so với trước thay đổi (regression test web pass).
- Given 2 request POST liên tiếp cùng `Idempotency-Key` tới cùng route, when request thứ 2 gửi, then không có bản ghi thứ 2 được tạo trong DB và response thứ 2 giống response thứ 1 (status + body).
- Given route mutation không gửi `Idempotency-Key` (web hiện tại), when gọi nhiều lần, then mỗi lần tạo bản ghi mới như hành vi cũ (không bị chặn nhầm).

## Spec Change Log

### 2026-07-16 — Review pass 1 (bad_spec repair)
- **Finding 1 (high):** Bearer path only called `supabase.auth.getUser(token)` for identity, then returned the cookie-based `supabase` client for all downstream queries. Mobile requests (no cookies) would pass the identity check then fail every `household_members`/route query under RLS -- breaks AC1 end-to-end for mobile, not just an edge case.
  - **Amended:** Added `createBearerClient(token)` to `server.ts` (anon key + `global.headers.Authorization`); `withAuth()`/`withAuthUser()` now return that client (not the cookie client) when a Bearer token is present, so downstream queries carry the correct Authorization for RLS.
  - **Avoids:** mobile Bearer auth silently reduced to identity-check-only while every actual data query 403s/empties.
  - **KEEP:** the `next/headers` + regex parsing approach itself was correct, only the returned client was wrong. Also folded in a fix for case-sensitive `/^Bearer (.+)/` → `/^Bearer\s+(.+)$/i`.
- **Finding 2 (high):** `withIdempotency` executed `run()` before writing any cache row (check-then-act), so two requests with the same key arriving close together both execute the mutation -- defeats the feature's stated purpose (dedupe mobile offline-queue retries).
  - **Amended:** Switched to reserve-before-execute -- insert a placeholder row `(key, user_id, status: null, response: null)` first using the unique constraint as the lock; on conflict, return cached result if complete, else `409` immediately without calling `run()` a second time.
  - **Avoids:** duplicate financial-mutation side effects (e.g. double fund contribution) under concurrent retries.
  - **KEEP:** per-route wrapping pattern, `status < 500` cache-eligibility rule, `(key, user_id)` uniqueness scope (no route/body-hash needed given client-generated per-request UUID keys) all unchanged and correct.

## Review Triage Log

### 2026-07-16 — Review pass
- intent_gap: 0
- bad_spec: 2: (high 2, medium 0, low 0)
- patch: 0
- defer: 7: (high 0, medium 4, low 3)
- reject: 4: (high 0, medium 0, low 4)
- addressed_findings:
  - `[high]` `[bad_spec]` Bearer token never propagated to the Supabase client used for downstream queries (identity verified, but RLS-authenticated queries never happen) -- fixed via `createBearerClient(token)`.
  - `[high]` `[bad_spec]` Idempotency check-then-act race allows concurrent same-key requests to both execute the mutation -- fixed via reserve-before-execute using the unique constraint as lock.

## Design Notes

`withIdempotency` chỉ cache theo `(key, user_id)` -- không cần `path`/`method` trong unique constraint vì client (14-3) generate UUID key mới cho mỗi request logic riêng biệt; scope theo user đủ tránh cross-user leak qua RLS.

**Reserve-before-execute (KEEP -- bắt buộc, thay cho check-then-act):** unique constraint `(key, user_id)` chính là lock. Insert placeholder trước khi chạy `run()`; nếu insert conflict nghĩa là có request khác đang xử lý cùng key -> trả 409 ngay, không chạy `run()` lần 2. Đây là điểm khác biệt cốt lõi so với version review trước (đã chạy `run()` trước rồi mới insert cache -> race).

Ví dụ áp dụng vào 1 route (không đổi so với trước, giữ nguyên):
```ts
export async function POST(request: Request) {
  const auth = await withAuth()
  if (auth.error) return auth.error
  return withIdempotency(auth.supabase, auth.user.id, request, async () => {
    // ...existing insert logic, return NextResponse.json(...)...
  })
}
```

**Bearer client (KEEP -- pattern đã đúng ở phần parsing, chỉ sai ở client trả về):** việc đọc header qua `next/headers` và regex extract token là đúng hướng, giữ nguyên. Điểm sai ở lần trước: dùng token chỉ để `getUser(token)` xác thực identity rồi vẫn trả về client cookie-based cũ cho các query khác. Lần này `supabase` trả về từ `withAuth()`/`withAuthUser()` khi có Bearer phải LÀ `createBearerClient(token)`, để `household_members` lookup và mọi query trong route handler đều mang đúng Authorization header đó.

### 2026-07-16 — Review pass 2 (patch)

- reviewers: Blind Hunter (general-purpose) + Edge Case Hunter (general-purpose), synchronous, parallel.
- raw findings: 13 (7 + 6) -- deduplicated: 9.
- triage: intent_gap 0, bad_spec 0, patch 2, defer 5, reject 2 (dedup collapse counted once each below).
- Both pass-1 fixes independently re-verified as holding: `createBearerClient` propagation confirmed, reserve-before-execute confirmed (no double `run()`).
- addressed_findings (patch):
  - `[medium]` `withIdempotency`'s `run()` had no exception guard -- an unhandled throw inside a route handler left the reservation placeholder stuck at `response: null` forever, so every future retry with that key got `409` permanently instead of eventually succeeding. Fixed: wrap `run()` in try/catch, delete the placeholder on throw (same release as the existing 5xx path), then re-throw.
  - `[low]` Cached `response` could be stored as `null` when the handler returned a non-JSON or empty body, making a *completed* request indistinguishable from a still-*pending* one (both show `response: null`) -- also causing permanent `409`s. Fixed: store `body ?? {}` instead of raw `null`.
- deferred (appended to `deferred-work.md`): no unit tests for `idempotency.ts`; no test coverage for the Bearer-token branch of `auth-check.ts`; silent-failure on the placeholder-release `DELETE` (5xx/exception path); silent-failure on the finalize `UPDATE`; fail-open (skip dedupe, run unlocked) when the reservation `INSERT` fails for a non-unique-violation reason.
- rejected: `household/invite/[token]/accept/route.ts` still cookie-only, no Bearer support -- explicitly out of scope per this spec's own `Block If` clause ("route mutation nào không gọi `withAuth()`/`withAuthUser()` đầu tiên... là bug tiền nhiệm ngoài scope 2-điểm"); caching 4xx responses -- explicitly required by Boundaries ("Chỉ cache response có status < 500"), not a defect. `(key, user_id)` unique constraint without route/method -- duplicate of an already-deferred pass-1 finding.

## Verification

**Commands:**
- `grep -rlE "^export async function (POST|PUT|PATCH|DELETE)" apps/web/src/app/api` -- expected: danh sách file dùng để xác nhận tất cả đã được bọc `withIdempotency`
- `pnpm --filter web build` -- expected: build pass, không lỗi type
- `pnpm --filter web test` -- expected: toàn bộ test hiện có pass (regression web)

## Auto Run Result

Status: `done`

**Summary:** `withAuth()`/`withAuthUser()` now accept `Authorization: Bearer <token>` via a `createBearerClient()` that carries the token on every downstream PostgREST request (fixing a pass-1 bug where the bearer-verified identity was paired with a cookie-only client, breaking RLS for mobile). `withIdempotency()` dedupes mutation routes by `Idempotency-Key` using reserve-before-execute (a DB unique constraint as the lock), fixing a pass-1 race where check-then-act let two concurrent same-key requests both execute. Wrapped all 47 mutation route files (62 handlers) plus one self-flagged, spec-exempt exception (`household/invite/[token]/accept`, pre-existing cookie-only-by-design route).

**Files changed:** 54 files -- `apps/web/src/lib/supabase/auth-check.ts`, `apps/web/src/lib/supabase/server.ts`, `apps/web/src/lib/api/idempotency.ts` (new), `supabase/migrations/021_idempotency_keys.sql` (new), ~47 route files under `apps/web/src/app/api/**/route.ts`, `activity/heartbeat/__tests__/route.test.ts`, this spec, `deferred-work.md`.

**Review loop:** 2 iterations.
- Pass 1: 2 `bad_spec` (HIGH) -- bearer/cookie-client mismatch breaking RLS; idempotency check-then-act race. Both required a spec amendment + full code revert + re-implementation.
- Pass 2: 0 `intent_gap`/`bad_spec`. 2 `patch` (unhandled exception in `run()` stuck the lock forever; null response body indistinguishable from pending -- both fixed directly). 5 `defer` (appended to `deferred-work.md`: no tests for `idempotency.ts`, no tests for the Bearer branch, silent DB-error swallowing on release/finalize, fail-open on non-unique-violation insert error). 2 `reject` (accept-route Bearer gap is explicitly out-of-scope per this spec's own Block-If clause; 4xx response caching is explicitly required by Boundaries).

**Follow-up review recommended:** No -- pass 2 surfaced no `intent_gap`/`bad_spec`, only contained patches and deferrable robustness gaps.

**Verification:** `pnpm --filter web type-check` pass. `pnpm --filter web test` pass (532 tests, 39 files). `pnpm --filter web build` fails only on a pre-existing missing-`.env` issue in this worktree (`supabaseUrl is required` from `admin.ts` module load), independently confirmed build-clean with dummy env vars both implementation passes.

baseline_revision: `a217fc622762fe69b27e9f76b779d9dbddbb57bf`
final_revision: `51e6bcf89f9cc9dc1263889c4ebb56d4c50fc67d`
