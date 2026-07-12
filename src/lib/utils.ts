// tiny className joiner (no deps) + formatters

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function euro(amount: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(amount);
  const formatted = `€${abs.toFixed(2)}`;
  if (opts.sign) return `${amount < 0 ? "−" : "+"}${formatted}`;
  return formatted;
}

/** French IBAN quick check: starts with FR + 25 more chars (27 total). */
export function isFrenchIban(raw: string): boolean {
  const v = raw.replace(/\s+/g, "").toUpperCase();
  return /^FR\d{2}[0-9A-Z]{23}$/.test(v);
}

/** Human deadline from an end date, e.g. "Expires in 3 d". */
export function formatDeadline(iso?: string | null): string {
  if (!iso) return "";
  const end = new Date(iso).getTime();
  const days = Math.ceil((end - Date.now()) / 86_400_000);
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires in 1 d";
  return `Expires in ${days} d`;
}

/** A task is visible to students when it has started and not yet ended. */
export function isTaskActive(t: {
  startsAt?: string | null;
  endsAt?: string | null;
}): boolean {
  const now = Date.now();
  if (t.startsAt && new Date(t.startsAt).getTime() > now) return false;
  if (t.endsAt && new Date(t.endsAt).getTime() < now) return false;
  return true;
}
