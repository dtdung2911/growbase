## Tester Log: S0 — Foundation Sprint

### Setup
- Cài `vitest@^2.1.9` (devDependency). Thêm scripts `test` (vitest run) + `test:watch` (vitest) vào package.json.
- Tạo `/vitest.config.ts` — environment `node`, `globals: true`, include `src/**/*.{test,spec}.{ts,tsx}`, alias `@` → `./src`.
- Test files đặt co-located trong `__tests__/` cạnh source.
- Verify: `vitest run` → 52/52 pass. `tsc --noEmit` → exit 0 (setup không phá type-check).

### Test files created
- `src/lib/utils/__tests__/currency.test.ts` — 8 tests — formatVND: dương, âm, 0, số lớn (tỷ), làm tròn (maximumFractionDigits 0), suffix ₫, dấu chấm phân cách. Normalize NBSP (U+00A0) → space để test robust với mọi locale-whitespace.
- `src/lib/utils/__tests__/date.test.ts` — 14 tests — monthRange (31/30 ngày, Feb thường/nhuận, Dec biên năm, không tràn tháng), toYearMonth (zero-pad, default = current month), firstDayOfMonth (+ cross-check với monthRange.from).
- `src/lib/utils/__tests__/budget.test.ts` — 10 tests — getBudgetStatus: safe/warning/danger qua các threshold. Đặc biệt test biên STRICT (>): actual==budget → warning (không phải danger), actual==budget*0.8 → safe (không phải warning). Edge: budget=0, actual=0.
- `src/lib/utils/__tests__/cn.test.ts` — 9 tests — cn(): join, drop falsy, conditional, tailwind-merge conflict resolution (last wins), array + object syntax, empty input.
- `src/lib/constants/__tests__/budgetTemplate.test.ts` — 11 tests — BUDGET_TEMPLATE: đúng 16 dòng, total budgetPct == 100, required fields hợp lệ, name unique, sortOrder 1..16 liền mạch, mọi dòng isSystem (BR-SY-001), chỉ 'Chi trả nợ' isAutoCalculated (source debt_entries), chỉ 'Quỹ đệm tháng kế tiếp' có linkedCategoryGroupNames rỗng.

### Coverage summary
- Utils: 4/4 tested (currency, date, budget, cn)
- Constants: 1/1 tested (budgetTemplate)
- API routes: 0/0 — S0 chưa có
- Schemas (Zod): 0/0 — S0 chưa có
- Hooks: 0/0 — chỉ có .gitkeep
- Components: 0/0 — chỉ landing placeholder

### Tests skipped
- `src/lib/supabase/client.ts` + `server.ts` — chỉ wrap createBrowser/ServerClient của @supabase/ssr, không có logic riêng để test ở S0. Mock + integration test sẽ làm ở S1 cùng auth flow.
- `src/lib/stores/appStore.ts` — Zustand store thuần state + setters, không có business logic. Sẽ test khi có hooks consume nó (S1+).
- `src/lib/queries/queryKeys.ts` — factory string thuần, không có logic phân nhánh.
- `src/types/*`, `src/app/*` (layout, providers, page placeholder) — không có testable logic ở S0.

### Known failures
- Không có. 52/52 tests pass.

### Notes cho sprint sau
- formatVND output dùng NBSP (U+00A0) giữa số và ₫ (Node ICU). Test đã normalize; nếu component snapshot test ở S1+ so chuỗi cần lưu ý whitespace này.
- getBudgetStatus dùng so sánh STRICT (>): tại biên budget*0.8 và budget, status rơi vào nhánh "thấp hơn". Đã có test ghi nhận behavior này. Nếu spec yêu cầu inclusive (>=) thì đây là điểm cần đối chiếu với BA ở Reports (S4).
- Threshold 0.8 đang hardcode ở cả budget.ts (TS) lẫn SQL — fixer đã ghi nhận duplication, chấp nhận ở S0. Test bám theo giá trị TS hiện tại.
