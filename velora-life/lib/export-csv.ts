export function csv(filename: string, columns: string[], rows: unknown[][]) {
  const esc = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const content = '\uFEFF' + [columns, ...rows].map((row) => row.map(esc).join(';')).join('\r\n');
  const url = URL.createObjectURL(
    new Blob([content], {
      type: 'text/csv;charset=utf-8',
    }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
