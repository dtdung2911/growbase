---
baseline_commit: a0da13dc3a06a8950e87e3f68ba5256d24405609
---

# Story 7.3: Người thứ hai bước vào

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **vợ/chồng vừa nhận lời mời và accept**,
I want **bước thẳng vào Dashboard thấy đúng mục tiêu / ngân sách / "còn lại hôm nay" mà người mời đã dựng — không phải onboarding lại**,
so that **gia nhập là bước vào một không gian đã có sẵn, không phải bắt đầu từ số 0**.

## Acceptance Criteria

**AC1 — Accept invite → thẳng Dashboard, KHÔNG bị đẩy về /setup (FR20)**
**Given** người thứ hai accept invite hợp lệ (story 7.1 flow: `accept_invitation` RPC thêm row `household_members`)
**When** họ vào app sau khi accept
**Then** middleware **KHÔNG** redirect họ tới `/setup` — vì household đã `onboarding_completed = true`
**And** họ land trên `/dashboard`

**AC2 — Thấy đúng dữ liệu chung của household (FR20)**
**Given** người thứ hai đã trong household
**When** Dashboard load
**Then** họ thấy **cùng** goals / budget / "còn lại hôm nay" như người mời — vì mọi dữ liệu household-scoped theo `householdId`, không tách theo user
**And** daily insight, goal narrative, milestone celebration (FR16 / 7.1) hoạt động cho cả hai

**AC3 — Insight tính trên tổng household, KHÔNG tách "tiền anh/tiền em"**
**Given** household có 2 thành viên
**When** hệ thống tính insight / "còn lại hôm nay" / tiến độ goal
**Then** tính trên **tổng** thu-chi household, KHÔNG chia hay hiển thị tách theo từng người
**And** nhãn household tự suy "Gia đình" khi ≥2 thành viên (đã dựng ở 7.1 — verify)

**AC4 — Khai báo thu nhập theo từng thành viên (tuỳ chọn, AR9)**
**Given** thu nhập hiện là các `income_sources` household-scoped, cột `member_id` nullable đã tồn tại (AR9: income KHÔNG gắn cứng user_id)
**When** user tạo/sửa một nguồn thu nhập
**Then** có thể **tuỳ chọn** gán nguồn đó cho một thành viên (dropdown chọn từ household members) — để trống = thu nhập chung/chưa gán
**And** đây là tuỳ chọn, không bắt buộc; tổng thu nhập household không đổi cách tính (chỉ thêm thuộc tính "của ai")

## Tasks / Subtasks

- [x] Task 1: Verify accept → Dashboard, không /setup (AC1) — VERIFY-ONLY, sửa nếu lệch
  - [x] 1.1 Đọc `src/middleware.ts` (logic `needsSetup` line 30-51): xác nhận `needsSetup = rows.length === 0 || rows.some((m) => !m.households.onboarding_completed)`. Người thứ hai join household đã `onboarding_completed = true` → chỉ có 1 membership row completed → `needsSetup = false` → KHÔNG redirect /setup. **Kết quả: khớp AC1, không sửa.**
  - [x] 1.2 Đọc `src/app/invite/[token]/InviteClient.tsx` (`handleAccept` line 71-76): sau accept `router.push("/dashboard")` ✓. Verify `accept_invitation` RPC (`supabase/migrations/003_functions.sql:357-393`): chỉ INSERT `household_members` + UPDATE invitation status='accepted', **KHÔNG đụng `households.onboarding_completed`** → không reset về false. **Kết quả: khớp, không sửa.**
  - [x] 1.3 Đọc `src/app/(app)/layout.tsx` (line 55-100): `householdId` set vào appStore từ `household_members` của user (validId từ allHouseholds). Người thứ hai giờ có membership row → householdId populate đúng. **Kết quả: khớp, không sửa.**
  - [x] 1.4 Không phát hiện lệch. Không sửa gì ở Task 1.
- [x] Task 2: Verify dữ liệu household-scoped hiển thị cho member mới (AC2, AC3) — VERIFY-ONLY
  - [x] 2.1 `/api/income-sources` + `/api/dashboard` scope theo `householdId` (`.eq("household_id", ...)`), KHÔNG filter money theo user_id → member mới thấy đúng dữ liệu chung. **Khớp AC2.**
  - [x] 2.2 Grep insight/dashboard: không có logic "tiền anh/tiền em"/per-user money split. `split` matches = date `.split("-")`. Insight household-scoped. **Khớp AC3.**
  - [x] 2.3 Nhãn "Gia đình" ≥2 thành viên đã dựng ở 7.1 (`HouseholdSettingsForm.tsx`, derive member count). **Verify không sửa.**
  - [x] 2.4 Grep `user_id`: hit duy nhất trong `/api/dashboard/route.ts:180` là **member activity streak (7.2, `member_activity` table)** — metric hoạt động cá nhân, KHÔNG phải chia tiền theo user → không vi phạm AC3. Ghi rõ.
- [x] Task 3: Thu nhập theo thành viên — dropdown chọn member (AC4) — BUILD THẬT
  - [x] 3.1 `IncomeSourceForm.tsx`: thay `Input` free-text `memberId` bằng shadcn **Select** liệt kê `useMembers().data.members`, option đầu "Chung / chưa gán". Radix Select cấm value rỗng → dùng sentinel `SHARED = "__shared__"` map về `""` → `member_id: undefined`. `member_id` giữ optional trong schema (không đổi).
  - [x] 3.2 `IncomeManager.tsx` build `memberNameById` map từ `useMembers()`, truyền `ownerName` xuống `IncomeSourceCard`. Card render badge tên thành viên khi `member_id` có giá trị; null → không badge.
  - [x] 3.3 KHÔNG đổi cách tính tổng income: `/api/income-sources` GET trả tất cả rows household-scoped, filter theo `is_current` (không theo member). `member_id` chỉ là metadata. **AR9 giữ nguyên.**
  - [x] 3.4 i18n: sửa `settings.income.memberPlaceholder` ("UUID thành viên"→"Chọn thành viên"), thêm `settings.income.shared` vào `vi.json` + `en.json`.
- [x] Task 4: Tests + verify
  - [x] 4.1 Middleware logic verify bằng manual trace (pure boolean, node env không có harness cho Next middleware + supabase network). Membership completed → không redirect; no membership → `rows.length===0` → redirect /setup (hành vi cũ giữ nguyên).
  - [x] 4.2 Contract `member_id` (optional uuid, omit→undefined) đã cover đầy đủ bởi `src/__tests__/validations/income-source.test.ts` (lines 47-67). Sentinel mapping form (UI glue) verify bằng trace. Tổng income không đổi (verify 3.3).
  - [x] 4.3 `npx tsc --noEmit` exit 0; `npx vitest run` 391/391 pass. Baseline trước khi sửa: 391/391 (đã tăng từ 381 của 7.1). Zero regression.
  - [x] 4.4 `### Testing` table điền đầy đủ bên dưới.

### Review Findings (code review 09-07-2026, range 954f19c..HEAD)

- [x] [Review][Decision] Badge chủ sở hữu biến mất khi member bị deactivate: `memberNameById` build từ `useMembers()` (chỉ `is_active=true`) → nguồn thu của member đã rời hiển thị y hệt "chung/chưa gán", PUT tiếp tục nhân bản `member_id` mồ côi vào SCD record mới. **Quyết: hiện badge fallback "Thành viên cũ" (đã implement).** [src/components/settings/IncomeManager.tsx:20-22, IncomeSourceCard.tsx:27]
- [x] [Review][Patch] (Major) AC4 chỉ đạt một nửa: "tạo/**sửa**" nhưng Select member chỉ render `{!isEdit && ...}`, `updateIncomeSourceSchema` không có `member_id`, PUT route carry-forward `old.member_id` → không thể gán lại/bỏ gán sau khi tạo, trừ khi delete+recreate [src/components/settings/IncomeSourceForm.tsx:138, src/lib/validations/income-source.ts:9, src/app/api/income-sources/[id]/route.ts:60]
- [x] [Review][Defer] POST /api/income-sources không validate `member_id` thuộc household (schema chỉ check UUID shape, FK global) — cross-household/inactive member id được chấp nhận, UUID lạ trả 500 thay vì 400 — deferred, pre-existing route, UI mới chỉ đưa member hợp lệ [src/app/api/income-sources/route.ts:41-48]

### Review Findings (vòng 2, 09-07-2026)

- [x] [Review][Patch] (High) PUT income-source close-then-insert không atomic + không validate member: mở form sửa, member bị owner khác xoá, save → step 1 đã set `is_current=false`, step 2 insert fail FK → nguồn thu biến mất khỏi danh sách hiện tại. Vòng 1 defer validation cho POST, nhưng PUT giờ nhận `member_id` từ client (route dùng `supabaseAdmin` bypass RLS) nên còn nhận cả member household khác. Fix: validate `member_id` thuộc active members của household TRƯỚC khi close record cũ (chung fix cho cả 2 lỗ) [src/app/api/income-sources/[id]/route.ts:43-70]
- [x] [Review][Patch] Badge "Former member" hiện sai khi `useMembers` đang loading/error: map rỗng → mọi source có gán đều bị dán badge. Gate theo members đã load xong [src/components/settings/IncomeManager.tsx:80-81]
- [x] [Review][Patch] Doc sync: tick Decision #1 (badge fallback — đã implement) + Patch AC4 (đã fix end-to-end, verify form seed `source.member_id`), bổ sung File List (`income-source.ts`, `income-sources/[id]/route.ts`, `IncomeSourceCard`), Change Log entry [7-3 story file]
- [x] [Review][Defer] Edit form không hiển thị được orphan assignment: Select value = uuid mồ côi → trigger render placeholder "Chọn thành viên" nhưng submit vẫn giữ orphan id — list badge nói "Thành viên cũ", form nói "chưa gán" — deferred, UX inconsistency nhỏ, user có thể reassign [src/components/settings/IncomeSourceForm.tsx:143-158]

### Phát hiện quan trọng nhất (đọc trước khi code)

**Phần lớn story 7.3 ĐÃ hoạt động — đây chủ yếu là VERIFY-ONLY.** Recon xác nhận:
- Middleware KHÔNG đẩy người thứ hai về `/setup`: `needsSetup = (không có membership row) OR (có household `onboarding_completed = false`)`. Người thứ hai join household đã complete → `needsSetup = false` (`src/middleware.ts:35-46`).
- Toàn bộ Dashboard (goals/budget/remaining/insight/milestone) household-scoped theo `householdId` — member mới thấy đúng dữ liệu chung tự động (`useDashboard.ts`, `useBudget.ts`, `/api/dashboard/route.ts`, `DailyInsightBanner.tsx`, `goalInsight.ts`, `goalMilestone.ts`).
- Nhãn "Gia đình" ≥2 thành viên đã dựng ở 7.1 (`HouseholdSettingsForm.tsx`).

**Build thật DUY NHẤT = AC4 (per-member income UI).** Schema đã sẵn: `income_sources.member_id uuid REFERENCES household_members(id)` nullable (`supabase/migrations/002_tables.sql:49`). `IncomeSourceForm.tsx` hiện có field `memberId` nhưng là **text Input**, không có dropdown chọn thành viên → chuyển thành Select từ `useMembers()`. KHÔNG cần migration mới.

**AR9 quan trọng**: income gắn household, `member_id` chỉ là metadata tuỳ chọn "của ai" — KHÔNG được biến tổng income thành per-user. Insight vẫn tính trên tổng household (AC3).

### Files sẽ đụng

- `src/components/settings/IncomeSourceForm.tsx` (UPDATE — build thật) — hiện field `memberId` là `Input` text (~line 132). Đổi thành Select dropdown từ `useMembers()`, option rỗng = null. Đọc file đầy đủ trước khi sửa (RHF + Zod pattern), giữ nguyên các field khác + validation.
- `src/app/(app)/settings/income/page.tsx` + `src/lib/hooks/useIncomeSources.ts` (UPDATE nhẹ) — hiển thị tên member nếu có `member_id`.
- `src/lib/i18n/messages/{vi,en}.json` (UPDATE) — keys mới.
- `src/middleware.ts`, `src/app/invite/[token]/InviteClient.tsx`, `src/app/(app)/layout.tsx`, các dashboard hook/insight file — **READ để verify**, chỉ sửa nếu phát hiện lệch AC.

### Files mới (NEW)

- Không bắt buộc file mới. (Có thể thêm test file colocated nếu chưa có cho income form / middleware.)

### Architecture compliance (bắt buộc)

- **AD-1**: nếu đụng route (không dự kiến) → `withAuth()` first, `{ data, error }`.
- **AD-3**: KHÔNG thêm state household-scoped vào Zustand. Member list qua `useMembers()` (`keys.members(hid)`).
- **AR9**: income household-scoped, `member_id` optional metadata — KHÔNG chuyển tổng income sang per-user.
- **A-4**: query keys qua factory `src/lib/queries/queryKeys.ts`.
- **A-5**: mọi string qua `t()` vi+en.
- **A-6**: settings pages là thin wrapper, logic ở client component.

### UI/Style (docs/06_STYLE_GUIDE.md là authority)

- Select dropdown theo component chuẩn dự án (shadcn Select nếu form khác đang dùng, hoặc pattern hiện có trong IncomeSourceForm — verify component nào đang dùng để đồng bộ). Input `h-[44px] rounded-[18px] border border-border`, focus `ring-2 ring-primary/20`. Không hardcode màu. Icon `@iconify/react`.
- Touch target ≥44px, mobile 375px, input font 16px.

### Previous story intelligence (7.1)

- 7.1 đã dựng: nhãn household tự suy (≥2 → "Gia đình"), `/settings/members` canonical, `useMembers()` trả members + `isOwner` + loading. Bài học: chỉ render label/logic khi `!isLoading && data` (tránh flash). Áp dụng cho dropdown member (chờ members load).
- `accept_invitation` RPC + invite accept flow đã hoạt động (7.1 verify). 7.3 KHÔNG sửa flow accept, chỉ verify nó không phá setup gate.
- Baseline test cuối 7.1: **381/381 pass** — xác nhận lại trước khi thêm.

### Git intelligence

- Pattern nhất quán qua các epic: verify-only tasks ghi rõ trạng thái; i18n thêm cả 2 file; RHF+Zod cho form; colocated test. Theo đúng. Migration cao nhất `013_onboarding_multi_goal.sql` (story này KHÔNG cần migration).

### Latest tech

- Stack cố định. Select: dùng đúng component library form hiện tại (kiểm tra IncomeSourceForm import). Không thêm dependency.

### Testing requirements

- Vitest, colocated `__tests__/`.
- Business flows verify (ghi `### Testing` table): (1) member có membership + household completed → middleware không redirect /setup; user không membership → vẫn redirect (regression); (2) accept → land /dashboard, householdId set; (3) member mới thấy cùng goals/budget/remaining (household-scoped, trace); (4) insight/milestone không tách per-user (grep + trace); (5) income form: gán member → member_id đúng, để trống → null; tổng income không đổi; (6) nhãn "Gia đình" ≥2; (7) regression toàn cục vitest+tsc.
- Flow verify-only → manual trace + grep, ghi rõ method.

### Project structure notes

- Không lệch cấu trúc. Chủ yếu sửa 1 component form + verify. Không thêm bảng/route mới.

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Story 7.3] — AC gốc, FR20, AR9, insight không tách per-user
- [Source: _bmad-output/implementation-artifacts/7-1-invite-settings-household-label.md] — accept flow, nhãn household, useMembers pattern
- [Source: supabase/migrations/002_tables.sql] — income_sources.member_id nullable (AR9), household_members schema
- [Source: supabase/migrations/003_functions.sql#accept_invitation] — RPC accept (line 357)
- [Source: src/middleware.ts] — setup gate logic (verify)
- [Source: docs/06_STYLE_GUIDE.md] — form/input/select rules
- [Source: _bmad-output/project-context.md] — bắt buộc đọc trước khi code

### Project context reference

- Đọc `_bmad-output/project-context.md` trước khi code (bắt buộc).
- Áp dụng skill `karpathy-guidelines` trước khi viết code (hard gate theo CLAUDE.md).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- Baseline: `npx tsc --noEmit` exit 0 · `npx vitest run` 391/391 pass (trước khi sửa).
- Sau sửa: `npx tsc --noEmit` exit 0 · `npx vitest run` 391/391 pass. Zero regression.
- ESLint không cấu hình trong project (interactive setup prompt) → skip.

### Implementation Plan

7.3 chủ yếu VERIFY-ONLY; build thật duy nhất = AC4 (per-member income UI):
1. Verify AC1/AC2/AC3 qua đọc code + grep (middleware setup gate, accept_invitation RPC, household-scoped data, không per-user money split).
2. `IncomeSourceForm`: `Input` text member → shadcn `Select` từ `useMembers()`, sentinel cho "chung".
3. `IncomeManager` + `IncomeSourceCard`: badge tên chủ sở hữu nguồn thu khi có `member_id`.
4. i18n `shared` key + đổi placeholder.

### Completion Notes List

- **AC1 verified (không sửa)**: middleware `needsSetup` false cho member join household completed → land /dashboard. `accept_invitation` RPC không reset `onboarding_completed`.
- **AC2/AC3 verified (không sửa)**: mọi money data household-scoped theo `householdId`; không có logic tách "tiền anh/tiền em". Hit `user_id` duy nhất ở `/api/dashboard:180` là activity streak cá nhân (7.2), không phải chia tiền.
- **AC4 built**: dropdown chọn thành viên cho nguồn thu (tuỳ chọn), sentinel `__shared__` → `member_id = undefined`. Badge chủ sở hữu trong list. Tổng income không đổi cách tính (AR9 giữ nguyên).
- Không cần migration mới (`income_sources.member_id` đã nullable).

### Testing

| # | Flow (AC) | Method | Kết quả |
|---|-----------|--------|---------|
| 1 | Member có membership + household completed → middleware KHÔNG redirect /setup (AC1) | Manual trace `src/middleware.ts:30-51` | Pass — `needsSetup=false` khi mọi household completed |
| 2 | User KHÔNG membership → vẫn redirect /setup (regression) | Manual trace | Pass — `rows.length===0` → `needsSetup=true` → redirect /setup, hành vi cũ giữ nguyên |
| 3 | Accept invite → land /dashboard, RPC không reset onboarding (AC1) | Manual trace `InviteClient.tsx:71-76` + `003_functions.sql:357-393` | Pass — `router.push("/dashboard")`, RPC chỉ INSERT member + UPDATE invite status |
| 4 | Member mới thấy cùng goals/budget/remaining (household-scoped) (AC2) | Grep + trace `/api/income-sources`, `/api/dashboard` | Pass — `.eq("household_id", ...)`, không filter money theo user |
| 5 | Insight/số dư KHÔNG tách per-user (AC3) | Grep `user_id`/`split`/"tiền anh" | Pass — hit `user_id` chỉ là activity streak (7.2); `split` là date parse |
| 6 | Income form: gán member → `member_id` gửi đúng; để trống → undefined (AC4) | Automated (schema contract `income-source.test.ts:47-67`) + trace sentinel mapping | Pass — schema optional uuid + omit→undefined covered; form map `__shared__`→`""`→`undefined` |
| 7 | Tổng income household KHÔNG đổi khi gán member (AC4/AR9) | Trace `/api/income-sources` GET | Pass — trả all rows household-scoped filter `is_current`, không theo member |
| 8 | Nhãn "Gia đình" ≥2 thành viên (AC3) | Verify 7.1 `HouseholdSettingsForm.tsx` | Pass — đã dựng ở 7.1, không sửa |
| 9 | Regression toàn cục | Automated `tsc --noEmit` + `vitest run` | Pass — exit 0, 391/391 |

### File List

- `src/components/settings/IncomeSourceForm.tsx` (UPDATE — Select member dropdown thay Input)
- `src/components/settings/IncomeManager.tsx` (UPDATE — resolve member name map, pass ownerName)
- `src/components/settings/IncomeSourceCard.tsx` (UPDATE — badge chủ sở hữu nguồn thu + fallback "Thành viên cũ")
- `src/lib/validations/income-source.ts` (UPDATE — `updateIncomeSourceSchema` thêm `member_id` nullable)
- `src/app/api/income-sources/[id]/route.ts` (UPDATE — PUT validate member_id thuộc active members trước khi close record cũ)
- `src/lib/i18n/messages/vi.json` (UPDATE — memberPlaceholder + shared)
- `src/lib/i18n/messages/en.json` (UPDATE — memberPlaceholder + shared)

## Change Log

- 09-07-2026 — Code-review vòng 2 fixes (xem Review Findings vòng 2)
