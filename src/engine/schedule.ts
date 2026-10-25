const MINUTES_PER_DAY = 24 * 60;

// Next spawn strictly after `now`, from a list of "HH:MM" UTC times of day.
// Working in UTC instants keeps daylight saving changes out of the engine:
// only the display converts to local time.
export function nextStartUtc(scheduleUtc: string[], now: Date): Date | undefined {
  const minutes = scheduleUtc.map(parseTimeOfDay).filter((m): m is number => m !== undefined);
  if (minutes.length === 0) return undefined;

  const startOfDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const nowMinutes = (now.getTime() - startOfDay) / 60_000;
  const later = minutes.filter((m) => m > nowMinutes);
  const next = later.length > 0 ? Math.min(...later) : Math.min(...minutes) + MINUTES_PER_DAY;
  return new Date(startOfDay + next * 60_000);
}

function parseTimeOfDay(value: string): number | undefined {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}
