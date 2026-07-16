---
title: 'Story 14.2: Scaffold Expo app + Metro monorepo config'
type: 'feature'
created: '2026-07-16'
status: 'done'
final_revision: 45ff66c64f66cdce9ccd7f548467bc4a4456633a
review_loop_iteration: 0
followup_review_recommended: false
story_id: "14.2"
story_key: "14-2-scaffold-expo-app"
epic: "Epic 14 — Foundation & Monorepo (mobile)"
baseline_revision: cf846ec84207de0d027ab7ae05f593510b4887c4
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-14-context.md'
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** Monorepo đã có `apps/web` + `packages/shared` (story 14.1) nhưng chưa có mobile app — Epic 15–18 (toàn bộ tính năng mobile) bị chặn cho tới khi có Expo shell chạy được và resolve được `@growbase/shared` qua Metro.

**Approach:** Scaffold Expo app (SDK 56, Expo Router v6, TypeScript strict) vào `apps/mobile` bằng create-expo-app, rút gọn về blank shell, cấu hình Metro cho pnpm monorepo (symlinks + package exports), cài base deps (TanStack Query v5, Zustand v5, react-native-mmkv), chứng minh import `@growbase/shared` hoạt động trong bundle.

## Boundaries & Constraints

**Always:**
- Expo SDK 56 (bản SDK là contract; RN version đi theo SDK — SDK 56 ship RN 0.85 + React 19.2, KHÔNG phải RN 0.86 như epics ghi nhầm; không tự nâng lên SDK 57).
- Expo Router v6 + TypeScript strict; `app.json` bật `experiments.typedRoutes`.
- `metro.config.js` extend `expo/metro-config` và set explicit `unstable_enableSymlinks: true` + `unstable_enablePackageExports: true` (AC yêu cầu explicit dù Metro mới đã default).
- Chỉ 1 instance react/react-native trong bundle mobile.
- `apps/mobile/package.json` có script `type-check: tsc --noEmit` để `pnpm -r type-check` ở root bao luôn mobile.
- Web không được vỡ: `pnpm build` + `pnpm test` (root, filter web) phải pass như trước.
- Native deps cài qua `npx expo install` để lấy version tương thích SDK 56.

**Block If:**
- create-expo-app / registry không thể tải template SDK 56 sau nhiều lần thử (network/registry hỏng) — HALT `blocked`.
- Metro không resolve được `@growbase/shared` và cách sửa duy nhất là đổi cấu hình install toàn repo (vd `node-linker=hoisted`) mà thay đổi đó làm web build/test fail — HALT `blocked` kèm bằng chứng.

**Never:**
- Không viết API client (story 14.3), không đụng web `/api` (story 14.4), không dùng `@supabase/supabase-js` trong mobile (chưa cần ở story này).
- Không build UI/feature screens thật (Epic 15+) — chỉ blank shell.
- Không setup EAS build, CI, Turborepo.
- Không sửa source `packages/shared` hay `apps/web` (trừ khi bắt buộc cho Metro fix có kiểm chứng regression).
- Không hardcode API endpoint hay thêm env secrets.

</intent-contract>

## Code Map

- `pnpm-workspace.yaml` -- đã có `apps/*` + `packages/*`; không cần sửa, `apps/mobile` tự vào workspace
- `packages/shared/package.json` -- `@growbase/shared`, exports `"."` + `"./*"` → `./src/*.ts`, consumed as source (không dist)
- `packages/shared/src/rules/currency.ts` -- có `formatVND` — dùng làm import chứng minh resolution
- `apps/web/` -- Next.js app, chỉ chạy regression, không sửa
- `apps/mobile/` -- MỚI: Expo app (app/, metro.config.js, tsconfig.json, app.json, package.json)
- Root `package.json` -- scripts `type-check` = `pnpm -r type-check` tự bao mobile; không đổi trừ khi cần

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/` -- scaffold bằng `create-expo-app` template default SDK 56 (tên package `@growbase/mobile`), chạy từ root để Expo auto-detect pnpm workspace -- nền app shell
- [x] `apps/mobile/app/` -- rút template về blank shell: `_layout.tsx` (Stack) + `index.tsx` render text app name + giá trị từ `formatVND` import `@growbase/shared/rules/currency`; xoá example screens/components/assets thừa của template -- chứng minh shared import + shell sạch
- [x] `apps/mobile/metro.config.js` -- extend `expo/metro-config`, set explicit `unstable_enableSymlinks` + `unstable_enablePackageExports` -- AC Metro monorepo
- [x] `apps/mobile/package.json` -- thêm deps `@tanstack/react-query@^5`, `zustand@^5`, `react-native-mmkv` (qua `npx expo install react-native-mmkv`); thêm script `type-check` -- base deps + root type-check coverage
- [x] `apps/mobile/tsconfig.json` -- extends `expo/tsconfig.base`, `strict: true` -- TS chuẩn
- [x] `apps/mobile/app.json` -- name/slug growbase-mobile, bật `experiments.typedRoutes` -- Router v6 typed routes
- [x] `apps/mobile/.gitignore` -- đảm bảo ignore `.expo/`, `node_modules/`, native build dirs -- repo sạch

**Acceptance Criteria:**
- Given monorepo sau 14.1, when scaffold xong, then `apps/mobile` là Expo SDK 56 + Expo Router v6 + TypeScript strict và `pnpm type-check` (root) pass cho cả 3 packages.
- Given app shell, when chạy `npx expo export --platform ios --platform android` trong `apps/mobile`, then export thành công cho cả 2 platform (proxy unattended cho "chạy được trên iOS simulator + Android emulator") và bundle chứa module resolve từ `@growbase/shared`.
- Given `metro.config.js`, when đọc file, then 2 flag `unstable_enableSymlinks` + `unstable_enablePackageExports` được set explicit true.
- Given deps đã cài, when kiểm tra `apps/mobile/package.json` + lockfile, then có TanStack Query v5, Zustand v5, react-native-mmkv version tương thích SDK 56, và chỉ 1 version react/react-native trong subtree mobile (`pnpm --filter @growbase/mobile why react-native` ra 1 version).
- Given web regression, when chạy `pnpm build` và `pnpm test` ở root, then pass như trước khi scaffold.

## Design Notes

- **Simulator AC → export proxy:** run unattended không mở được iOS simulator/Android emulator. `npx expo export` cho cả 2 platform chạy đúng Metro pipeline (resolve, transform, bundle) — fail nếu symlink/exports/duplicate-react hỏng, nên là proxy trung thực. Manual check cho human ghi ở Verification.
- **react-native-mmkv là native module:** chỉ CÀI ở story này, KHÔNG import vào runtime code — import nó sẽ phá chạy bằng Expo Go (cần dev build). Epic sau mới wire MMKV.
- **pnpm isolated linker:** Expo hỗ trợ pnpm isolated từ SDK 54; nếu gặp lỗi resolution thì ưu tiên fix cục bộ (public-hoist-pattern cho deps mobile) trước khi cân nhắc `node-linker=hoisted` toàn repo (đụng Block If nếu web vỡ).
- **Template SDK 56 sinh AGENTS.md/CLAUDE.md/.claude/** trong `apps/mobile` — xoá để khỏi nhiễu config repo (root đã có CLAUDE.md riêng).

## Verification

**Commands:**
- `pnpm install` -- expected: lockfile update sạch, không peer-dep error chặn
- `pnpm type-check` -- expected: pass cả `@growbase/shared`, web, `@growbase/mobile`
- `cd apps/mobile && npx expo-doctor` -- expected: pass (warnings không liên quan monorepo được phép, ghi lại nếu có)
- `cd apps/mobile && npx expo export --platform ios --platform android` -- expected: export OK cả 2 platform
- `pnpm --filter @growbase/mobile why react-native` -- expected: đúng 1 version react-native
- `pnpm build && pnpm test` -- expected: web build + vitest pass như baseline

**Manual checks (if no CLI):**
- (Human, sau run) `pnpm --filter @growbase/mobile start` rồi mở iOS simulator/Android emulator: blank shell hiện app name + số tiền format VND từ shared package.

## Review Triage Log

### 2026-07-16 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 8: (high 0, medium 2, low 6)
- defer: 4: (high 0, medium 2, low 2)
- reject: 9
- addressed_findings:
  - `[medium]` `[patch]` react-native-mmkv v4 (Nitro) thiếu `react-native-nitro-modules` trong deps của app → autolinking sẽ miss khi wire MMKV; đã thêm `react-native-nitro-modules@^0.36.1` qua `npx expo install`.
  - `[medium]` `[patch]` Dependency bloat trái tinh thần blank shell: prune 12 deps template không dùng (@expo/ui, expo-glass-effect, expo-symbols, expo-device, expo-web-browser, expo-image, expo-font, react-native-reanimated, react-native-worklets, react-native-gesture-handler, react-native-web, react-dom) + bỏ web target/script.
  - `[low]` `[patch]` Script `lint` chết (không có eslint config/dep) → xoá script; xoá `apps/mobile/.vscode/` (bị root .gitignore ignore, ghost files).
  - `[low]` `[patch]` `scheme: "mobile"` generic collision-prone → đổi `"growbase"`.
  - `[low]` `[patch]` Range `^5.0.0` không phản ánh version test → pin `@tanstack/react-query@^5.101.2`, `zustand@^5.0.14`.
  - `[low]` `[patch]` Dòng lẻ `example` trong apps/mobile/.gitignore (leftover template) → xoá.
  - `[low]` `[patch]` `.pnpmfile.cjs` + cách chạy mobile không được document → thêm section Monorepo vào CLAUDE.md.
  - `[low]` `[patch]` Verification top-up: `pnpm --filter @growbase/mobile why react` → đúng 1 version (19.2.3).

## Auto Run Result

Status: done

### Summary

Scaffold Expo SDK 56 app (`@growbase/mobile`) vào `apps/mobile` trong pnpm monorepo: Expo Router v6 + TypeScript strict, blank shell 2 screen files import `formatVND` từ `@growbase/shared/rules/currency`, Metro config explicit `unstable_enableSymlinks` + `unstable_enablePackageExports`, base deps TanStack Query v5 / Zustand v5 / react-native-mmkv v4 (+nitro-modules). Sau review: prune 12 deps template thừa, fix scheme/pins/gitignore, document monorepo vào CLAUDE.md.

### Files changed

- `apps/mobile/` (mới) — Expo app: `app/_layout.tsx` (Stack), `app/index.tsx` (shell + shared import), `metro.config.js` (2 flag explicit), `package.json`, `app.json` (typedRoutes, scheme growbase, không web target), `tsconfig.json` (strict, extends expo/tsconfig.base), `.gitignore`, assets template (icon/splash)
- `.pnpmfile.cjs` (mới, root) — inject optional `@types/react` peer: web link React 18 types, mobile React 19 types; fix type-check cross-app
- `CLAUDE.md` — thêm section Monorepo (layout, run mobile, .pnpmfile.cjs, cảnh báo mmkv/Expo Go)
- `pnpm-lock.yaml` — thêm dependency tree mobile; 0 version change cho deps web có sẵn (đã spot-check baseline diff)
- `_bmad-output/implementation-artifacts/epic-14-context.md` (mới) — compiled epic context
- `apps/web/.env.local` — copy từ checkout chính (untracked/gitignored, bootstrap env cho worktree — không phải code change)

### Review findings breakdown

- Patches applied: 8 (2 medium, 6 low) — chi tiết ở Review Triage Log
- Deferred: 4 → `deferred-work.md` (bundleIdentifier/android.package; URL polyfill cho root shared import — story 14.3; branding GrowBase cho icon/splash; exports map shared chỉ cover `./src/*.ts`)
- Rejected: 9 (noise / hành vi chuẩn Expo / theo AC — vd doctor fail do flag AC yêu cầu, alias `@/*`→`src/` đúng repo shape kế hoạch, dual TS major inherent với SDK 56)

### Verification

1. `pnpm install` — PASS (clean)
2. `pnpm type-check` — PASS cả 3 packages (shared, web, mobile)
3. `npx expo-doctor` — 20/21: fail duy nhất `"resolver.unstable_enableSymlinks" mismatch. Expected undefined, got: true` — hệ quả trực tiếp của AC yêu cầu set flag explicit (Metro 0.85 luôn bật symlinks); chấp nhận có chủ đích, KHÔNG phải regression
4. `npx expo export --platform ios --platform android` — PASS cả 2 (Hermes .hbc cho ios + android, chạy lại sau prune)
5. `pnpm --filter @growbase/mobile why react-native` / `why react` — đúng 1 version mỗi cái (0.85.3 / 19.2.3)
6. `pnpm build && pnpm test` — web build PASS, 39 files / 532 tests PASS
7. Manual (human, chưa chạy): `pnpm --filter @growbase/mobile start` + iOS simulator/Android emulator → shell hiện "GrowBase Mobile" + "1.250.000 ₫"

### Residual risks

- expo-doctor sẽ fail check Metro config chừng nào flag explicit còn theo AC (documented, chấp nhận).
- `formatVND` dùng `Intl.NumberFormat` — Hermes implement subset ECMA-402; output runtime trên device chưa được verify unattended (manual check #7 ở trên).
- Dual TypeScript major: mobile TS 6.0.3 (yêu cầu SDK 56) vs web/shared TS 5.7 — shared source bị check bởi 2 compiler; hiện pass cả 2, có thể drift khi upgrade.
- `.pnpmfile.cjs` allowlist (`EXTRA_PACKAGES`/`EXTRA_PREFIXES`) cần mở rộng thủ công khi thêm package types-only mới (đã document trong CLAUDE.md).
- typedRoutes types (.expo/types, expo-env.d.ts) là generated + gitignored — fresh clone type-check pass mà không có route typing cho tới lần `expo start/export` đầu (hành vi chuẩn Expo).
