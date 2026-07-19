## Fixer Log: S0 — Foundation Sprint

### Issues fixed

#### WARNING 1 — thiếu SET search_path trên SECURITY DEFINER functions
Thêm `SET search_path = public, pg_temp` vào 9 functions trong 003_functions.sql:
- 003_functions.sql:55 get_user_household_ids() → + SET search_path
- 003_functions.sql:110 fund_contribute() → + SET search_path
- 003_functions.sql:163 fund_withdraw() → + SET search_path
- 003_functions.sql:200 recalculate_debt_budget() → + SET search_path
- 003_functions.sql:236 set_transaction_behavior_type() (trigger fn) → + SET search_path
- 003_functions.sql:264 reset_freedom_funds() → + SET search_path
- 003_functions.sql:328 get_budget_with_actuals() → + SET search_path
- 003_functions.sql:348 get_invitation_by_token() → + SET search_path
- 003_functions.sql:383 accept_invitation() → + SET search_path

#### WARNING 2 — fund RPCs thiếu membership guard
Thêm guard `IF NOT (p_household_id = ANY(get_user_household_ids())) THEN RAISE EXCEPTION 'Access denied: not a member of this household'; END IF;` đầu mỗi function:
- 003_functions.sql:74-76 fund_contribute() → + membership guard
- 003_functions.sql:129-131 fund_withdraw() → + membership guard
- 003_functions.sql:175-177 recalculate_debt_budget() → + membership guard
- 003_functions.sql:286-288 get_budget_with_actuals() → + membership guard

#### WARNING 3 — accept_invitation trả NULL khi re-accept
- 003_functions.sql:373-378 accept_invitation() → thêm fallback SELECT lấy v_member_id từ household_members khi ON CONFLICT DO NOTHING không trả row (member đã tồn tại). Kèm comment giải thích edge case.

#### WARNING 4 — get_budget_with_actuals double-count risk
- 003_functions.sql:278-285 get_budget_with_actuals() → thêm comment cảnh báo double-count khi 1 category group được link bởi nhiều budget_baseline. KHÔNG sửa logic (defer S4 Reports).

#### MINOR — comment "19 tables" sai
- 002_tables.sql:1 → "19 tables" thành "17 tables"
- 004_rls.sql:1 → "19 tables" thành "17 tables"

#### MINOR — server.ts CookieToSet
- src/lib/supabase/server.ts:5 → thêm TODO comment "Remove CookieToSet alias when database.ts is generated from Supabase"

### Issues skipped (theo chỉ đạo, defer hoặc chấp nhận ở S0)
- 003_functions.sql:181-186 WARNING: recalculate_debt_budget match by name string ('Chi trả nợ') — defer S1 onboarding
- src/lib/utils/budget.ts vs SQL MINOR: threshold 0.8 duplicated — chấp nhận ở S0
- src/lib/constants/budgetTemplate.ts MINOR: budgetTemplate naming inconsistency — chấp nhận ở S0, resolve qua linkedCategoryGroupNames ở S1
- src/types/app.ts MINOR: re-export User từ @supabase/supabase-js — chấp nhận là kiến trúc có chủ ý

### Files modified
- /Users/dungduong/Sites/Personal/Projects/growbase/supabase/migrations/003_functions.sql
- /Users/dungduong/Sites/Personal/Projects/growbase/supabase/migrations/002_tables.sql
- /Users/dungduong/Sites/Personal/Projects/growbase/supabase/migrations/004_rls.sql
- /Users/dungduong/Sites/Personal/Projects/growbase/src/lib/supabase/server.ts

### New issues discovered (báo cáo, không tự handle)
- recalculate_debt_budget() được gọi qua trigger AFTER INSERT/UPDATE/DELETE trên debt_entries. Membership guard mới thêm dựa trên get_user_household_ids() (đọc auth.uid()). Trong context trigger thường, session vẫn là của user đã mutate debt_entries → user phải là member để qua RLS, nên guard không gây regression. NHƯNG nếu sau này có batch/admin/service-role job mutate debt_entries ngoài user session (auth.uid() = NULL), trigger sẽ RAISE 'Access denied' và rollback. Cần lưu ý khi build S1 onboarding/seed flow hoặc cron jobs — có thể cần đường gọi service-role bypass riêng.
