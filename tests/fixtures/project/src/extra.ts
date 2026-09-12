export function alpha(n: number): number {
  const doubled = n * 2;
  const offset = 10;
  const scaled = doubled * offset;
  const shifted = scaled + offset;
  const capped = shifted > 100 ? 100 : shifted;
  return capped - doubled;
}

export function beta(n: number): number {
  const doubled = n * 2;
  const offset = 10;
  const scaled = doubled * offset;
  const shifted = scaled + offset;
  const floored = shifted - 1;
  const capped = floored > 100 ? 100 : floored;
  return capped - doubled;
}
