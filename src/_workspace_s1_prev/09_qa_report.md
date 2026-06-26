# QA Report: S0 — Foundation Sprint (Schema + Functions + RLS + Seed + App Scaffold)

> Final validation sau toàn bộ pipeline. S0 là foundation sprint — không có API routes / hooks / UI screens,
> nên cross-boundary tập trung vào: DB chain (enums → tables → functions → RLS → seed) và app scaffold
> (supabase clients, store, queryKeys, constants, utils, tests). Đọc code thực tế, không chỉ confirm file tồn tại.

---

## Cross-Boundary Checks

### DB chain (enums → tables → functions → RLS → seed)
- ✓ **enums ↔ functions**: `behavior_type` enum có `'income'` (001:29) → set_transaction_behavior_type trigger gán từ `category.default_behavior_type` (003:225) không bao giờ vi phạm NOT NULL trên category. `transaction_type` enum (001:33) chứa đúng `fund_contribution`, `fund_withdrawal`, `internal_transfer` mà fund RPC + trigger tham chiếu.
- ✓ **tables ↔ functions**: `transactions.behavior_type` nullable (002:199, set bởi trigger) — đúng BR-CA-001. `categories.default_behavior_type behavior_type NOT NULL` (002:106) là nguồn cho trigger. fund RPC INSERT vào `transactions` + `fund_transactions` với cột khớp schema. `funds.updated_at` đã thêm (deviation có chủ ý) để khớp `UPDATE funds SET updated_at` trong RPC — nếu thiếu, RPC sẽ lỗi runtime.
- ✓ **functions ↔ RLS**: `get_user_household_ids()` định nghĩa TRƯỚC (003:49) vì 004_rls dùng nó trong mọi policy. SECURITY DEFINER STABLE → tránh recursion khi gọi trong policy SELECT.
- ✓ **seed ↔ template**: seed KHÔNG có `budget_baselines` (005:6,76 — BLOCKER #3 resolved); budget baseline đến từ app constant `budgetTemplate.ts`, INSERT per household ở S1 onboarding. Không có double-source-of-truth.

### App scaffold (store / queryKeys / clients vs CLAUDE.md)
- ✓ **appStore ↔ CLAUDE.md**: interface có đúng `householdId`, `currentMonth`, `user` + `setCurrentMonth`/`setHouseholdId`/`setUser`. `currentMonth` default = `toYearMonth()` (current month). Khớp 100% spec CLAUDE.md.
- ✓ **queryKeys ↔ CLAUDE.md**: factory có đủ 7 keys `household, transactions, funds, budget, reports, debts, categories` với signature đúng; thêm `as const` (tighten type, không lệch spec). Không hardcode string.
- ✓ **supabase clients**: client.ts dùng `createBrowserClient<Database>`, server.ts dùng `createServerClient` + `cookies()` getAll/setAll adapter (@supabase/ssr, KHÔNG auth-helpers cũ). Env qua `process.env.NEXT_PUBLIC_*`, không hardcode.

---

## Business Rules

- ✓ **BR-CO-003** (Fund = atomic RPC): `fund_contribute`/`fund_withdraw` (003:60,115) atomic — lock `FOR UPDATE`, insert transaction + fund_transaction + update balance trong 1 function. Không sequential client-side calls.
- ✓ **BR-CO-002 / BR-TX-001/002** (exclude_from_budget_report): contribute set `exclude=false` (003:92), withdraw set `exclude=true` (003:147); trigger `set_transaction_behavior_type` force `exclude=true` cho `fund_withdrawal` + `internal_transfer` (003:230) — set bởi DB, không phải user.
- ✓ **BR-CA-001** (behavior_type readonly): set bởi trigger từ `category.default_behavior_type` (003:224-227); cột nullable trên transactions, form không có field này (S0 chưa có form — invariant đã đúng ở DB layer).
- ✓ **BR-SY-001** (is_system bất biến): RLS write policies cho `categories` + `category_groups` đều có `is_system = false` guard trên INSERT/UPDATE/DELETE (004:263,266,269,278,281,284). budgetTemplate mọi dòng `isSystem: true` + test enforce.
- ✓ **BR-TX-003** (no unusual outflow): CHECK `chk_no_unusual_outflow` trên transactions (migration log, runtime-verified reject).

---

## Technical Constraints

### Yêu cầu verify cụ thể (6 mục)
1. ✓ **SET search_path trên TẤT CẢ SECURITY DEFINER**: 9/9 functions có `SET search_path = public, pg_temp` — get_user_household_ids (55), fund_contribute (110), fund_withdraw (163), recalculate_debt_budget (200), set_transaction_behavior_type (236), reset_freedom_funds (264), get_budget_with_actuals (328), get_invitation_by_token (348), accept_invitation (383). Lưu ý: 3 trigger fn không-SECURITY-DEFINER (`set_updated_at`, `trigger_recalculate_debt_budget`) chạy quyền invoker — đúng, không cần guard.
2. ✓ **Membership guard**: `fund_contribute` (74-76), `fund_withdraw` (129-131), `recalculate_debt_budget` (175-177), `get_budget_with_actuals` (286-288) đều có `IF NOT (p_household_id = ANY(get_user_household_ids())) THEN RAISE EXCEPTION 'Access denied...'`.
3. ✓ **accept_invitation fallback SELECT**: sau `ON CONFLICT (household_id, user_id) DO NOTHING RETURNING id`, có fallback `IF v_member_id IS NULL THEN SELECT id ... FROM household_members` (375-378) — fix re-accept NULL return. Kèm comment giải thích.
4. ✓ **budgetTemplate total = 100**: 16 dòng, tổng budgetPct = 100 (verified bằng tính tay + test `expect(total).toBe(100)`).
5. ✓ **appStore interface**: householdId/currentMonth/user + 3 setters — đúng CLAUDE.md.
6. ✓ **queryKeys factory**: 7 keys đúng CLAUDE.md.

### RLS & Security
- ✓ RLS enabled: 17/17 tables (`ENABLE ROW LEVEL SECURITY` × 17 trong 004_rls). Policies filter theo `household_id = ANY(get_user_household_ids())`.
- ✓ get_user_household_ids lọc `is_active = true` — member bị deactivate mất quyền.

### Fixer compliance (5 WARNING từ code review)
- ✓ WARNING 1 (search_path) — applied 9 functions.
- ✓ WARNING 2 (membership guard) — applied 4 functions.
- ✓ WARNING 3 (accept_invitation NULL) — applied fallback SELECT.
- ✓ WARNING 4 (double-count risk) — comment cảnh báo thêm (003:293-298), defer S4 đúng chỉ đạo.
- ✓ WARNING 5 (recalculate match-by-name) — defer S1 đúng chỉ đạo; bonus: function đã set `is_auto_calculated` + `auto_calculated_source` (003:195-196) chuẩn bị cho S1 match-by-field.
- ✓ MINOR (comment "19 tables", server.ts TODO) — applied.

### Tests
- ✓ vitest.config.ts: environment node, globals true, include `src/**/*.{test,spec}.{ts,tsx}`, alias `@`. 5 test files đều match pattern (`*.test.ts` trong `src/`).
- ✓ package.json: `vitest@^2.1.9` devDep, scripts `test` (vitest run) + `test:watch` + `type-check`.
- ✓ **Tests cover behavior thực tế**: budget.test khẳng định strict `>` boundary — `getBudgetStatus(800,1000)='safe'`, `(1000,1000)='warning'`, `(801,1000)='warning'`, `(0,0)='safe'`. budgetTemplate.test khẳng định 16 dòng + total=100 + đúng 1 auto-calculated ('Chi trả nợ') + chỉ 'Quỹ đệm tháng kế tiếp' rỗng linkedGroups. Tests bám đúng implementation, không test giả định sai.
- ✓ **Runtime verify**: `vitest run` → 52/52 pass. `tsc --noEmit` → exit 0.

### Mobile-first / Error handling / UX
- N/A ở S0 — chưa có UI screens, forms, list pages. landing page placeholder dùng `max-w-md` + `pb-16`. layout set `maximumScale 1` chống iOS zoom. Các check này sẽ áp dụng từ S1.

---

## UX Compliance
- N/A — S0 không build screen từ `05_UX_SPEC.md`. Chỉ landing placeholder. UX validation bắt đầu S1.

---

## Issues Summary

### CRITICAL (phải fix)
- Không có.

### WARNING (nên fix — đã được code review/fixer ghi nhận, defer hợp lý)
- `get_budget_with_actuals` double-count risk khi 1 category group link bởi nhiều baseline (003:293-298) — comment cảnh báo có sẵn, fix kỹ ở S4 Reports. Chấp nhận ở S0 vì chưa có data.
- Threshold `0.8` duplicate ở `budget.ts` (TS) và `get_budget_with_actuals` (SQL 003:312) — DRY violation. Cần thống nhất constant ở S4. Hiện 2 nơi cùng giá trị, không gây sai lệch.
- `recalculate_debt_budget` match `budget_baselines.name = 'Chi trả nợ'` (003:198) — fragile string coupling. S1 onboarding nên chuyển sang match `auto_calculated_source = 'debt_entries'` (field đã sẵn).
- Trigger `debt_budget_recalc` gọi membership guard dựa `auth.uid()`: nếu sau này có service-role/cron job mutate `debt_entries` ngoài user session → RAISE 'Access denied' + rollback. Lưu ý khi build seed/cron flow ở S1+ (fixer đã báo cáo).

---

## Kết luận

**PASS** — 0 critical issues, 4 warnings (đều low-risk, defer có chủ ý sang S1/S4).

Foundation S0 vững: DB chain nhất quán end-to-end (enums → tables → functions → RLS → seed), 9/9 SECURITY DEFINER có search_path + 4/4 sensitive RPC có membership guard, accept_invitation re-accept-safe, budgetTemplate total=100, appStore + queryKeys khớp CLAUDE.md đúng từng field. Cả 5 WARNING từ code review đã được fixer apply đúng. 52/52 tests pass, tsc clean. Tests phản ánh behavior thực tế (strict `>` boundary, total=100), không phải giả định.

Sẵn sàng cho S1 (auth + onboarding).
