export function summarize(items: string[]): string {
  const counted = items.length;
  const joined = items.join('|');
  const marked = `[${counted}] ${joined}`;
  const safe = marked.length > 80 ? `${marked.slice(0, 77)}...` : marked;
  return safe;
}
