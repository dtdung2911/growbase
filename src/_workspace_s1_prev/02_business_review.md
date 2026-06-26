## Business Review: Sprint S0 — Foundation (Schema + Seed + Next.js init)

### Kết luận
**NEEDS_REVISION** — Architect phải chốt 4 quyết định BLOCKER trước khi migration agent viết SQL.

### Phán quyết nghiệp vụ đã giải quyết

**Rủi ro #2 (edit recompute behavior_type):** S0 giữ trigger BEFORE INSERT only — ĐÚNG. Đẩy thành WARNING cho S2/US-3.03 — khuyến nghị thêm BEFORE UPDATE trigger khi `category_id` đổi.

**Rủi ro #3 (BR-TX-003):** Phải enforce ở **DB CHECK constraint**, không để app-layer-only. Data integrity invariant. Nâng lên BLOCKER cho S0.

---

### AC Coverage

**US-9.01 (S0 scope):**
- `Given RLS active Then no cross-household data leak`: ⚠ partially covered — RLS task #4 cover phần lớn, nhưng household_members và household_invitations chưa có policy → blocker #4.

**Schema tasks:** Mapping BR → DB tasks đầy đủ (xem Business Rules).

---

### Business Rules

**✓ Mapped đúng vào plan:**
- BR-CA-001 (trigger behavior_type BEFORE INSERT) → task #3
- BR-TX-001/002 (exclude_from_budget_report forced) → task #3
- BR-CO-001/002/003 (atomic fund RPC + balance check + exclude) → task #3
- BR-DT-001 (recalculate_debt_budget + trigger) → task #3
- BR-FU-003 (reset_freedom_funds function) → task #3
- BR-SY-001/003 (RLS block system write) → task #4
- BR-NW-001 (UNIQUE constraint) → task #2
- BR-NW-002 (GENERATED discrepancy column) → task #2

**⚠ Cần bổ sung:**
- BR-TX-003 — CHECK constraint `direction='out' → is_unusual_income=false` phải vào task #2 (xem BLOCKER #1)
- BR-CA-004 — NOT NULL `default_behavior_type` phải được xác nhận trong task #2 (liên quan BLOCKER #2)
- BR-SY-002 — không ảnh hưởng S0 (task #5 đúng khi không seed budget_baselines)

---

### Edge Cases

**✓ Handled:**
- Circular FK transactions ↔ fund_transactions (ALTER TABLE approach) ✓
- Atomic fund RPC + lock row ✓
- numeric(15,0) cho VND ✓
- fund_contribute không bị trigger exclude=true (contribute là transaction_type khác, trigger chỉ match fund_withdrawal + internal_transfer) ✓

**⚠ Cần xem xét:**
- `household_invitations` policy: invite acceptance cần đọc invitation TRƯỚC khi là member → không thể dùng pattern `own_household`. Cần SECURITY DEFINER function hoặc policy đặc biệt theo invite token.
- `reset_freedom_funds()` cần scheduling (pg_cron/Edge Function) — chỉ cần function ở S0, cơ chế trigger ở S5. WARNING nhẹ.
- S3 reports (behavior_type grouping): phải filter `direction='out'` trước khi group — hệ quả của giải pháp income behavior_type.

---

### Vấn đề phát hiện

#### BLOCKER #1 — BR-TX-003 CHECK constraint
BR-TX-003 chỉ định enforcement = DB CHECK. Schema không có.
**Phán quyết:** Enforce ở DB CHECK — `CHECK (NOT (direction='out' AND is_unusual_income=true))` — data integrity invariant, không thể chỉ dựa vào UI/app.
**Action:** Architect thêm vào task #2 (tables).

#### BLOCKER #2 — Income categories + behavior_type
`behavior_type` enum không có `income`. `categories.default_behavior_type` NOT NULL. Income categories không thể seed.
**Hệ quả nghiệp vụ:** income categories phải tồn tại (BR-CA-002 dùng cho direction='in').
**Recommendation cho Architect:** Thêm value `'income'` vào enum (option a — sạch nhất). Hoặc cho phép NULL khi cost_type='income' (option b). Architect chọn, migration implement.

#### BLOCKER #3 — Budget template storage
Template "16 budget lines" không có chỗ lưu. Plan đúng khi không seed budget_baselines. Nhưng US-2.02 (S1) cần nguồn copy.
**Recommendation cho Architect:** Hardcode constant trong app layer hoặc seed system `budget_baselines` với `household_id=null`. Phải chốt trước S1.

#### BLOCKER #4 — RLS household_members + household_invitations
Thiếu policy. Chặn toàn bộ S1 (auth flow). Cross-household leak risk.
**Action cho Architect:** Định nghĩa policies. Đặc biệt household_invitations: invite acceptance cần đọc invitation bằng token TRƯỚC khi user là member → KHÔNG copy pattern `own_household`, cần SECURITY DEFINER function hoặc policy chấp nhận unauthed read theo token (nếu dùng magic link / token flow).

#### WARNING #5 — @supabase/auth-helpers-nextjs deprecated
Ảnh hưởng middleware redirect (BR-OB-001). Dùng `@supabase/ssr` để tránh rework S1.
**Architect quyết.**

#### WARNING #6 — NOT NULL default_behavior_type chưa được xác nhận trong task #2
Liên kết với BLOCKER #2. Cần Architect xác nhận constraint được tạo ở task #2 và tương thích với giải pháp income categories.

---

### Tóm tắt cho Architect

4 quyết định phải có trong technical design (Phase 3):
1. Thêm CHECK constraint BR-TX-003 vào table transactions
2. Income behavior_type: thêm enum value 'income' hay cho phép NULL?
3. Budget template storage: hardcode constant hay seed với household_id=null?
4. RLS policies cho household_members + household_invitations (đặc biệt invite token flow)
5. (WARNING) @supabase/ssr vs auth-helpers-nextjs

Downstream note:
- S3 reports phải filter direction='out' khi group behavior_type
- S2/US-3.03 phải thêm BEFORE UPDATE trigger recompute behavior_type khi category_id đổi
