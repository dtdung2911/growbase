## Code Review: S0 — Foundation Sprint

### Summary
- Files reviewed: 23 (5 migrations + 18 app/config files)
- Critical issues: 0
- Warnings: 5
- Minor: 5

### Issues

#### 003_functions.sql:331-352 — WARNING: accept_invitation NULL return on re-accept
accept_invitation() INSERT ... ON CONFLICT DO NOTHING RETURNING id INTO v_member_id. Khi member đã tồn tại, RETURNING không trả row → v_member_id = NULL. Function vẫn mark accepted và RETURN NULL.
Tại sao: S1 API nhận NULL không phân biệt được "đã là member" vs "lỗi". Edge case: user click link mời 2 lần.
Fix:
```sql
IF v_member_id IS NULL THEN
  SELECT id INTO v_member_id FROM household_members
  WHERE household_id = v_inv.household_id AND user_id = p_user_id;
END IF;
```

#### 003_functions.sql (toàn bộ SECURITY DEFINER) — WARNING: thiếu SET search_path
Tất cả SECURITY DEFINER functions không set search_path. Supabase standard: thêm `SET search_path = public, pg_temp` vào mỗi function để tránh schema hijack.
Fix: Thêm `SET search_path = public, pg_temp` vào function signature của TẤT CẢ SECURITY DEFINER functions.

#### 003_functions.sql:60-155 — WARNING: fund RPCs thiếu membership guard
fund_contribute/fund_withdraw không verify caller là member của p_household_id. SECURITY DEFINER bypass RLS → caller biết fund_id + household_id của household khác có thể gọi được.
Fix: Thêm vào đầu mỗi fund RPC (và recalculate_debt_budget, get_budget_with_actuals):
```sql
IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
  RAISE EXCEPTION 'Access denied';
END IF;
```

#### 003_functions.sql:160-188 — WARNING: recalculate_debt_budget match by name string
UPDATE budget_baselines WHERE name = 'Chi trả nợ'. Fragile coupling qua tên cứng. Silent no-op nếu chưa có baseline.
Fix S0: Để lại. Flag cho S1 onboarding: thêm is_auto_calculated=true + auto_calculated_source='debt_entries' vào budget_baselines seed, sau đó update query match theo những fields này.

#### 003_functions.sql:277-304 — WARNING: get_budget_with_actuals double-count risk
GROUP BY logic có thể double-count nếu 1 category thuộc nhiều budget line. Chưa lộ ở S0 (không có data).
Fix: Để lại. Thêm comment cảnh báo. Fix kỹ ở S4 (Reports).

#### src/lib/utils/budget.ts vs 003_functions.sql:286 — MINOR: threshold 0.8 duplicated
getBudgetStatus client (0.8) và SQL get_budget_with_actuals (0.8). DRY violation.
Fix: Chấp nhận ở S0. Ghi nhận để thống nhất constant sau.

#### src/lib/constants/budgetTemplate.ts — MINOR: naming inconsistency
"Tiết kiệm & Quỹ" (template) map linkedCategoryGroupNames: ["Tiết kiệm"]. "Quỹ đệm tháng kế tiếp" map []. Tên budget line vs tên group không 1:1.
Fix: S1 dùng linkedCategoryGroupNames để resolve group IDs, KHÔNG match theo budget line name.

#### src/types/app.ts — MINOR: re-export thin wrapper
Re-export User từ @supabase/supabase-js. Chấp nhận được nếu là chủ ý kiến trúc.

#### src/lib/supabase/server.ts:5 — MINOR: CookieToSet self-defined
Tự định nghĩa type vì database.ts placeholder. Cần TODO comment xoá khi gen database.ts thật.

#### 002_tables.sql + 004_rls.sql — MINOR: comment "19 tables" sai
Thực tế 17 tables. Fix comment.

---

### Highlights (tốt)
- fund_contribute/fund_withdraw: atomic, FOR UPDATE lock, exclude=false/true đúng BR-CO-002/003
- set_transaction_behavior_type trigger: đúng BR-CA-001 + BR-TX-001/002
- behavior_type enum CÓ 'income' (BLOCKER #2 resolved)
- CHECK chk_no_unusual_outflow đúng BR-TX-003
- RLS: 17/17 tables enabled, get_user_household_ids() pattern tránh recursion, is_system check đúng
- Seed: không có budget_baselines (BLOCKER #3 resolved), income categories đúng
- App layer: queryKeys factory đúng CLAUDE.md, appStore đúng interface, providers QueryClient ổn định, không any, không hardcoded env, @supabase/ssr đúng

---

### Kết luận
**NEEDS_REVIEW** — 0 CRITICAL, 5 WARNING, 5 MINOR.
5 migrations runtime-verified đều pass. Foundation chạy được.
2 WARNING bảo mật cần fix ngay trước S1: membership guard + SET search_path.
accept_invitation NULL return fix trước S1 auth build.
