import { byWorst, DuplicatePair } from './compare.js';

export function renderText(pairs: DuplicatePair[]): string {
  const sorted = [...pairs].sort(byWorst);
  const lines = sorted.map(
    (p) =>
      `DUPLICATE score=${p.score.toFixed(2)}  ${p.left.unit.name} (${p.left.unit.file}:${p.left.unit.startLine}-${p.left.unit.endLine}) ↔ ${p.right.unit.name} (${p.right.unit.file}:${p.right.unit.startLine}-${p.right.unit.endLine})`
  );
  return lines.length === 0 ? '' : `${lines.join('\n')}\n`;
}

export function renderJson(pairs: DuplicatePair[]): string {
  const sorted = [...pairs].sort(byWorst);
  return `${JSON.stringify(sorted.map(toPlain), null, 2)}\n`;
}

function toPlain(pair: DuplicatePair): unknown {
  return {
    score: pair.score,
    left: plainUnit(pair.left),
    right: plainUnit(pair.right)
  };
}

function plainUnit(scored: DuplicatePair['left']): unknown {
  return {
    file: scored.unit.file,
    name: scored.unit.name,
    startLine: scored.unit.startLine,
    endLine: scored.unit.endLine,
    nodes: scored.nodes
  };
}
