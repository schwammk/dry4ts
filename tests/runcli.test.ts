import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';

const fixture = join(import.meta.dirname, 'fixtures', 'project', 'src');

const tempDirs: string[] = [];
const out: string[] = [];
const err: string[] = [];
const io = {
  stdout: (t: string) => out.push(t),
  stderr: (t: string) => err.push(t)
};

beforeEach(() => {
  out.length = 0;
  err.length = 0;
});

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.length = 0;
});

function tempRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'dry4ts-run-'));
  tempDirs.push(dir);
  return dir;
}

function write(rel: string, code: string): void {
  const full = join(rel);
  mkdirSync(full, { recursive: true });
  writeFileSync(join(full, 'frag.ts'), code);
}

describe('runCli', () => {
  it('reports fixture duplicates as text and exits 1', async () => {
    const code = await runCli(['--source-root', fixture], io);
    const text = out.join('');
    expect(code).toBe(1);
    expect(text).toContain('score=1.00');
    expect(text).toContain('calculateTotal');
    expect(text).toContain('summarize');
    expect(text).toContain('↔');
  });

  it('reports JSON entries with unit fields', async () => {
    const code = await runCli(['--source-root', fixture, '--format', 'json'], io);
    expect(code).toBe(1);
    const parsed = JSON.parse(out.join(''));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(3);
    for (const entry of parsed) {
      expect(entry).toHaveProperty('score');
      expect(entry.left).toHaveProperty('file');
      expect(entry.left).toHaveProperty('name');
      expect(entry.left).toHaveProperty('startLine');
      expect(entry.left).toHaveProperty('endLine');
      expect(entry.left).toHaveProperty('nodes');
    }
    const exactPairs = parsed.filter((e: { score: number }) => e.score === 1);
    expect(exactPairs.length).toBeGreaterThanOrEqual(2); // twins + cross/mirror
    // spec §4 anchors: extra-binding pair and different-callee pair are
    // reported but strictly below 1.0
    const anchorScores = (name: string): number[] =>
      parsed
        .filter(
          (e: { left: { name: string }; right: { name: string } }) =>
            e.left.name === name || e.right.name === name
        )
        .map((e: { score: number }) => e.score);
    expect(anchorScores('alpha').length).toBeGreaterThan(0);
    expect(anchorScores('renderA').length).toBeGreaterThan(0);
    for (const score of anchorScores('alpha')) {
      expect(score).toBeGreaterThanOrEqual(0.85);
      expect(score).toBeLessThanOrEqual(0.93);
    }
    for (const score of anchorScores('renderA')) {
      expect(score).toBeLessThan(1);
    }
  });

  it('never reports the unrelated pair', async () => {
    await runCli(['--source-root', fixture, '--format', 'json'], io);
    const parsed = JSON.parse(out.join(''));
    const names = parsed.flatMap((e: { left: { name: string }; right: { name: string } }) => [
      e.left.name,
      e.right.name
    ]);
    expect(names).not.toContain('sumSquares');
    expect(names).not.toContain('slugify');
  });

  it('warns about the broken fixture file but keeps going', async () => {
    await runCli(['--source-root', fixture], io);
    const errText = err.join('');
    expect(errText).toContain('cannot parse, skipped:');
    expect(errText).toContain('broken.ts');
  });

  it('prints no functions found and exits 0 for an empty source root', async () => {
    const empty = tempRoot();
    const code = await runCli(['--source-root', empty], io);
    expect(code).toBe(0);
    expect(err.join('')).toContain('no functions found');
    expect(out.join('')).toBe('');
  });

  it('exit 2 on bad args', async () => {
    const code = await runCli(['--bogus'], io);
    expect(code).toBe(2);
    expect(err.join('')).toContain('unknown option');
  });

  it('nested-blocks mode reports a duplicated fragment inside different functions', async () => {
    const dir = tempRoot();
    write(dir, [
      'export function wideA(x: number): number {',
      '  const a = x * 2;',
      '  const b = a + 1;',
      '  if (x > 0) {',
      '    const c = b * 3;',
      '    const d = c - 5;',
      '    const e = d * 2;',
      '    return e;',
      '  }',
      '  return 0;',
      '}',
      '',
      'export function wideB(y: number): number {',
      '  const p = Math.abs(y);',
      '  const q = p.toFixed(2);',
      '  if (q.length > 0) {',
      '    const r = p * 3;',
      '    const s = r - 5;',
      '    const t = s * 2;',
      '    return t;',
      '  }',
      '  return 0;',
      '}',
      ''
    ].join('\n'));
    const without = await runCli(['--source-root', dir, '--format', 'json'], io);
    expect(without).toBe(0); // wideA vs wideB differ overall
    out.length = 0;
    err.length = 0;
    const withFlag = await runCli(['--source-root', dir, '--nested-blocks', '--format', 'json'], io);
    expect(withFlag).toBe(1);
    const parsed = JSON.parse(out.join(''));
    expect(parsed.length).toBeGreaterThanOrEqual(1);
    expect(parsed[0].score).toBe(1);
  });
});
