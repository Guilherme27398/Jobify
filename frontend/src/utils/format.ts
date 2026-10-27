const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** "20 jul 2026" — formatted by hand so it does not depend on the browser's locale data. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "há 3 dias", "há 2 semanas", "há 4 meses" — pt-PT, para cartões e métricas. */
export function relativeDate(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const days = Math.floor(diff / DAY);
  if (days === 0) {
    const hours = Math.floor(diff / HOUR);
    if (hours < 1) return 'agora mesmo';
    return hours === 1 ? 'há 1 hora' : `há ${hours} horas`;
  }
  if (days === 1) return 'há 1 dia';
  if (days < 14) return `há ${days} dias`;
  if (days < 60) return `há ${Math.floor(days / 7)} semanas`;
  return `há ${Math.floor(days / 30)} meses`;
}

/** Idade em dias, para decidir se os números da homepage ainda são atuais. */
export function ageInDays(iso: string, now = Date.now()): number {
  return (now - new Date(iso).getTime()) / DAY;
}
