import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { normalizeNode } from '../src/normalize.js';

function bodyOf(code: string): string {
  const sf = ts.createSourceFile('t.ts', code, ts.ScriptTarget.ES2022, true);
  let fn: ts.Node | undefined;
  sf.forEachChild(function walk(n) {
    if (ts.isFunctionDeclaration(n)) fn = n;
    else n.forEachChild(walk);
  });
  if (fn === undefined) throw new Error('no function in test code');
  return JSON.stringify(normalizeNode((fn as ts.FunctionLikeDeclaration).body as ts.Node));
}

describe('normalizeNode', () => {
  it('maps identifier references to :id', () => {
    expect(bodyOf('function f(x: number): number { return x; }')).toBe(
      JSON.stringify({ tag: ':Block', children: [{ tag: ':ReturnStatement', children: [{ tag: ':id' }] }] })
    );
  });

  it('preserves callee names of plain calls', () => {
    const text = bodyOf('function f(x: number): number { return compute(x); }');
    expect(text).toContain(':name compute');
  });

  it('preserves method-call property names and normalizes the receiver', () => {
    const text = bodyOf('function f(o: Wrapper): string { return o.fetch(); }');
    expect(text).toContain(':prop fetch');
  });

  it('gives each operator its own marker', () => {
    const plus = bodyOf('function f(a: number, b: number): number { return a + b; }');
    const minus = bodyOf('function g(a: number, b: number): number { return a - b; }');
    expect(plus).toContain(':op+');
    expect(plus).not.toContain(':op-');
    expect(minus).toContain(':op-');
    expect(minus).not.toContain(':op+');
  });

  it('preserves member-access property names, normalizes the object', () => {
    const text = bodyOf('function f(o: Box): number { return o.state; }');
    expect(text).toContain(':prop state');
  });

  it('maps all literals to :literal (numbers, strings, booleans, null)', () => {
    const text = bodyOf('function f(): unknown { return [1, "two", true, null]; }');
    expect(text).not.toContain('"two"');
    expect(text).not.toContain(':TrueKeyword');
    expect(text.match(/:literal/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('normalizes template substitutions recursively', () => {
    const text = bodyOf('function f(x: string): string { return `a${x}b`; }');
    expect(text).toContain(':template');
    expect(text).toContain(':id');
  });

  it('keeps statement shape tags', () => {
    const text = bodyOf(
      'function f(x: number): number { if (x > 0) { return x; } return 0; }'
    );
    expect(text).toContain(':IfStatement');
    expect(text).toContain(':ReturnStatement');
  });

  it('object-literal keys are normalized (not preserved)', () => {
    const text = bodyOf('function f(): { state: number } { return { state: 1 }; }');
    expect(text).not.toContain(':prop state');
    expect(text).toContain(':id');
  });
});
