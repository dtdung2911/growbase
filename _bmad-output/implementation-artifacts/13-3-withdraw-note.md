---
baseline_commit: 16e7bf3cf66c07f35452170ff81f9ca94483d859
---

# Story 13.3: Mô tả lý do rút quỹ

Status: done

## Story

As a người dùng rút tiền từ quỹ,
I want nhập lý do khi rút,
So that có friction lành mạnh và dữ liệu cho câu chuyện sau này.

**Nguồn:** Epic 13 (`epics-onboarding-v2.md:1103-1117`) · BR-OB-018.

## Acceptance Criteria

1. **Given** user mở dialog "Rút quỹ"
   **When** form render
   **Then** thêm field mô tả lý do (text) BẮT BUỘC (BR-OB-018)

2. **Given** user xác nhận rút với lý do
   **When** withdraw hoàn tất (RPC fund_withdraw atomic, ConfirmDialog trước)
   **Then** lý do lưu vào transaction/fund history, hiện được ở tab Lịch sử; giữ atomic RPC; toast; i18n vi/en

## Tasks / Subtasks

- [x] Task 1: Description bắt buộc (AC: 1)
  - [x] `fundWithdrawSchema` (`validations/fund.ts:54`): `description` optional → `z.string().trim().min(1, "...").max(200)` bắt buộc (message tiếng Việt theo văn phong file)
  - [x] `WithdrawModal.tsx` (field đã tồn tại dòng 203, default "" dòng 70): label update "Lý do rút (bắt buộc)" i18n, error hiển thị dưới field khi trống (pattern form hiện có), submit disabled khi invalid
  - [x] KHÔNG đổi flow: ConfirmDialog trước mutation giữ nguyên; RPC `fund_withdraw` đã nhận `p_description` (`003_functions.sql:122`) — KHÔNG migration
- [x] Task 2: Hiện lý do ở tab Lịch sử (AC: 2)
  - [x] Fund detail tab history: kiểm tra transactions table render có show description chưa (đọc `funds/[id]/page.tsx` history tab 174-362) — nếu chưa, thêm description dòng phụ text-xs muted dưới row withdrawal (chỉ khi có); nếu đã hiện thì verify + không sửa
  - [x] Emergency withdraw (nguồn drama BR-OB-018): không phân biệt xử lý — mọi fund_type đều bắt buộc lý do (AC không giới hạn)
- [x] Task 3: Tests + verify (AC: 2)
  - [x] Validation test: description trống/khoảng trắng reject, có nội dung pass, max 200
  - [x] `npx tsc --noEmit` · `npx vitest run` full · i18n parity · manual trace: rút thiếu lý do bị chặn, rút có lý do → history hiện

## Dev Notes

- Infra ĐÃ SẴN (investigator): WithdrawModal field description (203) + default (70); `fundWithdrawSchema.description: z.string().optional()` (fund.ts:54); RPC `p_description text DEFAULT NULL` (003_functions.sql:122) → story = siết validation + label + hiển thị. KHÔNG migration, KHÔNG RPC change.
- Withdraw flow hiện có: ConfirmDialog destructive trước mutation (pattern project) — GIỮ.
- 12.3 lesson: hasContributedInMonth check direction — withdrawal direction 'out', không ảnh hưởng suggest logic.
- i18n: keys `funds.withdrawReason*` (label + error) parity vi/en.
- KHÔNG đụng: ContributeModal, engine, stageEvent (13.2 đang patch), RPC.

### References

- `epics-onboarding-v2.md:1103-1117` (13.3 verbatim) · BR-OB-018
- `003_functions.sql:122` (RPC signature sẵn) · `validations/fund.ts:54`

## Dev Agent Record

### Agent Model Used

claude-fable-5 (growbase-senior-developer; main thread verify độc lập)

### Debug Log References

- tsc exit 0 · vitest 38 files / 529 tests (524 → 529) — verify độc lập · parity 854 == 854

### Completion Notes List

1. fundWithdrawSchema.description required trim min1/max200 (Zod message vi); WithdrawModal label "(bắt buộc)" + placeholder + error i18n phân biệt too_big + submit disabled reasonMissing (watch+trim, pattern exceedsBalance); ConfirmDialog/RPC flow nguyên.
2. History tab ĐÃ hiện sẵn description (page dòng 250 desktop / 298 mobile, fallback label) — verify không sửa.
3. Fixture validWithdraw += description (bắt buộc để tests cũ pass — 3 fails transient trong lúc dev đã tự hết).

### Testing

| Business flow | Method | Kết quả |
|---|---|---|
| Reject missing/empty/whitespace/>200; accept boundary 200 + trim | Automated (validation tests) | PASS |
| Description → RPC p_description → history hiển thị | Trace call path + page render sẵn — **cần browser verify** | PASS (trace) |
| ConfirmDialog + atomic RPC giữ nguyên | Trace diff | PASS |

### File List

- M `src/lib/validations/fund.ts` · M `src/components/funds/WithdrawModal.tsx` · M `src/lib/i18n/messages/vi.json` · M `src/lib/i18n/messages/en.json` · M `src/__tests__/validations/fund.test.ts`

## Senior Developer Review (AI)

**Date:** 11-07-2026 · **Outcome:** Approve — CLEAN (0 findings) · **Layer:** cavecrew-reviewer (verify: server-side validation qua schema parse route, RPC path, trim cả 2 lớp, contribute không lây, 529 reproduce)

## Change Log

- 11-07-2026: Story 13.3 implemented + reviewed clean — withdraw description bắt buộc BR-OB-018, history hiện sẵn; 529 tests; status → done.
