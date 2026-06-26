---
name: growbase-orchestrator
description: |
  Điều phối TOÀN BỘ công việc phát triển GrowBase family finance app. LUÔN dùng skill này cho: viết code sprint, làm Sprint Day X, implement feature, review code, debug lỗi/error/bug, viết tests, lập kế hoạch sprint, quản lý tasks, viết PR description, viết tài liệu, báo cáo progress, hay BẤT KỲ yêu cầu nào liên quan đến dự án GrowBase. Dùng lại khi: 'tiếp tục', 'làm tiếp', 'update', 'sửa lại', 'cải thiện kết quả'. KHÔNG làm bất kỳ task GrowBase nào mà không qua skill này.
---

# GrowBase Orchestrator

**Token optimization:** Start every workflow with `/caveman ultra`. 
Read `.claude/AGENT_PROTOCOL.md` before spawning any agent.

Điểm vào duy nhất cho TẤT CẢ công việc GrowBase. Xác định loại request → route sang workflow phù hợp.

**Trước khi bắt đầu bất kỳ workflow nào:** Load `growbase-conventions` skill để có context về conventions và patterns hiện tại của project.

**Quality skills luôn active (load vào prompt cho agents phù hợp):**

| Skill | Load cho agent nào | Mục đích |
|-------|-------------------|----------|
| `karpathy-guidelines` | developer, reviewer, validator | Minimal code, no over-engineering |
| `react-best-practices` | developer, reviewer | Vercel perf rules (70 rules, 8 categories) |
| `composition-patterns` | developer, reviewer | Compound components, no boolean props |
| `frontend-design` | developer (UI pages) | Distinctive visual design, not templated |
| `web-design-guidelines` | reviewer | Accessibility, UX compliance |

---

## Phase 0: Nhận diện request

Phân loại request vào một trong các loại sau:

| Loại | Dấu hiệu nhận biết | Workflow |
| --- | --- | --- |
| **SPRINT** | "sprint S0-S5", "story US-X.XX", "Sprint Day X", "implement sprint", "bắt đầu sprint" | → Workflow A |
| **BUG_FIX** | "bug", "lỗi", "error", "fix", "không hoạt động", "crash", stack trace | → Workflow B |
| **FEATURE** | "thêm feature", "implement X" (ngoài sprint) | → Workflow C |
| **REVIEW** | "review code", "review PR", "check code" | → Workflow D |
| **PLAN** | "lập kế hoạch", "phân tích", "plan", "estimate" | → Workflow E |
| **TEST** | "viết tests", "test coverage", "viết unit test" | → Workflow F |
| **DOCS** | "viết docs", "update README", "tài liệu" | → Workflow G |
| **REPORT** | "báo cáo", "progress", "status", "xong chưa" | → Workflow H |
| **CONTINUE** | "tiếp tục", "làm tiếp", "cải thiện", "sửa lại" | → Kiểm tra `src/_workspace/` → route về workflow đang dở |

Nếu không xác định được → hỏi user: "Request này thuộc loại nào: implement sprint / fix bug / thêm feature / review / plan?"

---

## Workflow A: Sprint Implementation

Dùng khi: implement sprint S0-S5, story US-X.XX, Sprint Day X.

**Đọc và thực hiện theo `growbase-sprint/SKILL.md` hoàn toàn.**

Pipeline: planner → architect → migration → developer → reviewer → validator → qa (7 agents, optimized).
Thực thi theo growbase-sprint/SKILL.md.

Sau khi xong → **Bước cập nhật conventions:** Spawn `growbase-senior-developer` agent để review patterns mới phát hiện và update `growbase-conventions/SKILL.md`.

---

## Workflow B: Bug Fix

Dùng khi: có lỗi cụ thể, stack trace, behavior sai.

### B1: Debug Analysis
Spawn `growbase-code-reviewer` agent với prompt:
```
Bạn là GrowBase Code Reviewer. Đọc .claude/agents/growbase-code-reviewer.md.

Đây là bug report:
[BUG_DESCRIPTION / STACK_TRACE]

Phân tích:
1. Root cause là gì? Đọc file liên quan để confirm.
2. Files nào cần sửa?
3. Có risk gì khi sửa không (side effects)?

Trả về: root cause analysis + danh sách files cần sửa + risk assessment.
```

Lưu vào `src/_workspace/bug_analysis.md`.

### B2: Fix
Spawn `growbase-fixer` agent với prompt:
```
Đọc .claude/agents/growbase-fixer.md.

Bug analysis: [đọc src/_workspace/bug_analysis.md]

Fix bug theo analysis. Surgical fix — chỉ sửa đúng root cause.
Lưu log vào src/_workspace/bug_fix_log.md.
```

### B3: Verify
Spawn `growbase-code-reviewer` agent để verify fix không introduce bug mới.

### B4: Tester (nếu cần)
Nếu bug có risk tái phát → spawn `growbase-tester` để viết regression test.

Sau khi xong → **Cập nhật conventions** với pattern "cách tránh bug này".

---

## Workflow C: Feature Addition (ngoài sprint)

Dùng khi: user yêu cầu feature mới, không thuộc sprint backlog.

Pipeline rút gọn:
1. Spawn `growbase-analyst` để phân tích requirements (dù không có backlog story)
2. Spawn `growbase-architect` để design
3. Nếu cần DB changes → spawn `growbase-migration`
4. Spawn `growbase-senior-developer` để implement
5. Spawn `growbase-code-reviewer`
6. Spawn `growbase-fixer` nếu có issues
7. Spawn `growbase-tester`

Sau khi xong → cập nhật conventions nếu có pattern mới.

---

## Workflow D: Code Review Only

Dùng khi: user chỉ muốn review, không implement gì.

**Skills tích hợp:** `react-best-practices` + `composition-patterns` + `web-design-guidelines` + `karpathy-guidelines`

Spawn `growbase-code-reviewer` với prompt:
```
Đọc .claude/agents/growbase-code-reviewer.md.

Load quality skills:
- Read .claude/skills/react-best-practices/SKILL.md → check CRITICAL + HIGH rules
- Read .claude/skills/composition-patterns/SKILL.md → check architecture patterns
- Read .claude/skills/web-design-guidelines/SKILL.md → fetch guidelines, check UI compliance
- Read .claude/skills/karpathy-guidelines/SKILL.md → flag over-engineering

Review scope: [FILES hoặc DESCRIPTION từ user]

Thực hiện review đầy đủ theo checklist trong agent definition + quality skills.
Trả về report trực tiếp để orchestrator hiển thị cho user.
```

Hiển thị report cho user. Hỏi: "Bạn có muốn tự động fix issues không?"
- Có → route sang Workflow B (B2 trở đi)
- Không → done

---

## Workflow E: Planning / Analysis

Dùng khi: lập kế hoạch sprint, phân tích requirements, estimate.

1. Spawn `growbase-analyst` để đọc backlog + tạo task plan
2. Spawn `growbase-business-review` để validate requirements
3. Spawn `growbase-architect` để estimate complexity

Trình bày kết quả cho user: số tasks, dependencies, ước tính thời gian, risks.

---

## Workflow F: Testing

Dùng khi: viết tests cho code đã có, tăng test coverage.

Spawn `growbase-tester` với prompt:
```
Đọc .claude/agents/growbase-tester.md.

Scope cần test: [FILES hoặc FEATURE từ user]

Đọc code hiện tại, viết tests theo ưu tiên trong agent definition.
Lưu log vào src/_workspace/tester_log.md.
```

---

## Workflow G: Documentation

Dùng khi: viết/update docs, README, PR description, comments.

Spawn `growbase-analyst` (Explore) để đọc code và tạo documentation.

---

## Workflow H: Progress Report

Dùng khi: user hỏi progress, status, xong chưa.

Đọc các files trong `src/_workspace/`:
- `src/_workspace/01_plan.md` — sprint plan (compact)
- `src/_workspace/04_dev.md` — dev log (compact)
- `src/_workspace/07_qa.md` — QA verdict
- `src/_workspace/00_sprint_report.md` — final summary

Tổng hợp báo cáo ngắn gọn: đã làm gì, còn lại gì, blockers.

---

## Cập nhật conventions sau mỗi workflow

Sau khi hoàn thành BẤT KỲ workflow nào (A-H), thực hiện:

```
Đọc growbase-conventions/SKILL.md hiện tại.

Có pattern mới nào được phát hiện hoặc convention nào cần update không?
- Pattern tốt mới implement → thêm vào "Patterns đã được validate"
- Bug pattern tránh được → thêm vào "Common gotchas"
- Convention bị vi phạm nhiều lần → thêm note "enforce strictly"

Nếu có thay đổi → update growbase-conventions/SKILL.md trực tiếp.
Nếu không có thay đổi → bỏ qua bước này.
```

---

## Error handling

- Agent fail 1 lần: retry với cùng prompt
- Agent fail 2 lần: báo user lỗi cụ thể, hỏi có tiếp tục không
- Spec mâu thuẫn: dừng ngay, báo user, không tự quyết
- Kết quả không rõ: tóm tắt cho user, hỏi next step

---

## Test scenarios

**Sprint:** "implement sprint S1" → Workflow A → growbase-sprint pipeline đầy đủ → update conventions.

**Bug:** "Lỗi fund_contribute không cộng balance" → Workflow B → debug → tìm sequential calls thay vì RPC → fixer sửa → tester viết regression test → conventions thêm "fund operations phải dùng RPC".

**Continue:** "tiếp tục" → kiểm tra _workspace/ → tìm 09_qa_report.md chưa xong → resume từ Phase 9 của Workflow A.
