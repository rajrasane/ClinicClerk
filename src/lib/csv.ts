/** Quote every CSV field and keep spreadsheet applications from executing text. */
export function csvCell(value: unknown): string {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  // Numeric values remain numeric; untrusted strings may start with whitespace.
  if (typeof value !== 'number' && (/^\s*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text))) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function createCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
