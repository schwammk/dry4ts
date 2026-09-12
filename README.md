# dry4ts

Structural duplication detection for TypeScript — a port of
[dry4clj](https://github.com/unclebob/dry4clj)'s algorithm.

dry4ts compares function bodies after normalizing them: local names and
literals become generic markers, while the functions you call, the operators
you use, and member-access properties are preserved. Two functions that do the
same thing under different names score high; two functions that merely share a
vocabulary do not. Similarity is the Jaccard overlap of subtree fingerprint
sets.

```
CRAP of a pair = |A ∩ B| / |A ∪ B|        (over fingerprint sets)
```

Pairs with similarity ≥ threshold are reported. Defaults: threshold `0.82`,
min-lines `4`, min-nodes `20`.

## Install

```
npx github:schwammk/dry4ts [options]
```

## Options

| Option | Default | Meaning |
|---|---|---|
| `--source-root <dir>` | `./src` (falls back to `.`) | Directory to scan |
| `--threshold <n>` | `0.82` | Report pairs with similarity ≥ n (0 ≤ n ≤ 1) |
| `--min-lines <n>` | `4` | Both functions must span ≥ n lines |
| `--min-nodes <n>` | `20` | Both functions must have ≥ n normalized nodes |
| `--nested-blocks` | off | Also compare inner statement blocks (if/loop/try bodies) |
| `--format text\|json` | `text` | Report format |

## Output

```
DUPLICATE score=1.00  fetchUser (services/user.ts:12-38) ↔ loadUser (services/legacy.ts:55-81)
```

`score=1.00` means a pure rename. JSON output carries
`{score, left: {file, name, startLine, endLine, nodes}, right: {…}}`.

## Exit codes

- `0` — nothing at or above the threshold (also when no functions found)
- `1` — at least one duplicate pair reported
- `2` — configuration or tool error

## Development

```
npm test     # test suite
npm run dry  # dogfood gate: dry4ts on its own source, must exit 0
```

MIT
