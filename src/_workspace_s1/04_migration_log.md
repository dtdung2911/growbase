# Migration Log: S1 — Auth + Onboarding Wizard (US-1.04/1.05, US-2.02)

## Files created
- `supabase/migrations/006_onboarding.sql` — RPC `complete_onboarding`. Atomic all-or-nothing để kết thúc onboarding wizard: ghi income_sources + accounts + budget_baselines + debt_entries + set `households.onboarding_completed=true`. KHÔNG tạo table/enum/RLS mới (toàn bộ đã có ở S0).

## RPCs implemented
- `complete_onboarding(p_household_id uuid, p_income_sources jsonb, p_accounts jsonb, p_debt_entries jsonb, p_budget_pcts jsonb)` → `uuid`
  - **Behavior** (1 plpgsql transaction tự nhiên, thứ tự bắt buộc):
    1. Auth guard: `IF NOT (p_household_id = ANY(get_user_household_ids())) → RAISE 'Access denied'`
    2. Idempotency: lock household row `FOR UPDATE`; nếu `onboarding_completed=true → RAISE 'Onboarding already completed'`. Cũng raise 'Household not found' nếu id sai.
    3. INSERT income_sources — loop jsonb array. `currency` lấy từ household (không dùng default VND), `is_current=true`. `member_id` null-safe qua `NULLIF(...,'')::uuid`.
    4. INSERT accounts — loop. `bank_name`/`owner_name` null-safe; `account_type` default 'bank'; `is_credit_card` default false.
    5. INSERT budget_baselines — loop với `WITH ORDINALITY` để lấy `sort_order` (1-based theo vị trí trong array). Resolve `linked_category_group_ids` = `array_agg(id)` từ `category_groups WHERE is_system=true AND household_id IS NULL AND name = ANY(linked_group_names)`. Không match → `'{}'::uuid[]` (không raise). `is_system=true`.
    6. INSERT debt_entries — loop, AFTER budget_baselines. Trigger `debt_budget_recalc` (S0, 003 §4) tự chạy → UPDATE baseline 'Chi trả nợ'.budget_pct = debt_pct. KHÔNG gọi manual.
    7. UPDATE households SET onboarding_completed=true.
    8. RETURN p_household_id.
  - **Security**: `SECURITY DEFINER SET search_path = public, pg_temp` (rule tuyệt đối S0).
  - **Signature khớp** architect design + task spec.

## RLS policies
- Không thêm policy nào. income_sources / accounts / budget_baselines / debt_entries đã có đủ SELECT/INSERT/UPDATE/DELETE own_household ở `004_rls.sql`. RPC chạy `SECURITY DEFINER` nên bypass RLS — auth guard thủ công ở đầu function là lớp bảo vệ thay thế.

## Verification (chạy thực tế trên Postgres tạm, apply 001→006 sạch)
- ✅ Compile + apply toàn bộ 6 migrations không lỗi (NOTICE chỉ là DROP IF EXISTS idempotent guards).
- ✅ E2E happy path (income×2, accounts×2, debt×1, 4 budget lines, household currency=USD):
  - income_sources: 2 rows, currency=USD (kế thừa household, không phải default), is_current=true, member_id nullable OK.
  - accounts: 2 rows, null-safe fields OK.
  - budget_baselines: sort_order 1→4 đúng thứ tự array, is_system=true, mapping linked_category_group_ids đúng (Thực phẩm=1, Chi trả nợ=1, Quỹ đệm=NULL/không link, Tiết kiệm=1).
  - **'Chi trả nợ' budget_pct = 20.00** (5M/25M×100), is_auto_calculated=true, source='debt_entries' → CHỨNG MINH thứ tự baselines→debt đúng, trigger chạy non-no-op.
  - debt_entries: 1 row OK; households.onboarding_completed=true.
- ✅ Idempotency: gọi lần 2 → `ERROR: Onboarding already completed`.
- ✅ Auth guard: user không phải member → `ERROR: Access denied: not a member of this household`.
- ✅ Skip-debt (p_debt_entries=[]): baseline 'Chi trả nợ' giữ budget_pct=8 từ template, is_auto_calculated=false (trigger không chạy). Khớp BR (skip step 5 → editable, default 8%).
- ✅ Verify mapping budgetTemplate.ts ↔ seed category_groups: 15/15 named groups match exactly. "Quỹ đệm tháng kế tiếp" cố ý không link group → '{}'.

## Deviations from spec
- p_budget_pcts format: task spec truyền sẵn `linked_group_names` trong từng line của payload (`[{name, budget_pct, linked_group_names:[...]}]`). RPC dùng trực tiếp field này thay vì hardcode mapping từ template trong DB. Đây là theo đúng yêu cầu task (điểm 5) — không phải deviation thực sự, chỉ ghi chú để App layer (senior-developer) đảm bảo gửi `linked_group_names` từ `BUDGET_TEMPLATE.linkedCategoryGroupNames` khi build payload.

## Known issues
- **[Tham khảo — KHÔNG thuộc phạm vi S1, là edge case của hàm S0 `recalculate_debt_budget` ở 003]**: nếu `SUM(monthly_payment) / SUM(monthly_income) × 100 > 999.99` (vd dữ liệu bệnh lý monthly_payment >> income), UPDATE `budget_pct` vượt `numeric(5,2)` → `numeric field overflow` → toàn bộ RPC rollback (atomicity vẫn đảm bảo, không ghi dữ liệu bẩn). Với dữ liệu hợp lệ (debt payment < income) không bao giờ xảy ra. App layer NÊN validate `debtPct ≤ 100` ở Zod/client trước khi submit (design đã có `debtPct()` preview ở wizardStore). Nếu muốn hardening sâu hơn, S0 team có thể CLAMP debt_pct ≤ 100 trong `recalculate_debt_budget` — nhưng đó là thay đổi file 003, ngoài scope task này nên KHÔNG sửa.
- Không TODO nào còn lại trong `006_onboarding.sql`.
