import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage']);
const SKIP_FILES = /\.(d\.tsx?|spec\.tsx?|test\.tsx?)$/;

export function listSourceFiles(sourceRoot: string): string[] {
  const out: string[] = [];
  walk(sourceRoot, out);
  return out.sort();
}

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full, out);
      continue;
    }
    if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !SKIP_FILES.test(entry)) {
      out.push(full);
    }
  }
}
