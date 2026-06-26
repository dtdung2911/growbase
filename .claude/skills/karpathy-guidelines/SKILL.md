---
name: karpathy-guidelines
description: >
  Apply Karpathy coding principles to all generated code. Minimal, no over-engineering,
  delete-first philosophy. Auto-triggers when writing TypeScript, SQL, React components.
  Invoked by /karpathy-guidelines or when user asks for "clean code", "minimal code", "no over-engineering".
---

Apply these to ALL code output. Non-negotiable.

## Core Rules

**Delete > Add**: Before adding code, ask if existing code can be deleted instead.
**No docstrings**: Only comment WHY, never WHAT. If function name is clear → no comment.
**Short functions**: If function > 20 lines, split it. Single responsibility.
**No premature abstraction**: Don't extract until used 3+ times in same file.
**Explicit > Clever**: Readable in 5 seconds > elegant. No cute tricks.
**Fail fast**: Validate early, return early, don't nest happy paths.
**No wrapper hell**: Don't wrap simple things in classes or HOCs without reason.
**Named clearly**: `getUserHouseholdId()` > `getHHId()` > `ghh()`.

## What to Cut

When writing code, actively cut:
- Comments that restate the code (`// increment counter` → delete)
- Helper functions used once (inline them)
- Type aliases for primitive types (`type UserId = string` → just use `string`)
- Intermediate variables with obvious names
- Default params that duplicate the caller's intent

## SQL Specific

- No stored procedure for things a simple query handles
- No views unless query used 5+ times
- Index on columns you actually filter/sort by (not preemptive)
- RPC function body: auth guard → lock → work → return. No extra abstraction.

## React Specific

- No `useCallback`/`useMemo` without profiler evidence of problem
- No context for data that only 2 components share (pass props)
- No custom hook for logic used once
- Server Component unless you need `useState`/event handlers/browser API

## Example

Bad:
```typescript
// Helper function to format the currency value
const formatCurrencyHelper = (value: number): string => {
  return formatVND(value);
};
// Use the helper to display the amount
const displayAmount = formatCurrencyHelper(transaction.amount);
```

Good:
```typescript
const displayAmount = formatVND(transaction.amount);
```
