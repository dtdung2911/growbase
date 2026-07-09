---
baseline_commit: 98133d26e5d294f5fec53861bc32a23e16df9648
---

# Story 9.2: Icon quỹ — picker cho quỹ custom + persist mọi quỹ

Status: done

## Story

As a người dùng tạo quỹ theo ý riêng,
I want chọn icon thể hiện quỹ của tôi và thấy đúng icon đó trong app sau onboarding,
so that quỹ mang bản sắc của tôi, không phải icon target vô hồn giống nhau.

## Acceptance Criteria

1. **Given** user thêm quỹ custom ở GoalStep, **When** form custom mở, **Then** có icon picker (~8-12 icon Phosphor duotone phù hợp mục tiêu tài chính, grid touch target ≥44px), mặc định fallback icon (pencil) nếu user không chọn.
2. **Given** user hoàn thành onboarding với quỹ preset + custom, **When** RPC `complete_onboarding_v2` chạy, **Then** `funds.icon` được ghi cho MỌI quỹ: preset map từ presetId (single source of truth icon string), custom theo user chọn — migration mới cho RPC đọc `icon` từ từng phần tử `p_goals`, validate an toàn (Zod whitelist ở route trước khi gọi RPC).
3. **Given** user vào trang Funds/fund detail sau onboarding, **When** FundCard render, **Then** icon hiển thị đúng theo `fund.icon` (FundCard đã render `fund.icon || config.icon` — verify end-to-end), fallback config icon nếu null. TadaStep fund list cũng hiện icon user đã chọn cho quỹ custom.
4. **Given** i18n + type safety, **When** story done, **Then** strings qua `t()`, `npx tsc --noEmit` sạch, `npx vitest run` pass, Zod schema onboarding validate icon (whitelist), i18n parity vi==en.

## Tasks / Subtasks

- [x] Task 1: Icon catalog — single source of truth (AC: 1, 2)
  - [x] Refactor `src/components/onboarding/v2/goalPresetIcons.tsx`: chuyển từ static component imports sang map string iconify — `PRESET_ICON_NAMES: Record<string, string>` (emergency: `"stash:shield-duotone"`, education: `"ph:graduation-cap-duotone"`, house: `"ph:house-line-duotone"`, travel: `"ph:island-duotone"`, custom fallback: `"ph:pencil-simple-line-duotone"`) + render qua `<Icon icon={...}>` của `@iconify/react` (app đã dùng 60+ chỗ). Giữ nguyên visual (duotone, size, màu primary).
  - [x] Export `CUSTOM_ICON_CHOICES: string[]` (11 icon ph: duotone: car, airplane-tilt, heart, baby, gift, device-mobile, briefcase, diamond, piggy-bank, book, first-aid-kit) — verify tồn tại thật trong `node_modules/@iconify-react/ph/components` (ring-duotone KHÔNG tồn tại → dùng diamond-duotone).
- [x] Task 2: Icon picker trong form custom GoalStep (AC: 1)
  - [x] `GoalStep.tsx` (form custom): grid `grid-cols-6` icon buttons từ `CUSTOM_ICON_CHOICES`, chọn 1, selected state `ring-2 ring-primary`, touch `h-11 min-h-[44px]`, mặc định fallback pencil (set trong toggle). Label qua `t("setupV2.goal.customIconLabel")`. `role="radiogroup"`/`role="radio"` + `aria-checked`.
  - [x] State icon đi cùng goal custom trong flow onboarding (toggle set icon, `updateGoal(presetId, { icon })` khi chọn).
- [x] Task 3: Persist icon qua route + RPC (AC: 2)
  - [x] `src/lib/validations/onboardingV2.ts`: goal schema thêm `icon` — `z.enum(ICON_CATALOG)` (preset icon strings + CUSTOM_ICON_CHOICES) `.default(PRESET_ICON_NAMES.custom)`. KHÔNG nhận string tự do.
  - [x] `src/app/api/onboarding/complete/route.ts`: build `p_goals` element thêm `icon` (emergency + preset → map từ presetId server-side qua `PRESET_ICON_NAMES`, custom → từ `g.icon` đã validate).
  - [x] Migration `supabase/migrations/017_onboarding_fund_icon.sql`: DROP + recreate `complete_onboarding_v2` GIỮ NGUYÊN toàn bộ hardening của 016 (advisory lock đầu tiên, `IS DISTINCT FROM 'emergency'` cho phần tử 0, reject emergency ở 1..N, `jsonb_array_length <= 6`, `target_amount > 0`, localized name params, return `{household_id, fund_ids}`, REVOKE/GRANT đúng signature 8-arg) — chỉ THÊM `NULLIF(v_item->>'icon','')` vào INSERT funds.
  - [x] `src/lib/hooks/useCompleteOnboardingV2.ts`: input type goals dùng `OnboardingGoal[]` → icon đã carry transitively (z.infer), không cần sửa file (xem Completion Notes).
- [x] Task 4: Render end-to-end (AC: 3)
  - [x] TadaStep fund list: quỹ custom hiện icon user chọn qua helper `iconFor()` (match goals state theo name; API response shape KHÔNG đổi), preset/emergency map từ `PRESET_ICON_NAMES`.
  - [x] Verify FundCard (`src/components/funds/FundCard.tsx:49`) render `fund.icon` — manual trace: funds GET `select("*")` → `fund.icon` string iconify → `<Icon icon={fund.icon || config.icon}>`. Không cần sửa.
- [x] Task 5: Tests + verify (AC: 4)
  - [x] Unit tests: Zod schema icon (accept whitelist, reject junk string, default fallback); cập nhật store test + validations test cho shape đổi (thêm icon).
  - [x] `npx tsc --noEmit` sạch; `npx vitest run` 409 pass; i18n parity vi==en (763==763).

## Dev Notes

### Hiện trạng (điều tra 09-07-2026 — KHÔNG cần re-investigate)

- `funds.icon` column ĐÃ TỒN TẠI: `supabase/migrations/002_tables.sql:136` (`icon text`, nullable). Không cần ALTER TABLE.
- RPC hiện tại (016) INSERT funds KHÔNG có icon (`016_onboarding_rpc_hardening.sql:120-128`): chỉ `name, fund_type, target_amount, target_date, target_months_expense`. `p_goals` shape từ route (`route.ts:68-83`): `{fund_type, name, target_amount, target_date, target_months_expense}` — presetId bị mất sau onboarding.
- `goalPresetIcons.tsx` hiện dùng static imports `@iconify-react/ph/*-duotone` + `@iconify-react/stash/shield-duotone` (component per icon). Post-onboarding app render icon qua `@iconify/react` `<Icon icon="lucide:...">` string — 2 cơ chế khác nhau. Story này thống nhất về string iconify để persist được.
- `FundCard.tsx:49`: `<Icon icon={fund.icon || config.icon} .../>` — đã sẵn sàng nhận string, `FUND_TYPE_CONFIG` (src/types/app.ts:49-54) là fallback lucide.
- Package `@iconify/react` + `@iconify-react/ph` đều có trong package.json. Lưu ý: `@iconify/react` load icon data runtime từ API iconify (online) — icon ph:/stash: render được như lucide: hiện tại. Nếu muốn offline cho preset icons, giữ static imports cho onboarding UI nhưng vẫn persist STRING vào DB (2 lớp: render local, persist string) — ưu tiên cách đơn giản: dùng `<Icon>` string thống nhất, vì app đã phụ thuộc pattern này 60+ chỗ.

### Migration 017 — cẩn trọng

- 015 + 016 CHƯA push lên remote DB (đang chờ `supabase db push`) — 017 xếp chồng, thứ tự áp dụng đúng.
- COPY toàn bộ body 016 làm nền, chỉ thêm icon. Mất bất kỳ guard nào của 016 = fail review. Signature RPC đổi? KHÔNG — icon nằm trong `p_goals` jsonb, signature 8-arg giữ nguyên → REVOKE/GRANT giữ nguyên signature.
- Validate icon TRONG RPC không cần whitelist (Zod route đã chặn), nhưng nullable-safe: `NULLIF(goal->>'icon','')`.

### Regression guards

- GoalStep: emergency foundation card + multi-select flow (8-2) — không đổi hành vi chọn/bỏ preset; chỉ thêm picker vào form custom.
- Route: giữ locale/name params (016), LOCALIZED_NAMES map, 409 already_onboarded, generic 500.
- TadaStep vừa sửa ở 9.1 (per-fund/tổng/hint) — KHÔNG đụng phần đó, chỉ icon render.
- Zod: `monthlyIncome.min(100_000)`, duplicate-goal refine, bounds — giữ nguyên.
- Working tree đang có changes chưa commit (9.1 + review fixes) — KHÔNG git checkout/reset bất kỳ file nào.

### Karpathy guardrails

- Icon catalog = const map + array, không class/factory. Picker inline trong GoalStep nếu <20 dòng, chỉ tách component khi form custom quá dài.
- Không thêm dependency mới.

### Project Structure Notes

- UPDATE: `goalPresetIcons.tsx`, `GoalStep.tsx`, `TadaStep.tsx` (icon render only), `onboardingV2.ts` (validations), `route.ts` (onboarding complete), `useCompleteOnboardingV2.ts`, `vi.json`, `en.json`, tests.
- NEW: `supabase/migrations/017_onboarding_fund_icon.sql`.
- KHÔNG đụng: FundCard (chỉ verify), budgetTemplate.ts, migrations cũ.

### References

- [Source: _bmad-output/planning-artifacts/epics-onboarding-v2.md#Epic-9 Story 9.2]
- [Source: supabase/migrations/016_onboarding_rpc_hardening.sql — nền RPC]
- [Source: supabase/migrations/002_tables.sql:136 — funds.icon]
- [Source: src/components/onboarding/v2/goalPresetIcons.tsx — icon hiện tại]
- [Source: src/components/funds/FundCard.tsx:49 — render fund.icon]
- [Source: _bmad-output/implementation-artifacts/9-1-tada-transparent-numbers.md — TadaStep vừa sửa]

## Dev Agent Record

### Agent Model Used

Opus 4.8 (1M context) — claude-opus-4-8[1m] (growbase-senior-developer agent)

### Debug Log References

- `npx tsc --noEmit` → exit 0, 0 dòng output.
- `npx vitest run` → 31 test files, 409 tests passed. onboardingV2 validations: 32 tests (+3 icon).
- i18n parity: vi 763 keys == en 763 keys, diff rỗng cả 2 chiều.
- Verify icon phosphor tồn tại: chạy check trên `node_modules/@iconify-react/ph/components/<letter>/<name>-duotone.jsx` — `ring-duotone` KHÔNG có, đổi sang `diamond-duotone` (có). `stash:shield-duotone` verify trong `@iconify-react/stash`; `ph:graduation-cap-duotone` trong `@iconify-react/ph`.

### Completion Notes List

- `goalPresetIcons.tsx` chuyển hoàn toàn sang pure constants (bỏ `ReactNode` + static imports) → an toàn import từ validations (server) + route + tests, không kéo React vào server bundle.
- Zod whitelist: `ICON_CATALOG = [...Object.values(PRESET_ICON_NAMES), ...CUSTOM_ICON_CHOICES] as [string, ...string[]]`, `icon: z.enum(ICON_CATALOG).default(PRESET_ICON_NAMES.custom)`. z.enum vẫn check membership runtime → reject junk; default output type `icon: string` (required) nên mọi literal `OnboardingGoal` phải có icon.
- DEVIATION (Task 3, hook): `useCompleteOnboardingV2.ts` KHÔNG sửa — input type là `OnboardingGoal[]`, icon carry transitively qua z.infer. Thêm field thủ công là redundant (Karpathy: no redundant). Payload gửi API tự có icon.
- Do `OnboardingGoal` giờ require `icon`, phải thêm icon vào 2 literal typed trong `onboardingV2Store.test.ts` (regression fix, cùng scope shape đổi).
- Route: emergency + preset lấy icon server-side từ `PRESET_ICON_NAMES` (single source of truth), custom lấy `g.icon` đã whitelist — presetId là nguồn icon, không tin client cho preset.
- Migration 017 = copy nguyên body 016, thay đổi DUY NHẤT: cột `icon` + `NULLIF(v_item->>'icon','')` trong INSERT funds. Signature 8-arg, advisory lock, mọi guard, REVOKE/GRANT giữ nguyên.
- Regression: GoalStep emergency card + multi-select preset (8-2), TadaStep per-fund/tổng/feasibility (9.1), Zod min income/duplicate refine/bounds — KHÔNG đụng. FundCard KHÔNG sửa.

### Testing

| Flow | Method | Result |
|------|--------|--------|
| Zod goal.icon accept whitelist (custom choice + preset string) | unit test | PASS |
| Zod goal.icon reject junk string (`ph:skull-duotone`, `definitely-not-an-icon`) | unit test | PASS |
| Zod goal.icon default fallback pencil khi bỏ trống | unit test | PASS |
| onboardingV2 validations (toàn bộ 32) | `npx vitest run` | PASS |
| onboardingV2Store (icon thêm vào literals) | `npx vitest run` | PASS |
| Toàn bộ suite | `npx vitest run` | 409/409 PASS |
| Type safety toàn repo | `npx tsc --noEmit` | PASS (0 lỗi) |
| i18n parity vi==en (thêm customIconLabel) | script so sánh key set | PASS (763==763) |
| Phosphor icon names tồn tại thật | check filesystem `@iconify-react/ph` | PASS (diamond thay ring) |
| FundCard render fund.icon end-to-end | manual trace (picker → store → Zod → route → RPC 017 → funds select("*") → `<Icon fund.icon>`) | verified — không cần sửa FundCard |

Cần verify trên browser (runtime iconify fetch, không cover được bằng unit test):
- GoalStep form custom: grid 11 icon render (ph:*-duotone) + chọn → `ring-2 ring-primary`, touch ≥44px.
- TadaStep: quỹ custom hiện đúng icon đã chọn; preset/emergency đúng icon.
- Trang Funds sau onboarding: FundCard hiện icon đã chọn cho quỹ custom, preset icon cho quỹ preset (cần `supabase db push` migration 015→017 trước).

### File List

- `src/components/onboarding/v2/goalPresetIcons.tsx` (refactor: string maps + CUSTOM_ICON_CHOICES)
- `src/lib/validations/onboardingV2.ts` (icon whitelist enum + default)
- `src/components/onboarding/v2/GoalStep.tsx` (Icon render + icon picker + toggle set icon)
- `src/app/api/onboarding/complete/route.ts` (p_goals icon)
- `supabase/migrations/017_onboarding_fund_icon.sql` (NEW)
- `src/components/onboarding/v2/TadaStep.tsx` (iconFor helper + Icon render)
- `src/lib/i18n/messages/vi.json` (setupV2.goal.customIconLabel)
- `src/lib/i18n/messages/en.json` (setupV2.goal.customIconLabel)
- `src/__tests__/validations/onboardingV2.test.ts` (icon tests)
- `src/__tests__/stores/onboardingV2Store.test.ts` (icon field trong literals)

## Change Log

- 09-07-2026: Story created từ Epic 9. Status → ready-for-dev.
- 09-07-2026: Implement Tasks 1→5. Icon catalog string iconify, picker trong GoalStep custom, persist icon qua route + migration 017, TadaStep render icon custom. tsc sạch, vitest 409 pass, i18n parity 763==763.
- 09-07-2026 — Code-review fixes: (1) iconFor trim 2 phía; (2) migration 017 funds loop WITH ORDINALITY + ORDER BY ord; (3) Zod goals array refine reject presetId "emergency" + unit test; (4) icon catalog move sang src/lib/constants/fundIcons.ts, goalPresetIcons.tsx re-export (validations + route import từ lib, FundEditSheet compile qua re-export); (5) fix Debug Log typo graduation-cap. tsc sạch, 414 tests pass, i18n parity 766==766.

### Review Findings (code review 09-07-2026)

- [x] [Review][Patch] iconFor match custom goal trim 2 phía (`g.name.trim() === f.name.trim()`) — icon custom không còn rơi về pencil khi name có khoảng trắng [src/components/onboarding/v2/TadaStep.tsx iconFor]
- [x] [Review][Patch] Migration 017 funds loop thêm `WITH ORDINALITY ... ORDER BY ord` — bảo đảm thứ tự fund_ids[i] ↔ p_goals[i] khớp budget loop [supabase/migrations/017_onboarding_fund_icon.sql]
- [x] [Review][Patch] Zod goals array refine reject `presetId === "emergency"` → chặn pseudo-emergency shield icon bypass UI; thêm unit test [src/lib/validations/onboardingV2.ts]
- [x] [Review][Patch] Icon catalog move sang `src/lib/constants/fundIcons.ts` (PRESET_ICON_NAMES, CUSTOM_ICON_CHOICES, ICON_CATALOG); goalPresetIcons.tsx re-export (FundEditSheet + UI imports không vỡ); validations + route import từ lib [src/lib/constants/fundIcons.ts]
- [x] [Review][Patch] Story doc Debug Log sửa "stash:graduation-cap-duotone" → "ph:graduation-cap-duotone" [9-2 story file]
- [x] [Review][Defer] Deploy-order skew: route deploy trước `supabase db push` 017 → onboarding thành công nhưng funds.icon = NULL im lặng — deferred, ops note: push DB trước khi deploy code
- [x] [Review][Defer] aria-label icon picker = raw iconify id ("ph:car-duotone") cho screen reader — deferred, cần 11 human-readable label keys × 2 locale, làm đợt a11y
