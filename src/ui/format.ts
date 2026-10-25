// Display formatting. Dates are shown in the viewer's local time zone unless
// one is given (tests pin it to check daylight saving changes).

export function formatLocalTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone }).format(date);
}

export function formatLocalDateTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone }).format(date);
}
