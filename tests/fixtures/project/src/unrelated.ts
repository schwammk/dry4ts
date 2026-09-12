export function sumSquares(values: number[]): number {
  let total = 0;
  for (const value of values) {
    total += value * value;
  }
  return total;
}

export function slugify(raw: string): string {
  const lowered = raw.toLowerCase();
  const stripped = lowered.replace(/[^a-z0-9]+/g, '-');
  const trimmed = stripped.replace(/^-+|-+$/g, '');
  return trimmed;
}
