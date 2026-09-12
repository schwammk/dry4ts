import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { fingerprintUnit, serialize } from '../src/fingerprint.js';
import { CodeUnit } from '../src/units.js';

function firstFunctionUnit(code: string): CodeUnit {
  const sf = ts.createSourceFile('t.ts', code, ts.ScriptTarget.ES2022, true);
  let fn: ts.Node | undefined;
  sf.forEachChild(function walk(n) {
    if (ts.isFunctionDeclaration(n)) fn = n;
    else n.forEachChild(walk);
  });
  if (fn === undefined) throw new Error('no function in test source');
  return { file: 't.ts', name: 'f', startLine: 1, endLine: 2, node: fn };
}

describe('serialize', () => {
  it('leaf serializes to its tag alone', () => {
    expect(serialize({ tag: ':id' })).toBe(':id');
  });

  it('subtree serializes as tag(children...)', () => {
    expect(serialize({ tag: ':call', children: [{ tag: ':name foo' }, { tag: ':id' }] }))
      .toBe(':call(:name foo :id)');
  });

  it('empty children serialize as the bare tag', () => {
    expect(serialize({ tag: ':Block', children: [] })).toBe(':Block');
  });
});

describe('fingerprintUnit', () => {
  it('collects every subtree serialization including atoms', () => {
    const fp = fingerprintUnit(firstFunctionUnit('function f(x: number): number { return foo(x); }'));
    expect(fp.set.has(':Block(:ReturnStatement(:call(:name foo :id)))')).toBe(true);
    expect(fp.set.has(':ReturnStatement(:call(:name foo :id))')).toBe(true);
    expect(fp.set.has(':call(:name foo :id)')).toBe(true);
    expect(fp.set.has(':name foo')).toBe(true);
    expect(fp.set.has(':id')).toBe(true);
    expect(fp.set.size).toBe(5);
  });

  it('nodeCount counts marker-tree nodes', () => {
    const fp = fingerprintUnit(firstFunctionUnit('function f(x: number): number { return foo(x); }'));
    // :Block + :ReturnStatement + :call + :name foo + :id = 5
    expect(fp.nodeCount).toBe(5);
  });

  it('identical bodies yield equal fingerprint sets', () => {
    const a = fingerprintUnit(firstFunctionUnit('function f(x: number): number { return foo(x); }'));
    const b = fingerprintUnit(firstFunctionUnit('function f(y: number): number { return foo(y); }'));
    expect(a.set).toEqual(b.set);
    expect(a.nodeCount).toBe(b.nodeCount);
  });

  it('empty bodies still produce one fingerprint (:Block)', () => {
    const fp = fingerprintUnit(firstFunctionUnit('function f(): void {}'));
    expect(fp.set.has(':Block')).toBe(true);
    expect(fp.nodeCount).toBe(1);
  });
});
