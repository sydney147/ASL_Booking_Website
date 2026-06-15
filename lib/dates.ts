// Returns YYYY-MM-DD strings (LOCAL time) for each night a stay occupies.
// Excludes the checkout day since check-out happens at 12:00 PM and the next
// check-in starts at 2:00 PM — the checkout date is therefore available for
// a new check-in.
export function nightsBetween(checkIn: string, checkOut: string): string[] {
  const [y0, m0, d0] = checkIn.split('-').map(Number);
  const [y1, m1, d1] = checkOut.split('-').map(Number);
  const cur = new Date(y0, m0 - 1, d0);
  const end = new Date(y1, m1 - 1, d1);
  const out: string[] = [];
  while (cur < end) {
    out.push(formatLocalDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
