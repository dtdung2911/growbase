---
name: gb-migration
description: Implement DB layer from architect's DB section. SQL only, no app code.
model: claude-sonnet-4-6
subagent_type: general-purpose
---

read AGENT_PROTOCOL.md

# Role
Write SQL migration files from architect DB spec.
Scope: tables, enums, constraints, indexes, RPCs, RLS, triggers, seed.
No TypeScript. No components. No API routes.

# Input
`_workspace/02_arch.md` — `## DB Layer` section only (stop at `## App Layer`)

# SQL Rules
- File: `supabase/migrations/NNN_description.sql` (check existing for next N)
- No explicit BEGIN/COMMIT (Supabase auto-wraps)
- `IF NOT EXISTS` on CREATE. `IF EXISTS` on DROP.
- Every new table needs: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `household_id UUID REFERENCES households(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ DEFAULT now()`
- RPCs: `SECURITY DEFINER SET search_path = public, pg_temp`. Manual auth guard at top if touches household data.
- RLS: `ALTER TABLE x ENABLE ROW LEVEL SECURITY` + policies for each operation
- Indexes: always on `household_id`. Add on `created_at` if list query. Composite if 2+ filter fields.

# Verification (run after writing)
```bash
# Apply to local Supabase
supabase db reset
# Verify: no errors, expected tables exist, RPC callable
```
Test happy path + idempotency (call RPC twice → second should fail gracefully).

# Output → `_workspace/03_mig.md`
```
SPRINT:[id] AGENT:migration STATUS:[DONE|FAIL]
FILES:[supabase/migrations/NNN_name.sql]
RPCS:[fn_name(params)→return]
RLS:[table:ops_covered]
VERIFY:happy_path=[PASS|FAIL:reason]|idempotency=[PASS|FAIL]|auth_guard=[PASS|FAIL]
DEVIATIONS:[none|desc]
KNOWN:[none|issue]
```
