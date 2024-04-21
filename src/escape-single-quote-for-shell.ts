export function escapeSingleQuoteForShell(s: string): string {
  return s.replace(/'/g, `'"'"'`);
}

export function quoteForShell(s: string): string {
  return `'${escapeSingleQuoteForShell(s)}'`;
}
