import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { collectUnits, CodeUnit } from '../src/units.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'dry4ts-units-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(rel: string, code: string): void {
  const full = join(dir, rel);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, code);
}

function names(units: CodeUnit[]): string[] {
  return units.map((u) => u.name);
}

describe('collectUnits', () => {
  it('collects function declarations with names and line spans', () => {
    write('a.ts', 'function first(): void {}\nfunction second(): void {}\n');
    const units = collectUnits(dir, false, () => undefined);
    expect(names(units)).toEqual(['first', 'second']);
    expect(units[0]).toMatchObject({ file: join(dir, 'a.ts'), startLine: 1, endLine: 1 });
    expect(units[1]).toMatchObject({ startLine: 2, endLine: 2 });
  });

  it('collects methods, constructors, accessors, arrows and object-literal methods', () => {
    write('b.ts', [
      'class Greeter {',
      '  greet(): void {}',
      '  constructor() {}',
      '  get size(): number { return 1; }',
      '}',
      'const arrow = (): void => {};',
      'const obj = { methodKey(): void {} };',
      'const inner = function named(): void {};',
      ''
    ].join('\n'));
    const units = collectUnits(dir, false, () => undefined);
    expect(names(units)).toEqual(
      expect.arrayContaining(['Greeter.greet', 'Greeter.constructor', 'Greeter.size', 'arrow', 'methodKey', 'named'])
    );
  });

  it('collects nested function-likes inside bodies', () => {
    write('c.ts', 'function outer(): void {\n  const helper = (): void => {};\n}\n');
    const units = collectUnits(dir, false, () => undefined);
    expect(names(units)).toEqual(['outer', 'helper']);
  });

  it('names unnamed arrows <anonymous:line>', () => {
    write('d.ts', 'const xs = [1].map((x) => x + 1);\n');
    const units = collectUnits(dir, false, () => undefined);
    expect(units[0].name).toBe('<anonymous:1>');
  });

  it('skips tests, d.ts, node_modules, dist and non-TS files', () => {
    write('e.spec.ts', 'function a(): void {}\n');
    write('e.test.ts', 'function b(): void {}\n');
    write('e.d.ts', 'declare function c(): void;\n');
    write('f.ts', 'function keep(): void {}\n');
    mkdirSync(join(dir, 'node_modules'));
    write('node_modules/g.ts', 'function dropped(): void {}\n');
    mkdirSync(join(dir, 'dist'));
    write('dist/h.ts', 'function droppedToo(): void {}\n');
    write('f.js', 'function ignored(): void {}\n');
    const units = collectUnits(dir, false, () => undefined);
    expect(names(units)).toEqual(['keep']);
  });

  it('warns and skips files with syntax errors, continues with the rest', () => {
    write('broken.ts', 'export function broken( { return 1; }\n');
    write('good.ts', 'function fine(): void {}\n');
    const warnings: string[] = [];
    const units = collectUnits(dir, false, (m) => warnings.push(m));
    expect(names(units)).toEqual(['fine']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('cannot parse, skipped:');
    expect(warnings[0]).toContain('broken.ts');
  });

  it('with nestedBlocks adds inner block units owned by their function', () => {
    write('n.ts', [
      'function outer(x: number): number {',
      '  if (x > 0) {',
      '    return x + 1;',
      '  }',
      '  return 0;',
      '}',
      ''
    ].join('\n'));
    const units = collectUnits(dir, true, () => undefined);
    const fnUnits = units.filter((u) => !u.name.includes('#block'));
    const blocks = units.filter((u) => u.name.includes('#block'));
    expect(fnUnits.map((u) => u.name)).toEqual(['outer']);
    expect(blocks).toHaveLength(1); // the if-body block; `return 0` is a bare statement, not a block
    expect(blocks[0].name).toMatch(/^outer#block\d+$/);
    expect(blocks[0].startLine).toBe(3);
    expect(blocks[0].endLine).toBe(3);
  });

  it('without nestedBlocks adds no block units', () => {
    write('m.ts', 'function outer(x: number): number {\n  if (x > 0) { return x + 1; }\n  return 0;\n}\n');
    const units = collectUnits(dir, false, () => undefined);
    expect(units.every((u) => !u.name.includes('#block'))).toBe(true);
  });
});
