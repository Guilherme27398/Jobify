import type { MonthCount, NamedCount } from '../../api/types';
import { MODALITIES } from './theme';

export interface SectorSeries {
  slug: string;
  name: string;
  points: MonthCount[];
}

function recordedMonths(series: SectorSeries[]): string[] {
  return [...new Set(series.flatMap(s => s.points.map(p => p.month)))].sort();
}

/** Todos os meses 'AAAA-MM' entre o primeiro e o último, inclusive. */
function monthRange(first: string, last: string): string[] {
  const months: string[] = [];
  let [year, month] = first.split('-').map(Number);
  const [lastYear, lastMonth] = last.split('-').map(Number);
  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return months;
}

/**
 * Uma linha por mês com a contagem de cada área. Meses sem nenhuma recolha ficam a null
 * (lacuna no gráfico), para a linha não inventar valores entre recolhas.
 */
export function monthsTable(series: SectorSeries[]) {
  const recorded = recordedMonths(series);
  if (recorded.length === 0) return [];
  return monthRange(recorded[0], recorded[recorded.length - 1]).map(month => {
    const row: Record<string, string | number | null> = { month };
    const hasData = recorded.includes(month);
    series.forEach(s => {
      row[s.slug] = hasData ? (s.points.find(p => p.month === month)?.count ?? 0) : null;
    });
    return row;
  });
}

/** Meses dentro do intervalo em que não houve recolhas. */
export function monthsWithoutData(series: SectorSeries[]): string[] {
  const recorded = recordedMonths(series);
  if (recorded.length === 0) return [];
  return monthRange(recorded[0], recorded[recorded.length - 1]).filter(m => !recorded.includes(m));
}

export interface ModalityRow {
  sector: string;
  total: number;
  counts: Record<string, number>;
  /** Percentagem de cada modalidade, por chave ('remote', 'hybrid', ...). */
  [modality: string]: unknown;
}

export function toModalityRow(sector: string, remoteTypes: NamedCount[]): ModalityRow {
  const counts: Record<string, number> = {};
  remoteTypes.forEach(r => { counts[r.name] = r.count; });
  const total = remoteTypes.reduce((sum, r) => sum + r.count, 0);
  const row: ModalityRow = { sector, total, counts };
  MODALITIES.forEach(m => { row[m.key] = total ? ((counts[m.key] ?? 0) / total) * 100 : 0; });
  return row;
}
