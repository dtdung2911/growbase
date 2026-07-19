---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-extract-requirements", "step-03-epics-and-stories"]
note: "Fund-Transaction Sync — Epic 19 (web 1-13, mobile 14-18 đã dùng trong sprint-status.yaml chung). Nguồn requirements: thiết kế party mode 18-07-2026 user đã phê duyệt (memory project_fund_transaction_sync.md) — không có PRD riêng, chạy unattended theo chỉ đạo."
inputDocuments:
  - "memory: project_fund_transaction_sync.md (thiết kế chốt 18-07-2026)"
  - "memory: project_fund_management.md, project_money_model_v2.md, project_living_plan.md"
  - docs/02_BUSINESS_RULES.md
  - docs/04_TECHNICAL_SPEC.md
---

# GrowBase Fund-Transaction Sync - Epic Breakdown

## Overview

Đồng bộ hai thế giới Quỹ ↔ Giao dịch đang lệch nhau: nạp quỹ tạo transaction nhưng list giao dịch stale / category tùy tiện / sửa-xóa được gây lệch số dư; chi tiêu không tiêu được tiền quỹ; onboarding chưa dựng bộ quỹ nền tảng. 4 gói thiết kế đã chốt 18-07-2026 → 1 epic, 9 stories.

**Đánh số Epic 19** (web đã dùng 1–13, mobile 14–18) để chung sprint-status.yaml không đụng nhau.

## Requirements Inventory

### Functional Requirements

- FR-1 Sau mọi fund op (nạp/rút/tạo/xóa/release), list giao dịch + budget actuals + dashboard phản ánh ngay, không stale cache.
- FR-2 Category hệ thống duy nhất "Tiết kiệm & Quỹ" (`default_behavior_type='savings_investment'`, `is_system=true`) thay 3 categories template "Quỹ khẩn cấp"/"Quỹ mua sắm"/"Quỹ Future" (group "Tiết kiệm"); transactions cũ được remap; contribute resolve đích danh category này (không dò sort_order).
- FR-3 Transaction có `fund_id` hiển thị badge + tên quỹ ("Tiết kiệm & Quỹ · <tên quỹ>"), link tới trang quỹ; bị khóa update/delete cả UI lẫn API.
- FR-4 Hoàn tác lần nạp quỹ: RPC atomic đảo số dư quỹ + xóa transaction liên kết; nút hoàn tác ở lịch sử quỹ, ConfirmDialog trước.
- FR-5 Form giao dịch có 3 loại Chi tiêu / Thu nhập / Nạp quỹ; chọn Nạp quỹ → ô chọn quỹ thay category, hiển thị số dư trước/sau theo số nhập, option "+ Tạo quỹ mới" inline, empty-state dẫn đi tạo quỹ; submit gọi API contribute hiện có.
- FR-6 Onboarding complete tạo 3 quỹ mặc định: Quỹ khẩn cấp (emergency, target = 6 tháng × chi phí sinh hoạt từ budget baselines, fallback thu nhập), Quỹ dự phòng (sinking, gợi ý 1-2 tháng chi phí), Quỹ đầu tư (investment, không target). Mô tả phân biệt rõ, priority_rank khớp Money Model, xóa được (không is_system).
- FR-7 Card quỹ khẩn cấp có chips 3·4·5·6 tháng chỉnh target; engine allocation bỏ hằng số stage1=6 tháng, đọc target từ fund.
- FR-8 Quỹ không target: UI tích lũy theo thời gian, không progress bar %.
- FR-9 Household hiện hữu KHÔNG backfill quỹ — banner gợi ý "Tạo bộ quỹ cơ bản?" ở màn Quỹ; quỹ tùy biến (Mua nhà/Mua xe/Học phí con) = suggestion chips.
- FR-10 Chi từ quỹ: RPC atomic ghi transaction `expense` với category user chọn + `fund_id`, trừ số dư quỹ; chặn khi vượt số dư (message gợi ý).
- FR-11 `get_budget_with_actuals` bỏ qua expense có `fund_id IS NOT NULL` — một đồng chỉ ăn budget một lần, tại tháng rời thu nhập.
- FR-12 Báo cáo tổng chi tháng tách 2 dòng: chi-từ-thu-nhập / chi-từ-quỹ. `fund_withdrawal` giữ nguyên nghĩa rút-về-ví.
- FR-13 Form Chi tiêu có trường "Nguồn tiền" mặc định "Thu nhập tháng", chọn được quỹ; nút "Chi từ quỹ" ở trang quỹ; gợi ý quỹ khi tên khớp category và đủ số dư.
- FR-14 RPC đổi nguồn tiền hậu kiểm: gắn/bỏ `fund_id` trên expense hiện hữu, chỉnh số dư quỹ atomic.

### NonFunctional Requirements

- NFR-1 Fund ops = atomic RPC only (rule bất biến R1); mọi RPC mới đều SECURITY DEFINER + validate household membership.
- NFR-2 Auth check đầu mọi API route; query keys từ keys factory `@growbase/shared/queryKeys`.
- NFR-3 i18n vi/en mọi string qua t(); mutations isPending → disabled; ConfirmDialog cho destructive; toast success 2s / error 5s.
- NFR-4 Migration idempotent, không mất dữ liệu: remap transactions trước khi xóa categories; household mới (clone function) nhận category hệ thống đúng is_system.
- NFR-5 Không phá nghĩa dữ liệu cũ: `fund_contribution`/`fund_withdrawal` transaction types giữ nguyên semantics; behavior_type do DB trigger.

### Additional Requirements

- AD-1 Model khái niệm 3 hướng dòng tiền: ra nhà (expense) / vào nhà (income) / ở lại đổi chỗ (fund contribution-withdrawal). Mua cổ phiếu trong quỹ đầu tư = portfolio op, không vào list giao dịch.
- AD-2 Migration mới bắt đầu từ `022_` (hiện tại mới nhất 021_idempotency_keys.sql).
- AD-3 Contribute/withdraw hiện invalidate `keys.transactions(hid, currentMonth)` theo tháng trong store — nếu transaction_date thuộc tháng khác thì miss; đồng thời thiếu budgetActuals/dashboard/reports. Story 19.1 phải audit toàn bộ.
- AD-4 Clone function `clone_system_categories` (006) hiện clone với `is_system=false` — cần giữ is_system=true cho category "Tiết kiệm & Quỹ" khi clone.

### FR Coverage Map

| Req | Epic.Story |
|---|---|
| FR-1, AD-3 | 19.1 |
| FR-2, NFR-4, AD-2, AD-4 | 19.2 |
| FR-3 | 19.3 |
| FR-4 | 19.4 |
| FR-5 | 19.5 |
| FR-10, FR-11, FR-14 | 19.6 |
| FR-12, FR-13 | 19.7 |
| FR-6, FR-9 | 19.8 |
| FR-7, FR-8 | 19.9 |

## Epic List

19. **Fund-Transaction Sync** — đồng bộ Quỹ ↔ Giao dịch: cache invalidation, category hệ thống, khóa transaction quỹ, hoàn tác nạp, form 3 loại, chi từ quỹ, 3 quỹ mặc định onboarding.

---

## Epic 19: Fund-Transaction Sync

Quỹ và Giao dịch hiện là hai thế giới lệch pha: nạp quỹ xong list giao dịch không cập nhật, transaction nạp quỹ gắn category ngẫu nhiên và sửa/xóa được (gây lệch số dư quỹ), không chi tiêu được từ quỹ, onboarding không dựng bộ quỹ nền tảng. Epic này khép kín vòng đời tiền giữa hai màn hình theo model 3 hướng dòng tiền. Thứ tự implement: 19.1 → 19.2 → 19.3 → 19.4 → 19.5 → 19.6 → 19.7 → 19.8 → 19.9 (gói 3 đụng engine, làm cuối).

### Story 19.1: Fund ops invalidate đầy đủ query cache

As a người dùng,
I want list giao dịch, budget và dashboard cập nhật ngay sau khi nạp/rút/tạo/xóa quỹ,
So that không bao giờ thấy số liệu stale phải F5.

**Acceptance Criteria:**

**Given** user nạp quỹ từ ContributeModal với transaction_date thuộc tháng bất kỳ
**When** mutation thành công
**Then** query `transactions` được invalidate theo **tháng của transaction_date** (không chỉ currentMonth trong store)
**And** `budgetActuals`, `budget`, `dashboard`, `reports` của tháng đó cũng được invalidate

**Given** user rút quỹ, tạo quỹ, xóa quỹ, release quỹ đệm
**When** mutation thành công
**Then** mọi query key bị ảnh hưởng (funds, fundDetail, fundTransactions, transactions, dashboard, budgetActuals, livingPlan) được invalidate — audit từng mutation trong `apps/web/src/lib/hooks/useFunds.ts`
**And** tất cả keys lấy từ factory `keys.*`, không hardcode mảng

### Story 19.2: Category hệ thống "Tiết kiệm & Quỹ" + contribute resolve đích danh

As a hệ thống,
I want một category hệ thống duy nhất cho mọi giao dịch nạp quỹ,
So that transaction nạp quỹ luôn nhất quán, không phụ thuộc sort_order.

**Acceptance Criteria:**

**Given** DB có 3 categories template "Quỹ khẩn cấp"/"Quỹ mua sắm"/"Quỹ Future" (group "Tiết kiệm", household_id NULL) và bản clone ở households
**When** migration 022 chạy
**Then** template có category mới "Tiết kiệm & Quỹ" (`default_behavior_type='savings_investment'`, `is_system=true`, group "Tiết kiệm") và mọi household hiện hữu có bản clone `is_system=true`
**And** transactions cũ đang trỏ 3 categories bị xóa được remap sang category mới của household tương ứng
**And** 3 categories template cũ + bản clone household bị xóa
**And** function clone categories giữ `is_system=true` cho category này với household tạo sau migration

**Given** user nạp quỹ
**When** POST `/api/funds/[id]/contribute`
**Then** route resolve đích danh category hệ thống "Tiết kiệm & Quỹ" của household (không dò savings_investment đầu tiên theo sort_order)
**And** trả lỗi rõ ràng nếu category hệ thống không tồn tại

### Story 19.3: Badge + khóa transaction gắn quỹ

As a người dùng,
I want transaction nạp quỹ hiển thị rõ thuộc quỹ nào và không sửa/xóa trực tiếp được,
So that số dư quỹ không bao giờ lệch với lịch sử giao dịch.

**Acceptance Criteria:**

**Given** transaction có `fund_id IS NOT NULL` trong list giao dịch
**When** render row
**Then** hiển thị badge + tên quỹ dạng "Tiết kiệm & Quỹ · <tên quỹ>", click dẫn tới trang chi tiết quỹ
**And** action sửa/xóa bị ẩn hoặc disabled kèm tooltip giải thích (i18n vi/en)

**Given** request PATCH/DELETE transaction có `fund_id IS NOT NULL`
**When** API route xử lý
**Then** trả 403/422 với message hướng dẫn thao tác từ trang quỹ (hoàn tác/chi từ quỹ)

### Story 19.4: RPC hoàn tác lần nạp quỹ

As a người dùng,
I want hoàn tác một lần nạp quỹ nhầm,
So that số dư quỹ và list giao dịch cùng lúc trở về đúng.

**Acceptance Criteria:**

**Given** một fund_transaction nạp (contribution) trong lịch sử quỹ
**When** user bấm nút hoàn tác và xác nhận qua ConfirmDialog
**Then** RPC atomic mới đảo số dư quỹ và xóa transaction liên kết trong cùng 1 transaction DB
**And** chặn hoàn tác nếu số dư quỹ hiện tại không đủ (đã rút/chi mất phần đó) với message rõ ràng
**And** UI lịch sử quỹ + list giao dịch + số dư cập nhật ngay (invalidate đúng keys)
**And** API route auth check + validate membership; RPC SECURITY DEFINER

### Story 19.5: Form giao dịch 3 loại — tab Nạp quỹ

As a người dùng,
I want nạp quỹ ngay từ form thêm giao dịch,
So that không phải rời màn giao dịch để đi tìm trang quỹ.

**Acceptance Criteria:**

**Given** form thêm giao dịch
**When** mở form
**Then** có 3 loại: Chi tiêu / Thu nhập / Nạp quỹ (i18n vi/en)

**Given** user chọn loại "Nạp quỹ"
**When** form re-render
**Then** ô chọn category thay bằng ô chọn quỹ, hiển thị số dư quỹ trước/sau theo số tiền đang nhập (font-mono)
**And** có option "+ Tạo quỹ mới" inline mở modal tạo quỹ, quỹ mới tạo được chọn sẵn
**And** nếu household chưa có quỹ nào, empty-state dẫn đi tạo quỹ

**Given** user submit loại Nạp quỹ
**When** gọi API
**Then** dùng API contribute hiện có (`/api/funds/[id]/contribute`), không tạo endpoint mới
**And** isPending → disabled, success toast 2s, error giữ form + toast 5s

### Story 19.6: RPC chi từ quỹ + budget bỏ qua fund expense + RPC đổi nguồn tiền

As a hệ thống,
I want chi tiêu từ quỹ là thao tác atomic và không ăn budget tháng,
So that một đồng chỉ tính vào budget một lần — tại tháng nó rời thu nhập.

**Acceptance Criteria:**

**Given** user chi từ quỹ (category X, số tiền N)
**When** RPC atomic mới "fund_expense" chạy
**Then** ghi transaction `expense` với category X + `fund_id`, trừ số dư quỹ N trong cùng 1 transaction DB
**And** chặn khi N vượt số dư quỹ (message kèm số dư hiện tại)

**Given** tháng có expense `fund_id IS NOT NULL`
**When** gọi `get_budget_with_actuals`
**Then** actual của budget line bỏ qua các expense đó (migration cập nhật RPC 019)
**And** `fund_withdrawal` giữ nguyên nghĩa rút-về-ví, không đổi

**Given** một expense đã ghi nhầm nguồn tiền
**When** gọi RPC đổi nguồn tiền hậu kiểm
**Then** gắn/bỏ `fund_id` + chỉnh số dư quỹ tương ứng atomic; chặn nếu làm âm quỹ

### Story 19.7: UI chi từ quỹ — nguồn tiền, nút trang quỹ, báo cáo tách dòng

As a người dùng,
I want chọn nguồn tiền khi chi tiêu và thấy báo cáo tách bạch chi-từ-thu-nhập / chi-từ-quỹ,
So that hiểu đúng tiền tháng này đi đâu.

**Acceptance Criteria:**

**Given** form Chi tiêu
**When** render
**Then** có trường "Nguồn tiền" mặc định "Thu nhập tháng", dropdown chọn được quỹ (hiện số dư)
**And** chọn quỹ → submit gọi RPC chi-từ-quỹ (19.6); mặc định → flow expense như cũ
**And** đổi nguồn tiền sau khi ghi (edit) gọi RPC đổi nguồn tiền

**Given** trang chi tiết quỹ
**When** render actions
**Then** có nút "Chi từ quỹ" mở form chi với quỹ chọn sẵn

**Given** category có quỹ tên tương đồng đủ số dư (vd category "Sửa xe" ↔ quỹ "Bảo dưỡng xe")
**When** user chọn category đó ở form Chi tiêu
**Then** gợi ý chuyển nguồn tiền sang quỹ đó (dismissable, không ép)

**Given** báo cáo/tổng chi tháng
**When** render
**Then** tách 2 dòng: chi-từ-thu-nhập và chi-từ-quỹ (i18n, font-mono)

### Story 19.8: 3 quỹ mặc định khi onboarding + banner household cũ

As a người dùng mới,
I want kết thúc onboarding có sẵn bộ quỹ nền tảng đúng phương pháp,
So that bắt đầu phân bổ tiền ngay không phải tự nghĩ cấu trúc quỹ.

**Acceptance Criteria:**

**Given** user hoàn tất onboarding
**When** onboarding complete chạy
**Then** tạo 3 funds: "Quỹ khẩn cấp" (emergency, target = 6 tháng × chi phí sinh hoạt từ budget baselines, fallback thu nhập nếu thiếu data), "Quỹ dự phòng" (sinking, target gợi ý 1-2 tháng chi phí), "Quỹ đầu tư" (investment, KHÔNG target)
**And** mô tả phân biệt rõ: khẩn cấp = chuyện không đoán được; dự phòng = khoản biết trước (Tết, bảo hiểm, bảo dưỡng xe)
**And** priority_rank khớp Money Model (khẩn cấp trước, goal funds sau)
**And** cả 3 xóa được (không is_system)

**Given** household hiện hữu chưa có bộ quỹ cơ bản
**When** mở màn Quỹ
**Then** banner gợi ý "Tạo bộ quỹ cơ bản?" (không backfill tự động), dismiss được
**And** quỹ tùy biến (Mua nhà/Mua xe/Học phí con) hiển thị dạng suggestion chips khi tạo quỹ

### Story 19.9: Chips target quỹ khẩn cấp + engine đọc target từ fund + UI quỹ không target

As a người dùng,
I want chỉnh nhanh mục tiêu quỹ khẩn cấp theo số tháng và thấy quỹ không target hiển thị đúng bản chất tích lũy,
So that kế hoạch phân bổ phản ánh đúng lựa chọn của mình.

**Acceptance Criteria:**

**Given** card quỹ khẩn cấp
**When** render
**Then** có chips 3·4·5·6 tháng; chọn chip → cập nhật target_amount = tháng × chi phí sinh hoạt, ConfirmDialog nếu giảm dưới số dư hiện tại không cần — chỉ toast

**Given** engine allocation (`calculateAllocationPlan` trong packages/shared)
**When** tính stage 1
**Then** KHÔNG dùng hằng số 6 tháng nữa — đọc target từ fund emergency thực tế
**And** test engine cập nhật tương ứng, không regression các stage khác

**Given** quỹ không có target (vd Quỹ đầu tư)
**When** render card/detail
**Then** UI hiển thị tích lũy theo thời gian (số dư + đóng góp gần đây), KHÔNG progress bar %
