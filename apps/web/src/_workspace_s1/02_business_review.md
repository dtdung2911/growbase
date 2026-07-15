# Business Review: Sprint S1
> Status: NEEDS_REVISION → **RESOLVED** (quyết định đã chốt bên dưới)

## AC Coverage: ✓ Đầy đủ (với 4 bổ sung nhỏ)

- US-1.01: ✓ Full coverage
- US-1.02: ✓ Full coverage
- US-1.03: ⚠ Email invite → giải quyết bằng quyết định #2
- US-1.04: ✓ Full coverage
- US-1.05: ⚠ Debt→budget ordering → giải quyết bằng quyết định #1
- US-2.01: ⚠ Thiếu count + callout → bổ sung vào WizardStep6
- US-2.02: ✓ Full coverage (sau khi quyết định #1 resolved)

---

## BLOCKER Issues → Đã giải quyết

### BLOCKER #1 — Thứ tự debt step 5 → budget_baselines step 7

**Vấn đề:** Trigger `recalculate_debt_budget()` UPDATE `budget_baselines WHERE name='Chi trả nợ'`, nhưng baselines chỉ tạo ở step 7 → UPDATE no-op ở step 5.

**Quyết định: Hướng (b) — Step 5 preview client-side only**
- Step 5: tính `debt_pct = SUM(monthly_payment)/total_income * 100` hoàn toàn client-side (từ income + debt trong wizardStore)
- Không INSERT debt_entries ở step 5
- Khi completion (step 7 submit hoặc skip): atomic persist sequence:
  1. INSERT income_sources (nếu chưa persist)
  2. INSERT accounts (nếu chưa persist)
  3. UPSERT budget_baselines (16 lines từ template, copy vào household)
  4. INSERT debt_entries (trigger `recalculate_debt_budget` chạy → UPDATE baselines đã tồn tại ✓)
  5. UPSERT households SET onboarding_completed=true
- **Hoặc tốt hơn**: tạo 1 RPC `complete_onboarding(p_household_id, p_income_sources[], p_accounts[], p_debt_entries[], p_budget_pcts[])` atomic

**Lý do chọn (b):**
- Tránh baselines "rác" nếu user bỏ ngang wizard
- Không có race condition trigger
- Atomicity rõ ràng hơn

### BLOCKER #2 — Email invitation cơ chế

**Quyết định: Copy share link cho MVP**
- AC không yêu cầu email thật — chỉ yêu cầu token valid khi accept
- `/api/household/invite`: INSERT household_invitations → return `{ inviteLink: /invite/[token] }`
- UI hiển thị link + copy button
- KHÔNG gửi email trong MVP (không dùng Edge Function, không email provider)

---

## WARNING Issues → Cần xử lý

### WARNING #1 — Budget template nguồn

**Quyết định: Hardcoded TypeScript constant**
- Đã validate ở S0: `budgetTemplate.ts` — 16 dòng static hardcode, không seed vào DB
- Onboarding completion: INSERT 16 rows vào `budget_baselines` từ constant này, với `household_id` của user
- Không có `is_system` budget_baselines — chỉ household-specific baselines

### WARNING #2 — US-2.01 count + callout

**Bổ sung vào WizardStep6:**
- Hiển thị: "XX danh mục trong X nhóm"
- Callout: "Muốn thêm/chỉnh sửa → vào Cài đặt sau khi hoàn thành"

### WARNING #3 — Completion handler khi skip step 7

**Bổ sung vào Task 16:**
- Nếu user skip step 7 (không submit budget form), completion vẫn phải:
  - UPSERT budget_baselines với default pcts từ template
  - SET onboarding_completed=true

### WARNING #4 — RLS cho budget_baselines

**Bổ sung vào Task 4:**
- households members có thể UPSERT budget_baselines của household mình
- SELECT: household members
- INSERT/UPDATE: role='owner' hoặc 'member' (không restrict role cho budget)

### WARNING #5 — Guard division by zero trong recalculate_debt_budget

**Bổ sung vào Migration:**
- Nếu SUM(income_sources.monthly_amount) = 0 hoặc NULL → SET debt_pct = 0, không raise exception

### WARNING #6 — Middleware: user mới chưa có household

**Bổ sung vào Task 11:**
- `onboarding_completed` null (no household record) → redirect /setup (cùng với false)
- Query: `SELECT onboarding_completed FROM households WHERE ... AND user IS owner`
- Nếu 0 rows → /setup

---

## Quyết định chốt (tổng hợp)

| # | Quyết định | Giải pháp |
|---|------------|-----------|
| 1 | Debt→budget thứ tự | Step 5 client-side preview; persist atomic ở completion |
| 2 | Email invitation | Copy share link (không gửi email MVP) |
| 3 | Budget template | 16 lines hardcode từ `budgetTemplate.ts` |
| 4 | Division by zero | Guard trong `recalculate_debt_budget()` |
| 5 | Middleware "no household" | Treat null onboarding_completed → /setup |
| 6 | Touch target | 44px (theo CLAUDE.md) |
| 7 | AC không yêu cầu completion ở step 7 riêng | Skip flow phải set onboarding_completed |

---

## Kết luận sau giải quyết

**Status: APPROVED** — Tất cả BLOCKERs đã được giải quyết bằng quyết định nghiệp vụ rõ ràng. Architect có thể tiến hành design với các decisions trên.
