# Upstream provenance

dry4ts is a TypeScript port of unclebob's dry4clj. This file records which
upstream revision the port was derived from and every subsequent upstream
review, so changes upstream can be evaluated and integrated deliberately.

## Sources

| Name | Repo | Branch | Recorded revision (derived from) |
|------|------|--------|----------------------------------|
| upstream   | https://github.com/unclebob/dry4clj     | master | `5994ef2bcaaae8d12bcd0afb4f091ae09083228c` |
| swarmforge | https://github.com/unclebob/swarm-forge | main   | `f4f5fbcae0de6f7dcc26e82400334227647cfdb2` |

- `upstream` is the algorithm source this port implements (dry4clj
  `src/dry4clj/core.clj`): normalized syntax markers (callee/operator/property
  names and node kinds preserved; other identifiers → `:id`, literals →
  `:literal`), per-subtree fingerprint sets, Jaccard similarity, and the
  defaults threshold 0.82 / min-lines 4 / min-nodes 20.
- `swarmforge` hosts the engineering.prompt constitution that references this
  toolset; watch it for contract changes (tool table rows, guardrails).

The same revisions are recorded in machine-readable form in `.upstream`
(one `<name> <remote> <branch> <sha>` line each), which
`scripts/check-upstream.sh` reads.

## Checking for changes

    scripts/check-upstream.sh

An `unchanged` line per repo means nothing moved. When a repo has moved, the
script lists the new commits. Evaluate each change for relevance to this port,
then record the outcome:

1. Update the SHA in `.upstream` (and the table above) to the new revision.
2. Append a row to the decision log below.

## Decision log

| Date | Upstream | Revision | Changes observed | Verdict |
|------|----------|----------|------------------|---------|
| 2026-09-13 | upstream | `5994ef2…` | initial derivation: port implemented, normalization/fingerprint/Jaccard semantics matched against dry4clj core.clj | derived |
| 2026-09-13 | swarmforge | `f4f5fbc…` | engineering.prompt tool table read; TypeScript row absent (this port fills it) | derived |

