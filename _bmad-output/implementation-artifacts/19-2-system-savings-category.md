# Story 19.2: Category hệ thống "Tiết kiệm & Quỹ" + contribute resolve đích danh

Status: done

## Story

As a hệ thống,
I want một category hệ thống duy nhất cho mọi giao dịch nạp quỹ,
so that transaction nạp quỹ luôn nhất quán, không phụ thuộc sort_order.

## Acceptance Criteria

1. Migration 022: template (household_id NULL) có category mới "Tiết kiệm & Quỹ" (`default_behavior_type='savings_investment'`, `is_system=true`, group "Tiết kiệm"); mọi household hiện hữu có bản clone `is_system=true`.
2. Transactions (và estimated_expenses) đang trỏ 3 categories cũ "Quỹ khẩn cấp"/"Quỹ mua sắm"/"Quỹ Future" được remap sang category mới của household tương ứng (template refs → không có, nhưng remap trước khi xóa).
3. 3 categories template cũ + bản clone household bị xóa.
4. `clone_category_hierarchy` giữ `is_system=true` cho category "Tiết kiệm & Quỹ" khi clone cho household tạo sau migration.
5. POST `/api/funds/[id]/contribute` resolve đích danh category hệ thống "Tiết kiệm & Quỹ" của household (`is_system=true` + `default_behavior_type='savings_investment'`), không dò sort_order; trả lỗi rõ ràng nếu không tồn tại.
6. Migration idempotent (chạy lại không lỗi, không nhân đôi).

## Tasks / Subtasks

- [ ] Task 1: Migration `supabase/migrations/022_system_savings_category.sql` (AC: #1,2,3,4,6)
  - [ ] Insert template category "Tiết kiệm & Quỹ" vào group "Tiết kiệm" (household_id NULL, is_system=true, sort_order 1, icon 🐖 hoặc icon phù hợp bộ hiện có) — guard NOT EXISTS
  - [ ] Insert bản clone cho mọi household có group "Tiết kiệm" (map theo group name như pattern 006) — guard NOT EXISTS, is_system=true
  - [ ] UPDATE transactions SET category_id = <new cat cùng household> WHERE category_id IN (3 cats cũ của household đó); tương tự estimated_expenses
  - [ ] DELETE 3 categories cũ (template + household clones) theo name IN (...) AND group name = 'Tiết kiệm'
  - [ ] CREATE OR REPLACE `clone_category_hierarchy` (nguyên văn từ 006, chỉ đổi mệnh đề is_system khi clone categories: `sc.is_system AND sc.name = 'Tiết kiệm & Quỹ'` — giữ false cho phần còn lại)
  - [ ] Apply local: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/migrations/022_system_savings_category.sql` rồi chạy lại lần 2 verify idempotent
- [ ] Task 2: Contribute route resolve đích danh (AC: #5)
  - [ ] `apps/web/src/app/api/funds/[id]/contribute/route.ts` dòng ~33-40: đổi query `.eq("default_behavior_type","savings_investment").order("sort_order").limit(1)` → `.eq("is_system", true).eq("default_behavior_type","savings_investment").limit(1)`; giữ maybeSingle + error 500 message rõ
- [ ] Task 3: Verify (AC: tất cả)
  - [ ] psql verify: template + household có đúng 1 category "Tiết kiệm & Quỹ", 0 category cũ còn lại, 0 transactions trỏ category đã xóa
  - [ ] `pnpm --filter web exec tsc --noEmit` + `pnpm --filter web test`
  - [ ] Trace flow nạp quỹ: contribute → transaction gắn đúng category mới

## Dev Notes

- **Hard gate**: skill `karpathy-guidelines` đã áp dụng — migration thuần SQL tuần tự, không stored procedure thừa.
- Hiện trạng DB (dev): template group "Tiết kiệm" id `a4885d71-...`; 3 categories template cũ tồn tại + clone ở 1 household; 1 transaction đang trỏ category cũ; estimated_expenses cũng FK categories (0 rows affected dev nhưng phải remap generic).
- `clone_category_hierarchy` CHỈ định nghĩa ở `006_onboarding.sql` (dòng 16-45), không migration nào redefine — copy nguyên văn rồi sửa 1 biểu thức. Categories table KHÔNG có unique constraint (household_id, group_id, name) → `ON CONFLICT DO NOTHING` của 006 không có tác dụng thực; migration dùng `WHERE NOT EXISTS` guard.
- Chỉ 005_seed.sql tham chiếu tên 3 categories cũ — không code TS nào tham chiếu (đã grep). KHÔNG sửa 005 (migration cũ đã chạy); household mới vẫn clone từ template nên chỉ cần xóa ở template là hết.
- Transactions.behavior_type do DB trigger từ category — remap giữ nguyên savings_investment, không đổi behavior.
- Contribute route hiện dò `savings_investment` đầu tiên theo sort_order (route.ts:33-40) — nguy cơ dính "Chứng khoán" (group Đầu tư, cũng savings_investment). Sau story này resolve theo `is_system=true`.
- Non-Negotiable: auth check đã có đầu route (withAuth); fund ops vẫn qua RPC `fund_contribute` — không đổi RPC.

### Project Structure Notes

- Files: `supabase/migrations/022_system_savings_category.sql` (new), `apps/web/src/app/api/funds/[id]/contribute/route.ts` (modified).

### References

- [Source: epics-fund-transaction-sync.md#Story 19.2, FR-2, NFR-4, AD-2, AD-4]
- [Source: supabase/migrations/006_onboarding.sql#clone_category_hierarchy]

## Dev Agent Record

### Agent Model Used

claude-fable-5[1m]

### Debug Log References

- Migration apply lần 1: INSERT 1+1, UPDATE 1 (transactions), UPDATE 0 (estimated_expenses), DELETE 6, CREATE FUNCTION
- Apply lần 2: toàn 0 + CREATE FUNCTION — idempotent OK
- tsc --noEmit clean; vitest 39 files / 532 tests pass

### Testing

- psql verify: 2 categories "Tiết kiệm & Quỹ" (1 template + 1 household), 0 categories cũ, 0 transactions orphan category.
- Resolve query của contribute (household dev + savings_investment + is_system=true) trả đúng 1 row `1baea205-...` — không còn dính "Chứng khoán".
- clone_category_hierarchy mới: biểu thức `(sc.name = 'Tiết kiệm & Quỹ')` giữ is_system=true chỉ cho category này với household tương lai.

### Completion Notes List

- Quyết định tự chọn: DELETE để FK fail-loud nếu còn ref sót (thay vì nuốt lỗi); guard NOT EXISTS thay ON CONFLICT (bảng không có unique constraint nên ON CONFLICT vô tác dụng); không set icon cho category mới (3 categories cũ cũng không có icon).
- Không sửa 005_seed.sql (migration lịch sử); household mới nhận category qua template + clone function.

### File List

- supabase/migrations/022_system_savings_category.sql (new)
- apps/web/src/app/api/funds/[id]/contribute/route.ts (modified)
