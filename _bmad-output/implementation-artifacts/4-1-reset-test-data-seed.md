---
baseline_commit: a5a6ff584884a573a887fe0749453a2f96a6724f
---

# Story 4.1: Reset dữ liệu test & seed cấu trúc mới

Status: review

## Story

As a developer (dogfooder),
I want một script reset xoá sạch dữ liệu test cũ và giữ nguyên seed hệ thống,
so that onboarding v2 được build và dogfood trên nền dữ liệu sạch, không vướng cấu trúc cũ.

## Acceptance Criteria

1. **Given** database có dữ liệu test household-scoped từ cấu trúc cũ
   **When** dev chạy script reset (có confirm prompt bắt gõ chuỗi xác nhận trước khi xoá)
   **Then** toàn bộ dữ liệu household-scoped bị xoá: `households`, `household_members`, `household_invitations`, `accounts`, `income_sources`, `funds`, `fund_transactions`, `transactions`, `budget_baselines`, `budget_overrides`, `debt_entries`, `net_worth_snapshots`, `scheduled_payments`, `estimated_expenses`, `event_budgets`, `event_budget_items`, `investment_holdings`, `investment_purchases`, `investment_dca_plans`, và các rows `categories`/`category_groups`/`cost_types` có `household_id IS NOT NULL`
   **And** auth users (Supabase `auth.users`) giữ nguyên — sau reset, user login bị middleware đẩy về `/setup` (vì không còn membership; xem Dev Notes: không tồn tại flag `onboarding_completed` per-user để reset)

2. **Given** script đã chạy xong
   **When** kiểm tra seed hệ thống
   **Then** system rows còn nguyên vẹn: 7 `cost_types` + 20 `category_groups` + 38 `categories` với `household_id IS NULL, is_system = true`
   **And** script chạy lại lần 2 không lỗi, báo 0 rows xoá (idempotent)

3. **Given** đây là dev script chạy một lần `[ASSUMPTION: FR21]`
   **When** review deliverable
   **Then** không UI migration, không backward compatibility; script nằm ngoài app bundle (`scripts/`), không được import bởi code Next.js

## Tasks / Subtasks

- [x] Task 1: Setup script infrastructure (AC: 3)
  - [x] Thêm devDependency `tsx` (chưa có runner TS nào trong project)
  - [x] Thêm script `package.json`: `"db:reset-test": "NODE_OPTIONS=--experimental-websocket tsx scripts/reset-test-data.ts"` (flag cần cho supabase-js realtime trên Node 20)
  - [x] Tạo `scripts/reset-test-data.ts` — ngoài `src/`, không import từ `@/` (env Next.js không có ở CLI)
- [x] Task 2: Env + admin client trong script (AC: 1)
  - [x] Load env từ `.env.local` (parse thủ công, không thêm dep dotenv)
  - [x] Tạo Supabase client trực tiếp với `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (service role, bypass RLS — pattern giống `src/lib/supabase/admin.ts` nhưng KHÔNG import file đó)
  - [x] Fail sớm với message rõ nếu thiếu env var
- [x] Task 3: Confirm prompt + delete logic (AC: 1)
  - [x] Prompt readline: in target URL + số households hiện có, bắt gõ đúng chuỗi `RESET` mới chạy
  - [x] Đã đọc FK definitions: hầu hết cascade từ households NHƯNG `category_groups`/`categories` KHÔNG cascade, transactions ref categories/accounts/funds không cascade → dùng ordered delete con-trước-cha (22 bảng, xem `DELETE_ORDER` trong script)
  - [x] KHÔNG đụng `auth.users`, KHÔNG đụng rows `household_id IS NULL`
- [x] Task 4: Verify + report (AC: 2)
  - [x] Verify đổi sang **dynamic before/after** (user quyết định 02-07): capture system seed counts trước khi xoá, assert sau khi xoá không đổi (fail cứng nếu script làm mất seed); warn nếu counts ≠ 7/20/38 docs kỳ vọng — phát hiện seed drift thực tế: categories 35/38
  - [x] In report: số rows xoá per table
  - [x] Chạy lần 2: exit sạch, 0 deletions
- [x] Task 5: Manual verification (AC: 1, 2)
  - [x] `npm run type-check`: script 0 errors (2 errors pre-existing tại `src/app/(app)/layout.tsx:82-83` — file không thuộc story, có từ baseline)
  - [x] Chạy script trên local Supabase với test fixture thật (69 rows xoá, FK order pass); redirect `/setup` verify bằng manual trace `src/middleware.ts:33` (join `household_members!inner` rỗng → gate đẩy về `/setup`)
  - [x] App không crash: reset về trạng thái tương đương fresh install — dashboard redirect về setup là hành vi đúng theo middleware gate

## Dev Notes

### Corrections so với epic AC (nguồn sự thật = codebase, đã recon 02-07-2026)

- **KHÔNG có flag `onboarding_completed` per-user.** Flag nằm ở bảng `households` (boolean). Middleware (`src/middleware.ts:33`) join `household_members!inner` → user không còn membership = tự động về `/setup`. Xoá households là đủ đạt intent của AC — đừng tìm bảng profiles/users để reset.
- **"18 budget lines template" KHÔNG nằm trong DB seed.** `005_seed.sql` chỉ seed cost_types/category_groups/categories. 18 budget lines là app constant `src/lib/constants/budgetTemplate.ts` (`BUDGET_TEMPLATE`, sortOrder 1-18) — INSERT vào `budget_baselines` per household lúc onboarding. Script không cần (và không được) đụng gì để "giữ" nó.
- **Fund RPCs tên thật:** `fund_contribute` / `fund_withdraw` / `reset_freedom_funds` (003_functions.sql) — KHÔNG phải `contribute_to_fund`/`withdraw_from_fund` như alias trong docs. Không liên quan trực tiếp story này nhưng đừng "sửa" tên khi đọc code.

### Architecture patterns & constraints

- Script = system operation → service role key, bypass RLS (AD-2). Chạy CLI, ngoài Next.js runtime — AD-5 không áp (không phải route), nhưng nguyên tắc giữ nguyên: service key không bao giờ vào client bundle. `scripts/` ngoài `src/` đảm bảo điều này.
- `complete_onboarding` RPC hiện hành (`006_onboarding.sql:57-200`) là atomic all-or-nothing, có idempotency guard — story 4.4 sẽ thay bằng `complete_onboarding_v2`. Script reset này KHÔNG sửa function nào, chỉ xoá data.
- `clone_category_hierarchy` (`006_onboarding.sql`) clone system rows → household copies (`is_system=false`). Đây là lý do phải giữ system rows nguyên vẹn: onboarding v2 (story 4.4) sẽ clone lại từ chính chúng.
- TypeScript strict, không `any`, `throw new Error(msg)` — áp dụng cả cho script.

### Source tree components to touch

| File | Action |
|------|--------|
| `scripts/reset-test-data.ts` | NEW — toàn bộ logic |
| `package.json` | UPDATE — devDep `tsx` + script `db:reset-test` |

Không đụng: `src/**`, `supabase/migrations/**` (migrations là lịch sử — không sửa file cũ).

### Testing standards summary

Học từ retro epic 3 (near-miss `database.ts` revert): script chạm DB = high-risk. Verification bắt buộc, không chỉ type-check:
1. Dry-run mindset: print counts trước khi prompt confirm
2. Assert system seed counts (7/20/38) sau khi chạy — fail loud
3. Chạy 2 lần liên tiếp — lần 2 phải 0 deletions, exit 0
4. Login user cũ → `/setup` redirect (manual)

Không cần unit test Vitest cho one-off dev script — verification steps trên thay thế.

### Project Structure Notes

- `scripts/` là thư mục MỚI (chưa tồn tại) — đặt ngang `src/`, `supabase/`
- Convention import `@/*` chỉ dùng trong `src/` — script đứng độc lập
- `.env.example` xác nhận 3 env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story-4.1] — story gốc + ACs
- [Source: _bmad-output/planning-artifacts/prds/prd-onboarding-v2-2026-07-02/prd.md#F6] — FR21
- [Source: supabase/migrations/005_seed.sql] — system seed (7 cost_types, 20 groups, 38 categories, idempotent)
- [Source: supabase/migrations/006_onboarding.sql:57-200] — complete_onboarding + clone_category_hierarchy
- [Source: supabase/migrations/002_tables.sql] — FK definitions, xác định delete order
- [Source: src/middleware.ts:33] — onboarding gate join household_members
- [Source: src/lib/constants/budgetTemplate.ts:37-198] — BUDGET_TEMPLATE 18 lines
- [Source: docs/04_TECHNICAL_SPEC.md#7-SEED-DATA-SPEC] — seed spec
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-02-07-2026.md] — learning: verify nghiệp vụ, không chỉ type-check

## Dev Agent Record

### Agent Model Used

claude-fable-5 (Claude Fable 5)

### Debug Log References

- supabase-js v2 realtime yêu cầu WebSocket global — Node 20.19 chưa bật mặc định → thêm `NODE_OPTIONS=--experimental-websocket` vào npm script (không thêm dep `ws`)
- `complete_onboarding` + `fund_contribute` RPC có auth guard (`get_user_household_ids()` cần `auth.uid()`) → service role không gọi được; test fixture dựng bằng `clone_category_hierarchy` (không guard) + direct inserts
- Phát hiện seed drift: `005_seed.sql` chỉ có **35** system categories, docs/01 + memory nói **38** (khớp Google Sheet 21-06). User quyết: dynamic verify + warn, drift xử lý riêng ngoài story

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| Xoá toàn bộ dữ liệu household-scoped, FK order không vỡ | Automated run trên local Supabase với fixture thật (household + member + 35 cloned categories + account + income + transaction ref category/account + fund + fund_transactions ref fund/transaction) | ✅ 69 rows xoá, exit 0, không FK violation |
| System seed giữ nguyên sau reset | Automated — script assert before/after counts | ✅ 7/20/35 không đổi; warn drift 35 vs 38 in đúng |
| Auth users giữ nguyên | Automated — `auth.admin.listUsers()` sau reset | ✅ 3 users còn (kể cả dtdung.dev@gmail.com) |
| Confirm prompt chặn khi gõ sai | Automated — pipe `"no"` | ✅ "Huỷ — không xoá gì", 0 deletions |
| Idempotent — chạy lần 2 | Automated — chạy lại ngay sau reset | ✅ 0 deletions, exit 0 |
| User login sau reset → về `/setup` | Manual trace `src/middleware.ts:33` — join `household_members!inner` rỗng → gate redirect `/setup` | ✅ theo code path; CHƯA verify trên browser thật |
| Regression | `npm test` | ✅ 310/310 pass |

### Completion Notes List

- Script `scripts/reset-test-data.ts`: ordered delete 22 bảng (con-trước-cha vì `categories`/`category_groups` không cascade từ households), confirm prompt `RESET`, dynamic seed verify before/after + warn drift, idempotent
- `package.json`: devDep `tsx@^4`, script `db:reset-test`
- Deviation từ AC gốc (user approve 02-07): verify seed đổi từ hardcode 7/20/38 fail-loud → dynamic before/after fail + warn khi lệch docs, vì seed thực tế 35 categories (drift 3 so với docs — cần xử lý riêng, ngoài scope story này)
- 2 auth users test (`reset-test-*@test.local`) còn lại trong local DB — chủ đích (script không đụng auth), xoá tay nếu muốn

### File List

- `scripts/reset-test-data.ts` (NEW)
- `package.json` (UPDATE — devDep tsx, script db:reset-test)
- `package-lock.json` (UPDATE — tsx install)

## Change Log

- 02-07-2026: Story 4.1 implemented — reset script + tsx infra; verify strategy đổi sang dynamic before/after theo user decision (seed drift 35/38 phát hiện trong lúc dev)
