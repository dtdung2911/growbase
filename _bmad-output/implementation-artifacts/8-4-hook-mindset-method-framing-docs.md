# Story 8.4: Hook mindset + method framing + docs

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a người dùng mới,
I want biết app dựa trên phương pháp đã kiểm chứng ngay từ màn đầu,
so that tôi tin đây là khoa học chứ không phải tự suy diễn.

## Acceptance Criteria

1. **Given** user vào Hook step, **When** render, **Then** có dòng mindset "Trả cho bản thân trước" ghi nguồn *"Người giàu có nhất thành Babylon"* (George S. Clason) — đặt gần banner/insight hiện có, không phá layout demo dashboard, i18n vi/en.
2. **Given** app tự giới thiệu phương pháp, **When** copy nhắc framework, **Then** CHỈ dùng 3 nguồn đã xác thực: Pay Yourself First (Clason), Conscious Spending Plan (Ramit Sethi), mental accounting (Thaler — Nobel 2017). KHÔNG nhắc "6 Chiếc Lọ" hay "50/30/20" ở bất kỳ đâu trong app.
3. **Given** `docs/05_UX_SPEC.md`, **When** story done, **Then** flow onboarding mới được document: Hook (mindset) → Goal (2 tầng: emergency nền + multi-select) → Income → Tada (4 stage visual + khép vòng lặp).
4. **Given** `docs/02_BUSINESS_RULES.md`, **When** story done, **Then** rule mới được ghi: emergency fund LUÔN tạo (bắt buộc, không phải lựa chọn), onboarding hỗ trợ nhiều goal fund cùng lúc, framing phương pháp = Conscious Spending Plan.
5. i18n vi/en đầy đủ; `npx tsc --noEmit` sạch; không hardcode string.

## Tasks / Subtasks

- [x] Task 1: Hook mindset copy (AC: 1, 2)
  - [x] `HookStep.tsx`: thêm dòng mindset. Tận dụng slot banner/insight hiện có (`setupV2.hook.banner`, `setupV2.hook.insight`) — thêm 1 element nhỏ, không tạo section cồng kềnh.
  - [x] Key `setupV2.hook.mindset` — vi: *"Trả cho bản thân trước — nguyên tắc kinh điển từ 'Người giàu có nhất thành Babylon'."* en tương đương ("Pay yourself first — the timeless principle from 'The Richest Man in Babylon'.").
  - [x] Style: `text-xs text-muted-foreground` hoặc badge nhẹ, không lấn tiêu đề chính.
- [x] Task 2: Audit method framing toàn app (AC: 2)
  - [x] Grep toàn `src/` + `docs/` cho "6 lọ", "6 chiếc lọ", "6 jar", "50/30/20", "JARS" — nếu có, xoá/thay. (Kỳ vọng: chưa có — đây là guard phòng ngừa.)
  - [x] Đảm bảo mọi copy phương pháp mới (từ 8.2/8.3) chỉ dùng 3 nguồn đã duyệt.
- [x] Task 3: Cập nhật `docs/05_UX_SPEC.md` (AC: 3)
  - [x] Đọc phần onboarding hiện tại. Cập nhật mô tả flow 4 bước theo redesign: Goal step 2 tầng, Tada 4 stage visual, mindset ở Hook.
  - [x] Ghi rõ các screen state mới (emergency foundation card, multi-select counter, stacked budget bar, tada moment).
- [x] Task 4: Cập nhật `docs/02_BUSINESS_RULES.md` (AC: 4)
  - [x] Thêm/sửa rule onboarding: emergency fund bắt buộc (server luôn tạo, không phụ thuộc lựa chọn user); N goal funds tạo atomic trong RPC.
  - [x] Ghi framing phương pháp + 3 nguồn xác thực (để lần sau viết copy không bịa nguồn).
- [x] Task 5: Verify (AC: 5)
  - [x] `npx tsc --noEmit`; kiểm tra Hook step render vi + en; grep xác nhận 0 "50/30/20"/"6 lọ" trong `src/`.

## Dev Notes

- **Độc lập tương đối với 8.1/8.2/8.3** — story này chủ yếu copy + docs, có thể làm sau cùng hoặc song song. Nhưng framing 3 nguồn phải NHẤT QUÁN với string 8.2 (goal blurb) và 8.3 (rationale Thaler) — nếu làm trước, chốt wording nguồn để 8.2/8.3 dùng lại.
- **Hiện trạng `HookStep.tsx`**: demo dashboard "hôm nay còn lại bao nhiêu" từ `hookDemoData.ts` (`calculateTodayRemaining(HOOK_DEMO_MONTHLY_INCOME, ...)`), có banner + title + insight. Mindset chèn vào đây — mục đích: mở vòng lặp mà Tada (8.3) sẽ khép lại. 2 đầu onboarding phải "nói chuyện" với nhau.
- **Framing đã chốt (party-mode 06-07-2026), verifiable — KHÔNG bịa:**
  - Mindset nền: Pay Yourself First — George S. Clason, *The Richest Man in Babylon* (1926).
  - Khung chia tiền: Conscious Spending Plan — Ramit Sethi (*I Will Teach You To Be Rich*): cố định 50-60% / đầu tư 10% / tiết kiệm 5-10% / guilt-free 20-35% (khớp `freedom` fund `reset_monthly`).
  - Khoa học chia quỹ: mental accounting — Richard Thaler, Nobel Kinh tế 2017.
  - Chuẩn 3-6 tháng emergency: CFP Board / chuẩn ngành — verifiable.
  - KHÔNG gán tên ai cho khung 5 cost-type-group (chưa xác minh gốc Google Sheet) — chỉ gọi "khung ngân sách zero-based".
- **Vì sao KHÔNG 6 Lọ / 50/30/20:** data model có 6 fund_type + 18 budget line linh hoạt — 6 Lọ ép 6 tỷ lệ cứng (sai), 50/30/20 chỉ 3 nhóm gộp tiết kiệm+nợ (bỏ phí cấu trúc fund). Ramit khớp 1:1 với `freedom`/`investment`/`sinking`.
- **Docs là action-item retro** — style guide đã bị rewrite vì lệch hiện trạng; đừng để UX_SPEC/BUSINESS_RULES lệch tiếp.

### Project Structure Notes

- UPDATE: `src/components/onboarding/v2/HookStep.tsx`, `docs/05_UX_SPEC.md`, `docs/02_BUSINESS_RULES.md`, 2 file i18n. Không file mới.

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Epic-8 Story 8.4]
- [Source: src/components/onboarding/v2/HookStep.tsx — demo dashboard, slot banner/insight]
- [Source: docs/02_BUSINESS_RULES.md — fund types freedom/monthly_buffer semantics]
- [Source: src/lib/constants/budgetTemplate.ts — 5 cost-type-group, BUDGET_TEMPLATE]
- Party-mode 06-07-2026: quyết định framing Conscious Spending Plan + Pay Yourself First + mental accounting; loại 6 Lọ/50-30-20.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (dev-story workflow)

### Debug Log References

- `npx tsc --noEmit` → clean (exit 0)
- `npx vitest run` → 29 files, 383 tests passed
- i18n parity: vi 759 keys == en 759 keys, 0 missing either side
- `grep -rniE "6 lọ|6 chiếc lọ|6 jar|50/30/20|50-30-20|JARS" src/ docs/` → chỉ 1 match = dòng guard trong UX_SPEC (dòng cấm), 0 match trong `src/`

### Completion Notes List

- Task 1 (Hook mindset) + Task 3 (UX_SPEC redesign section) đã có sẵn trong working tree từ đợt redesign 8-3 (HookStep render `setupV2.hook.mindset`, cả vi/en). Verify khớp AC, giữ nguyên.
- Task 2 (audit framing): grep sạch — không có "6 Lọ"/"50-30-20" trong `src/`. Copy 8.2/8.3 chỉ dùng Clason/Ramit/Thaler.
- Task 4 (BUSINESS_RULES): thêm mới BR-OB-006 (emergency bắt buộc), BR-OB-007 (multi-goal atomic), BR-OB-008 (framing 3 nguồn). Ground vào thực tế code: `complete_onboarding_v2` (migration 013) RAISE nếu `p_goals[0]` ≠ emergency; API route `/onboarding/complete` luôn dựng emergency `p_goals[0]`.
- Không tạo file mới, không thêm dependency.

### Testing

| Business flow (AC) | Method | Result |
|---|---|---|
| Hook step hiển thị dòng mindset "Trả cho bản thân trước" + nguồn Babylon, i18n vi/en (AC1) | Manual trace: `HookStep.tsx:29` render `t("setupV2.hook.mindset")`; key tồn tại cả `vi.json:663` + `en.json:663` | PASS |
| Copy framework chỉ dùng 3 nguồn xác thực, 0 "6 Lọ"/"50-30-20" trong app (AC2) | Automated grep `src/` + `docs/` | PASS (0 match trong src) |
| UX_SPEC document flow 4 bước redesign (AC3) | Manual trace: `docs/05_UX_SPEC.md` section "/setup — Onboarding V2 (redesign, Epic 8)" mô tả Hook→Goal→Income→Tada 4 stage | PASS |
| BUSINESS_RULES ghi rule emergency bắt buộc + multi-goal + framing (AC4) | Manual trace: BR-OB-006/007/008 mới, khớp `complete_onboarding_v2` migration 013 guard | PASS |
| i18n đầy đủ, tsc sạch, không hardcode (AC5) | Automated: tsc exit 0 + i18n parity 759==759 | PASS |

### File List

- `docs/02_BUSINESS_RULES.md` (M) — thêm BR-OB-006/007/008
- `docs/05_UX_SPEC.md` (M) — thêm section /setup Onboarding V2 redesign
- `src/components/onboarding/v2/HookStep.tsx` (M) — dòng mindset
- `src/lib/i18n/messages/vi.json` (M) — key `setupV2.hook.mindset`
- `src/lib/i18n/messages/en.json` (M) — key `setupV2.hook.mindset`

### Change Log

- 2026-07-07: Implement story 8.4 — Hook mindset copy, method framing audit, docs UX_SPEC + BUSINESS_RULES. Status → review.
