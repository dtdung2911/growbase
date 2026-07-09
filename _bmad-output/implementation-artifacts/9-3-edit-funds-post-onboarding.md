---
baseline_commit: 98133d26e5d294f5fec53861bc32a23e16df9648
---

# Story 9.3: Điều chỉnh quỹ mọi lúc sau onboarding

Status: review

## Story

As a người dùng đã onboarding xong,
I want sửa được mục tiêu, số tháng, icon của các quỹ (kể cả quỹ khẩn cấp) bất cứ lúc nào,
so that kế hoạch tài chính theo kịp cuộc sống thay vì bị khoá cứng từ lúc setup.

## Acceptance Criteria

1. **Given** user mở fund detail của goal fund, **When** bấm edit, **Then** `GoalEditSheet` cho sửa name, target_amount, target_date, icon (reuse icon catalog từ 9.2); lưu qua `useUpdateFund` PATCH hiện có; icon hiển thị cập nhật ngay trên FundCard/detail sau save.
2. **Given** user mở fund detail của emergency fund, **When** xem trang, **Then** có edit affordance (hiện KHÔNG có) — sửa được `target_months_expense` (số tháng chi tiêu dự phòng) và icon; `updateFundSchema` bổ sung `target_months_expense` (bounded, int dương).
3. **Given** fund `is_system = true` hoặc fund type khác (freedom/sinking/investment), **When** render edit UI, **Then** giữ nguyên hành vi hiện tại — KHÔNG mở edit cho types ngoài goal + emergency (ngoài scope).
4. **Given** user sửa quỹ thành công, **When** mutation xong, **Then** toast.success, query invalidate đúng keys từ factory, số liệu funds/dashboard cập nhật; error → giữ form + toast.error 5s; nút submit disabled khi isPending.
5. `npx tsc --noEmit` sạch; `npx vitest run` pass; i18n vi/en đầy đủ qua `t()`; touch targets ≥44px; amounts font-mono.

## Tasks / Subtasks

- [x] Task 1: Mở rộng `updateFundSchema` (AC: 2)
  - [x] `src/lib/validations/fund.ts`: thêm `target_months_expense` (int, min 1, max 24 — khớp bound createFundSchema), verify `icon` giữ string tự do (không enum) trong update schema; whitelist chỉ ở UI picker.
  - [x] Unit tests: accept/reject bounds `target_months_expense` + icon string free (fund.test.ts +8 tests → 22 total).
- [x] Task 2: FundEditSheet thêm icon picker (AC: 1)
  - [x] Icon picker (reuse `PRESET_ICON_NAMES` + `CUSTOM_ICON_CHOICES` từ `goalPresetIcons.tsx` 9.2), seed từ `fund.icon`, submit icon cùng values qua `useUpdateFund`.
  - [x] Giữ nguyên 3 field goal (name, target_amount, target_date) + validate date tương lai.
- [x] Task 3: Emergency fund edit (AC: 2, 3)
  - [x] `src/app/(app)/funds/[id]/page.tsx`: edit affordance cho `fund_type === "emergency"` — `canEdit = goal || emergency`, gate cả :98 + :325.
  - [x] Generalize `GoalEditSheet` → `FundEditSheet` (1 component, fields theo fund_type): emergency = name + `target_months_expense` + icon; goal = name + target_amount + target_date + icon.
  - [x] KHÔNG mở edit cho freedom/sinking/investment — `canEdit` chặt.
- [x] Task 4: Invalidation + UX patterns (AC: 4)
  - [x] Verify `useUpdateFund` invalidate keys từ `keys.ts` (funds + fund-detail + dashboard) — đã đủ, không cần bổ sung.
  - [x] isPending → disabled, toast.success 2s / toast.error 5s (useUpdateFund.onError đã toast, caller không double-toast).
- [x] Task 5: Verify (AC: 5)
  - [x] `npx tsc --noEmit` (exit 0); `npx vitest run` (413 pass); i18n parity vi==en (765==765); flows trace.

## Dev Notes

### Hiện trạng (điều tra 09-07-2026)

- PATCH `/api/funds/[id]` (`route.ts:41-70`) validate `updateFundSchema` (`src/lib/validations/fund.ts:20-33`): đã cho `name, description, icon, color, monthly_contribution, contribution_day, target_amount, target_date, expected_return_rate, priority, sort_order, is_active`. THIẾU `target_months_expense` (có trong createFundSchema:13). Không có is_system guard trong PATCH — scope theo household_id.
- `useUpdateFund` (`src/lib/hooks/useFunds.ts:76-104`): PATCH raw input, onError đã toast — KHÔNG double-toast ở caller (bài học 8-3).
- Edit UI hiện tại: `funds/[id]/page.tsx:98` + `:325` gate `fund.fund_type === "goal"` → `GoalEditSheet` (`src/components/funds/GoalEditSheet.tsx:20-98`) 3 fields name/target_amount/target_date, date phải tương lai (`:39-42`), `:43 updateFund.mutate(values)`.
- Emergency fund KHÔNG có edit UI. `TadaFinishButton` (TadaStep) đã chứng minh update path hoạt động cho goal funds.
- Sau 9.2: `goalPresetIcons.tsx` export `PRESET_ICON_NAMES` + `CUSTOM_ICON_CHOICES` (string iconify), funds.icon được ghi từ onboarding. Funds tạo TRƯỚC 9.2 có icon NULL → FundCard fallback config.icon — edit sheet seed icon null = chưa chọn, không lỗi.

### Quyết định thiết kế

- `updateFundSchema.icon`: GIỮ string (không enum) — DB đang có icon lucide từ config/seed, enum sẽ reject PATCH hợp lệ khác. Whitelist chỉ enforce ở UI picker.
- Emergency: nếu record `is_system=true` → không sửa name (rule #3 dự án "is_system=true = immutable" áp cho identity; target_months_expense + icon là user preference — cho phép). Kiểm tra thực tế cột is_system của emergency fund do onboarding tạo (RPC 013/016/017 INSERT có set is_system không — đọc migration) rồi quyết định trong code; ghi quyết định vào Completion Notes.
- Server-side: `target_months_expense` chỉ có nghĩa với emergency — schema cho phép, UI chỉ expose ở emergency sheet. Không thêm cross-field validation phức tạp.

### Regression guards

- KHÔNG đụng TadaStep/GoalStep/route onboarding (9.1, 9.2 vừa sửa).
- KHÔNG mở edit/delete cho is_system ngoài quyết định trên; không đổi hành vi contribute/withdraw RPC.
- Query keys LUÔN từ `keys.ts` factory.
- Working tree có changes chưa commit — KHÔNG git checkout/reset/stash.

### Karpathy guardrails

- Ưu tiên generalize GoalEditSheet (1 component, fields theo fund_type) thay vì component mới copy-paste — nhưng nếu generalize làm component phình >150 dòng if/else, tách EmergencyEditSheet nhỏ riêng sạch hơn. Chọn hướng ít code hơn.
- Không context/HOC mới.

### Project Structure Notes

- UPDATE: `src/lib/validations/fund.ts`, `src/components/funds/GoalEditSheet.tsx`, `src/app/(app)/funds/[id]/page.tsx`, `src/lib/hooks/useFunds.ts` (chỉ nếu thiếu invalidation), `vi.json`, `en.json`, tests.
- NEW (tuỳ quyết định Task 3): `src/components/funds/EmergencyEditSheet.tsx`.
- KHÔNG đụng: migrations (không cần — icon + target_months_expense đã có cột), API route funds (schema là đủ), FundCard.

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Epic-9 Story 9.3]
- [Source: src/app/api/funds/[id]/route.ts:41-70 — PATCH]
- [Source: src/lib/validations/fund.ts:13,20-33 — schemas]
- [Source: src/components/funds/GoalEditSheet.tsx — form hiện tại]
- [Source: src/app/(app)/funds/[id]/page.tsx:98,325 — gate edit]
- [Source: _bmad-output/implementation-artifacts/9-2-fund-icon-picker-persist.md — icon catalog]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (claude-opus-4-8[1m]) — growbase-senior-developer agent.

### Debug Log References

- `npx tsc --noEmit` → exit 0 (sạch).
- `npx vitest run` → 413 tests pass / 31 files; `fund.test.ts` 22 pass (+8 mới).
- i18n parity: node script so khớp vi.json vs en.json → 765 == 765 keys, 0 missing hai chiều.

### Completion Notes List

- **Emergency name/is_system**: Bảng `funds` (migration 002:119-144) KHÔNG có cột `is_system` — RPC onboarding 017 INSERT funds không set is_system. RLS 004 gate is_system chỉ áp cho categories/category_groups/budget_baselines, KHÔNG áp funds. ⇒ Rule #3 (is_system immutable) không liên quan tới funds. Quyết định: emergency fund **cho phép sửa name** (cùng name + target_months_expense + icon), không bị khoá.
- **Generalize vs component riêng**: Chọn generalize `GoalEditSheet` → `FundEditSheet` (1 component, ~185 dòng, fields conditional theo `isEmergency`) thay vì thêm `EmergencyEditSheet` riêng. Lý do: shared name + icon picker + sheet scaffold + submit logic; hai component sẽ duplicate ~217 dòng vs 185 dòng generalize. Đổi tên file để không misleading (component không còn chỉ cho goal). Xoá `GoalEditSheet.tsx`, cập nhật import trong page.tsx (importer duy nhất).
- **icon schema**: Giữ `z.string().optional()` (không enum) trong updateFundSchema — DB có icon lucide cũ, enum sẽ reject PATCH hợp lệ. Whitelist chỉ ở UI picker. Payload submit dùng `icon: values.icon || undefined` để không ghi đè thành chuỗi rỗng.
- **iconChoices**: dedupe `[fund.icon, ...presets, ...CUSTOM_ICON_CHOICES]` — current icon luôn hiện selected kể cả icon preset cũ (education/house/travel) hay lucide ngoài whitelist. Emergency preset = `stash:shield-duotone`; goal presets = education/house/travel.
- **Invalidation Task 4**: `useUpdateFund` đã invalidate `keys.funds` + `["fund-detail", hid, fundId]` + `keys.dashboard` — đủ, không sửa. Không double-toast (onError trong hook đã toast).
- Không đụng TadaStep/GoalStep/onboarding route, không đổi contribute/withdraw RPC, không git checkout/reset/stash.

### Testing

| Flow | Method | Result |
|------|--------|--------|
| updateFundSchema.target_months_expense accept [1,24] | vitest unit | PASS |
| updateFundSchema.target_months_expense reject 0 / 25 | vitest unit | PASS |
| updateFundSchema.target_months_expense null/omit optional | vitest unit | PASS |
| updateFundSchema.icon free string (lucide + ph) | vitest unit | PASS |
| Toàn bộ suite (413 tests / 31 files) | `npx vitest run` | PASS |
| Type safety toàn repo | `npx tsc --noEmit` | PASS (exit 0) |
| i18n parity vi/en | node key-diff | PASS (765==765) |
| Edit goal đổi icon → save → icon cập nhật FundCard/detail | browser (cần verify thủ công) | pending |
| Edit emergency đổi target_months_expense + icon → save | browser (cần verify thủ công) | pending |
| freedom/sinking/investment KHÔNG hiện nút edit | browser (cần verify thủ công) | pending |

### File List

- MODIFIED: `src/lib/validations/fund.ts` — thêm `target_months_expense` vào updateFundSchema.
- MODIFIED: `src/__tests__/validations/fund.test.ts` — +8 tests bounds + icon string.
- ADDED: `src/components/funds/FundEditSheet.tsx` — generalized edit sheet (goal + emergency + icon picker).
- DELETED: `src/components/funds/GoalEditSheet.tsx` — thay bằng FundEditSheet.
- MODIFIED: `src/app/(app)/funds/[id]/page.tsx` — import + `canEdit` gate (goal||emergency) tại :98 + :325.
- MODIFIED: `src/lib/i18n/messages/vi.json` — thêm `funds.editEmergency`, `funds.chooseIcon`.
- MODIFIED: `src/lib/i18n/messages/en.json` — thêm `funds.editEmergency`, `funds.chooseIcon`.

## Change Log

- 09-07-2026: Story created từ Epic 9. Status → ready-for-dev.
- 09-07-2026: Implement Tasks 1-5. updateFundSchema thêm target_months_expense; generalize GoalEditSheet→FundEditSheet với icon picker + emergency edit; edit affordance emergency ở fund detail. tsc/vitest/i18n parity pass.
