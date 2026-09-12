interface Row {
  id: number;
  label: string;
}

function nameOfAll(rows: Row[]): string[] {
  return rows.map((r) => r.label);
}

function labelOfAll(rows: Row[]): string[] {
  return rows.map((r) => r.label);
}

export function renderA(rows: Row[]): string {
  const names = nameOfAll(rows);
  const capped = names.slice(0, 10);
  const sorted = capped.sort();
  const joined = sorted.join(', ');
  const marked = `[${joined.length}] ${joined}`;
  const counted = marked.length > 80 ? 1 : 0;
  const upper = joined.toUpperCase();
  const dashed = upper.replace(/\s+/g, '-');
  const padded = dashed.padEnd(20, '.');
  const flag = padded.length > 0;
  return `${marked} (${counted})`;
}

export function renderB(rows: Row[]): string {
  const names = labelOfAll(rows);
  const capped = names.slice(0, 10);
  const sorted = capped.sort();
  const joined = sorted.join(', ');
  const marked = `[${joined.length}] ${joined}`;
  const counted = marked.length > 80 ? 1 : 0;
  const upper = joined.toUpperCase();
  const dashed = upper.replace(/\s+/g, '-');
  const padded = dashed.padEnd(20, '.');
  const flag = padded.length > 0;
  return `${marked} (${counted})`;
}
