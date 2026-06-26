# GrowBase Agent Protocol v2
# All agents read this first. Rules not repeated in individual agent files.

## Log Format (ALL agents output this — no prose)
File: `_workspace/NN_[agent].md`
```
SPRINT:[id] AGENT:[name] STATUS:[DONE|FAIL|BLOCKED]
OK:[file1,file2,...] (created)
MOD:[file3,...] (modified)
ISSUES:C[n]=[desc]|W[n]=[desc]|M[n]=[desc]
SKIP:[reason or none]
KNOWN:[carry-forward issues or none]
NEXT:[ready|blocked:reason]
```
No markdown headers. No bullet prose. Structured data only.
Exceptions: code blocks inside ISSUES remain formatted.

## Model Tiers
| Agent | Model | Reason |
|-------|-------|--------|
| gb-planner | claude-sonnet-4-6 | analysis only |
| gb-architect | claude-opus-4-6 | critical design |
| gb-migration | claude-sonnet-4-6 | SQL execution |
| gb-developer | claude-opus-4-6 | complex codegen |
| gb-reviewer | claude-sonnet-4-6 | pattern match |
| gb-validator | claude-sonnet-4-6 | fix+test |
| gb-qa | claude-opus-4-6 | cross-boundary verify |

## Doc Read Permissions (read ONLY assigned sections)
| Agent | Reads |
|-------|-------|
| gb-planner | `docs/03_PRODUCT_BACKLOG.md` §stories + `docs/02_BUSINESS_RULES.md` §relevant-BRs-only |
| gb-architect | `src/_workspace/01_plan.md` + `docs/04_TECHNICAL_SPEC.md` §2-schema §3-functions |
| gb-migration | `src/_workspace/02_arch.md` lines between `## DB Layer` and `## App Layer` |
| gb-developer | `src/_workspace/02_arch.md` lines after `## App Layer` + `src/_workspace/03_mig.md` |
| gb-reviewer | `src/_workspace/04_dev.md` + files listed in OK/MOD |
| gb-validator | `src/_workspace/05_rev.md` + files listed in ISSUES |
| gb-qa | `src/_workspace/01_plan.md` `src/_workspace/02_arch.md` `src/_workspace/03_mig.md` `src/_workspace/04_dev.md` `src/_workspace/05_rev.md` `src/_workspace/06_val.md` + critical files only |

**Do not read full docs if not assigned.** Cross-boundary context = noise.

## Non-Negotiable Rules (enforced in code, not repeated in agents)
- R1: Fund contribute/withdraw → RPC only. Never sequential `.from().update()` + `.from().insert()`
- R2: `behavior_type` = set by DB trigger. Not in form, not in mutation payload
- R3: `is_system=true` → UI hides edit/delete + API returns 403
- R4: `exclude_from_budget_report` = set by DB trigger for fund_withdrawal + internal_transfer
- R5: Every API route: auth check first → 401 if no session
- R6: All query keys from `keys.*` factory in `queryKeys.ts`. No hardcoded strings
- R7: Buttons `min-h-[44px]`, inputs `text-base` (16px), pages with nav `pb-16`
- R8: Fund balance never goes negative. Check before RPC call

## Output Compression
All log output uses `/caveman ultra` style:
- Arrows for causality: X→Y
- Pipe for lists: a|b|c
- No conjunctions, no articles
- Code blocks unchanged
- Technical identifiers never abbreviated
