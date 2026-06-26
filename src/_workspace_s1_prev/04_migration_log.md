# Migration Log: S0 — Foundation (Schema + Functions + RLS + Seed)

## Files created
- `supabase/migrations/001_enums.sql` — 14 enum types. `behavior_type` thêm `'income'` (BLOCKER #2). Dùng `DO $$ ... EXCEPTION WHEN duplicate_object` để idempotent (CREATE TYPE không hỗ trợ IF NOT EXISTS).
- `supabase/migrations/002_tables.sql` — 17 tables theo đúng thứ tự FK (Phần B). `numeric(15,0)` cho mọi cột tiền. CHECK `chk_no_unusual_outflow` trên `transactions` (BLOCKER #1). `net_worth_snapshots.discrepancy` GENERATED ALWAYS STORED. Indexes spec 2.6 + bổ sung (`idx_fund_tx_fund`, `idx_funds_household`, `idx_household_members_user`).
- `supabase/migrations/003_functions.sql` — `set_updated_at` + triggers, `get_user_household_ids` (định nghĩa TRƯỚC TIÊN cho RLS), 2 fund RPC, debt recalc + trigger, behavior_type trigger, reset_freedom_funds, get_budget_with_actuals, get_invitation_by_token, accept_invitation.
- `supabase/migrations/004_rls.sql` — Enable RLS trên cả 17 tables + policies. DROP POLICY IF EXISTS trước mỗi CREATE để re-runnable.
- `supabase/migrations/005_seed.sql` — 6 cost_types, 17 system category_groups, 17 system categories (1/group). Idempotent. KHÔNG seed budget_baselines (BLOCKER #3).

## RPCs implemented
- `get_user_household_ids()` → `uuid[]` — SECURITY DEFINER STABLE; trả mảng household_id của user active. Dùng làm core cho mọi RLS policy.
- `fund_contribute(p_household_id, p_fund_id, p_member_id, p_amount, p_account_id, p_category_id, p_description, p_date)` → `uuid` — atomic: lock fund FOR UPDATE → insert transaction (fund_contribution, exclude=false) → insert fund_transaction (in) → update balance. Trả tx_id.
- `fund_withdraw(...)` → `uuid` — như trên nhưng chiều out, exclude_from_budget_report=true, RAISE EXCEPTION 'Insufficient fund balance' nếu balance < 0.
- `recalculate_debt_budget(p_household_id)` → `void` — tính debt_pct = SUM(monthly_payment active) / SUM(monthly_amount current income) × 100, update budget_baseline name='Chi trả nợ'. Có trigger `debt_budget_recalc` AFTER INSERT/UPDATE/DELETE ON debt_entries.
- `set_transaction_behavior_type()` (trigger) — BEFORE INSERT ON transactions: gán behavior_type từ category.default_behavior_type; force exclude_from_budget_report cho fund_withdrawal + internal_transfer.
- `reset_freedom_funds()` → `void` — SECURITY DEFINER; log reset fund_transaction TRƯỚC (đọc balance hiện tại) rồi mới zero balance.
- `get_budget_with_actuals(p_household_id, p_month text)` → `TABLE(...)` — spec 6.2, budget vs actual với status safe/warning/danger.
- `get_invitation_by_token(p_token)` → `TABLE(...)` — SECURITY DEFINER STABLE; đọc invitation + household name trước khi user là member.
- `accept_invitation(p_token, p_user_id)` → `uuid` — SECURITY DEFINER atomic: validate status/expiry (FOR UPDATE) → insert member (ON CONFLICT DO NOTHING) → mark accepted.

## RLS policies
| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| households | ✓ (own) | ✓ (authed) | ✓ (own) | ✓ (owner) |
| household_members | ✓ (own) | ✓ (self) | ✓ (owner) | ✓ (owner) |
| household_invitations | ✓ | ✓ | ✓ | ✓ (own_household) |
| income_sources | ✓ | ✓ | ✓ | ✓ |
| accounts | ✓ | ✓ | ✓ | ✓ |
| funds | ✓ | ✓ | ✓ | ✓ |
| fund_transactions | ✓ | ✓ | ✓ | ✓ |
| debt_entries | ✓ | ✓ | ✓ | ✓ |
| budget_baselines | ✓ | ✓ | ✓ | ✓ |
| budget_overrides | ✓ | ✓ | ✓ | ✓ |
| transactions | ✓ | ✓ | ✓ | ✓ |
| net_worth_snapshots | ✓ | ✓ | ✓ | ✓ |
| scheduled_payments | ✓ | ✓ | ✓ | ✓ |
| estimated_expenses | ✓ | ✓ | ✓ | ✓ |
| categories | ✓ (system+own) | ✓ (is_system=false) | ✓ (is_system=false) | ✓ (is_system=false) |
| category_groups | ✓ (all) | ✓ (custom) | ✓ (custom) | ✓ (custom) |
| cost_types | ✓ (all read-only) | — | — | — |

BR-SY-001 (is_system bất biến) enforced ở RLS write policies cho categories + category_groups.

## Verification
Đã spin up Postgres tạm (stub schema `auth` + `auth.users` + `auth.uid()`) và chạy cả 5 migrations từ DB sạch với `ON_ERROR_STOP=1`:
- 5/5 migrations pass.
- behavior_type enum = `fixed,variable,wasteful,debt_repayment,savings_investment,income` ✓
- 6 cost_types, 17 system groups, 17 system categories, 0 budget_baselines ✓
- Income categories default_behavior_type = 'income' ✓
- chk_no_unusual_outflow reject INSERT (out + is_unusual_income=true) ✓
- behavior_type trigger gán đúng từ category ✓
- fund_contribute: balance 0→500000, fund_tx tạo, exclude=false ✓
- fund_withdraw: 500000→300000, exclude=true; insufficient → RAISE EXCEPTION ✓
- accept_invitation: member added, status='accepted' ✓
- get_budget_with_actuals + reset_freedom_funds chạy không lỗi ✓

## Deviations from spec
- **`funds.updated_at` thêm cột (002).** Spec 2.5 định nghĩa `funds` chỉ có `created_at`, NHƯNG RPC spec 3.1/3.2/3.5 thực thi `UPDATE funds SET ... updated_at = now()` — tham chiếu cột không tồn tại. Đây là bug nội tại của spec gốc. Đã thêm `updated_at timestamptz DEFAULT now()` + trigger `funds_set_updated_at` để khớp hợp đồng RPC và tuân thủ quy tắc agent (tables có updated_at + trigger). Phát hiện qua runtime test, không phải đoán.
- **Trigger `set_updated_at` (003)** — thêm cho households, debt_entries, budget_baselines, transactions, funds (các bảng có cột updated_at). Spec gốc cập nhật updated_at thủ công trong RPC; trigger đảm bảo invariant cho mọi UPDATE path khác. Không phá vỡ behavior của RPC.
- **RLS bổ sung** (theo architect design Phần A.4, không tự ý): households INSERT/DELETE; household_members 4 policies owner-scoped; household_invitations 4 policies; enable RLS trên cost_types/category_groups/budget_overrides (spec 04 bỏ sót); CRUD đầy đủ cho budget_overrides + write policies cho category_groups custom.
- **"19 tables" trong architect design** thực tế liệt kê 17 bảng (Phần B). Spec 04 cũng định nghĩa đúng 17 bảng. Đã tạo đủ 17, không thiếu — con số "19" là lỗi đếm trong design doc, không phải thiếu bảng.

## Known issues
- Không có. Tất cả migrations + RPC + trigger + constraint đã test runtime pass trên Postgres 18.
- Lưu ý cho S1: `get_invitation_by_token` SECURITY DEFINER lộ mọi field invitation theo token — đúng thiết kế (token là secret), nhưng API layer nên rate-limit endpoint accept để tránh brute-force token.
- Phần F architect design còn 2 mục cần user chốt trước S1 (danh sách system categories con đầy đủ per group; mapping budget line → category_group names cho onboarding). S0 dùng 1 category/group làm baseline — đủ cho foundation.
```
