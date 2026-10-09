/** Number & date formatting helpers (Cairo timezone). */

export function fmtNum(n: number, maxDecimals = 3): string {
  if (!isFinite(n)) return '0';
  const rounded = Math.round(n * 1000) / 1000;
  const hasFrac = Math.abs(rounded % 1) > 1e-9;
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: hasFrac ? maxDecimals : 0,
  });
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

const dtFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "7 Oct 2026, 23:08 (Cairo)" */
export function fmtCairo(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${dtFmt.format(d).replace(',', ',')} (Cairo)`.replace(' at ', ', ');
}

const savedFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "08 Oct, 03:54 · Cairo" */
export function fmtSaved(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return `${savedFmt.format(d)} · Cairo`;
}

/** ISO string for "now" anchored to Cairo offset (+02:00 / +03:00 handled by Date). */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Unit-aware quantity: EA rounded to integers, weight/length keep decimals. */
export function fmtQty(n: number, unit: string): string {
  return unit === 'EA' ? fmtInt(n) : fmtNum(n);
}
