/**
 * Peru timezone utilities.
 * Peru is UTC-5 (no daylight saving time).
 */

const PERU_OFFSET_MS = -5 * 60 * 60 * 1000;

/** Returns the current Date object adjusted to Peru time */
export function getPeruTime(): Date {
  const utc = Date.now();
  return new Date(utc + PERU_OFFSET_MS);
}

/** Returns today's date string in Peru time as "YYYY-MM-DD" */
export function getPeruDateString(): string {
  const d = getPeruTime();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns current Peru time as "HH:MM" */
export function getPeruTimeString(): string {
  const d = getPeruTime();
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

/** Parses "HH:MM" into [hours, minutes] */
export function parseHHMM(time: string): [number, number] {
  const [h, m] = time.split(':').map(Number);
  return [h ?? 0, m ?? 0];
}

/**
 * Checks if the current Peru time is within the allowed work window.
 * Returns { allowed: true } or { allowed: false, reason: string }
 */
export function checkWorkSchedule(
  horario: { entrada?: string; salida?: string },
  toleranciaMinutos: number
): { allowed: boolean; reason?: string } {
  if (!horario.entrada || !horario.salida) {
    return { allowed: true }; // No schedule set — always allowed
  }

  const peruNow = getPeruTime();
  const nowMinutes = peruNow.getUTCHours() * 60 + peruNow.getUTCMinutes();

  const [entH, entM] = parseHHMM(horario.entrada);
  const [salH, salM] = parseHHMM(horario.salida);

  const entradaMinutes = entH * 60 + entM - 30; // Allow 30 min early
  const salidaMinutes  = salH * 60 + salM + toleranciaMinutos;

  if (nowMinutes < entradaMinutes) {
    return {
      allowed: false,
      reason: `Tu jornada comienza a las ${horario.entrada}. Aún no puedes ingresar.`,
    };
  }

  if (nowMinutes > salidaMinutes) {
    return {
      allowed: false,
      reason: `Tu jornada terminó a las ${horario.salida}. Acceso bloqueado hasta mañana.`,
    };
  }

  return { allowed: true };
}
