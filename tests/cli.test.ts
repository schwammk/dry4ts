import { describe, expect, it } from 'vitest';
import { CliError, parseArgs } from '../src/cli.js';

describe('parseArgs', () => {
  it('applies the documented defaults', () => {
    expect(parseArgs([])).toEqual({
      sourceRoot: 'src',
      threshold: 0.82,
      minLines: 4,
      minNodes: 20,
      nestedBlocks: false,
      format: 'text'
    });
  });

  it('parses all flags', () => {
    expect(
      parseArgs([
        '--source-root', 'packages',
        '--threshold', '0.9',
        '--min-lines', '6',
        '--min-nodes', '30',
        '--nested-blocks',
        '--format', 'json'
      ])
    ).toEqual({
      sourceRoot: 'packages',
      threshold: 0.9,
      minLines: 6,
      minNodes: 30,
      nestedBlocks: true,
      format: 'json'
    });
  });

  it('accepts threshold boundaries 0 and 1', () => {
    expect(parseArgs(['--threshold', '0']).threshold).toBe(0);
    expect(parseArgs(['--threshold', '1']).threshold).toBe(1);
  });

  it('rejects out-of-range thresholds', () => {
    expect(() => parseArgs(['--threshold', '1.5'])).toThrow(CliError);
    expect(() => parseArgs(['--threshold', '-0.1'])).toThrow(CliError);
  });

  it('rejects empty threshold values after trimming', () => {
    expect(() => parseArgs(['--threshold', '   '])).toThrow(CliError);
    expect(() => parseArgs(['--threshold', ''])).toThrow(CliError);
  });

  it('rejects non-numeric or negative min-lines/min-nodes', () => {
    expect(() => parseArgs(['--min-lines', 'abc'])).toThrow(CliError);
    expect(() => parseArgs(['--min-lines', '-2'])).toThrow(CliError);
    expect(() => parseArgs(['--min-nodes', '2.5'])).toThrow(CliError);
    expect(() => parseArgs(['--min-nodes', '-1'])).toThrow(CliError);
  });

  it('rejects empty or whitespace-only count values', () => {
    expect(() => parseArgs(['--min-lines', ''])).toThrow(CliError);
    expect(() => parseArgs(['--min-nodes', '   '])).toThrow(CliError);
  });

  it('rejects non-decimal count values', () => {
    expect(() => parseArgs(['--min-nodes', '0x10'])).toThrow(CliError);
  });

  it('rejects non-decimal threshold values', () => {
    expect(() => parseArgs(['--threshold', '0x.8'])).toThrow(CliError);
  });

  it('rejects bad formats', () => {
    expect(() => parseArgs(['--format', 'edn'])).toThrow(CliError);
  });

  it('rejects unknown flags and missing values', () => {
    expect(() => parseArgs(['--bogus'])).toThrow(CliError);
    expect(() => parseArgs(['--source-root'])).toThrow(CliError);
  });
});
