---
name: growbase-sprint
description: |
  GrowBase sprint execution orchestrator. Dùng skill này khi user nói: "implement sprint S0/S1/S2/S3/S4/S5", "implement story US-X.XX", "bắt đầu sprint", "tiếp tục sprint", "làm story", "build feature", "implement [tên feature GrowBase]", "viết code cho", "làm phần [auth/transaction/fund/dashboard/report/debt/setting]", "resume sprint", "tiếp tục làm", "làm tiếp", "implement lại", "update sprint", "chạy lại sprint", "sửa story", "bổ sung feature". Orchestrates 7-agent pipeline: planner → architect → migration → developer → reviewer → validator → qa. Phải dùng skill này cho mọi yêu cầu implement GrowBase backlog.
---

# GrowBase Sprint Orchestrator v2

**Token optimization active.** 7 agents (was 9). Compact log format. Selective doc reads.

Read `.claude/AGENT_PROTOCOL.md` before spawning any agent.

---

## Phase 0: Xác định context

```
src/_workspace/ có files không?
├── Không → KHỞI TẠO MỚI (chạy full pipeline)
├── Có + user sửa 1 phần → SỬA CỤC BỘ (re-run từ phase bị chỉ định trở đi)
└── Có + input mới → CHẠY LẠI (mv _workspace → _workspace_prev, tạo mới)
```

Xác định: sprint ID (S0–S5) hay story IDs (US-X.XX)?
SỬA CỤC BỘ: xác định phase bắt đầu, skip các phase trước.

---

## Phase 1: Planner (analyst + business review — 1 pass)

**Agent:** `gb-planner`

```
/caveman ultra
Read .claude/AGENT_PROTOCOL.md
Use agent: .claude/agents/gb-planner.md

Sprint: [SPRINT_ID]
Stories: [US-x.xx, US-x.xx, ...]
Known issues from last sprint: [từ src/_workspace/00_sprint_report.md nếu có]

Output: src/_workspace/01_plan.md
```

Đọc `src/_workspace/01_plan.md`.
- Có `BLOCKERS:` (không phải `none`) → báo user, chờ quyết định
- `STATUS:BLOCKED` → dừng, hỏi user
- OK → tiếp tục

Báo: "✓ Planner xong — [stories] stories, tasks: [TASKS_DB count] DB + [TASKS_APP count] App"

---

## Phase 2: Architect

**Agent:** `gb-architect`

```
/caveman ultra
Read .claude/AGENT_PROTOCOL.md
Use agent: .claude/agents/gb-architect.md

Input: src/_workspace/01_plan.md
Output: src/_workspace/02_arch.md
```

Đọc `src/_workspace/02_arch.md`, confirm có `## DB Layer` và `## App Layer`.

Báo: "✓ Architect xong"

---

## Phase 3: Migration

**Agent:** `gb-migration`

```
/caveman ultra
Read .claude/AGENT_PROTOCOL.md
Use agent: .claude/agents/gb-migration.md

Input: src/_workspace/02_arch.md (## DB Layer section only)
Check: supabase/migrations/ for next migration number
Output: src/_workspace/03_mig.md
```

Đọc `src/_workspace/03_mig.md`:
- `STATUS:FAIL` → báo user lỗi migration cụ thể, dừng
- `VERIFY:*FAIL*` → báo user, hỏi có tiếp tục không

Báo: "✓ Migration xong — [FILES] migration files, [RPCS] RPCs"

---

## Phase 4: Developer

**Agent:** `gb-developer`

**Skills tích hợp vào prompt:**
- `karpathy-guidelines` — minimal code, no over-engineering, delete > add
- `react-best-practices` — Vercel perf rules: no waterfalls, bundle optimization, server-side perf, re-render optimization
- `composition-patterns` — compound components, no boolean prop proliferation, composition over config
- `frontend-design` — distinctive visual design, intentional typography, not templated defaults

```
/caveman ultra
Read .claude/AGENT_PROTOCOL.md
Read .claude/skills/design-taste-frontend/SKILL.md
Use agent: .claude/agents/gb-developer.md

Load skills context:
- Read .claude/skills/karpathy-guidelines/SKILL.md → apply to ALL code
- Read .claude/skills/react-best-practices/SKILL.md → apply CRITICAL + HIGH rules (async-*, bundle-*, server-*)
- Read .claude/skills/composition-patterns/SKILL.md → apply architecture-* rules for complex components
- Read .claude/skills/frontend-design/SKILL.md → apply when building new UI pages/components

Input 1: src/_workspace/02_arch.md (## App Layer section only)
Input 2: src/_workspace/03_mig.md
Output: src/_workspace/04_dev.md
```

Đọc `src/_workspace/04_dev.md`:
- `BUILD:FAIL` hoặc `TSC:FAIL` → báo user lỗi cụ thể, dừng
- `DEVIATIONS:` có nội dung → ghi note, tiếp tục

Báo: "✓ Developer xong — [OK count] files tạo mới, [MOD count] files sửa. Build: OK"

---

## Phase 5: Reviewer

**Agent:** `gb-reviewer`

**Skills tích hợp vào prompt:**
- `react-best-practices` — check ALL 70 rules, flag violations as WARNINGS
- `composition-patterns` — flag boolean prop proliferation, missing compound patterns
- `web-design-guidelines` — UI accessibility, UX compliance (fetch guidelines from source URL)
- `karpathy-guidelines` — flag over-engineering, unnecessary abstractions, dead code

```
/caveman ultra
Read .claude/AGENT_PROTOCOL.md
Use agent: .claude/agents/gb-reviewer.md

Load skills context:
- Read .claude/skills/react-best-practices/SKILL.md → check CRITICAL rules (async-*, bundle-*) as C-level, HIGH (server-*) as W-level
- Read .claude/skills/composition-patterns/SKILL.md → flag architecture-* violations as W-level
- Read .claude/skills/web-design-guidelines/SKILL.md → fetch guidelines, check UI files for compliance
- Read .claude/skills/karpathy-guidelines/SKILL.md → flag over-engineering as M-level

Input: src/_workspace/04_dev.md (OK + MOD file lists)
Output: src/_workspace/05_rev.md
```

Đọc `src/_workspace/05_rev.md`:
- `STATUS:APPROVED` và `CRITICAL:0` → tiếp tục Phase 6 (vẫn chạy validator cho warnings/minors)
- `CRITICAL:[n>0]` → tiếp tục Phase 6 bắt buộc

Báo: "✓ Code Review xong — Critical: [n], Warning: [n], Minor: [n]"

---

## Phase 6: Validator (fixer + tester — 1 pass)

**Agent:** `gb-validator`

```
/caveman ultra
Read .claude/AGENT_PROTOCOL.md
Use agent: .claude/agents/gb-validator.md

Input: src/_workspace/05_rev.md (ISSUES field)
Output: src/_workspace/06_val.md
```

Đọc `src/_workspace/06_val.md`:
- `STATUS:FAIL` hoặc `TESTS_TOTAL:` có fail → báo user, hỏi có tiếp tục không
- `NEW_ISSUES:` có nội dung (không phải `none`) → ghi note vào final report

Báo: "✓ Validator xong — Fixed: [FIXED], Tests: [TESTS_TOTAL]"

---

## Phase 7: QA

**Agent:** `gb-qa`

```
/caveman ultra
Read .claude/AGENT_PROTOCOL.md
Use agent: .claude/agents/gb-qa.md

Input: src/_workspace/01_plan.md đến src/_workspace/06_val.md
Output: src/_workspace/07_qa.md + src/_workspace/00_sprint_report.md
```

Đọc `src/_workspace/07_qa.md`:
- `VERDICT:PASS` → sprint done
- `VERDICT:FAIL` → báo user issues, hỏi "Tự động re-run validator không?" → nếu có, quay Phase 6 với issues cụ thể

---

## Phase 8: Final Report

Đọc `src/_workspace/00_sprint_report.md` (do gb-qa tạo) và trình bày cho user:

```markdown
## Sprint [N] Done ✓

### Summary
- Stories: [list từ 00_sprint_report.md]
- Files: [FILES_NEW] mới, [FILES_MOD] sửa
- Tests: [TESTS] pass
- QA: PASS

### Deviations
[từ DEVIATIONS trong 04_dev.md nếu có]

### Known issues → Sprint [N+1]
[từ KNOWN trong 00_sprint_report.md]

### Next: Sprint [N+1] ready
```

---

## Error handling

- Agent fail 1 lần → retry cùng prompt
- Agent fail 2 lần → báo user lỗi cụ thể, hỏi tiếp tục không
- Planner `BLOCKERS:` cần PO decision → dừng, chờ user
- QA `VERDICT:FAIL` → hỏi user có re-run validator không
- Spec conflict bất kỳ phase → dừng, báo user, không tự quyết

---

## SỬA CỤC BỘ — Resume từ phase cụ thể

Khi user yêu cầu sửa hoặc re-run một phần:

```
user: "chạy lại từ developer" → bắt đầu Phase 4, dùng 02_arch.md + 03_mig.md hiện có
user: "chỉ re-run QA" → bắt đầu Phase 7
user: "fixer chạy lại với issue X" → bắt đầu Phase 6, thêm issue X vào prompt
```

Không xóa `_workspace/` khi SỬA CỤC BỘ. Chỉ overwrite file của phase được re-run.