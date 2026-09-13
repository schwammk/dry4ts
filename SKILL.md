---
name: dry4ts
description: "Detects structural duplication in TypeScript code — functions with the same shape but different names — by comparing normalized syntax trees with Jaccard similarity. Use when consolidating or reviewing code, when copy-paste or near-duplicate logic is suspected, or when a duplication threshold gate must pass."
---

# dry4ts — Structural Duplication for TypeScript

Compares every function/method body pairwise after **normalizing** it: all
ordinary identifiers and literals collapse to generic markers while callee
names, operators, member-access properties, and node shapes are preserved.
Two functions that differ only in local naming score **1.00** — the
signature case is "same structure, different names", which token-based
tools (e.g. jscpd) cannot see.

## Usage

```bash
# Scan a single project (defaults: threshold 0.82, min-lines 4, min-nodes 20)
npx github:schwammk/dry4ts --source-root src

# Nx monorepo
npx github:schwammk/dry4ts --source-root packages

# JSON output for tooling
npx github:schwammk/dry4ts --source-root packages --format json
```

### Output

```
DUPLICATE score=1.00  fetchUser (services/user.ts:12-38) ↔ loadUser (services/legacy.ts:55-81)
DUPLICATE score=0.89  buildOrderPayload (orders.ts:20-44) ↔ buildInvoicePayload (orders.ts:60-88)
```

Sorted worst-first. Exit codes: 0 = nothing over the threshold; 1 = at
least one duplicate pair; 2 = config/tool error.

## Interpreting Results

- **score = 1.00**: pure rename — extract or unify immediately.
- **0.82–0.99**: near-identical with small deltas (an extra binding, a
  different callee) — read both, extract what is genuinely shared.
- Threshold gates: never lower `--threshold` to silence the gate; extract
  the shared structure instead.

## How It Works

1. Collects function-like units (function decl/expr, arrow, method,
   constructor, accessors) via the TypeScript compiler, skipping tests,
   `.d.ts`, `node_modules`, `dist`, `coverage`
2. Normalizes each body into a marker tree (identifiers → `:id`, literals →
   `:literal`; callees/operators/properties/shapes preserved)
3. Fingerprints = serialization of every subtree; similarity = Jaccard over
   fingerprint sets, with a size-ratio prefilter
4. Reports pairs with score ≥ threshold that also clear the
   min-lines/min-nodes floors

## Notes

- Compare unit is the **whole function** by default; pass `--nested-blocks`
  to also compare inner blocks (named `<owner>#block<N>`).
- Same-file pairs are reported; the tool skips only pairs that overlap
  (a block inside its own enclosing function).
- Files with syntax errors are skipped with a stderr warning, not fatal.
