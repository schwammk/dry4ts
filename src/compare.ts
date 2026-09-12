import { fingerprintUnit } from './fingerprint.js';
import { CodeUnit } from './units.js';

export interface ScoredUnit {
  unit: CodeUnit;
  nodes: number;
}

export interface DuplicatePair {
  score: number;
  left: ScoredUnit;
  right: ScoredUnit;
}

export interface CompareOptions {
  threshold: number;
  minNodes: number;
  minLines: number;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  const union = a.size + b.size;
  if (union === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  return intersection / (union - intersection);
}

export function findDuplicates(units: CodeUnit[], options: CompareOptions): DuplicatePair[] {
  const fingerprints = units.map((unit) => fingerprintUnit(unit));
  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const left = units[i];
      const right = units[j];
      if (left.node === right.node) continue;
      if (spansOverlap(left, right)) continue;
      const fa = fingerprints[i];
      const fb = fingerprints[j];
      if (fa.nodeCount < options.minNodes || fb.nodeCount < options.minNodes) continue;
      if (lineSpan(left) < options.minLines || lineSpan(right) < options.minLines) continue;
      const ratio = Math.min(fa.set.size, fb.set.size) / Math.max(fa.set.size, fb.set.size);
      if (ratio < options.threshold) continue;
      const score = jaccard(fa.set, fb.set);
      if (score >= options.threshold) {
        pairs.push({
          score,
          left: { unit: left, nodes: fa.nodeCount },
          right: { unit: right, nodes: fb.nodeCount }
        });
      }
    }
  }
  return pairs.sort(byWorst);
}

function lineSpan(unit: CodeUnit): number {
  return unit.endLine - unit.startLine + 1;
}

function spansOverlap(a: CodeUnit, b: CodeUnit): boolean {
  if (a.file !== b.file) return false;
  return a.startLine <= b.endLine && b.startLine <= a.endLine;
}

export function byWorst(a: DuplicatePair, b: DuplicatePair): number {
  if (b.score !== a.score) return b.score - a.score;
  const leftOrder = `${a.left.unit.file}:${a.left.unit.name}`.localeCompare(
    `${b.left.unit.file}:${b.left.unit.name}`
  );
  if (leftOrder !== 0) return leftOrder;
  return `${a.right.unit.file}:${a.right.unit.name}`.localeCompare(
    `${b.right.unit.file}:${b.right.unit.name}`
  );
}
