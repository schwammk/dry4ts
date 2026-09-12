import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const fixture = join(import.meta.dirname, 'fixtures', 'project', 'src');
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.length = 0;
});

describe('built CLI end-to-end', () => {
  const cliPath = join(import.meta.dirname, '..', 'dist', 'cli.js');

  it('prints the report and exits 1 on the fixture', () => {
    const result = spawnSync(process.execPath, [cliPath, '--source-root', fixture], {
      encoding: 'utf8'
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('score=1.00');
    expect(result.stdout).toContain('calculateTotal');
  });

  it('exits 2 with a message on unknown flags', () => {
    const result = spawnSync(process.execPath, [cliPath, '--bogus'], { encoding: 'utf8' });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('unknown option');
  });

  it('works through a symlinked binary (npm link / npx installs)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dry4ts-symlink-'));
    tempDirs.push(dir);
    const link = join(dir, 'dry4ts-link');
    symlinkSync(realpathSync(cliPath), link);
    const result = spawnSync(process.execPath, [link, '--source-root', fixture], {
      encoding: 'utf8'
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('score=1.00');
  });
});
