# Developer Log

## S0 — App Scaffold (Senior Developer)

### Config files
✓ Next.js 14 init — /package.json — deps theo architect PHẦN D (@supabase/ssr, KHÔNG auth-helpers)
✓ tsconfig — /tsconfig.json — paths "@/*" → "./src/*", strict
✓ next config — /next.config.mjs
✓ tailwind config — /tailwind.config.ts — zinc theme tokens + tailwindcss-animate
✓ postcss config — /postcss.config.mjs
✓ shadcn config — /components.json — style "default", baseColor zinc, cssVariables true, utils alias "@/lib/utils/cn"
✓ .env.example — /.env.example — 3 biến (spec mục 8)
✓ .gitignore — /.gitignore — gồm .env.local

### App structure
✓ globals.css — /src/app/globals.css — Tailwind directives + zinc CSS vars (light + dark)
✓ providers — /src/app/providers.tsx — "use client", QueryClient trong useState (staleTime 60_000, refetchOnWindowFocus false), Toaster sonner richColors top-center
✓ root layout — /src/app/layout.tsx — lang vi, viewport maximumScale 1 (chống iOS zoom), wrap Providers
✓ landing page — /src/app/page.tsx — placeholder mobile-first (max-w-md, pb-16)

### Supabase clients
✓ browser client — /src/lib/supabase/client.ts — createBrowserClient<Database>
✓ server client — /src/lib/supabase/server.ts — createServerClient + cookies() getAll/setAll adapter

### State & queries
✓ appStore — /src/lib/stores/appStore.ts — Zustand AppStore (householdId, currentMonth=toYearMonth(), user, 3 setters)
✓ queryKeys — /src/lib/queries/queryKeys.ts — keys factory đúng CLAUDE.md (as const)

### Constants
✓ budgetTemplate — /src/lib/constants/budgetTemplate.ts — 16 BudgetTemplateLine (spec 7.3, total 100%); "Chi trả nợ" isAutoCalculated; linkedCategoryGroupNames map sang groups spec 7.2

### Utils
✓ cn — /src/lib/utils/cn.ts — clsx + tailwind-merge
✓ date — /src/lib/utils/date.ts — monthRange, toYearMonth, firstDayOfMonth (spec mục 9)
✓ currency — /src/lib/utils/currency.ts — formatVND (spec mục 9)
✓ budget — /src/lib/utils/budget.ts — getBudgetStatus (spec mục 9)

### Types
✓ api — /src/types/api.ts — ApiResponse<T> discriminated union
✓ app — /src/types/app.ts — re-export User từ @supabase/supabase-js
✓ database — /src/types/database.ts — placeholder Database type (gen từ Supabase CLI sau)

### Placeholders
✓ /src/lib/hooks/.gitkeep, /src/lib/validations/.gitkeep

### Deviations
- /src/lib/supabase/server.ts: thêm type alias CookieToSet (CookieOptions từ @supabase/ssr) cho setAll param. Lý do: database.ts placeholder rỗng làm generic không infer cookie types → strict mode báo implicit any. Phát hiện qua build, không phải đoán. Khi gen database.ts thật, annotation này vẫn an toàn.

### Verification
- npx tsc --noEmit → exit 0 (clean)
- npm run build → Compiled successfully, 4/4 static pages generated

### Next: S1 (auth + onboarding) ready to start
