import activity from '../data/activity.json';

// Las fechas son 'YYYY-MM-DD' en la zona horaria del collector; se manejan
// siempre en UTC para que la zona del navegador o del build no las corra.

export type DayMap = Record<string, number>;

export interface Milestone {
  week: string;
  text: string;
  project?: string;
}

export interface Cell {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  future: boolean;
}

const DAY = 86_400_000;

const parse = (d: string) => new Date(`${d}T00:00:00Z`);
const format = (d: Date) => d.toISOString().slice(0, 10);

export function mondayOf(date: string): string {
  const d = parse(date);
  const offset = (d.getUTCDay() + 6) % 7;
  return format(new Date(d.getTime() - offset * DAY));
}

export const rangeEnd: string = activity.rangeEnd;
export const generatedAt: string = activity.generatedAt;

export function projectDays(slug: string): DayMap {
  const projects = activity.projects as Record<string, { days: DayMap } | undefined>;
  return projects[slug]?.days ?? {};
}

export function lastActivity(slug: string): string | null {
  const projects = activity.projects as Record<string, { lastActivity: string | null } | undefined>;
  return projects[slug]?.lastActivity ?? null;
}

export function mergeDays(maps: DayMap[]): DayMap {
  const merged: DayMap = {};
  for (const map of maps) {
    for (const [day, count] of Object.entries(map)) {
      merged[day] = (merged[day] ?? 0) + count;
    }
  }
  return merged;
}

export function activeDays(days: DayMap): number {
  return Object.values(days).filter((c) => c > 0).length;
}

// Sin números en pantalla: el nivel se traduce a una palabra.
const LEVEL_LABELS = ['Sin actividad', 'Avance ligero', 'Avance constante', 'Avance intenso', 'Avance intenso'];

function levelFor(count: number): Cell['level'] {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function levelLabel(level: number): string {
  return LEVEL_LABELS[level];
}

// Devuelve columnas (semanas, de lunes a domingo) que terminan en la semana de rangeEnd.
export function buildWeeks(days: DayMap, weeks = 53): { monday: string; cells: Cell[] }[] {
  const lastMonday = parse(mondayOf(rangeEnd));
  const end = parse(rangeEnd);
  const columns = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const monday = new Date(lastMonday.getTime() - w * 7 * DAY);
    const cells: Cell[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday.getTime() + i * DAY);
      const date = format(day);
      const level = levelFor(days[date] ?? 0);
      cells.push({ date, level, label: LEVEL_LABELS[level], future: day > end });
    }
    columns.push({ monday: format(monday), cells });
  }
  return columns;
}

const longDate = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const shortMonth = new Intl.DateTimeFormat('es', { month: 'short', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const formatLongDate = (d: string) => longDate.format(parse(d));
export const formatMonth = (d: string) => shortMonth.format(parse(d)).replace('.', '');
export const formatMonthYear = (d: string) => monthYear.format(parse(d));

export function relativeActivity(date: string | null): string {
  if (!date) return 'Sin actividad reciente';
  const diff = Math.round((parse(rangeEnd).getTime() - parse(date).getTime()) / DAY);
  if (diff <= 0) return 'Activo hoy';
  if (diff === 1) return 'Activo ayer';
  if (diff < 7) return `Activo hace ${diff} días`;
  if (diff < 30) {
    const weeks = Math.round(diff / 7);
    return `Activo hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  return `Última actividad: ${formatMonthYear(date)}`;
}
