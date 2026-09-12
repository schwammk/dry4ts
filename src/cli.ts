#!/usr/bin/env node

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
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new CliError('--threshold must be a number in [0,1]');
  }
  return value;
}

function parseCount(raw: string, flag: string): number {
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value < 0) {
    throw new CliError(`${flag} must be a non-negative integer`);
  }
  return value;
}
