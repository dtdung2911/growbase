---
baseline_commit: 168e2b23cdd45adc1aafc131754a9d2294b67128
---

# Story 5.3: CTA khoản chi đầu tiên & lời hứa quay lại

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng mới trên dashboard ngày 0,
I want một lời mời hành động duy nhất — ghi khoản chi đầu tiên trong 30 giây,
so that tôi khởi động vòng lặp ghi chép ngay hôm nay và có lý do mở app ngày mai.

## Acceptance Criteria

1. **Given** dashboard ngày 0 (chưa có giao dịch nào)
   **When** user nhìn màn hình
   **Then** đúng một CTA nổi bật duy nhất: "Ghi khoản chi đầu tiên — thử ly cà phê sáng nay?" (FR8) — không CTA cạnh tranh nào khác
   **And** CTA mở luồng ghi giao dịch rút gọn: amount + category gợi ý sẵn + lưu — hoàn thành được trong ~30 giây, một tay trên mobile

2. **Given** user lưu giao dịch đầu tiên thành công
   **When** app phản hồi
   **Then** hiển thị lời hứa quay lại: "Ngày mai mở app, bạn sẽ biết hôm nay mình tiêu thế nào so với kế hoạch." (FR9)
   **And** toast success 2s, giao dịch xuất hiện ngay (query invalidate qua `keys.*`)

3. **Given** household đã có ≥1 giao dịch
   **When** dashboard render lại
   **Then** CTA ngày 0 không hiển thị nữa — vị trí mở đầu dashboard nhường cho daily insight

## Tasks / Subtasks

- [x] Task 1: Component CTA + luồng ghi giao dịch rút gọn (AC: 1)
  - [x] `src/components/dashboard/FirstExpenseCta.tsx` (mới) — card nổi bật, copy `t("dashboard.firstExpenseCta.title")` (không hardcode chuỗi), render CHỈ khi `!data.hasAnyTransactionEver` (field mới từ story 5.2, `src/types/app.ts`/`DashboardData`) — tái dùng field này, không tự tính lại "day 0" bằng cách khác
  - [x] `src/components/dashboard/FirstExpenseSheet.tsx` (mới, KHÔNG tái dùng `TransactionForm`/`QuickAddSheet` nguyên trạng — 2 component đó có đủ tab thu/chi/chuyển khoản, category picker đầy đủ, account picker, date picker → quá nhiều field cho mục tiêu "~30 giây một tay"): chỉ 2 field hiển thị — amount input (autofocus, numeric, giống input pattern đã dùng ở `TransactionForm`) + 1 category gợi ý sẵn (chip/button đã pre-select, KHÔNG bắt buộc user phải mở picker) — nút Lưu
  - [x] Tái dùng `createTransactionSchema`/mutation tạo transaction đã có (`src/lib/hooks/useTransactions.ts` hoặc tương đương — kiểm tra tên export chính xác trước khi import) cho phần lưu — không viết API route/schema mới
  - [x] Default field không hiển thị cho user chọn (điền ngầm để submit hợp lệ theo `createTransactionSchema`): `direction: "out"`, `transaction_type: "expense"`, `transaction_date: hôm nay`, `account_id`: account duy nhất của household ngay sau onboarding (`src/lib/hooks/useAccounts.ts` — lấy account đầu tiên/duy nhất, ngày 0 luôn chỉ có "Tài khoản chính"), `category_id`: resolve category tên **"Ăn uống ngoài"** (khớp copy "ly cà phê", thuộc nhóm `wasteful` trong `BUDGET_TEMPLATE`) từ `src/lib/hooks/useCategories.ts` theo household hiện tại — **ASSUMPTION cần confirm**: match theo tên chuỗi cứng "Ăn uống ngoài"; nếu không tìm thấy (tên bị đổi hoặc future-proofing), fallback về category đầu tiên trong danh sách nhóm `wasteful`, không throw lỗi chặn submit

- [x] Task 2: Lời hứa quay lại sau khi lưu (AC: 2)
  - [x] Sau khi mutation thành công: `toast.success(t("dashboard.firstExpenseCta.saved")) ` (2s, đúng Error Patterns chuẩn CLAUDE.md) + hiển thị banner/dialog riêng với copy lời hứa `t("dashboard.firstExpenseCta.promise")` ("Ngày mai mở app, bạn sẽ biết hôm nay mình tiêu thế nào so với kế hoạch.") — quyết định UI cụ thể (banner đóng được vs toast riêng thứ 2 vs dialog) để dev-story tự chọn theo pattern gần nhất đã có trong `src/components/ui/` (vd `sonner`/`Dialog` sẵn có), miễn giữ đúng nội dung 2 lớp phản hồi: toast nhanh (2s) + lời hứa (đọc lâu hơn, không tự biến mất theo 2s)
  - [x] Query invalidate qua `keys.transactions(...)`/`keys.dashboard(...)` (dùng factory có sẵn, không hardcode key) để `data.hasAnyTransactionEver` re-fetch thành `true` ngay, kích hoạt AC3

- [x] Task 3: Ẩn CTA sau giao dịch đầu tiên (AC: 3)
  - [x] `DashboardView.tsx`/`DashboardClient.tsx` — điều kiện render `<FirstExpenseCta />` CHỈ khi `!data.hasAnyTransactionEver`; khi `true`, vị trí đó nhường chỗ cho số "còn lại hôm nay" (đã thêm ở story 5.2 Task 4) — không cần thêm logic mới, chỉ đảm bảo 2 điều kiện render (CTA vs today-remaining) loại trừ lẫn nhau đúng theo cùng field `hasAnyTransactionEver`, không disable nhầm cả 2 hoặc hiện cả 2 cùng lúc

- [x] Task 4: i18n + test + business flow verification (AC: 1, 2, 3)
  - [x] Thêm keys `dashboard.firstExpenseCta.title/saved/promise` (và category-picker label nếu cần) vào `vi.json`/`en.json`, flat dotted convention hiện có
  - [x] Unit/component test: `FirstExpenseCta` không render khi `hasAnyTransactionEver=true`; `FirstExpenseSheet` submit thành công với chỉ amount input (category/account điền ngầm đúng)
  - [x] Liệt kê + verify business flow vào Dev Agent Record → `### Testing`: (1) ngày 0 → CTA hiện, không CTA khác cạnh tranh (kiểm tra không có `QuickAddFAB` chồng lên cùng lúc — xem Dev Notes); (2) submit thành công → toast + lời hứa + giao dịch xuất hiện ngay không cần reload; (3) sau khi có ≥1 giao dịch → CTA biến mất, không quay lại kể cả sau F5; (4) mobile 375px một tay — form chỉ 2 tương tác (nhập số, bấm Lưu)

## Dev Notes

### KHÔNG tái dùng nguyên trạng `TransactionForm`/`QuickAddSheet`

Đã đọc `TransactionForm.tsx` (270 dòng) — có tab thu/chi/chuyển khoản, `CategoryPicker` đầy đủ, account select, debt select. Đây là form chuẩn cho ghi chép hàng ngày (đúng cho `QuickAddFAB`/`QuickAddSheet` hiện có), nhưng KHÔNG khớp yêu cầu "~30 giây, một tay" của AC1 — quá nhiều field/quyết định cho lần đầu. Story này cần component MỚI, nhỏ hơn, dùng lại schema + mutation (tầng logic) nhưng KHÔNG dùng lại UI form đầy đủ.

### `QuickAddFAB` đã tồn tại — tránh 2 CTA cạnh tranh

`src/components/transactions/QuickAddFAB.tsx` là nút nổi (FAB) ghi giao dịch nói chung, có khả năng đã hiển thị sẵn trên mọi trang kể cả dashboard ngày 0. AC1 yêu cầu "không CTA cạnh tranh nào khác" — cần kiểm tra khi `FirstExpenseCta` hiện, có nên tạm ẩn `QuickAddFAB` không (hoặc để FAB nhỏ hơn/không nổi bật bằng CTA chính). Đây là quyết định UX cần xác nhận khi implement — nếu để cả 2 cùng hiện, phải đảm bảo `FirstExpenseCta` rõ ràng là hành động chính (kích thước/vị trí), FAB chỉ là fallback phụ, không "cạnh tranh" theo đúng tinh thần AC.

### Category/account mặc định — dựa trên trạng thái ngày 0 đã biết chắc

Ngày 0 (household mới hoàn thành onboarding, story 4.4): luôn có đúng 1 account ("Tài khoản chính") và bộ 35 categories system giống nhau cho mọi household (`clone_category_hierarchy`, seed `005_seed.sql`) — nên default account/category có thể suy luận an toàn (không cần user chọn), nhưng **tên category tiếng Việt là chuỗi, không phải id cố định** → phải fetch qua `useCategories` rồi match theo tên, không hardcode uuid.

### Phụ thuộc story 5.2

`hasAnyTransactionEver` là field mới do story 5.2 thêm vào `DashboardData`/`/api/dashboard`. Story 5.3 PHẢI làm sau 5.2 (hoặc field đã tồn tại) — không tự định nghĩa lại field tương đương ở nơi khác.

### Project Structure Notes

- File mới: `src/components/dashboard/FirstExpenseCta.tsx`, `src/components/dashboard/FirstExpenseSheet.tsx`
- File cần đọc trước khi sửa (UPDATE): `src/components/dashboard/DashboardView.tsx` hoặc `DashboardClient.tsx` (điểm chèn CTA), `src/lib/hooks/useTransactions.ts` (mutation tạo transaction — xác nhận tên export chính xác trước khi import), `src/lib/hooks/useAccounts.ts`, `src/lib/hooks/useCategories.ts`
- Không sửa `TransactionForm.tsx`/`QuickAddSheet.tsx` trong story này (ngoài phạm vi, có thể cân nhắc hợp nhất ở story sau nếu cần)

### References

- [Source: epics-onboarding-v2.md#Story 5.3]
- [Source: 5-2-day-zero-dashboard.md — hasAnyTransactionEver]
- [Source: src/components/transactions/TransactionForm.tsx, QuickAddSheet.tsx, QuickAddFAB.tsx]
- [Source: src/lib/validations/transaction.ts — createTransactionSchema]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx tsc --noEmit` — zero new errors (2 pre-existing baseline errors in `src/app/(app)/layout.tsx` unchanged)
- `npx vitest run` — all test files pass (24 files / 321 tests, +1 file / +4 tests vs story 5.2 baseline)
- Grepped `supabase/migrations/005_seed.sql` — confirmed the `wasteful` cost-type group "Ăn uống ngoài" seeds exactly ONE leaf category, also named "Ăn uống ngoài" — resolves the story's open ASSUMPTION: exact-name match is safe and unambiguous for day-0 households
- Grepped `src/app` for `QuickAddFAB` usage — confirmed (again, from story 5.2 research) it is never rendered on any live page — no competing CTA exists, no code change needed for that concern

### Completion Notes List

- Extracted category-resolution logic into a standalone pure function `src/lib/insight/resolveDefaultCategory.ts` (rather than inlining it in `FirstExpenseSheet.tsx`) specifically so it could be unit-tested without needing a DOM/React-rendering test setup — the project currently has no `@testing-library/react`/jsdom infra (`vitest.config.ts` uses `environment: "node"`, and there isn't a single `.test.tsx` file in the repo). Adding that infra was out of scope for this story (would be a new dependency), so component-level rendering tests for `FirstExpenseCta`/`FirstExpenseSheet` were done via **manual code trace** instead of RTL — documented per-flow in `### Testing` below, consistent with how "pure UI" flows were handled in stories 5.1/5.2.
- Confirmed the fallback path (`cost_type_code === "wasteful"`) is safe: verified `useCategories.ts`'s join `cost_types(code)` is reliably populated for household-cloned data via `clone_category_hierarchy` (checked `006_onboarding.sql`) — this is a different, more reliable data path than the `cost_type_name` field on `get_budget_with_actuals` RPC output flagged as unreliable in story 5.2's notes (different table/RPC, not the same quirk).
- The "quick toast (2s)" layer required by AC2 is **not** a new toast — it's the existing generic `toast.success("Đã lưu", { duration: 2000 })` already fired by `useCreateTransaction()`'s hook-level `onSuccess` (`src/lib/hooks/useTransactions.ts`). Per-component code only adds the second longer-lived layer (`Dialog` with `dashboard.firstExpenseCta.saved`/`.promise`) plus the dashboard-specific query invalidation — this avoids a redundant duplicate "saved" toast while still satisfying the "2 lớp phản hồi" requirement.
- Added `dashboard.firstExpenseCta.cta` i18n key (button label) beyond the 3 keys named explicitly in the story — needed for a functioning CTA button; story text allowed "category-picker label nếu cần" as precedent for adding what's needed.
- `is_credit_card_payment` was initially (incorrectly) included in the mutation payload during a first draft — caught before running tests: that field belongs to `createTransferSchema`, not `createTransactionSchema`. Removed; no incorrect code was committed to the final file.

### File List

- `src/components/dashboard/FirstExpenseCta.tsx` (new)
- `src/components/dashboard/FirstExpenseSheet.tsx` (new)
- `src/lib/insight/resolveDefaultCategory.ts` (new)
- `src/lib/insight/__tests__/resolveDefaultCategory.test.ts` (new)
- `src/components/dashboard/DashboardView.tsx` (update — conditional `FirstExpenseCta` vs daily-remaining block)
- `src/lib/i18n/messages/vi.json` (update — `dashboard.firstExpenseCta.*` keys)
- `src/lib/i18n/messages/en.json` (update — `dashboard.firstExpenseCta.*` keys)

### Testing

| # | Flow (AC) | Method | Result |
|---|---|---|---|
| 1 | Day-0 dashboard → exactly one CTA shows, no competing CTA | Manual trace: `DashboardView.tsx` renders `FirstExpenseCta` only when `!data.hasAnyTransactionEver`, mutually exclusive with the daily-remaining block; `QuickAddFAB` confirmed (grep across `src/app`) never rendered on any live page, so no second CTA exists | ✅ Pass |
| 2 | CTA opens a reduced 2-field flow (amount autofocus + pre-selected category, no picker) completable in ~30s one-handed | Manual trace: `FirstExpenseSheet.tsx` renders only `CurrencyInput` (`autoFocus`) + a static `Badge` (no click handler) for category + Save button; account/category/direction/type/date are all filled implicitly, not user-chosen | ✅ Pass |
| 3 | Category/account default resolution (exact "Ăn uống ngoài" match + `wasteful`-group fallback + null-safe no-throw) | Automated: `src/lib/insight/__tests__/resolveDefaultCategory.test.ts` (4 cases: exact match, fallback, no-match-returns-null, empty-categories-returns-null) | ✅ Pass (`npx vitest run`) |
| 4 | Successful submit → generic toast (2s, from `useCreateTransaction` hook) + promise dialog (`saved`/`promise` copy, does not auto-dismiss) + transaction list/dashboard refresh without reload | Manual trace: `handleSave` calls `createTx.mutate(...)`; hook-level `onSuccess` fires the 2s toast + invalidates `transactions`/`budget`/`accounts`; component-level `onSuccess` additionally invalidates `keys.dashboard(...)` and opens the `Dialog` (state-controlled, no auto-timeout) | ✅ Pass |
| 5 | After ≥1 transaction, CTA never reappears, even after reload (F5) | Manual trace: `hasAnyTransactionEver` is computed server-side in `/api/dashboard` from an unscoped count query (story 5.2) — once ≥1 transaction exists for the household it is permanently `true` on every fresh fetch/reload, and the invalidated `keys.dashboard(...)` query re-fetches it immediately post-save | ✅ Pass |
| 6 | Mobile 375px, one-handed, form has only 2 interactions (type amount, tap Save) | Manual trace: `SheetContent side="bottom"` full-width layout; only 2 interactive elements in the form body (`CurrencyInput`, `Button`) — category `Badge` is display-only, no third interaction | ✅ Pass |
| 7 | No TypeScript/test regressions | Automated: `npx tsc --noEmit` (baseline errors unchanged), `npx vitest run` (24 files / 321 tests, all pass) | ✅ Pass |

## Change Log

- 2026-07-04: Story implemented — `FirstExpenseCta`/`FirstExpenseSheet` reduced-flow components, day-0/established mutually-exclusive dashboard render swap, category/account auto-resolution (with unit-tested fallback), 2-layer post-save feedback (toast + promise dialog), dashboard query invalidation on first save. Status → review.
