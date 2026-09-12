#!/usr/bin/env node

import { existsSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { collectUnits } from './units.js';
import { findDuplicates } from './compare.js';
import { renderJson, renderText } from './report.js';

export interface Config {
  sourceRoot: string;
  threshold: number;
  minLines: number;
  minNodes: number;
  nestedBlocks: boolean;
  format: 'text' | 'json';
}

export class CliError extends Error {}

export function parseArgs(argv: string[]): Config {
  const config: Config = {
    sourceRoot: 'src',
    threshold: 0.82,
    minLines: 4,
    minNodes: 20,
    nestedBlocks: false,
    format: 'text'
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const needValue = (flag: string): string => {
      if (i + 1 >= argv.length) {
        throw new CliError(`missing value for ${flag}`);
      }
      i += 1;
      return argv[i];
    };
    switch (arg) {
      case '--source-root':
        config.sourceRoot = needValue(arg);
        break;
      case '--threshold':
        config.threshold = parseThreshold(needValue(arg));
        break;
      case '--min-lines':
        config.minLines = parseCount(needValue(arg), '--min-lines');
        break;
      case '--min-nodes':
        config.minNodes = parseCount(needValue(arg), '--min-nodes');
        break;
      case '--nested-blocks':
        config.nestedBlocks = true;
        break;
      case '--format': {
        const value = needValue(arg);
        if (value !== 'text' && value !== 'json') {
          throw new CliError('--format must be text or json');
        }
        config.format = value;
        break;
      }
      default:
        throw new CliError(`unknown option: ${arg}`);
    }
  }
  return config;
}

function parseThreshold(raw: string): number {
  const trimmed = raw.trim();
  if (trimmed === '') {
    throw new CliError('--threshold must be a number in [0,1]');
  }
  const value = Number(trimmed);
  if (!/^-?\d+(\.\d+)?$/.test(trimmed) || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new CliError('--threshold must be a number in [0,1]');
  }
  return value;
}

function parseCount(raw: string, flag: string): number {
  const trimmed = raw.trim();
  if (trimmed === '' || !/^\d+$/.test(trimmed)) {
    throw new CliError(`${flag} must be a non-negative integer`);
  }
  return Number(trimmed);
}

export interface Io {
  stdout(text: string): void;
  stderr(text: string): void;
}

export const defaultIo: Io = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text)
};

export async function runCli(argv: string[], io: Io = defaultIo): Promise<number> {
  let config: Config;
  try {
    config = parseArgs(argv);
  } catch (error) {
    io.stderr(`${(error as Error).message}\n`);
    return 2;
  }
  const warnings: string[] = [];
  const warn = (message: string): void => {
    warnings.push(message);
  };
  const root = existsSync(config.sourceRoot) ? config.sourceRoot : '.';
  const units = collectUnits(root, config.nestedBlocks, warn);
  if (units.length === 0) {
    io.stderr('no functions found\n');
    return 0;
  }
  const pairs = findDuplicates(units, config);
  const report = config.format === 'json' ? renderJson(pairs) : renderText(pairs);
  if (report !== '') {
    io.stdout(report);
  }
  for (const warning of warnings) {
    io.stderr(`${warning}\n`);
  }
  return pairs.length > 0 ? 1 : 0;
}

if (process.argv[1] !== undefined) {
  const invoked = pathToFileURL(realpathSync(process.argv[1])).href;
  if (invoked === import.meta.url) {
    process.exitCode = await runCli(process.argv.slice(2));
  }
}
