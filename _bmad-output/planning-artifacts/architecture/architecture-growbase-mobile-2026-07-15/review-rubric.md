# Rubric Walker Review — Architecture Spine: GrowBase Mobile

- **Spine:** `ARCHITECTURE-SPINE.md` (architecture-growbase-mobile-2026-07-15)
- **Parent spine:** `architecture-growbase-2026-06-27` (final)
- **Lens:** good-spine checklist (reviewer-gate.md)
- **Context:** RN companion (Expo), thin client kế thừa web spine, gọi `/api/*` sẵn có, offline-first, solo dev, stakes moderate, fast-path draft.

## Verdict

**PASS-with-fixes.** — Spine invariant-first thật sự tốt: fix đúng các divergence point mobile-specific (supabase-js auth-only vs direct data, cookie vs Bearer, session-at-rest, offline replay + idempotency, monorepo shared code), backend-touch được flag rõ ràng, và operational envelope (AD-M8 EAS/env/CORS) có mặt — điểm mà nhiều mobile draft bỏ sót. Tuy nhiên có **2 gap substantive**: (1) contract state/cache-invalidation khi switch household (inherited AD-3) không được carry sang mobile dù có persisted MMKV cache → nguy cơ cross-household data leak; (2) offline queue không phân định mutation nào eligible — fund balance RPC (A-1, balance-sensitive) bị "every mutation queued" cuốn vào, replay-against-stale-balance chưa xử lý. Fix 2 cái này + pin versions là đủ handoff.

---

## Findings (tiered)

### CRITICAL
_none._

### HIGH

**H1 — Inherited AD-3 (household-switch state/cache-invalidation contract) bị drop; persisted MMKV cache khuếch đại rủi ro cross-household leak.**
Web spine AD-3 là một invariant hard: on switch household → `householdId` update → `currentMonth` reset → TanStack Query cache auto-invalidate; mọi household-scoped state phải clear-on-switch hoặc derive từ key có `householdId`. Section 2 (Inherited Invariants) của mobile spine **không liệt kê AD-3**, và AD-M6 chỉ nói "householdId + currentMonth từ Zustand" mà không mang theo contract clear/invalidate. Mobile lại persist cả query-cache **và** Zustand vào MMKV (AD-M4, AD-M6) — nghĩa là cache của household cũ **nằm trên đĩa** qua các phiên. Không có contract, hai dev có thể chọn lệch nhau về việc có purge persisted cache khi switch hay không → dữ liệu household A rò sang view household B (đặc biệt lúc offline đọc từ persisted cache). Đây chính xác là loại divergence spine phải fix.
- *Fix:* Thêm AD-3 vào bảng inherited (Section 2) **và** thêm một AD mobile buộc: switch household → invalidate + purge persisted MMKV query-cache & clear household-scoped Zustand trước khi load household mới. Không để "Switch household UX → bmad-ux" (Deferred) nuốt luôn contract state/security — UX là layout, đây là data-integrity invariant.

**H2 — Offline queue không phân định mutation eligibility; fund balance RPC (A-1) bị cuốn vào "every mutation queued", replay-against-stale-balance chưa xử lý.**
AD-M4 nói "mọi mutation → durable queue → replay tuần tự khi online, mỗi call mang Idempotency-Key". Idempotency-Key chỉ chống **duplicate**; nó không chống một mutation **queued lúc offline rồi replay lên balance đã đổi** (ví dụ contribute/withdraw fund — A-1 balance-sensitive, atomic server-side). Với offline-first, một withdraw queued nhiều giờ có thể replay khi quỹ đã bị rút bởi web client → server business rule reject giữa chừng. Hai vấn đề chưa quyết: (a) mutation nào được phép offline-queue vs online-only (fund ops có nên queue không?); (b) hành vi queue khi một item **fail validation** lúc replay — block phần còn lại, skip, hay surface? Đây là divergence point thật về correctness + integrity ở stakes moderate.
- *Fix:* Thêm vào AD-M4: (1) whitelist/blacklist rõ mutation eligible cho offline-queue (khuyến nghị fund balance RPC = **online-only**, không queue); (2) chính sách replay-failure (halt-and-surface vs skip-and-report) để hai unit không tự chọn khác nhau.

### MEDIUM

**M1 — Operational/environmental envelope còn lỗ hổng (observability, OTA, client-version compat).** AD-M8 đã cover deploy (EAS + stores) và env base-URL — tốt. Nhưng ba dimension operational im lặng hoàn toàn:
- **Observability / crash reporting** (Sentry / EAS-integrated) — không nhắc; production RN không có crash telemetry là mù.
- **OTA update strategy** (EAS Update / `expo-updates`) — dimension cốt lõi của Expo, không được decided/deferred.
- **Client-version ↔ backend compatibility** — AD-M2 & AD-M4 đổi contract backend (Bearer, Idempotency dedupe); app đã publish + offline lâu có thể chạy contract cũ. Không có min-supported-client / forced-update / API-version negotiation. Với offline queue replay stale, đây là rủi ro thật.
- *Fix:* Thêm ít nhất decided/deferred cho 3 mục này (crash reporting + OTA có thể là 1 dòng Deferred nếu chưa làm v1; client-version compat nên là một open question vì gắn với backend touch).

**M2 — Stack versions dùng "latest" (unpinned) + version-currency chưa verify.** Section 4 có 5 rows `latest` (mmkv, query-async-storage-persister, expo-secure-store, expo-local-authentication, expo-notifications). Lint reviewer-gate flag "unpinned Stack versions" — seed phải pin đúng-ở-cold-start. Ngoài ra Expo SDK 56 / RN 0.86 / React 19.2 / Expo Router v6 / gifted-charts 1.4.x được assert nhưng chưa verified-current trong review này.
- *Fix:* Pin version cụ thể cho các row `latest`; xác nhận SDK 56 là stable channel tại 2026-07 trước cold-start.

### LOW (tail)

**L1 — Inherited client-layer invariants A-3 (UI guard `is_system` immutable) và A-5 (mọi string qua `t()` i18n) không được carry vào Section 2 dù mobile có UI.** A-3 phần "UI must guard" và A-5 là client-layer, áp dụng cho mobile screens. Bỏ khỏi bảng inherited có thể để mobile UI cho phép edit `is_system` record hoặc hardcode string. (Mobile thin-client + backend enforce giảm nhẹ, nhưng guard/i18n vẫn là client concern.)

**L2 — AD-M6 re-state một phần A-4 / A-7 (query keys via `keys.*`, householdId từ Zustand).** Đây là inherited invariant đã ở Section 2 — restate mild redundancy (không mâu thuẫn). Phần binding mới thực sự của AD-M6 là "single storage layer = MMKV"; nên tách rõ để AD không loãng.

**L3 — AD-M7 (notification v1 local-only) là quyết định scoping hơn là spine invariant.** Nó không fix divergence point giữa hai unit build độc lập — mà là "chưa build push". Push đã nằm ở Deferred (Section 6). Cân nhắc gộp AD-M7 vào Deferred thay vì để như một AD ngang hàng với các security/data invariant.

---

## Checklist trace

| Tiêu chí | Đánh giá |
|---|---|
| Invariant-first, fix đúng divergence | Mostly PASS — AD-M1..M5, M8 là divergence point thật; AD-M6 hơi redundant; AD-M7 thiên scoping (L3) |
| Mỗi AD có Binds/Prevents/Rule actionable | PASS — cả 8 AD đủ triad, lint mechanical sạch |
| Seed tối thiểu, không lẫn invariant | PASS — Stack (§4) + Repo (§5) labeled "seed", tách khỏi AD |
| Breadth: mọi dimension decided/deferred/open | PARTIAL — operational envelope thiếu observability/OTA/version-compat (M1) |
| Inherited invariants không re-derive/mâu thuẫn | PARTIAL — AD-3 bị drop (H1), A-3/A-5 client-guard không carry (L1); AD-M2 extend AD-1 (Bearer) được flag đúng, không weaken |
| Deferred nêu rõ cái không quyết | MOSTLY PASS — Deferred/Open rõ; nhưng "switch household UX" nuốt nhầm state-contract (H1) |
| Named tech verified-current | UNVERIFIED — `latest` placeholders (M2), versions chưa cross-check |

## Điểm mạnh đáng giữ
- Backend-touch (AD-M2 Bearer, AD-M4 Idempotency dedupe) được đánh dấu ⚠️ rõ và đẩy lên Open Questions để user confirm — đúng tinh thần surface-conflict thay vì override cục bộ.
- AD-M3 LargeSecureStore bắt đúng gotcha thật (SecureStore 2048-byte limit) — đây là invariant thực, không phải cái hiển nhiên.
- AD-M8 có mặt: nhiều mobile spine bỏ trống deploy/env — đây điền đủ EAS + env base-URL + CORS note.
- Paradigm "thin client, no business logic" nhất quán với inherited AD-2 (system ops server-side only) — reinforce chứ không mâu thuẫn.
