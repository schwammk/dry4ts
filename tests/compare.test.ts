import { describe, expect, it } from 'vitest';
import { findDuplicates, jaccard } from '../src/compare.js';
import { firstFunctionUnit } from './helpers.js';

const LARGE_BODY = [
  'function template(a: number, b: number, c: number): number {',
  '  const sum = a + b + c;',
  '  const scaled = sum * 2;',
  '  const shifted = scaled + 1;',
  '  const bounded = shifted > 100 ? 100 : shifted;',
  '  const squared = bounded * bounded;',
  '  return squared - a;',
  '}',
  ''
].join('\n');

describe('jaccard', () => {
  it('computes |A∩B| / |A∪B|', () => {
    expect(jaccard(new Set(['a', 'b', 'c']), new Set(['a', 'b', 'd']))).toBe(0.5);
  });

  it('returns 1 for identical sets and 0 when the union is empty', () => {
    expect(jaccard(new Set(['x']), new Set(['x']))).toBe(1);
    expect(jaccard(new Set(), new Set())).toBe(0);
  });
});

describe('findDuplicates', () => {
  const options = { threshold: 0.82, minNodes: 20, minLines: 4 };

  it('reports a rename-only pair with score exactly 1', () => {
    const a = firstFunctionUnit(
      LARGE_BODY.replace('template', 'first'),
      'a.ts',
      'first'
    );
    const b = firstFunctionUnit(
      LARGE_BODY.replace('template', 'second'),
      'b.ts',
      'second'
    );
    const pairs = findDuplicates([a, b], options);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].score).toBe(1);
    expect(pairs[0].left.unit.name).toBe('first');
    expect(pairs[0].right.unit.name).toBe('second');
    expect(pairs[0].left.nodes).toBe(pairs[0].right.nodes);
  });

  it('does not report structurally different functions', () => {
    const a = firstFunctionUnit(LARGE_BODY, 'a.ts', 'a');
    const b = firstFunctionUnit(
      [
        'function other(input: string): string {',
        '  const trimmed = input.trim();',
        '  const lowered = trimmed.toLowerCase();',
        '  const parts = lowered.split("-");',
        '  const joined = parts.join("_");',
        '  const tagged = `pre_${joined}`;',
        '  return tagged.replace(/\\s+/g, "");',
        '}',
        ''
      ].join('\n'),
      'b.ts',
      'other'
    );
    expect(findDuplicates([a, b], options)).toHaveLength(0);
  });

  it('honors minNodes', () => {
    const tiny = 'function t(): number { return 1 + 2; }';
    const a = firstFunctionUnit(tiny, 'a.ts', 'a');
    const b = firstFunctionUnit(tiny.replace('t()', 'u()'), 'b.ts', 'b');
    expect(findDuplicates([a, b], options)).toHaveLength(0);
    const loose = { threshold: 0.82, minNodes: 1, minLines: 1 };
    const pairs = findDuplicates([a, b], loose);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].score).toBe(1);
  });

  it('honors minLines', () => {
    const oneLiner = 'function s(): number { return 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18; }';
    const a = firstFunctionUnit(oneLiner, 'a.ts', 'a');
    const b = firstFunctionUnit(oneLiner.replace('s()', 'r()'), 'b.ts', 'r');
    const looseNodes = { threshold: 0.82, minNodes: 1, minLines: 4 };
    expect(findDuplicates([a, b], looseNodes)).toHaveLength(0);
    const loose = { threshold: 0.82, minNodes: 1, minLines: 1 };
    expect(findDuplicates([a, b], loose)).toHaveLength(1);
  });

  it('skips span-overlapping pairs (block vs its own enclosing function)', () => {
    const a = firstFunctionUnit(LARGE_BODY, 'a.ts', 'outer');
    const overlapping = { ...a, name: 'outer#block1', startLine: a.startLine + 1, endLine: a.endLine - 1 };
    expect(findDuplicates([a, overlapping], { threshold: 0.82, minNodes: 1, minLines: 1 })).toHaveLength(0);
  });

  it('returns pairs sorted worst-first', () => {
    const exact = firstFunctionUnit(LARGE_BODY.replace('template', 'p'), 'a.ts', 'p');
    const twin = firstFunctionUnit(LARGE_BODY.replace('template', 'q'), 'b.ts', 'q');
    const partial = firstFunctionUnit(
      LARGE_BODY.replace('template', 'r').replace('  const squared = bounded * bounded;\n', ''),
      'c.ts',
      'r'
    );
    const pairs = findDuplicates([partial, twin, exact], { threshold: 0.5, minNodes: 20, minLines: 4 });
    const scores = pairs.map((p) => p.score);
    expect([...scores].sort((x, y) => y - x)).toEqual(scores);
  });
});
