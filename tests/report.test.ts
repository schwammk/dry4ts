import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { DuplicatePair } from '../src/compare.js';
import { renderJson, renderText } from '../src/report.js';
import { firstFunctionUnit } from './helpers.js';

function dummyNode(name: string): ts.Node {
  return firstFunctionUnit(`function ${name}(): number { return 1; }`).node;
}

function pairWith(score: number, leftName: string, rightName: string): DuplicatePair {
  return {
    score,
    left: { unit: { file: 'a.ts', name: leftName, startLine: 10, endLine: 20, node: dummyNode(leftName) }, nodes: 30 },
    right: { unit: { file: 'b.ts', name: rightName, startLine: 40, endLine: 55, node: dummyNode(rightName) }, nodes: 28 }
  };
}

describe('renderText', () => {
  it('renders the dry4clj line shape with names', () => {
    const text = renderText([pairWith(0.89, 'handleError', 'catchError')]);
    expect(text).toBe(
      'DUPLICATE score=0.89  handleError (a.ts:10-20) ↔ catchError (b.ts:40-55)\n'
    );
  });

  it('sorts worst-first and ends with a newline', () => {
    const text = renderText([pairWith(0.84, 'low', 'pair'), pairWith(0.97, 'high', 'pair')]);
    const lines = text.split('\n').filter((l) => l !== '');
    expect(lines[0]).toContain('0.97');
    expect(lines[1]).toContain('0.84');
    expect(text.endsWith('\n')).toBe(true);
  });

  it('returns an empty string for no pairs', () => {
    expect(renderText([])).toBe('');
  });
});

describe('renderJson', () => {
  it('renders score and unit fields including node counts', () => {
    const parsed = JSON.parse(renderJson([pairWith(0.89, 'left1', 'right1')]));
    expect(parsed).toEqual([
      {
        score: 0.89,
        left: { file: 'a.ts', name: 'left1', startLine: 10, endLine: 20, nodes: 30 },
        right: { file: 'b.ts', name: 'right1', startLine: 40, endLine: 55, nodes: 28 }
      }
    ]);
  });

  it('sorts worst-first and returns "[]\\n" for no pairs', () => {
    const text = renderJson([pairWith(0.84, 'low', 'pair'), pairWith(0.97, 'high', 'pair')]);
    const parsed = JSON.parse(text);
    expect(parsed[0].score).toBe(0.97);
    expect(text.endsWith('\n')).toBe(true);
    expect(renderJson([])).toBe('[]\n');
  });
});
