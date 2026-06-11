export function quoteRemoteArg(value: string): string {
  if (value.length === 0) {
    return "''";
  }

  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function quoteRemoteArgs(values: readonly string[]): string {
  return values.map(quoteRemoteArg).join(' ');
}
